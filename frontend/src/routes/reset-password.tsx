import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordScreen } from "@/screens/reset-password-screen";

const resetPasswordSearchSchema = z.object({
	token: z.string().optional(),
	error: z.string().optional(),
});

export const Route = createFileRoute("/reset-password")({
	validateSearch: resetPasswordSearchSchema,
	component: ResetPasswordScreen,
});
