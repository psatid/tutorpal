import { Hono } from "hono";
import { cors } from "hono/cors";
import { openAPIRouteHandler } from "hono-openapi";
import type { ApplicationDependencies } from "./app-dependencies";
import { createLogger } from "./lib/logger";
import { createAdminAuthTargetGuard } from "./middleware/admin-auth";
import { errorHandler } from "./middleware/error-handler";
import { createRequestLogger } from "./middleware/request-logger";
import { createRoutes } from "./routes";
import type { AppEnv } from "./types/hono-env";

export function createApp(dependencies: ApplicationDependencies) {
	const { auth, config, routes } = dependencies;
	const port = Number(config.PORT);
	const app = new Hono<AppEnv>();
	const apiLogger = createLogger("api", config);
	const adminAuthTargetGuard = createAdminAuthTargetGuard({
		auth,
		prisma: dependencies.prisma,
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
		const guardResponse = await adminAuthTargetGuard(c.req.raw);
		return guardResponse ?? auth.handler(c.req.raw);
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
