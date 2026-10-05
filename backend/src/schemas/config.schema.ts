import { resolver } from "hono-openapi";
import { z } from "zod";

export const PublicConfigResponseSchema = z
	.object({
		publicSignupEnabled: z.boolean(),
		socialLogin: z
			.object({
				google: z.boolean(),
				line: z.boolean(),
			})
			.strict(),
	})
	.strict();

export const PublicConfigResponseResolver = resolver(
	PublicConfigResponseSchema,
);
