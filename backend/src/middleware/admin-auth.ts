import type { PrismaClient } from "@prisma/client";
import type { Context, Next } from "hono";
import type { Auth } from "../lib/auth-factory";
import { AppError } from "../lib/error";
import type { AppEnv } from "../types/hono-env";

export function createRequireAdmin({ auth }: { auth: Auth }) {
	return async (c: Context<AppEnv>, next: Next) => {
		const session = await auth.api.getSession({ headers: c.req.raw.headers });
		if (!session) {
			throw AppError.unauthorized("UNAUTHORIZED", "Authentication required");
		}
		if (session.user.role !== "admin") {
			throw AppError.forbidden(
				"ADMIN_REQUIRED",
				"Administrator access required",
			);
		}

		c.set("user", session.user);
		c.set("session", session.session);
		await next();
	};
}

export function createRequireAdminOrigin(adminOrigin: string) {
	return async (c: Context<AppEnv>, next: Next) => {
		if (c.req.header("Origin") !== adminOrigin) {
			throw AppError.forbidden(
				"ADMIN_ORIGIN_REQUIRED",
				"Invalid request origin",
			);
		}
		await next();
	};
}

/**
 * Keeps Better Auth's browser-facing admin endpoints scoped to regular users.
 *
 * The endpoints are disabled in the Better Auth configuration, but this guard
 * remains in front of the handler so a future endpoint re-enable cannot make
 * admin targets manageable by accident.
 */
export function createAdminAuthTargetGuard({
	auth,
	prisma,
}: {
	auth: Auth;
	prisma: PrismaClient;
}) {
	return async (request: Request): Promise<Response | undefined> => {
		const url = new URL(request.url);
		if (!url.pathname.startsWith("/api/auth/admin/")) return undefined;

		const session = await auth.api.getSession({ headers: request.headers });
		if (!session || session.user.role !== "admin") return undefined;

		let targetId = url.searchParams.get("id");
		if (!targetId && request.method !== "GET") {
			try {
				const body = (await request.clone().json()) as {
					userId?: unknown;
				};
				if (typeof body.userId === "string") targetId = body.userId;
			} catch {
				// Let Better Auth return its normal malformed-request response.
			}
		}

		if (!targetId) return undefined;

		const target = await prisma.user.findFirst({
			where: { id: targetId, role: "user" },
			select: { id: true },
		});
		if (target) return undefined;

		return new Response(
			JSON.stringify({
				errorCode: "USER_NOT_FOUND",
				message: "User not found",
			}),
			{
				status: 404,
				headers: { "Content-Type": "application/json" },
			},
		);
	};
}
