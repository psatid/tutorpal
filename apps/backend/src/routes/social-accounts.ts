import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute } from "hono-openapi";
import type { Logger } from "pino";
import { AppError } from "../lib/error";
import { getLocalAppConfig } from "../lib/local-config";
import { requireAuth } from "../middleware/auth";
import { SocialAccountRepository } from "../repositories";
import { SocialAccountAuthorizationResponseResolver } from "../schemas";
import { SocialAccountService } from "../services";
import type { AppEnv } from "../types/hono-env";

export type SocialAccountRouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	socialAccountService: SocialAccountService;
	getFrontendUrl(): string;
	logger?: Pick<Logger, "warn">;
};

function lineEnrollmentRedirect(
	frontendUrl: string,
	result: "connected" | "error",
) {
	return new URL(`/settings/account?line=${result}`, frontendUrl).toString();
}

function googleEnrollmentRedirect(
	frontendUrl: string,
	result: "connected" | "error",
) {
	return new URL(`/settings/account?google=${result}`, frontendUrl).toString();
}

function lineEnrollmentFailureReason(error: unknown) {
	if (!(error instanceof AppError)) {
		return "UNEXPECTED_ERROR";
	}

	switch (error.errorCode) {
		case "LINE_ENROLLMENT_INVALID":
			return "INVALID_CALLBACK";
		case "LINE_AUTHORIZATION_UNAVAILABLE":
			return "PROVIDER_UNAVAILABLE";
		case "LINE_SOCIAL_ACCOUNT_CONFLICT":
			return "ACCOUNT_CONFLICT";
		default:
			return "APPLICATION_ERROR";
	}
}

function googleEnrollmentFailureReason(error: unknown) {
	if (!(error instanceof AppError)) {
		return "UNEXPECTED_ERROR";
	}

	switch (error.errorCode) {
		case "GOOGLE_ENROLLMENT_INVALID":
			return "INVALID_CALLBACK";
		case "GOOGLE_AUTHORIZATION_UNAVAILABLE":
			return "PROVIDER_UNAVAILABLE";
		case "GOOGLE_SOCIAL_ACCOUNT_CONFLICT":
			return "ACCOUNT_CONFLICT";
		default:
			return "APPLICATION_ERROR";
	}
}

export function createSocialAccountRoutes({
	requireAuth,
	socialAccountService,
	getFrontendUrl,
	logger,
}: SocialAccountRouteDependencies) {
	return new Hono<AppEnv>()
		.post(
			"/google/authorization",
			describeRoute({
				tags: ["social-accounts"],
				description:
					"Start authenticated Google account enrollment for the current tutor",
				responses: {
					200: {
						description: "Google authorization URL",
						content: {
							"application/json": {
								schema: SocialAccountAuthorizationResponseResolver,
							},
						},
					},
					401: { description: "Authentication required" },
					403: { description: "Tutor is not eligible to enroll Google" },
					404: { description: "Google sign-in is not configured" },
				},
			}),
			requireAuth,
			async (c) =>
				c.json(
					await socialAccountService.startGoogleEnrollment({
						userId: c.get("user").id,
						impersonatedBy: c.get("session").impersonatedBy,
					}),
				),
		)
		.get(
			"/google/callback",
			describeRoute({
				tags: ["social-accounts"],
				description:
					"Complete Google account enrollment and redirect to the fixed account-settings result",
				parameters: [
					{
						name: "code",
						in: "query",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "state",
						in: "query",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					302: {
						description:
							"Fixed redirect to account settings with connected or error result",
					},
				},
			}),
			async (c) => {
				try {
					await socialAccountService.completeGoogleEnrollment({
						code: c.req.query("code"),
						state: c.req.query("state"),
					});
					return c.redirect(
						googleEnrollmentRedirect(getFrontendUrl(), "connected"),
					);
				} catch (error) {
					try {
						logger?.warn({
							event: "auth.social_account.google_enrollment.failed",
							provider: "google",
							reasonCode: googleEnrollmentFailureReason(error),
						});
					} catch {
						// Logging must never change the fixed callback response.
					}
					return c.redirect(
						googleEnrollmentRedirect(getFrontendUrl(), "error"),
					);
				}
			},
		)
		.post(
			"/line/authorization",
			describeRoute({
				tags: ["social-accounts"],
				description:
					"Start authenticated LINE account enrollment for the current tutor",
				responses: {
					200: {
						description: "LINE authorization URL",
						content: {
							"application/json": {
								schema: SocialAccountAuthorizationResponseResolver,
							},
						},
					},
					401: { description: "Authentication required" },
					403: { description: "Tutor is not eligible to enroll LINE" },
					404: { description: "LINE sign-in is not configured" },
				},
			}),
			requireAuth,
			async (c) =>
				c.json(
					await socialAccountService.startLineEnrollment({
						userId: c.get("user").id,
						impersonatedBy: c.get("session").impersonatedBy,
					}),
				),
		)
		.get(
			"/line/callback",
			describeRoute({
				tags: ["social-accounts"],
				description:
					"Complete LINE account enrollment and redirect to the fixed account-settings result",
				parameters: [
					{
						name: "code",
						in: "query",
						required: true,
						schema: { type: "string" },
					},
					{
						name: "state",
						in: "query",
						required: true,
						schema: { type: "string" },
					},
				],
				responses: {
					302: {
						description:
							"Fixed redirect to account settings with connected or error result",
					},
				},
			}),
			async (c) => {
				try {
					await socialAccountService.completeLineEnrollment({
						code: c.req.query("code"),
						state: c.req.query("state"),
					});
					return c.redirect(
						lineEnrollmentRedirect(getFrontendUrl(), "connected"),
					);
				} catch (error) {
					try {
						logger?.warn({
							event: "auth.social_account.line_enrollment.failed",
							provider: "line",
							reasonCode: lineEnrollmentFailureReason(error),
						});
					} catch {
						// Logging must never change the fixed callback response.
					}
					return c.redirect(lineEnrollmentRedirect(getFrontendUrl(), "error"));
				}
			},
		);
}

export const socialAccountRoutes = createSocialAccountRoutes({
	requireAuth,
	socialAccountService: new SocialAccountService(
		new SocialAccountRepository(),
		getLocalAppConfig(),
	),
	getFrontendUrl: () => getLocalAppConfig().FRONTEND_URL,
});
