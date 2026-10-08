import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { DashboardScreen } from "@/screens/dashboard-screen";

const dashboardSearchSchema = z.object({
  setup: z.literal("hours-added").optional(),
});

export const Route = createFileRoute("/_layout/")({
  validateSearch: dashboardSearchSchema,
  component: DashboardRoute,
});

function DashboardRoute() {
  return (
    <ScreenLayout>
      <DashboardScreen />
    </ScreenLayout>
  );
}
