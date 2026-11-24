import { type ReactNode, useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon as AlertCircleHugeIcon,
  Key01Icon as KeyRoundHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@tutorpal/ui/button";
import { Skeleton } from "@tutorpal/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useStartGoogleAuthorization } from "@/hooks/mutations/use-start-google-authorization";
import { useStartLineAuthorization } from "@/hooks/mutations/use-start-line-authorization";
import { useSocialAccountStatus } from "@/hooks/queries/use-social-account-status";
import type { SocialAccountStatus } from "@/lib/social-account-api";
import { usePublicConfig } from "@/lib/public-config";

type AccountSettingsScreenProps = {
  googleCallback?: "connected" | "error";
  lineCallback?: "connected" | "error";
  onCallbackHandled: () => void;
};

function AccountMethodsSkeleton() {
  const { t } = useTranslation("settings");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" role="status">
      <span className="sr-only">{t("account.checking")}</span>
      <div className="space-y-2 p-5">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </div>
      {[0, 1, 2].map((row) => (
        <div className="flex items-center gap-3 border-t border-border p-5" key={row}>
          <Skeleton className="size-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </div>
          <Skeleton className="hidden h-9 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}

type MethodRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  linked: boolean;
  action?: ReactNode;
};

function MethodRow({ icon, title, description, linked, action }: MethodRowProps) {
  const { t } = useTranslation("settings");

  return (
    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
          <p className="mt-2 text-sm font-medium text-foreground">
            {linked ? t("account.linked") : t("account.notLinked")}
          </p>
        </div>
      </div>
      {action ? <div className="w-full shrink-0 sm:w-auto">{action}</div> : null}
    </div>
  );
}

function AccountMethods({
  accounts,
  canConnectGoogle,
  canConnectLine,
  isGoogleLoginEnabled,
  isGoogleLoginChecking,
  isGoogleLoginConfigError,
  isLineLoginEnabled,
  isLineLoginChecking,
  isLineLoginConfigError,
  isRetryingGoogleLoginConfig,
  isRetryingLineLoginConfig,
  isConnectingGoogle,
  isConnectingLine,
  onConnectGoogle,
  onConnectLine,
  onRetryGoogleLoginConfig,
  onRetryLineLoginConfig,
}: {
  accounts: SocialAccountStatus;
  canConnectGoogle: boolean;
  canConnectLine: boolean;
  isGoogleLoginEnabled: boolean;
  isGoogleLoginChecking: boolean;
  isGoogleLoginConfigError: boolean;
  isLineLoginEnabled: boolean;
  isLineLoginChecking: boolean;
  isLineLoginConfigError: boolean;
  isRetryingGoogleLoginConfig: boolean;
  isRetryingLineLoginConfig: boolean;
  isConnectingGoogle: boolean;
  isConnectingLine: boolean;
  onConnectGoogle: () => void;
  onConnectLine: () => void;
  onRetryGoogleLoginConfig: () => void;
  onRetryLineLoginConfig: () => void;
}) {
  const { t } = useTranslation("settings");

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="p-5">
        <h2 className="font-medium text-foreground">{t("account.methodsTitle")}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("account.methodsDescription")}
        </p>
      </div>
      <div className="border-t border-border">
        <MethodRow
          icon={<HugeiconsIcon icon={KeyRoundHugeIcon} strokeWidth={2} className="size-5" aria-hidden="true" />}
          title={t("account.password.title")}
          description={t("account.password.description")}
          linked={accounts.password}
        />
        <div className="border-t border-border" />
        <MethodRow
          icon={
            <img
              alt=""
              aria-hidden="true"
              className="size-5 object-contain"
              src="/icons/google/default.svg"
            />
          }
          title={t("account.google.title")}
          description={t("account.google.description")}
          linked={accounts.google}
          action={
            accounts.google ? undefined : (
              isGoogleLoginChecking && canConnectGoogle ? (
                <p
                  aria-live="polite"
                  className="text-sm text-muted-foreground sm:text-right"
                  role="status"
                >
                  {t("account.google.checking")}
                </p>
              ) : isGoogleLoginConfigError && canConnectGoogle ? (
                <div className="space-y-2 sm:text-right" role="alert">
                  <p className="text-sm text-muted-foreground">
                    {t("account.google.availabilityError")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    loading={isRetryingGoogleLoginConfig}
                    onClick={onRetryGoogleLoginConfig}
                  >
                    {t("account.google.retryAvailability")}
                  </Button>
                </div>
              ) : isGoogleLoginEnabled && canConnectGoogle ? (
                <Button
                  aria-busy={isConnectingGoogle}
                  className="w-full sm:w-auto"
                  disabled={isConnectingLine}
                  loading={isConnectingGoogle}
                  onClick={onConnectGoogle}
                  type="button"
                >
                  {isConnectingGoogle
                    ? t("account.google.connecting")
                    : t("account.google.connect")}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground sm:text-right">
                  {t("account.google.unavailable")}
                </p>
              )
            )
          }
        />
        <div className="border-t border-border" />
        <MethodRow
          icon={
            <img
              alt=""
              aria-hidden="true"
              className="size-5 object-contain"
              src="/icons/line/default.svg"
            />
          }
          title={t("account.line.title")}
          description={t("account.line.description")}
          linked={accounts.line}
          action={
            accounts.line ? undefined : (
              isLineLoginChecking && canConnectLine ? (
                <p
                  aria-live="polite"
                  className="text-sm text-muted-foreground sm:text-right"
                  role="status"
                >
                  {t("account.line.checking")}
                </p>
              ) : isLineLoginConfigError && canConnectLine ? (
                <div className="space-y-2 sm:text-right" role="alert">
                  <p className="text-sm text-muted-foreground">
                    {t("account.line.availabilityError")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    loading={isRetryingLineLoginConfig}
                    onClick={onRetryLineLoginConfig}
                  >
                    {t("account.line.retryAvailability")}
                  </Button>
                </div>
              ) : isLineLoginEnabled && canConnectLine ? (
                <Button
                  aria-busy={isConnectingLine}
                  className="w-full sm:w-auto"
                  disabled={isConnectingGoogle}
                  loading={isConnectingLine}
                  onClick={onConnectLine}
                  type="button"
                >
                  {isConnectingLine
                    ? t("account.line.connecting")
                    : t("account.line.connect")}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground sm:text-right">
                  {t("account.line.unavailable")}
                </p>
              )
            )
          }
        />
      </div>
    </div>
  );
}

export function AccountSettingsScreen({
  googleCallback,
  lineCallback,
  onCallbackHandled,
}: AccountSettingsScreenProps) {
  const { t } = useTranslation("settings");
  const { isImpersonating, session, user } = useAuth();
  const {
    isError: isPublicConfigError,
    isFetching: isPublicConfigFetching,
    isPending: isPublicConfigPending,
    isStale: isPublicConfigStale,
    socialLogin,
    refetch: refetchPublicConfig,
  } = usePublicConfig();
  const isPublicConfigChecking =
    !isPublicConfigError &&
    (isPublicConfigPending || isPublicConfigFetching || isPublicConfigStale);
  const canConnectSocial =
    session !== null && user?.role === "user" && !isImpersonating;
  const callbackProvider = googleCallback ? "google" : lineCallback ? "line" : undefined;
  const callbackResult = googleCallback ?? lineCallback;
  const callbackKey = callbackProvider
    ? `${callbackProvider}:${callbackResult}`
    : undefined;
  const handledCallback = useRef<string | undefined>(undefined);
  const accounts = useSocialAccountStatus();
  const connectGoogle = useStartGoogleAuthorization();
  const connectLine = useStartLineAuthorization();

  const handleConnectGoogle = () => {
    if (connectLine.isPending) {
      return;
    }

    connectGoogle.mutate(undefined, {
      onSuccess: (authorizationUrl) => window.location.assign(authorizationUrl),
      onError: () => toast.error(t("account.google.connectFailed")),
    });
  };

  const handleConnectLine = () => {
    if (connectGoogle.isPending) {
      return;
    }

    connectLine.mutate(undefined, {
      onSuccess: (authorizationUrl) => window.location.assign(authorizationUrl),
      onError: () => toast.error(t("account.line.connectFailed")),
    });
  };

  useEffect(() => {
    if (
      !callbackProvider ||
      !callbackResult ||
      handledCallback.current === callbackKey
    ) {
      return;
    }

    handledCallback.current = callbackKey;

    const handleCallback = async () => {
      const messages =
        callbackProvider === "google"
          ? {
              connected: t("account.google.connected"),
              connectFailed: t("account.google.connectFailed"),
              notReflected: t("account.google.notReflected"),
            }
          : {
              connected: t("account.line.connected"),
              connectFailed: t("account.line.connectFailed"),
              notReflected: t("account.line.notReflected"),
            };

      try {
        const result = await accounts.refetch();

        if (
          !result.isError &&
          callbackResult === "connected" &&
          result.data?.[callbackProvider]
        ) {
          toast.success(messages.connected);
        } else if (result.isError) {
          toast.error(messages.connectFailed);
        } else if (callbackResult === "connected") {
          toast.error(messages.notReflected);
        } else {
          toast.error(messages.connectFailed);
        }
      } catch {
        toast.error(messages.connectFailed);
      } finally {
        onCallbackHandled();
      }
    };

    void handleCallback();
  }, [
    accounts,
    callbackKey,
    callbackProvider,
    callbackResult,
    onCallbackHandled,
    t,
  ]);

  return (
    <section className="mx-auto w-full max-w-2xl pb-8">
      <header className="mb-8 min-w-0">
        <h1 className="text-2xl font-normal tracking-[-0.02em] text-foreground">
          {t("account.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("account.description")}
        </p>
      </header>

      {accounts.isLoading ? <AccountMethodsSkeleton /> : null}

      {accounts.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4" role="alert">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <HugeiconsIcon icon={AlertCircleHugeIcon} strokeWidth={2} className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{t("account.fetchError")}</p>
          </div>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void accounts.refetch()}
          >
            {t("account.retry")}
          </Button>
        </div>
      ) : null}

      {accounts.data ? (
        <AccountMethods
          accounts={accounts.data}
          canConnectGoogle={canConnectSocial}
          canConnectLine={canConnectSocial}
          isGoogleLoginEnabled={socialLogin.google}
          isGoogleLoginChecking={isPublicConfigChecking}
          isGoogleLoginConfigError={isPublicConfigError}
          isLineLoginEnabled={socialLogin.line}
          isLineLoginChecking={isPublicConfigChecking}
          isLineLoginConfigError={isPublicConfigError}
          isRetryingGoogleLoginConfig={isPublicConfigFetching}
          isRetryingLineLoginConfig={isPublicConfigFetching}
          isConnectingGoogle={connectGoogle.isPending}
          isConnectingLine={connectLine.isPending}
          onConnectGoogle={handleConnectGoogle}
          onConnectLine={handleConnectLine}
          onRetryGoogleLoginConfig={() => void refetchPublicConfig()}
          onRetryLineLoginConfig={() => void refetchPublicConfig()}
        />
      ) : null}
    </section>
  );
}
