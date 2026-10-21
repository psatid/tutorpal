import { Link } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight01Icon as ArrowRightHugeIcon,
  CheckmarkCircle02Icon as CheckCircleHugeIcon,
  CircleIcon as CircleHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common/button";
import { Badge } from "@/components/common/badge";
import { Skeleton } from "@/components/common/skeleton";
import { APP_ROUTES } from "@/constants/routes";
import { useLineConnection } from "@/hooks/queries/use-line-connection";

export function IntegrationsScreen() {
  const { t } = useTranslation(["integrations"]);
  const connection = useLineConnection();
  const isConnectionLoading =
    connection.isLoading ||
    (!connection.isError && connection.data === undefined);

  return (
    <section className="mx-auto w-full max-w-[960px] px-1 pb-10 pt-4 sm:px-3 sm:pt-6">
      <header className="mb-8">
        <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
          {t("integrations:title")}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          {t("integrations:description")}
        </p>
      </header>

      <section aria-labelledby="messaging-integrations-heading" className="mb-8">
        <h2
          className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          id="messaging-integrations-heading"
        >
          {t("integrations:groups.messaging")}
        </h2>
        <div
          className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]"
        >
          {isConnectionLoading ? (
            <IntegrationCardSkeleton label={t("integrations:loadingLine")} />
          ) : connection.isError ? (
            <LineConnectionErrorCard
              message={t("integrations:line.connectionError")}
              name={t("integrations:line.name")}
              onRetry={() => void connection.refetch()}
              retryLabel={t("integrations:retry")}
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
                connection.data?.configured
                  ? t("integrations:line.manage")
                  : t("integrations:line.setUp")
              }
              to={APP_ROUTES.LINE_INTEGRATION}
            />
          )}
        </div>
      </section>

      <section aria-labelledby="online-class-integrations-heading" className="mb-8">
        <h2
          className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          id="online-class-integrations-heading"
        >
          {t("integrations:groups.onlineClasses")}
        </h2>
        <div
          className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17.5rem),1fr))]"
        >
          <ComingSoonCard
            description={t("integrations:zoom.description")}
            name={t("integrations:zoom.name")}
            label={t("integrations:zoom.comingSoon")}
            provider="zoom"
          />
          <ComingSoonCard
            description={t("integrations:googleMeet.description")}
            name={t("integrations:googleMeet.name")}
            label={t("integrations:googleMeet.comingSoon")}
            provider="google-meet"
          />
        </div>
      </section>

      <p className="text-center text-xs leading-5 text-muted-foreground">
        {t("integrations:privacyNote")}
      </p>
    </section>
  );
}

function IntegrationCard({
  accountBasicId,
  accountName,
  description,
  name,
  provider,
  status,
  statusLabel,
  action,
  to,
}: {
  accountBasicId?: string | null;
  accountName?: string;
  description: string;
  name: string;
  provider: Provider;
  status: "connected" | "not-connected";
  statusLabel: string;
  action: string;
  to: string;
}) {
  return (
    <article
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
    >
      <ProviderMark name={name} provider={provider} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <Badge
            className="gap-1.5"
            variant={status === "connected" ? "success" : "neutral"}
          >
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3.5"
              icon={
                status === "connected" ? CheckCircleHugeIcon : CircleHugeIcon
              }
              strokeWidth={2}
            />
            {statusLabel}
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm leading-5 text-muted-foreground">
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
      <Button
        className="min-h-11 w-full shrink-0 sm:w-auto"
        render={<Link to={to} />}
        variant={status === "connected" ? "outline" : "default"}
      >
        {action}
        <HugeiconsIcon
          aria-hidden="true"
          className="ml-1 size-4"
          icon={ArrowRightHugeIcon}
          strokeWidth={2}
        />
      </Button>
    </article>
  );
}

function ComingSoonCard({
  description,
  name,
  label,
  provider,
}: {
  description: string;
  name: string;
  label: string;
  provider: Provider;
}) {
  return (
    <article
      className="flex min-w-0 items-start gap-4 rounded-xl border border-border bg-card p-5"
    >
      <ProviderMark name={name} provider={provider} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-foreground">{name}</h3>
          <Badge className="gap-1.5" variant="neutral">
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3.5"
              icon={CircleHugeIcon}
              strokeWidth={2}
            />
            {label}
          </Badge>
        </div>
        <p className="mt-1 truncate text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </article>
  );
}

function LineConnectionErrorCard({
  message,
  name,
  onRetry,
  retryLabel,
}: {
  message: string;
  name: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <article
      className="flex min-w-0 flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center"
    >
      <ProviderMark name={name} provider="line" />
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <p className="mt-1 text-sm leading-5 text-muted-foreground" role="alert">
          {message}
        </p>
      </div>
      <Button
        className="min-h-11 w-full shrink-0 sm:w-auto"
        onClick={onRetry}
        variant="outline"
      >
        {retryLabel}
      </Button>
    </article>
  );
}

type Provider = "line" | "zoom" | "google-meet";

function ProviderMark({
  name,
  provider,
}: {
  name: string;
  provider: Provider;
}) {
  const label: Record<Provider, string> = {
    line: "LINE",
    zoom: "zoom",
    "google-meet": "Meet",
  };

  return (
    <span
      aria-label={name}
      className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground"
      role="img"
    >
      <span className="text-[0.625rem] font-bold tracking-[-0.04em]">
        {label[provider]}
      </span>
    </span>
  );
}

function IntegrationCardSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="flex items-center gap-5 rounded-xl border border-border bg-card p-5"
      role="status"
    >
      <Skeleton className="size-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      <Skeleton className="h-11 w-28 shrink-0 rounded-full" />
    </div>
  );
}
