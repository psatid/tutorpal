import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import type { StopImpersonationErrorCategory } from "@/hooks/mutations/use-stop-impersonation";
import { getAdminImpersonationRecoveryUrl } from "@/lib/impersonation-recovery";
import { cn } from "@/lib/utils";

type ImpersonationBannerProps = {
  userName?: string;
  isPending: boolean;
  isError: boolean;
  errorCategory?: StopImpersonationErrorCategory;
  onExit: () => void;
};

export function ImpersonationBanner({
  userName,
  isPending,
  isError,
  errorCategory,
  onExit,
}: ImpersonationBannerProps) {
  const { t } = useTranslation(["common", "settings"]);
  const displayName = userName ?? t("common:profile.unknownName");
  const originalSessionUnavailable =
    isError && errorCategory === "original-session-unavailable";
  const retryableFailure = isError && !originalSessionUnavailable;
  const actionLabel = originalSessionUnavailable
    ? t("common:impersonation.banner.recoveryLink")
    : retryableFailure
      ? t("common:retry")
      : isPending
        ? t("settings:exitingTutorView")
        : t("settings:exitTutorView");

  return (
    <section
      aria-busy={isPending}
      aria-label={t("common:impersonation.banner.label")}
      className="border-b border-warning/30 bg-warning-container px-3 py-3 sm:px-4 lg:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
            <TriangleAlert aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-warning-container-foreground">
              {t("common:impersonation.banner.title")}
            </p>
            <p className="mt-0.5 break-words text-sm leading-6 text-warning-container-foreground">
              {t("common:impersonation.banner.description", {
                name: displayName,
              })}
            </p>
          </div>
        </div>
        {originalSessionUnavailable ? (
          <a
            className={cn(
              buttonVariants({ variant: "default" }),
              "w-full sm:w-auto",
            )}
            href={getAdminImpersonationRecoveryUrl()}
          >
            {actionLabel}
          </a>
        ) : (
          <Button
            className="w-full sm:w-auto"
            loading={isPending}
            onClick={onExit}
            type="button"
          >
            {actionLabel}
          </Button>
        )}
      </div>

      <p aria-live="polite" className="sr-only" role="status">
        {isPending ? t("settings:exitingTutorView") : null}
      </p>

      {isError ? (
        <div className="mt-3 border-t border-warning/30 pt-3" role="alert">
          <p className="text-sm font-medium text-warning-container-foreground">
            {originalSessionUnavailable
              ? t("common:impersonation.banner.recovery")
              : t("common:impersonation.banner.exitError")}
          </p>
        </div>
      ) : null}
    </section>
  );
}
