import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordScreen } from "@/screens/forgot-password-screen";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordScreen,
});
