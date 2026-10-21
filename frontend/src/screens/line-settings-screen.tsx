import {
  type FormEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  CheckmarkCircle02Icon as CheckCircle2HugeIcon,
  CircleIcon as CircleHugeIcon,
  Key01Icon as KeyRoundHugeIcon,
  Message01Icon as MessageCircleHugeIcon,
  PencilEdit01Icon as PencilHugeIcon,
  SecurityCheckIcon as ShieldCheckHugeIcon,
  ViewIcon as EyeHugeIcon,
  ViewOffIcon as EyeOffHugeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { Label } from "@/components/common/label";
import { Skeleton } from "@/components/common/skeleton";
import { IntegrationConfigLayout } from "@/components/integrations/integration-config-layout";
import { lineQueryKeys } from "@/constants/query-keys/line-query-keys";
import { APP_ROUTES } from "@/constants/routes";
import { type LineConnection, useLineConnection } from "@/hooks/queries/use-line-connection";
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

const lineErrorTranslationKeys = {
  LINE_CREDENTIALS_INVALID: "lineConfiguration.errors.credentialsInvalid",
  LINE_CONNECTION_REQUIRED: "lineConfiguration.errors.connectionRequired",
  LINE_TEST_RECIPIENT_REQUIRED: "lineConfiguration.errors.testRecipientRequired",
  LINE_TEST_ACCOUNT_NOT_FRIEND: "lineConfiguration.errors.testAccountNotFriend",
} as const;

function isLineSettingsErrorCode(
  errorCode: string,
): errorCode is keyof typeof lineErrorTranslationKeys {
  return Object.prototype.hasOwnProperty.call(lineErrorTranslationKeys, errorCode);
}

function connectionError(error: unknown, t: TFunction, fallback: string) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return fallback;
  }

  const response = error.response;
  if (typeof response !== "object" || response === null || !("data" in response)) {
    return fallback;
  }

  const data = response.data;
  if (typeof data !== "object" || data === null || !("errorCode" in data)) {
    return fallback;
  }

  const errorCode = data.errorCode;
  return typeof errorCode === "string" && isLineSettingsErrorCode(errorCode)
    ? t(lineErrorTranslationKeys[errorCode])
    : fallback;
}

export function LineSettingsScreen({
  testRecipient,
}: {
  testRecipient?: "connected" | "error";
}) {
  const { t } = useTranslation("integrations");
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isReconcilingTestRecipient, setIsReconcilingTestRecipient] = useState(
    testRecipient === "connected",
  );
  const accessTokenRef = useRef<HTMLInputElement>(null);
  const editCredentialsRef = useRef<HTMLButtonElement>(null);
  const contentHeadingRef = useRef<HTMLHeadingElement>(null);
  const handledTestRecipientRef = useRef<string | null>(null);
  const connection = useLineConnection();

  function announceSuccess(message: string) {
    setActionError(null);
    toast.success(message);
  }

  function showFailure(message: string) {
    setActionError(message);
  }

  const save = useMutation({
    mutationFn: saveLineConnection,
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(lineQueryKeys.connection(), data);
      setCredentials(emptyCredentials);
      setEditing(false);
      announceSuccess(t("lineConfiguration.messages.saved"));
      window.requestAnimationFrame(() => contentHeadingRef.current?.focus());
    },
    onError: (error) => {
      showFailure(connectionError(error, t, t("lineConfiguration.messages.saveFailed")));
    },
  });

  const connectTestAccount = useMutation({
    mutationFn: startLineTestRecipientAuthorization,
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: (authUrl) => window.location.assign(authUrl),
    onError: (error) => {
      showFailure(
        connectionError(error, t, t("lineConfiguration.messages.connectTestFailed")),
      );
    },
  });

  const sendTest = useMutation({
    mutationFn: sendLineConnectionTestMessage,
    onMutate: () => {
      setActionError(null);
    },
    onSuccess: () => announceSuccess(t("lineConfiguration.messages.testSent")),
    onError: (error) => {
      showFailure(connectionError(error, t, t("lineConfiguration.messages.testFailed")));
    },
  });

  useEffect(() => {
    if (!testRecipient || handledTestRecipientRef.current === testRecipient) return;

    handledTestRecipientRef.current = testRecipient;
    void navigate({ to: APP_ROUTES.LINE_INTEGRATION, search: {}, replace: true });

    if (testRecipient === "error") {
      setIsReconcilingTestRecipient(false);
      showFailure(t("lineConfiguration.messages.testAccountFailed"));
      return;
    }

    setIsReconcilingTestRecipient(true);
    void connection.refetch()
      .then((result) => {
        if (!result.isError && result.data?.testRecipientConnected) {
          announceSuccess(t("lineConfiguration.messages.testAccountConnected"));
        } else {
          showFailure(t("lineConfiguration.messages.testAccountFailed"));
        }
      })
      .catch(() => showFailure(t("lineConfiguration.messages.testAccountFailed")))
      .finally(() => setIsReconcilingTestRecipient(false));
  }, [connection.refetch, navigate, t, testRecipient]);

  useEffect(() => {
    if (!editing) return;

    const frame = window.requestAnimationFrame(() => {
      accessTokenRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editing]);

  const visibleConnection =
    !connection.isLoading && !connection.isError ? connection.data : undefined;
  const configuredConnection = visibleConnection?.configured ? visibleConnection : undefined;
  const testRecipientConnected =
    Boolean(visibleConnection?.testRecipientConnected) && !isReconcilingTestRecipient;
  const isBusy = save.isPending || connectTestAccount.isPending || sendTest.isPending;

  function updateCredential(field: keyof LineConnectionCredentials, value: string) {
    setCredentials((current: LineConnectionCredentials) => ({
      ...current,
      [field]: value,
    }));
  }

  function openCredentialEditor() {
    setCredentials(emptyCredentials);
    setActionError(null);
    setEditing(true);
  }

  function cancelCredentialEditor() {
    setCredentials(emptyCredentials);
    setActionError(null);
    setEditing(false);
    window.requestAnimationFrame(() => editCredentialsRef.current?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(credentials);
  }

  function retryConnection() {
    setActionError(null);
    void connection.refetch().then((result) => {
      if (!result.isError) {
        window.requestAnimationFrame(() => contentHeadingRef.current?.focus());
      }
    });
  }

  const mainContent = connection.isLoading ? (
    <LineSettingsSkeleton />
  ) : connection.isError ? (
    <ConnectionErrorState isRetrying={connection.isFetching} onRetry={retryConnection} />
  ) : configuredConnection && !editing ? (
    <ConfiguredConnectionPanel
      connection={configuredConnection}
      actionError={actionError}
      contentHeadingRef={contentHeadingRef}
      editCredentialsRef={editCredentialsRef}
      isBusy={isBusy}
      isConnectingTestAccount={connectTestAccount.isPending}
      isSendingTest={sendTest.isPending}
      testRecipientConnected={testRecipientConnected}
      onConnectTestAccount={() => connectTestAccount.mutate()}
      onEditCredentials={openCredentialEditor}
      onSendTest={() => sendTest.mutate()}
    />
  ) : (
    <CredentialsForm
      actionError={actionError}
      accessTokenRef={accessTokenRef}
      contentHeadingRef={contentHeadingRef}
      credentials={credentials}
      editing={editing}
      isSaving={save.isPending}
      onCancel={cancelCredentialEditor}
      onSubmit={submit}
      updateCredential={updateCredential}
    />
  );

  return (
    <IntegrationConfigLayout
      parentLabel={t("title")}
      mobileParentLabel={t("lineConfiguration.allIntegrations")}
      parentTo={APP_ROUTES.INTEGRATIONS}
      title={t("line.name")}
      badgeLabel={t("lineConfiguration.supported")}
      description={t("lineConfiguration.description")}
      providerMark={<img alt="" className="size-8" src="/icons/line/default.svg" />}
      aside={<LineAboutPanel connection={visibleConnection} testRecipientConnected={testRecipientConnected} />}
      footer={
        <p className="mt-6 max-w-[32.5rem] text-xs leading-5 text-muted-foreground">
          {t("privacyNote")}
        </p>
      }
    >
      {mainContent}
    </IntegrationConfigLayout>
  );
}

type ConfiguredConnectionPanelProps = {
  connection: LineConnection;
  actionError: string | null;
  contentHeadingRef: RefObject<HTMLHeadingElement | null>;
  editCredentialsRef: RefObject<HTMLButtonElement | null>;
  isBusy: boolean;
  isConnectingTestAccount: boolean;
  isSendingTest: boolean;
  testRecipientConnected: boolean;
  onConnectTestAccount: () => void;
  onEditCredentials: () => void;
  onSendTest: () => void;
};

function ConfiguredConnectionPanel({
  connection,
  actionError,
  contentHeadingRef,
  editCredentialsRef,
  isBusy,
  isConnectingTestAccount,
  isSendingTest,
  testRecipientConnected,
  onConnectTestAccount,
  onEditCredentials,
  onSendTest,
}: ConfiguredConnectionPanelProps) {
  const { t } = useTranslation("integrations");

  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="line-connection-heading">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Badge className="gap-1.5" variant={testRecipientConnected ? "success" : "neutral"}>
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={testRecipientConnected ? CheckCircle2HugeIcon : CircleHugeIcon}
              strokeWidth={2}
            />
            {testRecipientConnected
              ? t("lineConfiguration.connectionStatus.testRecipientConnected")
              : t("lineConfiguration.connectionStatus.credentialsConfigured")}
          </Badge>
          <h2
            ref={contentHeadingRef}
            id="line-connection-heading"
            tabIndex={-1}
            className="mt-3 rounded-sm break-words text-xl font-medium tracking-[-0.01em] text-foreground focus:outline-none focus:ring-[3px] focus:ring-primary/35 focus:ring-offset-2"
          >
            {connection.accountName ?? t("line.name")}
          </h2>
          {connection.accountBasicId || connection.lastVerifiedAt ? (
            <dl className="mt-5 divide-y divide-border border-t border-border text-sm leading-6">
              {connection.accountBasicId ? (
                <div className="grid grid-cols-2 gap-3 py-3">
                  <dt className="text-muted-foreground">
                    {t("lineConfiguration.account.basicId")}
                  </dt>
                  <dd className="min-w-0 break-all text-right text-foreground">
                    {connection.accountBasicId}
                  </dd>
                </div>
              ) : null}
              {connection.lastVerifiedAt ? (
                <div className="grid grid-cols-2 gap-3 py-3">
                  <dt className="text-muted-foreground">
                    {t("lineConfiguration.account.lastVerified")}
                  </dt>
                  <dd className="min-w-0 break-words text-right text-foreground">
                    {DateTime.formatDateTime(connection.lastVerifiedAt)}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </div>
        <HugeiconsIcon
          aria-hidden="true"
          className="size-6 shrink-0 text-muted-foreground"
          icon={ShieldCheckHugeIcon}
          strokeWidth={2}
        />
      </div>

      <ActionFeedback message={actionError} />

      <LineSetupProgress
        configured
        testRecipientConnected={testRecipientConnected}
        testRecipientAction={
          !testRecipientConnected ? (
            <Button
              className="w-full sm:w-auto"
              disabled={isBusy}
              leftIcon={CheckCircle2HugeIcon}
              loading={isConnectingTestAccount}
              onClick={onConnectTestAccount}
            >
              {t("lineConfiguration.testRecipient.action")}
            </Button>
          ) : undefined
        }
        testMessageAction={
          testRecipientConnected ? (
            <Button
              className="w-full sm:w-auto"
              disabled={isBusy}
              leftIcon={MessageCircleHugeIcon}
              loading={isSendingTest}
              onClick={onSendTest}
            >
              {t("lineConfiguration.testMessage.action")}
            </Button>
          ) : undefined
        }
      />

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
              <HugeiconsIcon
                aria-hidden="true"
                className="size-5"
                icon={KeyRoundHugeIcon}
                strokeWidth={2}
              />
            </span>
            <div className="min-w-0">
              <h3 className="font-medium text-foreground">{t("lineConfiguration.credentials.title")}</h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("lineConfiguration.credentials.summaryDescription")}
              </p>
            </div>
          </div>
          <Button
            ref={editCredentialsRef}
            className="w-full sm:w-auto"
            disabled={isBusy}
            leftIcon={PencilHugeIcon}
            onClick={onEditCredentials}
            variant="outline"
          >
            {t("lineConfiguration.credentials.edit")}
          </Button>
        </div>
      </div>
    </section>
  );
}

type CredentialsFormProps = {
  actionError: string | null;
  accessTokenRef: RefObject<HTMLInputElement | null>;
  contentHeadingRef: RefObject<HTMLHeadingElement | null>;
  credentials: LineConnectionCredentials;
  editing: boolean;
  isSaving: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  updateCredential: (field: keyof LineConnectionCredentials, value: string) => void;
};

function CredentialsForm({
  actionError,
  accessTokenRef,
  contentHeadingRef,
  credentials,
  editing,
  isSaving,
  onCancel,
  onSubmit,
  updateCredential,
}: CredentialsFormProps) {
  const { t } = useTranslation("integrations");
  const [showAccessToken, setShowAccessToken] = useState(false);
  const accessTokenToggleLabel = t(
    showAccessToken
      ? "lineConfiguration.credentials.hideToken"
      : "lineConfiguration.credentials.showToken",
  );
  const AccessTokenToggleIcon = showAccessToken ? EyeOffHugeIcon : EyeHugeIcon;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <ol aria-label={t("lineConfiguration.setupProgress.title")}>
        <li className="min-w-0">
          <form aria-busy={isSaving || undefined} onSubmit={onSubmit}>
            <div className="flex min-w-0 gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                <HugeiconsIcon
                  aria-hidden="true"
                  className="size-5"
                  icon={KeyRoundHugeIcon}
                  strokeWidth={2}
                />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary">
                  {t("lineConfiguration.setupProgress.step", { number: 1 })}
                </p>
                <h2
                  ref={contentHeadingRef}
                  tabIndex={-1}
                  className="mt-1 rounded-sm font-medium text-foreground focus:outline-none focus:ring-[3px] focus:ring-primary/35 focus:ring-offset-2"
                >
                  {editing
                    ? t("lineConfiguration.credentials.editTitle")
                    : t("lineConfiguration.credentials.connectTitle")}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("lineConfiguration.credentials.description")}
                </p>
              </div>
            </div>

            <ActionFeedback message={actionError} />

            <div className="mt-6 space-y-5">
              <div className="space-y-2">
                <CredentialFieldLabel
                  htmlFor="line-access-token"
                  label={t("lineConfiguration.credentials.accessToken")}
                />
                <Input
                  ref={accessTokenRef}
                  id="line-access-token"
                  type={showAccessToken ? "text" : "password"}
                  autoComplete="off"
                  aria-describedby="line-access-token-help"
                  disabled={isSaving}
                  required
                  value={credentials.messagingAccessToken}
                  onChange={(event) => updateCredential("messagingAccessToken", event.target.value)}
                  rightAdornment={
                    <button
                      aria-label={accessTokenToggleLabel}
                      aria-pressed={showAccessToken}
                      className="inline-flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50"
                      disabled={isSaving}
                      onClick={() => setShowAccessToken((visible) => !visible)}
                      title={accessTokenToggleLabel}
                      type="button"
                    >
                      <HugeiconsIcon
                        aria-hidden="true"
                        className="size-4"
                        icon={AccessTokenToggleIcon}
                        strokeWidth={2}
                      />
                    </button>
                  }
                />
                <p id="line-access-token-help" className="text-sm leading-6 text-muted-foreground">
                  {t("lineConfiguration.credentials.accessTokenHelp")}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <CredentialFieldLabel
                    htmlFor="line-login-channel-id"
                    label={t("lineConfiguration.credentials.loginChannelId")}
                  />
                  <Input
                    id="line-login-channel-id"
                    autoComplete="off"
                    aria-describedby="line-login-channel-id-help"
                    disabled={isSaving}
                    required
                    value={credentials.loginChannelId}
                    onChange={(event) => updateCredential("loginChannelId", event.target.value)}
                  />
                  <p id="line-login-channel-id-help" className="text-sm leading-6 text-muted-foreground">
                    {t("lineConfiguration.credentials.loginChannelIdHelp")}
                  </p>
                </div>

                <div className="space-y-2">
                  <CredentialFieldLabel
                    htmlFor="line-login-channel-secret"
                    label={t("lineConfiguration.credentials.loginChannelSecret")}
                  />
                  <Input
                    id="line-login-channel-secret"
                    type="password"
                    autoComplete="off"
                    aria-describedby="line-login-channel-secret-help"
                    disabled={isSaving}
                    required
                    value={credentials.loginChannelSecret}
                    onChange={(event) => updateCredential("loginChannelSecret", event.target.value)}
                  />
                  <p id="line-login-channel-secret-help" className="text-sm leading-6 text-muted-foreground">
                    {t("lineConfiguration.credentials.loginChannelSecretHelp")}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-start">
              <Button className="w-full sm:w-auto" loading={isSaving} type="submit">
                {t("lineConfiguration.credentials.save")}
              </Button>
              {editing ? (
                <Button
                  className="w-full sm:w-auto"
                  disabled={isSaving}
                  onClick={onCancel}
                  type="button"
                  variant="ghost"
                >
                  {t("lineConfiguration.actions.cancel")}
                </Button>
              ) : null}
            </div>

          </form>
        </li>
        <SetupProgressStep
          label={t("lineConfiguration.setupProgress.steps.testRecipient")}
          number={2}
          status="upcoming"
        />
        <SetupProgressStep
          label={t("lineConfiguration.setupProgress.steps.testMessage")}
          number={3}
          status="upcoming"
        />
      </ol>
    </div>
  );
}

function CredentialFieldLabel({ htmlFor, label }: { htmlFor: string; label: string }) {
  const { t } = useTranslation("integrations");

  return (
    <Label htmlFor={htmlFor}>
      {label}
      <span aria-hidden="true" className="ml-1 text-destructive">
        *
      </span>
      <span className="sr-only"> {t("lineConfiguration.credentials.required")}</span>
    </Label>
  );
}

function ActionFeedback({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <p
      className="mt-5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive"
      role="alert"
    >
      {message}
    </p>
  );
}

type SetupStepStatus = "complete" | "next" | "available" | "upcoming";

function LineSetupProgress({
  configured,
  testRecipientConnected,
  testRecipientAction,
  testMessageAction,
}: {
  configured: boolean;
  testRecipientConnected: boolean;
  testRecipientAction?: ReactNode;
  testMessageAction?: ReactNode;
}) {
  const { t } = useTranslation("integrations");
  const steps: Array<{
    action?: ReactNode;
    label: string;
    number: number;
    status: SetupStepStatus;
  }> = [
    {
      label: t("lineConfiguration.setupProgress.steps.credentials"),
      number: 1,
      status: configured ? "complete" : "next",
    },
  ];

  steps.push(
    {
      action: testRecipientAction,
      label: t("lineConfiguration.setupProgress.steps.testRecipient"),
      number: 2,
      status: testRecipientConnected ? "complete" : configured ? "next" : "upcoming",
    },
    {
      action: testMessageAction,
      label: t("lineConfiguration.setupProgress.steps.testMessage"),
      number: 3,
      status: testRecipientConnected ? "available" : "upcoming",
    },
  );

  const stepList = (
    <ol className="mt-3 space-y-3" aria-label={t("lineConfiguration.setupProgress.title")}>
      {steps.map((step) => (
        <SetupProgressStep
          action={step.action}
          key={step.label}
          label={step.label}
          number={step.number}
          status={step.status}
        />
      ))}
    </ol>
  );

  return (
    <section
      aria-labelledby="line-setup-progress-heading"
      className="mt-6 border-t border-border pt-5"
    >
      <h2 id="line-setup-progress-heading" className="font-medium text-foreground">
        {t("lineConfiguration.setupProgress.title")}
      </h2>
      {stepList}
    </section>
  );
}

function SetupProgressStep({
  action,
  label,
  number,
  status,
}: {
  action?: ReactNode;
  label: string;
  number: number;
  status: SetupStepStatus;
}) {
  const { t } = useTranslation("integrations");
  const statusLabel =
    status === "complete"
      ? t("lineConfiguration.setupProgress.status.complete")
      : status === "next"
        ? t("lineConfiguration.setupProgress.status.next")
        : status === "available"
          ? t("lineConfiguration.setupProgress.status.available")
          : t("lineConfiguration.setupProgress.status.upcoming");

  return (
    <li className="flex min-w-0 gap-2 border-t border-border pt-3 first:border-t-0 first:pt-0">
      {status === "complete" ? (
        <HugeiconsIcon
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-muted-foreground"
          icon={CheckCircle2HugeIcon}
          strokeWidth={2}
        />
      ) : (
        <span
          aria-hidden="true"
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[0.625rem] font-medium text-muted-foreground"
        >
          {number}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          <span className="sr-only">{t("lineConfiguration.setupProgress.step", { number })}:</span>{" "}
          {label}
        </p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{statusLabel}</p>
        {action ? <div className="mt-3">{action}</div> : null}
      </div>
    </li>
  );
}

function ConnectionErrorState({
  isRetrying,
  onRetry,
}: {
  isRetrying: boolean;
  onRetry: () => void;
}) {
  const { t } = useTranslation("integrations");

  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="line-connection-error-heading">
      <h2 id="line-connection-error-heading" className="font-medium text-foreground">
        {t("lineConfiguration.connectionError.title")}
      </h2>
      <p className="mt-1 text-sm leading-6 text-muted-foreground" role="alert">
        {t("line.connectionError")}
      </p>
      <Button
        className="mt-5 w-full sm:w-auto"
        loading={isRetrying}
        onClick={onRetry}
        variant="outline"
      >
        {t("retry")}
      </Button>
    </section>
  );
}

function LineSettingsSkeleton() {
  const { t } = useTranslation("integrations");

  return (
    <div className="space-y-5" role="status" aria-label={t("lineConfiguration.loading")}>
      <div className="rounded-lg border border-border bg-card p-5">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-4 h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-36" />
        <Skeleton className="mt-5 h-px w-full" />
        <Skeleton className="mt-5 h-20 w-full" />
      </div>
      <div className="rounded-lg border border-border bg-card p-5">
        <div className="flex min-w-0 gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        </div>
        <Skeleton className="mt-5 h-11 w-full sm:w-40" />
      </div>
    </div>
  );
}

function LineAboutPanel({
  connection,
  testRecipientConnected,
}: {
  connection: LineConnection | undefined;
  testRecipientConnected: boolean;
}) {
  const { t } = useTranslation("integrations");
  return (
    <section className="rounded-lg border border-border bg-card p-5" aria-labelledby="line-about-heading">
      <h2 id="line-about-heading" className="font-medium text-foreground">
        {t("lineConfiguration.about.title")}
      </h2>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-foreground">
          {t("lineConfiguration.about.capabilitiesTitle")}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {t("lineConfiguration.about.capabilitiesDescription")}
        </p>
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <h3 className="text-sm font-medium text-foreground">
          {t("lineConfiguration.about.requirementsTitle")}
        </h3>
        <ul className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
          <AboutRequirement complete={Boolean(connection?.configured)}>
            {t("lineConfiguration.about.requirements.officialAccount")}
          </AboutRequirement>
          <AboutRequirement complete={Boolean(connection?.configured)}>
            {t("lineConfiguration.about.requirements.channels")}
          </AboutRequirement>
          <AboutRequirement complete={testRecipientConnected}>
            {t("lineConfiguration.about.requirements.testRecipient")}
          </AboutRequirement>
        </ul>
      </div>

      <a
        className="mt-5 flex min-h-11 w-full items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        href="https://developers.line.biz/console/"
        rel="noreferrer"
        target="_blank"
      >
        {t("lineConfiguration.about.developersConsole")}
      </a>
    </section>
  );
}

function AboutRequirement({ complete, children }: { complete: boolean; children: string }) {
  return (
    <li className="flex min-w-0 gap-2">
      <HugeiconsIcon
        aria-hidden="true"
        className="mt-1 size-4 shrink-0 text-muted-foreground"
        icon={complete ? CheckCircle2HugeIcon : CircleHugeIcon}
        strokeWidth={2}
      />
      <span className="min-w-0">{children}</span>
    </li>
  );
}
