import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LineLinkScreen } from "@/screens/line-link-screen";

const lineLinkSearchSchema = z.object({
  token: z.string().optional(),
  success: z.union([z.string(), z.boolean()]).optional(),
  error: z.string().optional(),
  name: z.string().optional(),
});

export const Route = createFileRoute("/line-link")({
  validateSearch: lineLinkSearchSchema,
  component: LineLinkScreen,
});
