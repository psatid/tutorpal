import { createFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { DashboardScreen } from "@/screens/dashboard-screen";

export const Route = createFileRoute("/_layout/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ScreenLayout>
      <DashboardScreen />
    </ScreenLayout>
  );
}
