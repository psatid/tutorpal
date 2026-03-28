import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const baseRoutes = new Hono()
	.get(
		"/health",
		describeRoute({
			tags: ["system"],
			description: "Health check endpoint",
			responses: {
				200: {
					description: "Service is healthy",
				},
			},
		}),
		(c) => c.json({ status: "ok" }),
	)
	.get(
		"/docs",
		describeRoute({
			tags: ["system"],
			description: "API documentation UI (Scalar)",
			responses: {
				200: {
					description: "Scalar API documentation UI",
				},
			},
		}),
		Scalar({
			url: "/v1/docs/open-api",
			theme: "kepler",
			layout: "modern",
			defaultHttpClient: { targetKey: "js", clientKey: "axios" },
		}),
	);

export type AppType = typeof baseRoutes;
export default baseRoutes;
