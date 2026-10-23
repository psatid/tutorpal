import { createFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { SchedulesScreen } from "@/screens/schedules-screen";

export const Route = createFileRoute("/_layout/schedules")({
  component: SchedulesRoute,
});

function SchedulesRoute() {
  return (
    <ScreenLayout fullBleed className="h-[calc(100dvh-3rem)] min-h-0">
      <SchedulesScreen />
    </ScreenLayout>
  );
}
