import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/screens/login-screen";

export const Route = createFileRoute("/login")({
  component: LoginScreen,
});
