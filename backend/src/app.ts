import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";
import type { Logger } from "pino";
import type { ApplicationDependencies } from "./app-dependencies";
import type { Auth } from "./lib/auth-factory";
import {
	createAuthImpersonationStartHandler,
	createImpersonationUserNotFoundResponse,
	IMPERSONATE_USER_PATH,
	isImpersonationStartPath,
} from "./lib/auth-impersonation";
import { createLogger } from "./lib/logger";
import {
	createAdminAuthTargetGuard,
	createAuthImpersonationGuard,
} from "./middleware/admin-auth";
import { errorHandler } from "./middleware/error-handler";
import { createRequestLogger } from "./middleware/request-logger";
import { createRoutes } from "./routes";
import type { AppEnv } from "./types/hono-env";

const STOP_IMPERSONATING_PATH = "/api/auth/admin/stop-impersonating";
const NATIVE_STOP_ADMIN_SESSION_UNAVAILABLE_MESSAGE =
	"Failed to find admin session";

type ImpersonationAction = "start" | "stop";

type ImpersonationAuditContext = {
	action: ImpersonationAction;
	actorUserId?: string;
	impersonationSessionId?: string;
	origin: string | null;
	targetUserId?: string;
};

function getImpersonationAction(
	request: Request,
): ImpersonationAction | undefined {
	if (request.method !== "POST") return undefined;

	const pathname = new URL(request.url).pathname;
	if (pathname === IMPERSONATE_USER_PATH) return "start";
	if (pathname === STOP_IMPERSONATING_PATH) return "stop";
	return undefined;
}

async function getImpersonationAuditContext(
	request: Request,
	auth: Auth,
): Promise<ImpersonationAuditContext | undefined> {
	const action = getImpersonationAction(request);
	if (!action) return undefined;

	const auditContext: ImpersonationAuditContext = {
		action,
		origin: request.headers.get("Origin"),
	};

	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (action === "stop" && session?.session.impersonatedBy) {
			auditContext.actorUserId = session.session.impersonatedBy;
			auditContext.impersonationSessionId = session.session.id;
			auditContext.targetUserId = session.user.id;
		}
	} catch {
		// Audit context remains useful without session identifiers.
	}
	return auditContext;
}

function getImpersonationFailureReason(status: number) {
	if (status === 400) return "BAD_REQUEST";
	if (status === 401) return "UNAUTHORIZED";
	if (status === 403) return "FORBIDDEN";
	if (status === 404) return "USER_NOT_FOUND";
	if (status >= 500) return "INTERNAL_ERROR";
	return `HTTP_${status}`;
}

async function normalizeKnownStopFailure(
	request: Request,
	response: Response,
): Promise<Response> {
	if (
		request.method !== "POST" ||
		new URL(request.url).pathname !== STOP_IMPERSONATING_PATH ||
		response.status !== 500
	) {
		return response;
	}

	try {
		const body = (await response.clone().json()) as unknown;
		if (
			typeof body !== "object" ||
			body === null ||
			(body as { message?: unknown }).message !==
				NATIVE_STOP_ADMIN_SESSION_UNAVAILABLE_MESSAGE
		) {
			return response;
		}
	} catch {
		return response;
	}

	return new Response(
		JSON.stringify({
			errorCode: "IMPERSONATION_ADMIN_SESSION_UNAVAILABLE",
			message:
				"The original administrator session is no longer available. Please sign in again.",
		}),
		{
			status: 500,
			headers: { "Content-Type": "application/json" },
		},
	);
}

function logImpersonationLifecycle(
	logger: Logger,
	auditContext: ImpersonationAuditContext,
	status: number,
	impersonationSessionId = auditContext.impersonationSessionId,
	targetUserId = auditContext.targetUserId,
) {
	try {
		const logData = {
			actorUserId: auditContext.actorUserId,
			impersonationSessionId,
			origin: auditContext.origin,
			status,
			targetUserId,
		};

		if (status < 400) {
			logger.info({
				event:
					auditContext.action === "start"
						? "auth.impersonation.started"
						: "auth.impersonation.stopped",
				...logData,
			});
			return;
		}

		const failureLog = {
			event: "auth.impersonation.failed",
			action: auditContext.action,
			reasonCode: getImpersonationFailureReason(status),
			...logData,
		};
		if (status < 500) {
			logger.warn(failureLog);
			return;
		}

		logger.error(failureLog);
	} catch {
		// Logging must never change the HTTP response.
	}
}

export function createApp(dependencies: ApplicationDependencies) {
	const { auth, config, routes } = dependencies;
	const port = Number(config.PORT);
	const app = new Hono<AppEnv>();
	const apiLogger = createLogger("api", config);
	const adminAuthTargetGuard = createAdminAuthTargetGuard({
		auth,
		prisma: dependencies.prisma,
	});
	const authImpersonationGuard = createAuthImpersonationGuard({
		auth,
		prisma: dependencies.prisma,
		adminOrigin: config.ADMIN_FRONTEND_URL,
	});
	const authImpersonationStartHandler = createAuthImpersonationStartHandler({
		auth,
		prisma: dependencies.prisma,
		adminOrigin: config.ADMIN_FRONTEND_URL,
	});

	app.use(createRequestLogger(apiLogger));
	app.onError(errorHandler);

	app.use(
		"*",
		cors({
			origin: [
				config.CORS_ORIGIN,
				config.FRONTEND_URL,
				config.ADMIN_FRONTEND_URL,
			],
			allowHeaders: ["Content-Type", "Authorization", "better-auth"],
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			exposeHeaders: ["Content-Length"],
			maxAge: 600,
			credentials: true,
		}),
	);

	app.on(["POST", "GET"], "/api/auth/*", async (c) => {
		const pathname = new URL(c.req.url).pathname;
		if (isImpersonationStartPath(pathname)) {
			const fallbackAuditContext: ImpersonationAuditContext = {
				action: "start",
				origin: c.req.header("Origin") ?? null,
			};

			if (c.req.method !== "POST" || pathname !== IMPERSONATE_USER_PATH) {
				const response = createImpersonationUserNotFoundResponse();
				logImpersonationLifecycle(
					apiLogger,
					fallbackAuditContext,
					response.status,
				);
				return response;
			}

			try {
				const result = await authImpersonationStartHandler(c.req.raw);
				logImpersonationLifecycle(
					apiLogger,
					{
						...fallbackAuditContext,
						actorUserId: result.actorUserId,
						impersonationSessionId: result.impersonationSessionId,
						targetUserId: result.targetUserId,
					},
					result.response.status,
				);
				return result.response;
			} catch (error) {
				logImpersonationLifecycle(apiLogger, fallbackAuditContext, 500);
				throw error;
			}
		}

		const action = getImpersonationAction(c.req.raw);
		let auditContext: ImpersonationAuditContext | undefined = action
			? { action, origin: c.req.header("Origin") ?? null }
			: undefined;
		try {
			auditContext =
				(await getImpersonationAuditContext(c.req.raw, auth)) ?? auditContext;
		} catch {
			// Audit metadata is best-effort and must not change the HTTP response.
		}

		try {
			const guardResponse =
				(await authImpersonationGuard(c.req.raw)) ??
				(await adminAuthTargetGuard(c.req.raw));
			const nativeResponse = guardResponse ?? (await auth.handler(c.req.raw));
			const response = await normalizeKnownStopFailure(
				c.req.raw,
				nativeResponse,
			);
			if (auditContext) {
				logImpersonationLifecycle(apiLogger, auditContext, response.status);
			}
			return response;
		} catch (error) {
			if (auditContext) {
				logImpersonationLifecycle(apiLogger, auditContext, 500);
			}
			throw error;
		}
	});

	app.route("/", createRoutes(routes));

	app.get(
		"/v1/docs/open-api",
		openAPIRouteHandler(app, {
			documentation: {
				info: {
					title: "TutorPal API",
					version: "1.0.0",
					description: "TutorPal API documentation",
				},
				servers: [
					{
						url: `http://localhost:${port}`,
						description: "Local development server",
					},
				],
				tags: [
					{ name: "system", description: "System endpoints" },
					{ name: "admin-users", description: "Administrator user management" },
					{ name: "students", description: "Student management endpoints" },
					{ name: "line", description: "LINE account linking endpoints" },
				],
			},
		}),
	);

	return app;
}

export type AppType = ReturnType<typeof createApp>;
