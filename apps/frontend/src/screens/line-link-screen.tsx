import { useCallback, useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon as XCircleHugeIcon,
  CheckmarkCircle02Icon as CheckCircleHugeIcon,
  RotateLeft01Icon as RetryHugeIcon,
} from "@hugeicons/core-free-icons";
import { isAxiosError } from "axios";
import { useTranslation } from "react-i18next";
import { Button } from "@tutorpal/ui/button";
import { LineMark } from "@/components/auth/provider-marks";
import {
  getAppLanguage,
  setAppLanguage,
  type AppLanguage,
} from "@/lib/i18n/config";
import { apiClient } from "@/lib/api-client";
import { validateLineAuthorizationUrl } from "@/lib/line-authorization-url";
import { cn } from "@/lib/utils";

type LinkState = "loading" | "ready" | "success" | "error";
type LinkError =
  | "missing_params"
  | "link_failed"
  | "invalid_token"
  | "connection_unavailable"
  | "network";

function LanguageSelector() {
  const { t } = useTranslation("auth");
  const activeLanguage = getAppLanguage();

  return (
    <div
      className="flex items-center gap-1"
      aria-label={t("footer.languageLabel")}
    >
      {(["en", "th"] as const).map((language) => (
        <button
          key={language}
          type="button"
          aria-pressed={activeLanguage === language}
          className={cn(
            "min-h-11 min-w-11 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            activeLanguage === language
              ? "font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => void setAppLanguage(language as AppLanguage)}
        >
          {t(`footer.language.${language}`)}
        </button>
      ))}
    </div>
  );
}

function ConnectionIdentity() {
  return (
    <div
      className="flex items-center gap-3 sm:justify-center sm:gap-4"
      aria-hidden="true"
    >
      <img src="/app-icon.png" alt="" className="size-14 shrink-0" />
      <span className="flex gap-1">
        <span className="size-1.5 rounded-full bg-muted-foreground/45" />
        <span className="size-1.5 rounded-full bg-muted-foreground/45" />
        <span className="size-1.5 rounded-full bg-muted-foreground/45" />
      </span>
      <span className="flex size-14 items-center justify-center rounded-xl bg-[#00C300] p-2">
        <img
          src="/icons/line/default.svg"
          alt=""
          className="size-10 brightness-0 invert"
        />
      </span>
    </div>
  );
}

function classifyLinkError(error: unknown): LinkError {
  if (!isAxiosError(error)) {
    return "connection_unavailable";
  }

  const payload = error.response?.data as { errorCode?: string } | undefined;

  if (
    payload?.errorCode === "INVALID_TOKEN" ||
    payload?.errorCode === "MISSING_TOKEN"
  ) {
    return "invalid_token";
  }

  return error.response ? "connection_unavailable" : "network";
}

export function LineLinkScreen() {
  const { t } = useTranslation(["students", "auth"]);
  const search = useSearch({ strict: false }) as {
    token?: string;
    success?: string | boolean;
    error?: string;
    name?: string;
  };
  const [state, setState] = useState<LinkState>("loading");
  const [linkError, setLinkError] = useState<LinkError | null>(null);
  const [linkedName, setLinkedName] = useState("");
  const { token, success, error, name } = search;
  const isConnecting = state === "loading" && Boolean(token);

  useEffect(() => {
    if (success === true || success === "true") {
      setLinkedName(name || "");
      setState("success");
      return;
    }

    if (error) {
      setLinkError(
        error === "missing_params" ? "missing_params" : "link_failed",
      );
      setState("error");
      return;
    }

    if (!token) {
      setLinkError("invalid_token");
      setState("error");
      return;
    }

    setState("ready");
  }, [error, name, success, token]);

  const handleConnect = useCallback(async () => {
    if (!token) return;

    setState("loading");
    setLinkError(null);

    try {
      const response = await apiClient.getV1LineAuthUrl({ token });
      window.location.href = validateLineAuthorizationUrl(
        response.data.authUrl,
      );
    } catch (requestError) {
      setLinkError(classifyLinkError(requestError));
      setState("error");
    }
  }, [token]);

  const errorCopy = linkError
    ? {
        missing_params: t("students:line.error.missing"),
        link_failed: t("students:line.error.expired"),
        invalid_token: t("students:line.error.invalid"),
        connection_unavailable: t(
          "students:line.error.connectionUnavailable",
        ),
        network: t("students:line.error.network"),
      }[linkError]
    : "";
  const errorTitle =
    linkError === "network"
      ? t("students:line.networkErrorTitle")
      : linkError === "connection_unavailable"
        ? t("students:line.connectionUnavailableTitle")
        : t("students:line.expiredErrorTitle");

  return (
    <div className="flex min-h-dvh flex-col bg-card px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:pt-8">
      <header className="flex min-h-11 justify-end">
        <LanguageSelector />
      </header>
      <main className="flex flex-1 flex-col items-center sm:justify-center">
        {state === "ready" || isConnecting ? (
          <section className="flex w-full max-w-sm flex-1 flex-col sm:flex-none sm:min-h-[27rem] sm:text-center">
            <ConnectionIdentity />
            <div className="mt-8 space-y-4">
              <h1 className="text-balance text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">
                {t("students:line.readyTitle")}
              </h1>
              <p className="text-pretty text-sm leading-6 text-muted-foreground sm:text-base">
                {t("students:line.readyDescription")}
              </p>
              <p className="rounded-lg bg-muted px-4 py-3 text-sm leading-6 text-secondary-foreground">
                {t("students:line.approvalNote")}
              </p>
            </div>
            <Button
              type="button"
              className="mt-auto h-12 w-full sm:mt-8"
              loading={isConnecting}
              disabled={isConnecting}
              aria-busy={isConnecting}
              onClick={() => void handleConnect()}
            >
              <LineMark />
              {isConnecting
                ? t("students:line.connecting")
                : t("students:line.connect")}
            </Button>
          </section>
        ) : null}

        {state === "success" ? (
          <section className="flex w-full max-w-sm flex-1 flex-col pt-8 sm:flex-none sm:text-center">
            <img src="/app-icon.png" alt="" className="size-14" />
            <HugeiconsIcon
              icon={CheckCircleHugeIcon}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-8 size-10 text-success sm:mx-auto"
            />
            <h1 className="mt-4 text-balance text-4xl font-light leading-tight tracking-[-0.02em] text-foreground sm:text-[2.5rem]">
              {t("students:line.successTitle")}
            </h1>
            {linkedName ? (
              <p className="mt-3 break-words text-muted-foreground">
                {t("students:line.connectedAs", { name: linkedName })}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("students:line.closePage")}
            </p>
          </section>
        ) : null}

        {state === "error" ? (
          <section
            className="flex w-full max-w-sm flex-1 flex-col pt-8 sm:flex-none sm:text-center"
            aria-live="assertive"
            role="alert"
          >
            <img src="/app-icon.png" alt="" className="size-14" />
            <HugeiconsIcon
              icon={XCircleHugeIcon}
              strokeWidth={2}
              aria-hidden="true"
              className="mt-8 size-10 text-destructive sm:mx-auto"
            />
            <h1 className="mt-4 text-balance text-3xl font-light tracking-[-0.02em] text-foreground sm:text-4xl">
              {errorTitle}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {errorCopy}
            </p>
            {linkError === "network" ? (
              <Button
                type="button"
                onClick={() => void handleConnect()}
                variant="outline"
                className="mt-8 h-12 w-full"
                rightIcon={RetryHugeIcon}
              >
                {t("students:line.retry")}
              </Button>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                {t("students:line.askTutor")}
              </p>
            )}
          </section>
        ) : null}
      </main>
      <footer className="hidden border-t border-border pt-5 text-xs text-muted-foreground sm:flex sm:items-center">
        <p>{t("auth:footer.copyright")}</p>
      </footer>
    </div>
  );
}
