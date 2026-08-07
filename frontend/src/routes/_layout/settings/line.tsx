import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { LineSettingsScreen } from "@/screens/line-settings-screen";

const lineSettingsSearch = z.object({
  testRecipient: z.enum(["connected", "error"]).optional(),
  returnTo: z.string().optional(),
});

export const Route = createFileRoute("/_layout/settings/line")({
  validateSearch: lineSettingsSearch,
  component: LineSettingsRoute,
});

function LineSettingsRoute() {
  return (
    <ScreenLayout>
      <LineSettingsScreen />
    </ScreenLayout>
  );
}
