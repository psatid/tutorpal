import { createFileRoute } from "@tanstack/react-router";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { IntegrationsScreen } from "@/screens/integrations-screen";

export const Route = createFileRoute("/_layout/integrations/")({
  component: IntegrationsRoute,
});

function IntegrationsRoute() {
  return (
    <ScreenLayout>
      <IntegrationsScreen />
    </ScreenLayout>
  );
}
