import { resolver } from "hono-openapi";
import { z } from "zod";

export const SocialAccountAuthorizationResponseSchema = z.object({
	authorizationUrl: z.string().url(),
});

export const SocialAccountAuthorizationResponseResolver = resolver(
	SocialAccountAuthorizationResponseSchema,
);
