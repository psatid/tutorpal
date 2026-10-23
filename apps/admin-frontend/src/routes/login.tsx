import { createFileRoute } from "@tanstack/react-router";
import { AdminLoginScreen } from "@/screens/admin-login-screen";

export const Route = createFileRoute("/login")({
	component: AdminLoginScreen,
});
