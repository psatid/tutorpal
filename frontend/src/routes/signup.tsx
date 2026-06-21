import { createFileRoute } from "@tanstack/react-router";
import { SignupScreen } from "@/screens/signup-screen";

export const Route = createFileRoute("/signup")({
  component: SignupScreen,
});
