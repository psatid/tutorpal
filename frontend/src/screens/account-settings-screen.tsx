import { type ReactNode, useEffect, useRef } from "react";
import { AlertCircle, KeyRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { useStartLineAuthorization } from "@/hooks/mutations/use-start-line-authorization";
import { useSocialAccountStatus } from "@/hooks/queries/use-social-account-status";
import type { SocialAccountStatus } from "@/lib/social-account-api";
import { usePublicConfig } from "@/lib/public-config";

type AccountSettingsScreenProps = {
  lineCallback?: "connected" | "error";
  onCallbackHandled: () => void;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.35 12.23c0-.72-.06-1.25-.2-1.8H12v3.42h5.37c-.11.85-.72 2.13-2.08 2.99l-.02.11 3.02 2.34.21.02c1.92-1.77 2.85-4.38 2.85-7.08Z"
      />
      <path
        fill="#34A853"
        d="M12 21.73c2.63 0 4.84-.87 6.45-2.38l-3.07-2.47c-.82.57-1.92.97-3.38.97-2.58 0-4.77-1.7-5.55-4.05l-.1.01-3.14 2.43-.03.1A9.74 9.74 0 0 0 12 21.73Z"
      />
      <path
        fill="#FBBC05"
        d="M6.45 13.8A5.92 5.92 0 0 1 6.14 12c0-.62.11-1.22.3-1.8v-.12L3.27 7.62l-.1.05A9.72 9.72 0 0 0 2.1 12c0 1.56.37 3.03 1.07 4.33l3.28-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.15c1.84 0 3.08.8 3.79 1.47l2.77-2.7C16.83 3.3 14.63 2.27 12 2.27a9.74 9.74 0 0 0-8.82 5.4l3.27 2.53C7.23 7.85 9.42 6.15 12 6.15Z"
      />
    </svg>
  );
}

function LineMark() {
  return (
    <svg aria-hidden="true" className="size-5" viewBox="0 0 24 24">
      <path
        fill="#06C755"
        d="M20.65 10.93c0-4.12-4.13-7.47-9.2-7.47s-9.2 3.35-9.2 7.47c0 3.69 3.28 6.78 7.71 7.37.3.06.7.18.8.41.09.21.06.54.03.75l-.13.71c-.04.21-.2.82.8.45s5.4-3.18 7.37-5.44c1.37-1.5 1.87-3.02 1.87-4.25Z"
      />
      <path fill="white" d="M7.59 8.87h1.04v3.29h1.77v.88H7.59V8.87Zm3.43 0h1.04v4.17h-1.04V8.87Zm1.87 0h1.04l1.77 2.4v-2.4h1.04v4.17h-1.04l-1.77-2.4v2.4h-1.04V8.87Zm4.7 0h2.81v.88h-1.77v.73h1.77v.88h-1.77v.8h1.77v.88h-2.81V8.87Z" />
    </svg>
  );
}

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
  canConnectLine,
  isLineLoginEnabled,
  isLineLoginChecking,
  isLineLoginConfigError,
  isRetryingLineLoginConfig,
  isConnecting,
  onConnectLine,
  onRetryLineLoginConfig,
}: {
  accounts: SocialAccountStatus;
  canConnectLine: boolean;
  isLineLoginEnabled: boolean;
  isLineLoginChecking: boolean;
  isLineLoginConfigError: boolean;
  isRetryingLineLoginConfig: boolean;
  isConnecting: boolean;
  onConnectLine: () => void;
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
          icon={<KeyRound className="size-5" aria-hidden="true" />}
          title={t("account.password.title")}
          description={t("account.password.description")}
          linked={accounts.password}
        />
        <div className="border-t border-border" />
        <MethodRow
          icon={<GoogleMark />}
          title={t("account.google.title")}
          description={t("account.google.description")}
          linked={accounts.google}
        />
        <div className="border-t border-border" />
        <MethodRow
          icon={<LineMark />}
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
                  aria-busy={isConnecting}
                  className="w-full sm:w-auto"
                  loading={isConnecting}
                  onClick={onConnectLine}
                >
                  {isConnecting
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
  const canConnectLine =
    session !== null && user?.role === "user" && !isImpersonating;
  const handledCallback = useRef<string | undefined>(undefined);
  const accounts = useSocialAccountStatus();
  const connectLine = useStartLineAuthorization();

  const handleConnectLine = () => {
    connectLine.mutate(undefined, {
      onSuccess: (authorizationUrl) => window.location.assign(authorizationUrl),
      onError: () => toast.error(t("account.line.connectFailed")),
    });
  };

  useEffect(() => {
    if (!lineCallback || handledCallback.current === lineCallback) {
      return;
    }

    handledCallback.current = lineCallback;

    const handleCallback = async () => {
      const result = await accounts.refetch();

      if (lineCallback === "connected" && result.data?.line) {
        toast.success(t("account.line.connected"));
      } else if (lineCallback === "connected") {
        toast.error(t("account.line.notReflected"));
      } else {
        toast.error(t("account.line.connectFailed"));
      }

      onCallbackHandled();
    };

    void handleCallback();
  }, [accounts, lineCallback, onCallbackHandled, t]);

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
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
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
          canConnectLine={canConnectLine}
          isLineLoginEnabled={socialLogin.line}
          isLineLoginChecking={isPublicConfigChecking}
          isLineLoginConfigError={isPublicConfigError}
          isRetryingLineLoginConfig={isPublicConfigFetching}
          isConnecting={connectLine.isPending}
          onConnectLine={handleConnectLine}
          onRetryLineLoginConfig={() => void refetchPublicConfig()}
        />
      ) : null}
    </section>
  );
}
