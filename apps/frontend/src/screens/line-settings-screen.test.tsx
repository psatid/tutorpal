import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

type ConnectionData = {
  accountBasicId?: string | null;
  accountName?: string;
  configured: boolean;
  lastVerifiedAt?: string;
  testRecipientConnected: boolean;
};

const navigate = vi.hoisted(() => vi.fn());
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
const lineSettingsApi = vi.hoisted(() => ({
  saveLineConnection: vi.fn(),
  sendLineConnectionTestMessage: vi.fn(),
  startLineTestRecipientAuthorization: vi.fn(),
}));
const connectionState = vi.hoisted(() => ({
  data: undefined as ConnectionData | undefined,
  isError: false,
  isFetching: false,
  isLoading: false,
  refetch: vi.fn(),
}));

let animationFrameId = 0;
let animationFrameCallbacks = new Map<number, FrameRequestCallback>();

function flushAnimationFrames() {
  const callbacks = [...animationFrameCallbacks.values()];
  animationFrameCallbacks.clear();
  callbacks.forEach((callback) => callback(0));
}

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} href={to}>
      {children}
    </a>
  ),
  useNavigate: () => navigate,
}));

vi.mock("@/hooks/queries/use-line-connection", () => ({
  useLineConnection: () => connectionState,
}));

vi.mock("@/lib/line-settings-api", () => lineSettingsApi);
vi.mock("sonner", () => ({ toast }));

import { LineSettingsScreen } from "@/screens/line-settings-screen";

function makeConnection(overrides: Partial<ConnectionData> = {}): ConnectionData {
  return {
    accountBasicId: "@tutorpal",
    accountName: "TutorPal Academy",
    configured: true,
    lastVerifiedAt: "2026-10-18T03:04:00.000Z",
    testRecipientConnected: false,
    ...overrides,
  };
}

function renderLineSettings(testRecipient?: "connected" | "error") {
  const queryClient = new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LineSettingsScreen testRecipient={testRecipient} />
    </QueryClientProvider>,
  );
}

function getCredentialInputs() {
  return {
    accessToken: screen.getByLabelText(/Messaging API channel access token/i),
    loginChannelId: screen.getByLabelText(/LINE Login channel ID/i),
    loginChannelSecret: screen.getByLabelText(/LINE Login channel secret/i),
  };
}

function expectSetupProgress(
  expectedSteps: Array<{ label: string; number: number; status: string }>,
) {
  const progress = screen.getByRole("list", { name: "LINE setup" });
  const steps = within(progress).getAllByRole("listitem");

  expect(steps).toHaveLength(expectedSteps.length);
  expectedSteps.forEach((expectedStep, index) => {
    const step = steps[index];
    if (!step) {
      throw new Error(`Expected setup step ${index + 1}`);
    }

    expect(step).toHaveTextContent(`Step ${expectedStep.number}:`);
    expect(step).toHaveTextContent(expectedStep.label);
    expect(step).toHaveTextContent(expectedStep.status);

    const ordinal = step.querySelector('span[aria-hidden="true"]');
    if (expectedStep.status === "Complete") {
      expect(ordinal).toBeNull();
    } else {
      expect(ordinal).toHaveTextContent(String(expectedStep.number));
      expect(ordinal).toHaveClass("size-5", "rounded-full");
    }
  });

  return progress;
}

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  values = {
    accessToken: "line-access-token",
    loginChannelId: "line-login-id",
    loginChannelSecret: "line-login-secret",
  },
) {
  const inputs = getCredentialInputs();

  await user.type(inputs.accessToken, values.accessToken);
  await user.type(inputs.loginChannelId, values.loginChannelId);
  await user.type(inputs.loginChannelSecret, values.loginChannelSecret);

  return { inputs, values };
}

describe("LineSettingsScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");

    animationFrameId = 0;
    animationFrameCallbacks = new Map();
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      animationFrameId += 1;
      animationFrameCallbacks.set(animationFrameId, callback);
      return animationFrameId;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      animationFrameCallbacks.delete(id);
    });

    connectionState.data = undefined;
    connectionState.isError = false;
    connectionState.isFetching = false;
    connectionState.isLoading = false;
    connectionState.refetch.mockReset();
    connectionState.refetch.mockResolvedValue({ isError: false });

    navigate.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
    lineSettingsApi.saveLineConnection.mockReset();
    lineSettingsApi.sendLineConnectionTestMessage.mockReset();
    lineSettingsApi.startLineTestRecipientAuthorization.mockReset();
    lineSettingsApi.saveLineConnection.mockResolvedValue(makeConnection());
    lineSettingsApi.sendLineConnectionTestMessage.mockResolvedValue(undefined);
    lineSettingsApi.startLineTestRecipientAuthorization.mockResolvedValue(
      "https://access.line.me/oauth2/v2.1/authorize",
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps the responsive integration shell and accessible loading state visible", () => {
    connectionState.isLoading = true;

    renderLineSettings();

    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeVisible();
    expect(screen.getByRole("link", { name: "All integrations" })).toHaveAttribute(
      "href",
      "/integrations",
    );
    expect(screen.getByRole("heading", { name: "LINE", level: 1 })).toBeVisible();
    expect(screen.getByText("Supported")).toBeVisible();
    expect(screen.getByRole("status", { name: "Checking LINE connection" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "About LINE" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Open LINE Developers Console" })).toHaveAttribute(
      "target",
      "_blank",
    );
    const providerMark = document.querySelector<HTMLImageElement>('img[src="/icons/line/default.svg"]');
    if (!providerMark) {
      throw new Error("Expected the bundled LINE provider mark.");
    }
    expect(providerMark).toHaveAttribute("alt", "");
    expect(providerMark.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(screen.queryByRole("img", { name: "LINE" })).not.toBeInTheDocument();
    expect(screen.getByRole("complementary").parentElement).toHaveClass(
      "@[824px]:grid-cols-[minmax(0,1fr)_17.5rem]",
    );
    expect(within(screen.getByRole("complementary")).getByText(
      "Your connection details are encrypted and used only for your teaching workspace.",
    )).toBeVisible();
  });

  it("retries a LINE-specific connection error from the keyboard", async () => {
    const user = userEvent.setup();
    connectionState.isError = true;

    renderLineSettings();

    expect(screen.getByRole("heading", { name: "Couldn't check LINE" })).toBeVisible();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't check your LINE connection. Try again.",
    );

    const retry = screen.getByRole("button", { name: "Retry" });
    retry.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => expect(connectionState.refetch).toHaveBeenCalledTimes(1));
  });

  it("shows a compact labelled setup form and preserves input after a mapped save error", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ configured: false });
    lineSettingsApi.saveLineConnection.mockRejectedValue({
      response: { data: { errorCode: "LINE_CREDENTIALS_INVALID" } },
    });

    renderLineSettings();

    const setupHeading = screen.getByRole("heading", {
      name: /Step 1:\s*Connect your official account/,
    });
    expect(setupHeading).toBeVisible();
    const credentialsStep = setupHeading.closest("li");
    const form = credentialsStep?.querySelector("form");
    const setupRow = form?.firstElementChild;
    const numberRail = setupRow?.firstElementChild;
    const formContent = numberRail?.nextElementSibling;

    expect(numberRail).toHaveAttribute("aria-hidden", "true");
    expect(numberRail).toHaveClass("size-6", "rounded-full");
    expect(formContent).toHaveClass("min-w-0", "flex-1");
    const saveCredentials = screen.getByRole("button", { name: "Save and verify" });
    expect(saveCredentials).toHaveClass("w-full", "sm:w-auto");
    const { inputs, values } = await fillCredentials(user);
    expect(inputs.accessToken).toHaveAttribute("required");
    expect(inputs.accessToken).toHaveAttribute("aria-describedby", "line-access-token-help");
    expect(inputs.loginChannelId).not.toHaveAttribute("aria-describedby");
    expect(inputs.loginChannelSecret).not.toHaveAttribute("aria-describedby");
    expect(inputs.accessToken).toHaveAttribute("placeholder", "Paste the long-lived token");
    expect(inputs.loginChannelId).toHaveAttribute("placeholder", "10-digit ID");
    expect(credentialsStep?.querySelectorAll(".text-destructive")).toHaveLength(0);

    await user.click(saveCredentials);

    await waitFor(() =>
      expect(lineSettingsApi.saveLineConnection).toHaveBeenCalledWith(
        {
          messagingAccessToken: values.accessToken,
          loginChannelId: values.loginChannelId,
          loginChannelSecret: values.loginChannelSecret,
        },
        expect.anything(),
      ),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Your LINE credentials are invalid. Check them and try again.",
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(inputs.accessToken).toHaveValue(values.accessToken);
    expect(inputs.loginChannelId).toHaveValue(values.loginChannelId);
    expect(inputs.loginChannelSecret).toHaveValue(values.loginChannelSecret);
  });

  it("localizes the concise credential placeholders", async () => {
    await i18n.changeLanguage("th");
    connectionState.data = makeConnection({ configured: false });

    renderLineSettings();

    expect(screen.getByPlaceholderText("วางโทเค็นแบบ long-lived")).toBeVisible();
    expect(screen.getByPlaceholderText("ID 10 หลัก")).toBeVisible();
  });

  it("lets keyboard users reveal and hide the access token", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ configured: false });

    renderLineSettings();

    const { accessToken } = getCredentialInputs();
    expect(accessToken).toHaveAttribute("type", "password");

    const showToken = screen.getByRole("button", { name: "Show access token" });
    expect(showToken).toHaveAttribute("aria-pressed", "false");
    showToken.focus();
    await user.keyboard("{Enter}");

    expect(accessToken).toHaveAttribute("type", "text");
    const hideToken = screen.getByRole("button", { name: "Hide access token" });
    expect(hideToken).toHaveAttribute("aria-pressed", "true");
    expect(hideToken).toHaveFocus();
    await user.keyboard(" ");

    expect(accessToken).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Show access token" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("moves successful first-time setup to the configured-without-recipient state", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ configured: false });
    lineSettingsApi.saveLineConnection.mockImplementation(async () => {
      const connection = makeConnection({ testRecipientConnected: false });
      connectionState.data = connection;
      return connection;
    });

    renderLineSettings();

    const setupLists = screen.getAllByRole("list", { name: "LINE setup" });
    expect(setupLists).toHaveLength(1);

    const initialProgress = setupLists[0];
    if (!initialProgress) {
      throw new Error("Expected the unconfigured LINE setup list.");
    }

    const [credentialsStep, testRecipientStep, testMessageStep] = within(
      initialProgress,
    ).getAllByRole("listitem");

    expect(credentialsStep).toHaveTextContent("Step 1");
    const credentialsHeading = within(credentialsStep!).getByRole("heading", {
      name: /Step 1:\s*Connect your official account/,
    });
    expect(credentialsHeading).toBeVisible();
    expect(
      within(credentialsStep!).getByRole("button", { name: "Save and verify" }),
    ).toBeVisible();

    expect(testRecipientStep).toHaveTextContent("Step 2: Connect test recipient");
    const testRecipientStatus = within(testRecipientStep!).getByText(
      "Complete earlier steps first",
    );
    expect(testRecipientStatus).toHaveClass("sr-only");
    expect(testRecipientStep).toHaveClass("mt-5");
    expect(testMessageStep).toHaveTextContent("Step 3: Send a test message");
    const testMessageStatus = within(testMessageStep!).getByText(
      "Complete earlier steps first",
    );
    expect(testMessageStatus).toHaveClass("sr-only");
    expect(testMessageStep).toHaveClass("mt-3");
    expect(within(initialProgress).queryAllByRole("button")).toHaveLength(2);

    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Save and verify" }));

    expect(await screen.findByText("Credentials configured")).toBeVisible();
    expect(screen.getByRole("button", { name: "Connect test recipient" })).toBeVisible();
    const connectionHeading = screen.getByRole("heading", { name: "TutorPal Academy" });
    expect(connectionHeading).toHaveAttribute("tabindex", "-1");
    expect(connectionHeading).toHaveClass(
      "focus:ring-[3px]",
      "focus:ring-primary/35",
      "focus:ring-offset-2",
    );
    flushAnimationFrames();
    expect(connectionHeading).toHaveFocus();
    const configuredProgress = expectSetupProgress([
      { label: "Save credentials", number: 1, status: "Complete" },
      { label: "Connect test recipient", number: 2, status: "Next" },
      { label: "Send a test message", number: 3, status: "Complete earlier steps first" },
    ]);
    expect(within(configuredProgress).getByRole("button", { name: "Connect test recipient" })).toBeVisible();
    expect(toast.success).toHaveBeenCalledWith("LINE credentials saved.");
    expect(screen.queryByLabelText(/Messaging API channel access token/i)).not.toBeInTheDocument();
  });

  it("renders configured account identity and maps a test-recipient authorization error", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ testRecipientConnected: false });
    lineSettingsApi.startLineTestRecipientAuthorization.mockRejectedValue({
      response: { data: { errorCode: "LINE_TEST_ACCOUNT_NOT_FRIEND" } },
    });

    renderLineSettings();

    expect(screen.getByText("Credentials configured")).toBeVisible();
    expect(screen.getByRole("heading", { name: "TutorPal Academy" })).toBeVisible();
    const basicIdLabel = screen.getByText("Basic ID");
    const accountDetails = basicIdLabel.closest("dl");
    if (!accountDetails) throw new Error("Expected account details to use a definition list");
    const basicIdValue = within(accountDetails).getByText("@tutorpal");
    const lastVerifiedLabel = within(accountDetails).getByText("Last verified");
    const lastVerifiedValue = lastVerifiedLabel.parentElement?.querySelector("dd");

    expect(basicIdLabel.tagName).toBe("DT");
    expect(basicIdValue.tagName).toBe("DD");
    expect(basicIdValue).toHaveClass("min-w-0", "break-all", "text-right");
    expect(lastVerifiedLabel.tagName).toBe("DT");
    expect(lastVerifiedValue).not.toBeNull();
    expect(lastVerifiedValue).toHaveClass("min-w-0", "break-words", "text-right");
    expect(screen.getByRole("button", { name: "Connect test recipient" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Send test message" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Connect test recipient" }));

    await waitFor(() =>
      expect(lineSettingsApi.startLineTestRecipientAuthorization).toHaveBeenCalledTimes(1),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The test account must add your LINE Official Account first.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("shows only supported connected-account fields and sends a test message", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ testRecipientConnected: true });

    renderLineSettings();

    expect(screen.getByText("Test recipient connected")).toBeVisible();
    expect(screen.getByRole("heading", { name: "TutorPal Academy" })).toBeVisible();
    expectSetupProgress([
      { label: "Save credentials", number: 1, status: "Complete" },
      { label: "Connect test recipient", number: 2, status: "Complete" },
      { label: "Send a test message", number: 3, status: "Available" },
    ]);
    expect(screen.getByText("Basic ID")).toBeVisible();
    expect(screen.getByText("@tutorpal")).toBeVisible();
    expect(screen.getByText("Last verified")).toBeVisible();
    expect(screen.getByRole("button", { name: "Send test message" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit credentials" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Connect test recipient" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/LINE Login channel ID/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Send test message" }));

    await waitFor(() =>
      expect(lineSettingsApi.sendLineConnectionTestMessage).toHaveBeenCalledTimes(1),
    );
    expect(toast.success).toHaveBeenCalledWith("Test message sent.");
  });

  it("opens blank credentials, then cancels and restores focus to Edit credentials", async () => {
    const user = userEvent.setup();
    connectionState.data = makeConnection({ testRecipientConnected: true });

    renderLineSettings();

    const editCredentials = screen.getByRole("button", { name: "Edit credentials" });
    await user.click(editCredentials);

    const editHeading = screen.getByRole("heading", {
      name: /Step 1:\s*Update LINE credentials/,
    });
    expect(editHeading).toBeVisible();
    expect(editHeading).toHaveAttribute("tabindex", "-1");
    expect(editHeading).toHaveClass(
      "focus:ring-[3px]",
      "focus:ring-primary/35",
      "focus:ring-offset-2",
    );
    const inputs = getCredentialInputs();
    flushAnimationFrames();
    expect(inputs.accessToken).toHaveValue("");
    expect(inputs.loginChannelId).toHaveValue("");
    expect(inputs.loginChannelSecret).toHaveValue("");
    expect(inputs.accessToken).toHaveFocus();

    await user.type(inputs.accessToken, "new-access-token");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    const restoredEditCredentials = screen.getByRole("button", { name: "Edit credentials" });
    flushAnimationFrames();
    await waitFor(() => expect(restoredEditCredentials).toHaveFocus());
    expect(screen.queryByDisplayValue("new-access-token")).not.toBeInTheDocument();
  });

  it("only confirms a callback when the refetched connection includes a test recipient", async () => {
    connectionState.data = makeConnection({ testRecipientConnected: false });
    connectionState.refetch.mockResolvedValue({
      data: makeConnection({ testRecipientConnected: false }),
      isError: false,
    });

    renderLineSettings("connected");

    await waitFor(() => expect(connectionState.refetch).toHaveBeenCalledTimes(1));
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true, search: {} }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't connect the test recipient. Try again.",
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("confirms a callback after the refetched connection has a test recipient", async () => {
    connectionState.data = makeConnection({ testRecipientConnected: false });
    let resolveRefetch:
      | ((result: { data: ConnectionData; isError: false }) => void)
      | undefined;
    connectionState.refetch.mockImplementation(
      () =>
        new Promise<{ data: ConnectionData; isError: false }>((resolve) => {
          resolveRefetch = resolve;
        }),
    );

    renderLineSettings("connected");

    await waitFor(() => expect(connectionState.refetch).toHaveBeenCalledTimes(1));
    const reconcilingProgress = expectSetupProgress([
      { label: "Save credentials", number: 1, status: "Complete" },
      { label: "Connect test recipient", number: 2, status: "Next" },
      { label: "Send a test message", number: 3, status: "Complete earlier steps first" },
    ]);
    expect(within(reconcilingProgress).getByRole("button", { name: "Connect test recipient" })).toBeVisible();

    const confirmedConnection = makeConnection({ testRecipientConnected: true });
    connectionState.data = confirmedConnection;
    const resolveCallback = resolveRefetch;
    if (!resolveCallback) {
      throw new Error("Expected callback refetch resolver");
    }

    resolveCallback({
      data: confirmedConnection,
      isError: false,
    });

    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ replace: true, search: {} }),
    );
    await waitFor(() =>
      expectSetupProgress([
        { label: "Save credentials", number: 1, status: "Complete" },
        { label: "Connect test recipient", number: 2, status: "Complete" },
        { label: "Send a test message", number: 3, status: "Available" },
      ]),
    );
    expect(toast.success).toHaveBeenCalledWith("Test recipient connected.");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("cleans the callback URL and reports an explicit authorization failure without refetching", async () => {
    connectionState.data = makeConnection({ testRecipientConnected: false });

    renderLineSettings("error");

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ replace: true, search: {} })),
    );
    expect(connectionState.refetch).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't connect the test recipient. Try again.",
    );
    expect(toast.error).not.toHaveBeenCalled();
  });
});
