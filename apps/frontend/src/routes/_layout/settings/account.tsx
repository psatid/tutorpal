import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { ScreenLayout } from "@/components/layout/screen-layout";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/auth-context";
import { AccountSettingsScreen } from "@/screens/account-settings-screen";

const accountSettingsSearch = z.object({
  google: z.enum(["connected", "error"]).optional(),
  line: z.enum(["connected", "error"]).optional(),
});

export const Route = createFileRoute("/_layout/settings/account")({
  validateSearch: accountSettingsSearch,
  component: AccountSettingsRoute,
});

function AccountSettingsRoute() {
  const navigate = useNavigate();
  const { isImpersonating } = useAuth();
  const { google, line } = Route.useSearch();

  useEffect(() => {
    if (isImpersonating) {
      void navigate({ to: APP_ROUTES.HOME, replace: true });
    }
  }, [isImpersonating, navigate]);

  if (isImpersonating) {
    return null;
  }

  return (
    <ScreenLayout>
      <AccountSettingsScreen
        googleCallback={google}
        lineCallback={line}
        onCallbackHandled={() =>
          void navigate({ to: APP_ROUTES.ACCOUNT_SETTINGS, replace: true })
        }
      />
    </ScreenLayout>
  );
}
