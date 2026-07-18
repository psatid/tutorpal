import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, LogOut, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLogout } from "@/hooks/mutations/use-logout";
import { getLineConnection } from "@/lib/line-settings-api";
import { APP_ROUTES } from "@/constants/routes";

function initials(name?: string) {
  return (name || "TutorPal")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function SettingsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation(["settings"]);
  const logout = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const connection = useQuery({
    queryKey: ["line", "connection"],
    queryFn: getLineConnection,
    retry: false,
  });
  const status = connection.data?.configured
    ? t("settings:line.connected")
    : t("settings:line.notConnected");
  const routeReturnTo = (location.search as { returnTo?: unknown }).returnTo;
  const returnTo = typeof routeReturnTo === "string" ? routeReturnTo : null;
  const exitTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith(APP_ROUTES.SETTINGS)
      ? returnTo
      : APP_ROUTES.HOME;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col pb-8">
      <header className="mb-8 flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: exitTo })}
          aria-label={t("settings:backToApp")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 pt-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            {t("settings:title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("settings:subtitle")}</p>
        </div>
      </header>

      <div className="flex items-center gap-4 border-b border-border pb-6">
        <Avatar size="lg" className="size-14">
          <AvatarImage src={user?.image ?? undefined} alt="" />
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate font-bold text-foreground">{user?.name}</h3>
          <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          {t("settings:connections")}
        </h3>
        <Link
          to="/settings/line"
          search={{ returnTo: returnTo ?? undefined }}
          className="group flex min-h-20 items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/40"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-foreground">{t("settings:line.title")}</span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {connection.isLoading ? t("settings:line.checking") : status}
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="mt-12 border-t border-border pt-6 sm:mt-16">
        <Button
          variant="destructive"
          onClick={() => logout.mutate()}
          loading={logout.isPending}
          leftIcon={LogOut}
          className="w-full sm:w-auto"
        >
          {t("settings:logout")}
        </Button>
      </div>
    </section>
  );
}
