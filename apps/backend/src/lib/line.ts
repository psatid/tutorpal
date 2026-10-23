import type { AppConfig } from "./app-config";
import { getLocalAppConfig } from "./local-config";

export interface LineLoginCredentials {
	channelId: string;
	channelSecret: string;
}

export interface LineBotInfo {
	userId: string;
	basicId: string;
	premiumId?: string;
	displayName: string;
}

export class LinePushError extends Error {
	constructor(
		readonly kind: "timeout" | "network" | "server" | "client",
		readonly status?: number,
		readonly providerRequestId?: string,
	) {
		super("LINE push message failed");
	}
}

interface LineTokenResponse {
	access_token: string;
	token_type: string;
	refresh_token: string;
	expires_in: number;
	scope: string;
	id_token: string;
}

interface LineProfileResponse {
	userId: string;
	displayName: string;
	pictureUrl?: string;
	statusMessage?: string;
}

export type LinePushMessage = { type: string; text: string };

export type LineClient = {
	exchangeCodeForToken(
		code: string,
		credentials: LineLoginCredentials,
	): Promise<LineTokenResponse>;
	getLineProfile(accessToken: string): Promise<LineProfileResponse>;
	buildLineAuthUrl(state: string, channelId: string): string;
	sendLinePushMessage(
		lineUserId: string,
		messages: LinePushMessage[],
		channelAccessToken: string,
		retryKey?: string,
	): Promise<string | undefined>;
	getLineBotInfo(channelAccessToken: string): Promise<LineBotInfo>;
	validateLineRecipient(
		lineUserId: string,
		channelAccessToken: string,
	): Promise<void>;
};

async function exchangeCodeForTokenWithRedirectUrl(
	redirectUrl: string,
	code: string,
	credentials: LineLoginCredentials,
): Promise<LineTokenResponse> {
	const response = await fetch("https://api.line.me/oauth2/v2.1/token", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "authorization_code",
			code,
			redirect_uri: redirectUrl,
			client_id: credentials.channelId,
			client_secret: credentials.channelSecret,
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE token exchange failed:", text);
		throw new Error("Failed to exchange LINE authorization code");
	}

	return response.json() as Promise<LineTokenResponse>;
}

async function getLineProfile(
	accessToken: string,
): Promise<LineProfileResponse> {
	const response = await fetch("https://api.line.me/v2/profile", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});

	if (!response.ok) {
		const text = await response.text();
		console.error("LINE profile fetch failed:", text);
		throw new Error("Failed to fetch LINE profile");
	}

	return response.json() as Promise<LineProfileResponse>;
}

function buildLineAuthUrlWithRedirectUrl(
	redirectUrl: string,
	state: string,
	channelId: string,
): string {
	const params = new URLSearchParams({
		response_type: "code",
		client_id: channelId,
		redirect_uri: redirectUrl,
		state,
		scope: "profile",
		bot_prompt: "aggressive",
	});

	return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}

async function sendLinePushMessage(
	lineUserId: string,
	messages: LinePushMessage[],
	channelAccessToken: string,
	retryKey?: string,
): Promise<string | undefined> {
	let response: Response;
	try {
		response = await fetch("https://api.line.me/v2/bot/message/push", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${channelAccessToken}`,
				...(retryKey && { "X-Line-Retry-Key": retryKey }),
			},
			body: JSON.stringify({
				to: lineUserId,
				messages,
			}),
			signal: AbortSignal.timeout(10_000),
		});
	} catch (error) {
		throw new LinePushError(
			error instanceof DOMException &&
				(error.name === "AbortError" || error.name === "TimeoutError")
				? "timeout"
				: "network",
		);
	}

	if (!response.ok && response.status !== 409) {
		throw new LinePushError(
			response.status >= 500 ? "server" : "client",
			response.status,
			response.headers.get("x-line-request-id") ?? undefined,
		);
	}

	return response.headers.get("x-line-request-id") ?? undefined;
}

async function getLineBotInfo(
	channelAccessToken: string,
): Promise<LineBotInfo> {
	const response = await fetch("https://api.line.me/v2/bot/info", {
		headers: { Authorization: `Bearer ${channelAccessToken}` },
	});
	if (!response.ok) {
		throw new Error("Failed to verify LINE Messaging API credentials");
	}
	return response.json() as Promise<LineBotInfo>;
}

async function validateLineRecipient(
	lineUserId: string,
	channelAccessToken: string,
): Promise<void> {
	const response = await fetch(
		`https://api.line.me/v2/bot/profile/${encodeURIComponent(lineUserId)}`,
		{ headers: { Authorization: `Bearer ${channelAccessToken}` } },
	);
	if (!response.ok) {
		throw new Error(
			"The LINE account has not added this Official Account as a friend",
		);
	}
}

export function createLineClient(
	config: Pick<AppConfig, "LINE_LINK_REDIRECT_URL">,
): LineClient {
	return {
		exchangeCodeForToken: (code, credentials) =>
			exchangeCodeForTokenWithRedirectUrl(
				config.LINE_LINK_REDIRECT_URL,
				code,
				credentials,
			),
		getLineProfile,
		buildLineAuthUrl: (state, channelId) =>
			buildLineAuthUrlWithRedirectUrl(
				config.LINE_LINK_REDIRECT_URL,
				state,
				channelId,
			),
		sendLinePushMessage,
		getLineBotInfo,
		validateLineRecipient,
	};
}

function getLocalLineClient() {
	return createLineClient(getLocalAppConfig());
}

export async function exchangeCodeForToken(
	code: string,
	credentials: LineLoginCredentials,
): Promise<LineTokenResponse> {
	return getLocalLineClient().exchangeCodeForToken(code, credentials);
}

export {
	getLineProfile,
	sendLinePushMessage,
	getLineBotInfo,
	validateLineRecipient,
};

export function buildLineAuthUrl(state: string, channelId: string): string {
	return getLocalLineClient().buildLineAuthUrl(state, channelId);
}
