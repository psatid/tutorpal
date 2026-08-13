import { Scalar } from "@scalar/hono-api-reference";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

export function createBaseRoutes(getPublicSignupEnabled = () => false) {
	return new Hono()
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
			"/config",
			describeRoute({
				tags: ["system"],
				description: "Public client configuration",
				responses: {
					200: {
						description: "Public client configuration",
					},
				},
			}),
			(c) => c.json({ publicSignupEnabled: getPublicSignupEnabled() }),
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
}

export const baseRoutes = createBaseRoutes();

export type AppType = ReturnType<typeof createBaseRoutes>;
export default baseRoutes;
