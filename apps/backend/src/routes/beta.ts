import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { AppError } from "../lib/error";
import {
	BetaConfigResponseResolver,
	BetaRequestResponseResolver,
	CreateBetaRequestSchema,
} from "../schemas/beta.schema";
import type { BetaService } from "../services/beta.service";

export type BetaRouteDependencies = {
	betaService: BetaService;
	marketingOrigin: string;
};

export function createBetaRoutes({
	betaService,
	marketingOrigin,
}: BetaRouteDependencies) {
	return new Hono()
		.get(
			"/config",
			describeRoute({
				tags: ["beta"],
				description: "Public beta request configuration",
				responses: {
					200: {
						description: "Beta request configuration",
						content: {
							"application/json": { schema: BetaConfigResponseResolver },
						},
					},
				},
			}),
			(c) => c.json(betaService.getPublicConfig()),
		)
		.post(
			"/requests",
			describeRoute({
				tags: ["beta"],
				description: "Submit a beta demo request",
				responses: {
					200: {
						description: "Beta request accepted",
						content: {
							"application/json": { schema: BetaRequestResponseResolver },
						},
					},
				},
			}),
			async (_c, next) => {
				betaService.assertRequestSubmissionAvailable();
				await next();
			},
			async (c, next) => {
				if (c.req.header("Origin") !== marketingOrigin) {
					throw AppError.forbidden(
						"BETA_REQUEST_ORIGIN_INVALID",
						"Invalid request origin.",
					);
				}
				await next();
			},
			validator("json", CreateBetaRequestSchema),
			async (c) => {
				return c.json(
					await betaService.submitRequest(
						c.req.valid("json"),
						c.req.header("CF-Connecting-IP"),
					),
				);
			},
		);
}
