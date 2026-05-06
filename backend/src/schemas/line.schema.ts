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
