import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailScreen } from "@/screens/verify-email-screen";

const verifyEmailSearchSchema = z.object({
  email: z.string().optional(),
  error: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifyEmailSearchSchema,
  component: VerifyEmailScreen,
});
