import { resolver } from "hono-openapi";
import { z } from "zod";

export const GenerateLinkTokenRequestSchema = z.object({
	studentId: z.string().uuid("Invalid student ID"),
});

export const LinkTokenResponseSchema = z.object({
	token: z.string(),
	linkUrl: z.string(),
	expiresAt: z.string().datetime(),
});

export const LineAuthUrlResponseSchema = z.object({
	authUrl: z.string(),
});

export const SendTestMessageRequestSchema = z.object({
	studentId: z.string().uuid("Invalid student ID"),
});

export const SendTestMessageResponseSchema = z.object({
	sent: z.boolean(),
});

export const SaveLineConnectionRequestSchema = z.object({
	messagingAccessToken: z
		.string()
		.min(20, "Enter a valid channel access token"),
	loginChannelId: z.string().min(1, "Enter your LINE Login channel ID"),
	loginChannelSecret: z.string().min(1, "Enter your LINE Login channel secret"),
});

export const LineConnectionStatusSchema = z.object({
	configured: z.boolean(),
	accountName: z.string().optional(),
	accountBasicId: z.string().nullable().optional(),
	lastVerifiedAt: z.string().datetime().optional(),
	testRecipientConnected: z.boolean(),
});

export const LineAuthorizeResponseSchema = z.object({
	authUrl: z.string().url(),
});

export const UnlinkLineRequestSchema = z.object({
	studentId: z.string().uuid("Invalid student ID"),
});

export const UnlinkLineResponseSchema = z.object({
	unlinked: z.boolean(),
});

export const GenerateLinkTokenRequestResolver = resolver(
	GenerateLinkTokenRequestSchema,
);
export const LinkTokenResponseResolver = resolver(LinkTokenResponseSchema);
export const LineAuthUrlResponseResolver = resolver(LineAuthUrlResponseSchema);
export const SendTestMessageRequestResolver = resolver(
	SendTestMessageRequestSchema,
);
export const SendTestMessageResponseResolver = resolver(
	SendTestMessageResponseSchema,
);
export const SaveLineConnectionRequestResolver = resolver(
	SaveLineConnectionRequestSchema,
);
export const LineConnectionStatusResolver = resolver(
	LineConnectionStatusSchema,
);
export const LineAuthorizeResponseResolver = resolver(
	LineAuthorizeResponseSchema,
);

export const UnlinkLineRequestResolver = resolver(UnlinkLineRequestSchema);
export const UnlinkLineResponseResolver = resolver(UnlinkLineResponseSchema);
