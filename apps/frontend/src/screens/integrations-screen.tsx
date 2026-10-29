import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon as ArrowRightHugeIcon,
  CheckmarkCircle02Icon as CheckCircleHugeIcon,
  CircleIcon as CircleHugeIcon,
} from "@hugeicons/core-free-icons";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@tutorpal/ui/button";
import { Badge } from "@tutorpal/ui/badge";
import { Skeleton } from "@tutorpal/ui/skeleton";
import { APP_ROUTES } from "@/constants/routes";
import { useLineConnection } from "@/hooks/queries/use-line-connection";

export function IntegrationsScreen() {
  const { t } = useTranslation(["integrations"]);
  const connection = useLineConnection();
  const isConnectionLoading =
    connection.isLoading ||
    (!connection.isError && connection.data === undefined);

  return (
    <section className="pb-10 mx-auto w-full max-w-7xl">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          {t("integrations:title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("integrations:description")}
        </p>
      </header>

      <section
        aria-labelledby="messaging-integrations-heading"
        className="mb-8"
      >
        <h2
          className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          id="messaging-integrations-heading"
        >
          {t("integrations:groups.messaging")}
        </h2>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
          {isConnectionLoading ? (
            <IntegrationCardSkeleton label={t("integrations:loadingLine")} />
          ) : connection.isError ? (
            <IntegrationCard
              action={
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  onClick={() => void connection.refetch()}
                  variant="outline"
                >
                  {t("integrations:retry")}
                </Button>
              }
              alert
              description={t("integrations:line.connectionError")}
              name={t("integrations:line.name")}
              provider="line"
            />
          ) : (
            <IntegrationCard
              accountBasicId={
                connection.data?.configured
                  ? connection.data.accountBasicId
                  : undefined
              }
              accountName={
                connection.data?.configured
                  ? connection.data.accountName
                  : undefined
              }
              description={t("integrations:line.description")}
              name={t("integrations:line.name")}
              provider="line"
              status={
                connection.data?.configured ? "connected" : "not-connected"
              }
              statusLabel={
                connection.data?.configured
                  ? t("integrations:line.connected")
                  : t("integrations:line.notConnected")
              }
              action={
                <Button
                  className="min-h-11 w-full sm:w-auto"
                  render={<Link to={APP_ROUTES.LINE_INTEGRATION} />}
                  variant={connection.data?.configured ? "outline" : "default"}
                >
                  {connection.data?.configured
                    ? t("integrations:line.manage")
                    : t("integrations:line.setUp")}
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="ml-1 size-4"
                    icon={ArrowRightHugeIcon}
                    strokeWidth={2}
                  />
                </Button>
              }
            />
          )}
        </div>
      </section>

      <section
        aria-labelledby="online-class-integrations-heading"
        className="mb-8"
      >
        <h2
          className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          id="online-class-integrations-heading"
        >
          {t("integrations:groups.onlineClasses")}
        </h2>
        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]">
          <IntegrationCard
            description={t("integrations:zoom.description")}
            name={t("integrations:zoom.name")}
            provider="zoom"
            status="coming-soon"
            statusLabel={t("integrations:zoom.comingSoon")}
          />
          <IntegrationCard
            description={t("integrations:googleMeet.description")}
            name={t("integrations:googleMeet.name")}
            provider="google-meet"
            status="coming-soon"
            statusLabel={t("integrations:googleMeet.comingSoon")}
          />
        </div>
      </section>
    </section>
  );
}

function IntegrationCard({
  accountBasicId,
  accountName,
  action,
  alert,
  description,
  name,
  provider,
  status,
  statusLabel,
}: {
  accountBasicId?: string | null;
  accountName?: string;
  action?: ReactNode;
  alert?: boolean;
  description: string;
  name: string;
  provider: Provider;
  status?: "connected" | "not-connected" | "coming-soon";
  statusLabel?: string;
}) {
  return (
    <article className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <ProviderMark provider={provider} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words font-semibold text-foreground">
              {name}
            </h3>
            {status && statusLabel ? (
              <Badge
                className="gap-1.5"
                variant={status === "connected" ? "success" : "neutral"}
              >
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-3.5"
                  icon={
                    status === "connected"
                      ? CheckCircleHugeIcon
                      : CircleHugeIcon
                  }
                  strokeWidth={2}
                />
                {statusLabel}
              </Badge>
            ) : null}
          </div>
          <p
            className="mt-1 text-sm leading-5 text-muted-foreground"
            role={alert ? "alert" : undefined}
          >
            {description}
          </p>
          {accountName ? (
            <p className="mt-2 truncate text-sm font-medium text-foreground">
              {accountName}
            </p>
          ) : null}
          {accountBasicId ? (
            <p className="truncate text-sm text-muted-foreground">
              {accountBasicId}
            </p>
          ) : null}
        </div>
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto">{action}</div>
      ) : null}
    </article>
  );
}

type Provider = "line" | "zoom" | "google-meet";

function ProviderMark({ provider }: { provider: Provider }) {
  const src: Record<Provider, string> = {
    line: "/icons/line/default.svg",
    zoom: "/icons/zoom/zoom-2025.svg",
    "google-meet": "/icons/google-meet/google-meet-2026.svg",
  };

  return (
    <span
      aria-hidden="true"
      className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted p-2"
    >
      <img alt="" className="size-8 object-contain" src={src[provider]} />
    </span>
  );
}

function IntegrationCardSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
      role="status"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <Skeleton className="h-11 w-full shrink-0 rounded-full sm:w-28" />
    </div>
  );
}
