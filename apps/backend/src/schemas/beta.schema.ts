import { resolver } from "hono-openapi";
import { z } from "zod";

export const BetaConfigResponseSchema = z
	.object({
		betaEnabled: z.boolean(),
		requestAvailable: z.boolean(),
		turnstileSiteKey: z.string().nullable(),
	})
	.strict();

export const CreateBetaRequestSchema = z
	.object({
		name: z.string().trim().min(1).max(120),
		email: z.string().trim().toLowerCase().email().max(254),
		subject: z.string().trim().min(1).max(120).optional(),
		studentCountRange: z.enum(["1-5", "6-15", "16-30", "30+"]).optional(),
		hasLineOfficialAccount: z.boolean().optional(),
		turnstileToken: z.string().min(1).max(2048),
	})
	.strict();

export const BetaRequestResponseSchema = z.object({
	status: z.literal("accepted"),
});

export const BetaConfigResponseResolver = resolver(BetaConfigResponseSchema);
export const BetaRequestResponseResolver = resolver(BetaRequestResponseSchema);
