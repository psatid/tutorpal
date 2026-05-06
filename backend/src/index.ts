import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { openAPIRouteHandler } from "hono-openapi";
import { auth } from "./lib/auth";
import { ENV } from "./lib/env";
import { errorHandler } from "./middleware/error-handler";
import { createRoutes } from "./routes";

const port = Number(ENV.PORT);

const routes = createRoutes();

const app = new Hono();
app.use(logger());

// Enable CORS for all routes
const corsMiddleware = cors({
	origin: ENV.CORS_ORIGIN,
	allowHeaders: ["Content-Type", "Authorization", "better-auth"],
	allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	exposeHeaders: ["Content-Length"],
	maxAge: 600,
	credentials: true,
});

app.use("*", corsMiddleware);

// Mount better-auth routes before other routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

// Mount API routes
app.route("/", routes).onError(errorHandler);

// Serve OpenAPI spec generated from describeRoute metadata
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
				{ name: "students", description: "Student management endpoints" },
				{ name: "line", description: "LINE account linking endpoints" },
			],
		},
	}),
);

Bun.serve({
	port,
	fetch: app.fetch,
});

console.log(`Server running on http://localhost:${port}`);
