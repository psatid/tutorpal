import { type FormEvent, type RefObject, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  KeyRound,
  MessageCircle,
  Pencil,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { lineQueryKeys } from "@/constants/query-keys/line-query-keys";
import { useLineConnection } from "@/hooks/queries/use-line-connection";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
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
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState(emptyCredentials);
  const editCredentialsRef = useRef<HTMLButtonElement>(null);
  const formHeadingRef = useRef<HTMLHeadingElement>(null);
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

  useEffect(() => {
    if (!editing) return;

    const frame = window.requestAnimationFrame(() => {
      formHeadingRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editing]);

  const configuredConnection = connection.data?.configured ? connection.data : undefined;
  const testRecipientConnected = configuredConnection?.testRecipientConnected;
  const isBusy = save.isPending || connectTestAccount.isPending || sendTest.isPending;

  function updateCredential(field: keyof LineConnectionCredentials, value: string) {
    setCredentials((current) => ({ ...current, [field]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(credentials);
  }

  return (
    <section className="mx-auto w-full max-w-2xl pb-8">
      <header className="mb-8 min-w-0">
        <h1 className="text-2xl font-normal tracking-[-0.02em] text-foreground">
          {t("settings:line.title")}
        </h1>
        <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
          {t("settings:line.description")}
        </p>
      </header>

      {connection.isLoading ? <LineSettingsSkeleton /> : null}

      {connection.isError ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground" role="alert">
            {t("settings:line.connectionError")}
          </p>
          <Button className="mt-4" variant="outline" onClick={() => void connection.refetch()}>
            {t("settings:line.retry")}
          </Button>
        </div>
      ) : null}

      {!connection.isLoading && !connection.isError ? (
        <>
          <ConnectionSummary connection={configuredConnection} />

          {configuredConnection && !editing ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-border bg-card">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-medium text-foreground">{t("settings:line.testTitle")}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      {testRecipientConnected
                        ? t("settings:line.testReady")
                        : t("settings:line.testSetup")}
                    </p>
                  </div>
                </div>
                {testRecipientConnected ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => sendTest.mutate()}
                    loading={sendTest.isPending}
                    leftIcon={MessageCircle}
                  >
                    {t("settings:line.sendTest")}
                  </Button>
                ) : (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => connectTestAccount.mutate()}
                    loading={connectTestAccount.isPending}
                    leftIcon={CheckCircle2}
                  >
                    {t("settings:line.connectTestAccount")}
                  </Button>
                )}
              </div>

              <div className="border-t border-border" />

              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                    <KeyRound className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-medium text-foreground">{t("settings:line.credentials")}</h2>
                    <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                      {t("settings:line.credentialsDescription")}
                    </p>
                  </div>
                </div>
                <Button
                  ref={editCredentialsRef}
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => setEditing(true)}
                  disabled={isBusy}
                  leftIcon={Pencil}
                >
                  {t("settings:line.editCredentials")}
                </Button>
              </div>
            </div>
          ) : (
            <CredentialsForm
              editing={editing}
              formHeadingRef={formHeadingRef}
              isSaving={save.isPending}
              onCancel={() => {
                setEditing(false);
                window.requestAnimationFrame(() => editCredentialsRef.current?.focus());
              }}
              onSubmit={submit}
              credentials={credentials}
              updateCredential={updateCredential}
            />
          )}
        </>
      ) : null}

      <p className="mt-5 text-center text-sm leading-6 text-muted-foreground">
        {t("settings:line.privacyNote")}
      </p>
    </section>
  );
}

type ConnectionSummaryProps = {
  connection:
    | {
        accountName?: string;
        accountBasicId?: string | null;
        lastVerifiedAt?: string;
      }
    | undefined;
};

function ConnectionSummary({ connection }: ConnectionSummaryProps) {
  const { t } = useTranslation(["settings"]);
  const isConnected = Boolean(connection);

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p
            className={cn(
              "flex items-center gap-2 text-sm font-semibold",
              isConnected ? "text-green-700" : "text-muted-foreground",
            )}
            role="status"
          >
            {isConnected ? (
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="size-4 shrink-0" aria-hidden="true" />
            )}
            {isConnected ? t("settings:line.connected") : t("settings:line.notConnected")}
          </p>
          {isConnected ? (
            <>
              <h2 className="mt-3 break-words text-xl font-medium tracking-[-0.01em] text-foreground">
                {connection?.accountName}
              </h2>
              {connection?.accountBasicId ? (
                <p className="mt-1 break-words text-sm text-muted-foreground">{connection.accountBasicId}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("settings:line.setupHelp")}
            </p>
          )}
        </div>
        <ShieldCheck
          className={cn(
            "size-6 shrink-0",
            isConnected ? "text-primary" : "text-muted-foreground/60",
          )}
          aria-hidden="true"
        />
      </div>
      {isConnected && connection?.lastVerifiedAt ? (
        <div className="mt-5 border-t border-border pt-4 text-sm text-muted-foreground">
          {t("settings:line.lastVerified", {
            date: DateTime.formatDateTime(connection.lastVerifiedAt),
          })}
        </div>
      ) : null}
    </div>
  );
}

function LineSettingsSkeleton() {
  const { t } = useTranslation(["settings"]);

  return (
    <div className="space-y-5" role="status" aria-label={t("settings:line.checking")}>
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-4 h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-32" />
        <Skeleton className="mt-5 h-px w-full" />
        <Skeleton className="mt-4 h-4 w-44" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-4 w-full max-w-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-full sm:w-40" />
        </div>
        <div className="border-t border-border" />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-4 w-full max-w-md" />
            </div>
          </div>
          <Skeleton className="h-11 w-full sm:w-40" />
        </div>
      </div>
    </div>
  );
}

type CredentialsFormProps = {
  editing: boolean;
  formHeadingRef: RefObject<HTMLHeadingElement | null>;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  credentials: LineConnectionCredentials;
  updateCredential: (field: keyof LineConnectionCredentials, value: string) => void;
};

function CredentialsForm({
  editing,
  formHeadingRef,
  isSaving,
  onCancel,
  onSubmit,
  credentials,
  updateCredential,
}: CredentialsFormProps) {
  const { t } = useTranslation(["settings"]);

  return (
    <form onSubmit={onSubmit} className="mt-5 rounded-lg border border-border bg-card p-5">
      <div className="mb-6 flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2
            ref={formHeadingRef}
            tabIndex={-1}
            className="font-medium text-foreground outline-none"
          >
            {editing ? t("settings:line.updateTitle") : t("settings:line.connectTitle")}
          </h2>
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
            aria-describedby="line-access-token-help"
            required
            value={credentials.messagingAccessToken}
            onChange={(event) => updateCredential("messagingAccessToken", event.target.value)}
          />
          <p id="line-access-token-help" className="text-sm leading-6 text-muted-foreground">
            {t("settings:line.accessTokenHelp")}
          </p>
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
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
            {t("settings:cancel")}
          </Button>
        ) : null}
        <Button type="submit" className="w-full sm:w-auto" loading={isSaving}>
          {t("settings:line.saveAndVerify")}
        </Button>
      </div>
    </form>
  );
}
