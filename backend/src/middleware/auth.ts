import type { PrismaClient } from "@prisma/client";
import type { Context, Next } from "hono";
import { auth } from "../lib/auth";
import type { Auth } from "../lib/auth-factory";
import { prisma } from "../lib/db";
import { AppError } from "../lib/error";
import type { AppEnv } from "../types/hono-env";

/**
 * Middleware to require authentication for routes.
 * Validates the session using Better-Auth and attaches user/session/tutorId to context.
 */
export function createRequireAuth({
	auth,
	prisma,
}: {
	auth: Auth;
	prisma: PrismaClient;
}) {
	return async (c: Context<AppEnv>, next: Next) => {
		const session = await auth.api.getSession({
			headers: c.req.raw.headers,
		});

		if (!session) {
			throw AppError.unauthorized("UNAUTHORIZED", "Authentication required");
		}

		// Attach user and session to context for use in route handlers
		c.set("user", session.user);
		c.set("session", session.session);

		// Look up the Tutor record for this user and attach tutorId
		const tutor = await prisma.tutor.findUnique({
			where: { userId: session.user.id },
			select: { id: true },
		});

		if (!tutor) {
			throw AppError.notFound("TUTOR_NOT_FOUND", "Tutor profile not found");
		}

		c.set("tutorId", tutor.id);

		await next();
	};
}

export const requireAuth = createRequireAuth({ auth, prisma });
