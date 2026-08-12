import { type FormEvent, useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  MessageCircle,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lineQueryKeys } from "@/constants/query-keys/line-query-keys";
import { useLineConnection } from "@/hooks/queries/use-line-connection";
import { DateTime } from "@/lib/date-time";
import {
  saveLineConnection,
  sendLineConnectionTestMessage,
  startLineTestRecipientAuthorization,
  type LineConnectionCredentials,
} from "@/lib/line-settings-api";

const emptyCredentials: LineConnectionCredentials = {
  messagingAccessToken: "",
  loginChannelId: "",
  loginChannelSecret: "",
};

function connectionError(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "response" in error) {
    const response = error.response as { data?: { message?: string } };
    return response.data?.message || fallback;
  }
  return fallback;
}

export function LineSettingsScreen() {
  const { t } = useTranslation(["settings"]);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState(emptyCredentials);
  const connection = useLineConnection();

  const save = useMutation({
    mutationFn: saveLineConnection,
    onSuccess: (data) => {
      queryClient.setQueryData(lineQueryKeys.connection(), data);
      setCredentials(emptyCredentials);
      setEditing(false);
      toast.success(t("settings:line.saved"));
    },
    onError: (error) => toast.error(connectionError(error, t("settings:line.saveFailed"))),
  });

  const connectTestAccount = useMutation({
    mutationFn: startLineTestRecipientAuthorization,
    onSuccess: (authUrl) => window.location.assign(authUrl),
    onError: (error) => toast.error(connectionError(error, t("settings:line.connectTestFailed"))),
  });

  const sendTest = useMutation({
    mutationFn: sendLineConnectionTestMessage,
    onSuccess: () => toast.success(t("settings:line.testSent")),
    onError: (error) => toast.error(connectionError(error, t("settings:line.testFailed"))),
  });

  useEffect(() => {
    const testRecipient = new URLSearchParams(window.location.search).get("testRecipient");
    if (testRecipient === "connected") {
      queryClient.invalidateQueries({ queryKey: lineQueryKeys.connection() });
      toast.success(t("settings:line.testAccountConnected"));
      window.history.replaceState({}, "", "/settings/line");
    }
    if (testRecipient === "error") {
      toast.error(t("settings:line.testAccountFailed"));
      window.history.replaceState({}, "", "/settings/line");
    }
  }, [queryClient, t]);

  const configuredConnection = connection.data?.configured ? connection.data : undefined;
  const testRecipientConnected = configuredConnection?.testRecipientConnected;
  const isBusy = save.isPending || connectTestAccount.isPending || sendTest.isPending;
  const routeReturnTo = (location.search as { returnTo?: unknown }).returnTo;
  const returnTo = typeof routeReturnTo === "string" ? routeReturnTo : null;

  function updateCredential(field: keyof LineConnectionCredentials, value: string) {
    setCredentials((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(credentials);
  }

  return (
    <section className="mx-auto w-full max-w-2xl pb-8">
      <header className="mb-7 flex min-w-0 items-start gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate({
              to: "/settings",
              search: { returnTo: returnTo ?? undefined },
            })
          }
          aria-label={t("settings:backToSettings")}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-normal tracking-[-0.02em] text-foreground">
            {t("settings:line.title")}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("settings:line.description")}</p>
        </div>
      </header>

      {connection.isLoading ? (
        <div className="flex min-h-56 items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-5 animate-spin" /> {t("settings:line.checking")}
        </div>
      ) : configuredConnection && !editing ? (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <span className="size-2.5 rounded-full bg-green-600" aria-hidden="true" />
                  {t("settings:line.connected")}
                </p>
                <h3 className="mt-3 text-xl font-medium tracking-[-0.01em] text-foreground">
                  {configuredConnection.accountName}
                </h3>
                {configuredConnection.accountBasicId ? (
                  <p className="mt-1 text-sm text-muted-foreground">{configuredConnection.accountBasicId}</p>
                ) : null}
              </div>
              <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden="true" />
            </div>
            <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
              {configuredConnection.lastVerifiedAt
                ? t("settings:line.lastVerified", {
                    date: DateTime.formatDateTime(configuredConnection.lastVerifiedAt),
                  })
                : t("settings:line.connected")}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground">{t("settings:line.testTitle")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {testRecipientConnected
                    ? t("settings:line.testReady")
                    : t("settings:line.testSetup")}
                </p>
              </div>
            </div>
            {testRecipientConnected ? (
              <Button
                className="mt-5 w-full"
                onClick={() => sendTest.mutate()}
                loading={sendTest.isPending}
                leftIcon={MessageCircle}
              >
                {t("settings:line.sendTest")}
              </Button>
            ) : (
              <Button
                className="mt-5 w-full"
                onClick={() => connectTestAccount.mutate()}
                loading={connectTestAccount.isPending}
                leftIcon={CheckCircle2}
              >
                {t("settings:line.connectTestAccount")}
              </Button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <KeyRound className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-foreground">{t("settings:line.credentials")}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("settings:line.credentialsDescription")}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={() => setEditing(true)}
              disabled={isBusy}
              leftIcon={Pencil}
            >
              {t("settings:line.editCredentials")}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
          <div className="mb-6 flex gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <KeyRound className="size-5" />
            </span>
            <div>
              <h3 className="font-medium text-foreground">
                {editing ? t("settings:line.updateTitle") : t("settings:line.connectTitle")}
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{t("settings:line.setupHelp")}</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="line-access-token">{t("settings:line.accessToken")}</Label>
              <Input
                id="line-access-token"
                type="password"
                autoComplete="off"
                required
                value={credentials.messagingAccessToken}
                onChange={(event) => updateCredential("messagingAccessToken", event.target.value)}
              />
              <p className="text-sm text-muted-foreground">{t("settings:line.accessTokenHelp")}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-login-channel-id">{t("settings:line.loginChannelId")}</Label>
              <Input
                id="line-login-channel-id"
                autoComplete="off"
                required
                value={credentials.loginChannelId}
                onChange={(event) => updateCredential("loginChannelId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="line-login-channel-secret">{t("settings:line.loginChannelSecret")}</Label>
              <Input
                id="line-login-channel-secret"
                type="password"
                autoComplete="off"
                required
                value={credentials.loginChannelSecret}
                onChange={(event) => updateCredential("loginChannelSecret", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {editing ? (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={save.isPending}>
                {t("settings:cancel")}
              </Button>
            ) : null}
            <Button type="submit" loading={save.isPending}>
              {t("settings:line.saveAndVerify")}
            </Button>
          </div>
        </form>
      )}

      <p className="mt-5 text-center text-sm leading-6 text-muted-foreground">
        {t("settings:line.privacyNote")}
      </p>
    </section>
  );
}
