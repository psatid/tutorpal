import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { ENV } from "../lib/env";
import { requireAuth } from "../middleware/auth";
import { lineRepository, studentRepository } from "../repositories";
import {
	GenerateLinkTokenRequestSchema,
	LineAuthorizeResponseResolver,
	LineAuthUrlResponseResolver,
	LineConnectionStatusResolver,
	LinkTokenResponseResolver,
	SaveLineConnectionRequestSchema,
	SendTestMessageRequestSchema,
	SendTestMessageResponseResolver,
	UnlinkLineRequestSchema,
	UnlinkLineResponseResolver,
} from "../schemas";
import { LineService } from "../services";
import type { AppEnv } from "../types/hono-env";

const lineService = new LineService(lineRepository, studentRepository);

const lineRoutes = new Hono<AppEnv>()
	// Public routes (no authentication required)
	.get(
		"/auth-url",
		describeRoute({
			tags: ["line"],
			description: "Get LINE Login authorization URL for a given link token",
			parameters: [
				{
					name: "token",
					in: "query",
					required: true,
					schema: { type: "string" },
					description: "Link token from /link-token endpoint",
				},
			],
			responses: {
				200: {
					description: "LINE auth URL",
					content: {
						"application/json": {
							schema: LineAuthUrlResponseResolver,
						},
					},
				},
				400: { description: "Invalid or expired token" },
			},
		}),
		async (c) => {
			const token = c.req.query("token");
			if (!token) {
				return c.json(
					{ errorCode: "MISSING_TOKEN", message: "Token is required" },
					400,
				);
			}
			const result = await lineService.getAuthUrl(token);
			return c.json(result);
		},
	)
	.get(
		"/callback",
		describeRoute({
			tags: ["line"],
			description: "LINE OAuth callback — exchanges code and links student",
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
				302: { description: "Redirects to frontend success/error page" },
			},
		}),
		async (c) => {
			const code = c.req.query("code");
			const state = c.req.query("state");

			if (!code || !state) {
				return c.redirect(`${ENV.FRONTEND_URL}/line-link?error=missing_params`);
			}

			try {
				const result = await lineService.handleCallback(code, state);
				if (result.kind === "test-recipient") {
					return c.redirect(
						`${ENV.FRONTEND_URL}/settings/line?testRecipient=connected`,
					);
				}
				return c.redirect(
					`${ENV.FRONTEND_URL}/line-link?success=true&name=${encodeURIComponent(result.displayName)}`,
				);
			} catch (error) {
				console.error("line callback failed", error);
				return c.redirect(`${ENV.FRONTEND_URL}/line-link?error=link_failed`);
			}
		},
	)
	// Apply authentication middleware for protected routes below
	.use(requireAuth)
	.get(
		"/connection",
		describeRoute({
			tags: ["line"],
			description: "Get the current tutor's safe LINE connection status",
			responses: {
				200: {
					description: "LINE connection status",
					content: {
						"application/json": { schema: LineConnectionStatusResolver },
					},
				},
			},
		}),
		async (c) =>
			c.json(await lineService.getConnectionStatus(c.get("tutorId"))),
	)
	.put(
		"/connection",
		describeRoute({
			tags: ["line"],
			description: "Save and verify the current tutor's LINE credentials",
			responses: {
				200: {
					description: "Verified LINE connection",
					content: {
						"application/json": { schema: LineConnectionStatusResolver },
					},
				},
				400: { description: "Invalid credentials" },
			},
		}),
		validator("json", SaveLineConnectionRequestSchema),
		async (c) =>
			c.json(
				await lineService.saveConnection(c.get("tutorId"), c.req.valid("json")),
			),
	)
	.post(
		"/connection/test-recipient/authorize",
		describeRoute({
			tags: ["line"],
			description:
				"Begin LINE Login to connect the tutor's test recipient account",
			responses: {
				200: {
					description: "LINE authorization URL",
					content: {
						"application/json": { schema: LineAuthorizeResponseResolver },
					},
				},
			},
		}),
		async (c) =>
			c.json(
				await lineService.startTestRecipientAuthorization(c.get("tutorId")),
			),
	)
	.post(
		"/connection/test-message",
		describeRoute({
			tags: ["line"],
			description:
				"Send a test message to the tutor's connected personal LINE account",
			responses: {
				200: {
					description: "Test message sent",
					content: {
						"application/json": { schema: SendTestMessageResponseResolver },
					},
				},
			},
		}),
		async (c) =>
			c.json(await lineService.sendConnectionTestMessage(c.get("tutorId"))),
	)
	.post(
		"/link-token",
		describeRoute({
			tags: ["line"],
			description: "Generate a magic link token for LINE account linking",
			responses: {
				200: {
					description: "Link token generated successfully",
					content: {
						"application/json": {
							schema: LinkTokenResponseResolver,
						},
					},
				},
				401: { description: "Unauthorized" },
				404: { description: "Student not found" },
				409: { description: "Student already linked" },
			},
		}),
		validator("json", GenerateLinkTokenRequestSchema),
		async (c) => {
			const { studentId } = c.req.valid("json");
			const tutorId = c.get("tutorId");
			const result = await lineService.generateLinkToken(studentId, tutorId);
			return c.json(result);
		},
	)
	.post(
		"/test-message",
		describeRoute({
			tags: ["line"],
			description: "Send a test message to a linked student via LINE",
			responses: {
				200: {
					description: "Test message sent successfully",
					content: {
						"application/json": {
							schema: SendTestMessageResponseResolver,
						},
					},
				},
				401: { description: "Unauthorized" },
				404: { description: "Student not found" },
			},
		}),
		validator("json", SendTestMessageRequestSchema),
		async (c) => {
			const { studentId } = c.req.valid("json");
			const tutorId = c.get("tutorId");
			const result = await lineService.sendTestMessage(studentId, tutorId);
			return c.json(result);
		},
	)
	.post(
		"/unlink",
		describeRoute({
			tags: ["line"],
			description: "Unlink a LINE account from a student",
			responses: {
				200: {
					description: "LINE account unlinked successfully",
					content: {
						"application/json": {
							schema: UnlinkLineResponseResolver,
						},
					},
				},
				401: { description: "Unauthorized" },
				404: { description: "Student not found" },
				400: { description: "LINE account not linked" },
			},
		}),
		validator("json", UnlinkLineRequestSchema),
		async (c) => {
			const { studentId } = c.req.valid("json");
			const tutorId = c.get("tutorId");
			const result = await lineService.unlinkStudent(studentId, tutorId);
			return c.json(result);
		},
	);

export { lineRoutes };
