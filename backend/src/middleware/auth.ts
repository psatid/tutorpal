import type { Context, Next } from "hono";
import { auth } from "../lib/auth";
import { AppError } from "../lib/error";

/**
 * Middleware to require authentication for routes.
 * Validates the session using Better-Auth and attaches user/session to context.
 */
export async function requireAuth(c: Context, next: Next) {
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		throw AppError.unauthorized("UNAUTHORIZED", "Authentication required");
	}

	// Attach user and session to context for use in route handlers
	c.set("user", session.user);
	c.set("session", session.session);

	await next();
}
