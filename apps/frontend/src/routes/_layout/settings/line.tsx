import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { APP_ROUTES } from "@/constants/routes";

const lineSettingsSearch = z.object({
  testRecipient: z.enum(["connected", "error"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_layout/settings/line")({
  validateSearch: lineSettingsSearch,
  beforeLoad: ({ search }) => {
    throw redirect({
      to: APP_ROUTES.LINE_INTEGRATION,
      search,
      replace: true,
    });
  },
});
