import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/screens/dashboard-screen";

export const Route = createFileRoute("/_layout/")({
  component: DashboardScreen,
});
