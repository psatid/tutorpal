import type { z } from "zod";
import type { AppConfig } from "../lib/app-config";
import { AppError } from "../lib/error";
import type { CreateBetaRequestSchema } from "../schemas/beta.schema";

const TURNSTILE_VERIFY_URL =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "beta_demo_request";
const REQUEST_TIMEOUT_MS = 10_000;

type BetaRequest = z.infer<typeof CreateBetaRequestSchema>;
type Fetch = typeof fetch;

type TurnstileVerificationResponse = {
	action?: unknown;
	hostname?: unknown;
	success?: unknown;
};

type DiscordConfirmation = {
	id?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getWebhookUrl(value: string): URL | null {
	try {
		const url = new URL(value);
		if (url.protocol !== "https:") return null;
		url.searchParams.set("wait", "true");
		return url;
	} catch {
		return null;
	}
}

function escapeDiscordMarkdown(value: string) {
	return value.replaceAll(/([\\`*_{}[\]<>()#+\-.!|])/g, "\\$1");
}

function discordField(name: string, value: string) {
	return { name, value: escapeDiscordMarkdown(value).slice(0, 1_024) };
}

function toDiscordPayload(request: BetaRequest) {
	const fields = [
		discordField("Name", request.name),
		discordField("Email", request.email),
	];

	if (request.subject !== undefined) {
		fields.push(discordField("Subject", request.subject));
	}
	if (request.studentCountRange !== undefined) {
		fields.push(discordField("Students", request.studentCountRange));
	}
	if (request.hasLineOfficialAccount !== undefined) {
		fields.push(
			discordField(
				"LINE Official Account",
				request.hasLineOfficialAccount ? "Yes" : "No",
			),
		);
	}

	return {
		allowed_mentions: { parse: [] },
		embeds: [
			{
				title: "Beta demo request",
				fields,
			},
		],
	};
}

export class BetaService {
	constructor(
		private readonly config: AppConfig,
		private readonly fetchFn: Fetch = fetch,
	) {}

	getPublicConfig() {
		return {
			betaEnabled: this.config.BETA_ENABLED,
			requestAvailable: this.isRequestAvailable(),
			turnstileSiteKey: this.config.TURNSTILE_SITE_KEY || null,
		};
	}

	async submitRequest(request: BetaRequest, connectingIp?: string) {
		this.assertRequestSubmissionAvailable();

		await this.verifyTurnstile(request.turnstileToken, connectingIp);
		await this.notifyDiscord(request);

		return { status: "accepted" as const };
	}

	assertRequestSubmissionAvailable() {
		if (!this.config.BETA_ENABLED) {
			throw AppError.notFound(
				"BETA_REQUESTS_DISABLED",
				"Beta requests are not available.",
			);
		}
		if (!this.isRequestAvailable()) {
			throw AppError.serviceUnavailable(
				"BETA_REQUESTS_UNAVAILABLE",
				"Beta requests are temporarily unavailable.",
			);
		}
	}

	private isRequestAvailable() {
		return (
			this.config.BETA_ENABLED &&
			this.config.TURNSTILE_SITE_KEY !== "" &&
			this.config.TURNSTILE_SECRET_KEY !== "" &&
			getWebhookUrl(this.config.DISCORD_BETA_WEBHOOK_URL) !== null
		);
	}

	private async verifyTurnstile(token: string, connectingIp?: string) {
		const body = new URLSearchParams({
			secret: this.config.TURNSTILE_SECRET_KEY,
			response: token,
		});
		if (connectingIp?.trim()) {
			body.set("remoteip", connectingIp.trim().slice(0, 45));
		}

		let response: Response;
		try {
			response = await this.fetchFn(TURNSTILE_VERIFY_URL, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body,
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
		} catch {
			throw AppError.serviceUnavailable(
				"BETA_REQUESTS_UNAVAILABLE",
				"Beta requests are temporarily unavailable.",
			);
		}

		if (!response.ok) {
			throw AppError.serviceUnavailable(
				"BETA_REQUESTS_UNAVAILABLE",
				"Beta requests are temporarily unavailable.",
			);
		}

		let result: TurnstileVerificationResponse;
		try {
			result = (await response.json()) as TurnstileVerificationResponse;
		} catch {
			throw AppError.serviceUnavailable(
				"BETA_REQUESTS_UNAVAILABLE",
				"Beta requests are temporarily unavailable.",
			);
		}

		const expectedHostname = new URL(this.config.MARKETING_ORIGIN).hostname;
		if (
			!isRecord(result) ||
			result.success !== true ||
			result.action !== TURNSTILE_ACTION ||
			result.hostname !== expectedHostname
		) {
			throw AppError.badRequest(
				"TURNSTILE_VERIFICATION_FAILED",
				"Turnstile verification failed.",
			);
		}
	}

	private async notifyDiscord(request: BetaRequest) {
		const webhookUrl = getWebhookUrl(this.config.DISCORD_BETA_WEBHOOK_URL);
		if (!webhookUrl) {
			throw AppError.serviceUnavailable(
				"BETA_REQUESTS_UNAVAILABLE",
				"Beta requests are temporarily unavailable.",
			);
		}

		let response: Response;
		try {
			response = await this.fetchFn(webhookUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(toDiscordPayload(request)),
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			});
		} catch {
			throw AppError.badGateway(
				"BETA_NOTIFICATION_FAILED",
				"Beta request delivery failed.",
			);
		}

		if (!response.ok) {
			throw AppError.badGateway(
				"BETA_NOTIFICATION_FAILED",
				"Beta request delivery failed.",
			);
		}

		let confirmation: DiscordConfirmation;
		try {
			confirmation = (await response.json()) as DiscordConfirmation;
		} catch {
			throw AppError.badGateway(
				"BETA_NOTIFICATION_FAILED",
				"Beta request delivery failed.",
			);
		}

		if (
			!isRecord(confirmation) ||
			typeof confirmation.id !== "string" ||
			!/^\d{16,32}$/.test(confirmation.id)
		) {
			throw AppError.badGateway(
				"BETA_NOTIFICATION_FAILED",
				"Beta request delivery failed.",
			);
		}
	}
}
