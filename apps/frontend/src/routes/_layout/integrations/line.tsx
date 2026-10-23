import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { LineSettingsScreen } from "@/screens/line-settings-screen";

const integrationSearch = z.object({
  testRecipient: z.enum(["connected", "error"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_layout/integrations/line")({
  validateSearch: integrationSearch,
  component: LineIntegrationRoute,
});

function LineIntegrationRoute() {
  const { testRecipient } = Route.useSearch();

  return (
    <ScreenLayout>
      <LineSettingsScreen testRecipient={testRecipient} />
    </ScreenLayout>
  );
}
