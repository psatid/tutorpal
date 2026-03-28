import { Hono } from "hono";
import baseRoutes from "./base-router";

export function createRoutes() {
  return new Hono().route("/v1", baseRoutes);
}

export type AppType = ReturnType<typeof createRoutes>;
