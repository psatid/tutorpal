import { useState, useEffect, useCallback } from "react";
import { useSearch } from "@tanstack/react-router";
import { Loader2, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";

type LinkState = "loading" | "ready" | "success" | "error";

type LinkError = "missing_params" | "link_failed" | "invalid_token" | "network";

export function LineLinkScreen() {
  const { t } = useTranslation(["students"]);
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

  useEffect(() => {
    if (success === true || success === "true") {
      setLinkedName(name || "");
      setState("success");
      return;
    }
    if (error) {
      const errorMap: Record<string, LinkError> = {
        missing_params: "missing_params",
        link_failed: "link_failed",
      };
      setLinkError(errorMap[error] || "link_failed");
      setState("error");
      return;
    }
    if (!token) {
      setLinkError("invalid_token");
      setState("error");
      return;
    }
    setState("ready");
  }, [token, success, error, name]);

  const handleConnect = useCallback(async () => {
    if (!token) return;
    setState("loading");
    setLinkError(null);
    try {
      const response = await apiClient.getV1LineAuthUrl({
        token,
      });
      window.location.href = response.data.authUrl;
    } catch {
      setLinkError("network");
      setState("error");
    }
  }, [token]);

  const errorMessage = linkError
    ? {
        missing_params: t("students:line.error.missing"),
        link_failed: t("students:line.error.expired"),
        invalid_token: t("students:line.error.invalid"),
        network: t("students:line.error.network"),
      }[linkError]
    : "";

  const canRetry = linkError === "network";

  return (
    <div className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-[#eaf1f8] p-6">
      <img
        aria-hidden="true"
        alt=""
        className="pointer-events-none absolute inset-0 -z-10 size-full object-cover opacity-70"
        src="/stripe-auth-mesh.svg"
      />
      <div className="relative z-10 w-full max-w-sm space-y-6 rounded-xl border border-white/80 bg-white p-6 text-center shadow-transient-card sm:p-8">
        <div className="space-y-2">
          <div className="flex justify-center">
            <div className="flex size-20 items-center justify-center rounded-xl bg-primary-container">
              <span className="text-3xl font-semibold text-primary">TP</span>
            </div>
          </div>
          <h1 className="font-headline text-2xl font-light tracking-[-0.02em] text-on-surface">
            TutorPal
          </h1>
        </div>

        {state === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-on-surface-variant">
              {t("students:line.connecting")}
            </p>
          </div>
        )}

        {state === "ready" && (
          <div className="space-y-6">
            <p className="text-on-surface-variant leading-relaxed">
              {t("students:line.readyDescription")}
            </p>
            <Button
              onClick={handleConnect}
              size="lg"
              className="w-full"
              style={{ backgroundColor: "#06C755" }}
            >
              {t("students:line.connect")}
            </Button>
          </div>
        )}

        {state === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div className="space-y-1">
              <h2 className="font-headline text-xl font-normal tracking-[-0.01em] text-on-surface">
                {t("students:line.successTitle")}
              </h2>
              {linkedName && (
                <p className="text-on-surface-variant">
                  {t("students:line.connectedAs", { name: linkedName })}
                </p>
              )}
            </div>
            <p className="text-sm text-on-surface-variant">
              {t("students:line.closePage")}
            </p>
          </div>
        )}

        {state === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 text-destructive mx-auto" />
            <div className="space-y-1">
              <h2 className="font-headline text-xl font-normal tracking-[-0.01em] text-on-surface">
                {t("students:line.errorTitle")}
              </h2>
              <p className="text-on-surface-variant">{errorMessage}</p>
            </div>
            {canRetry ? (
              <Button
                onClick={handleConnect}
                variant="outline"
                rightIcon={RotateCcw}
              >
                {t("students:line.retry")}
              </Button>
            ) : (
              <p className="text-sm text-on-surface-variant">
                {t("students:line.askTutor")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
