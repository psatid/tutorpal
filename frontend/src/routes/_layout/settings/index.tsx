import { createFileRoute, redirect } from "@tanstack/react-router";
import { APP_ROUTES } from "@/constants/routes";

export const Route = createFileRoute("/_layout/settings/")({
  beforeLoad: () => {
    throw redirect({ to: APP_ROUTES.LINE_SETTINGS, replace: true });
  },
});
