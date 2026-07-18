import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SettingsScreen } from "@/screens/settings-screen";

export const Route = createFileRoute("/_layout/settings/")({
  validateSearch: z.object({
    returnTo: z.string().optional(),
  }),
  component: SettingsScreen,
});
