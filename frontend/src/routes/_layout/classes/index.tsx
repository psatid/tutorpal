import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const classesSearchSchema = z.object({
  setup: z.literal("getting-started").optional(),
});

export const Route = createFileRoute("/_layout/classes/")({
  validateSearch: classesSearchSchema,
});
