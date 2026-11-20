import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

type AccountStatus = {
  google: boolean;
  line: boolean;
  password: boolean;
};

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));
const authState = vi.hoisted(() => ({
  isImpersonating: false,
  session: { session: {}, user: { role: "user" } } as object | null,
  user: { role: "user" } as { role: string } | null,
}));
const publicConfigState = vi.hoisted(() => ({
  isError: false,
  isFetching: false,
  isPending: false,
  isStale: false,
  refetch: vi.fn(),
  socialLogin: { google: true, line: true },
}));
const accountsState = vi.hoisted(() => ({
  data: { google: false, line: false, password: true } as AccountStatus | undefined,
  isError: false,
  isLoading: false,
  refetch: vi.fn(),
}));
const googleMutation = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));
const lineMutation = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));

vi.mock("@/contexts/auth-context", () => ({ useAuth: () => authState }));
vi.mock("@/lib/public-config", () => ({ usePublicConfig: () => publicConfigState }));
vi.mock("@/hooks/queries/use-social-account-status", () => ({
  useSocialAccountStatus: () => accountsState,
}));
vi.mock("@/hooks/mutations/use-start-google-authorization", () => ({
  useStartGoogleAuthorization: () => googleMutation,
}));
vi.mock("@/hooks/mutations/use-start-line-authorization", () => ({
  useStartLineAuthorization: () => lineMutation,
}));
vi.mock("sonner", () => ({ toast }));

import { AccountSettingsScreen } from "@/screens/account-settings-screen";

function renderScreen(props: Partial<ComponentProps<typeof AccountSettingsScreen>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AccountSettingsScreen onCallbackHandled={vi.fn()} {...props} />
    </QueryClientProvider>,
  );
}

function getProviderRow(provider: "Google" | "LINE") {
  const heading = screen.getByRole("heading", { name: provider });
  const row = heading.closest("div.flex.flex-col");

  if (!(row instanceof HTMLElement)) {
    throw new Error(`Expected ${provider} to be in a settings method row.`);
  }

  return row;
}

describe("AccountSettingsScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    authState.isImpersonating = false;
    authState.session = { session: {}, user: { role: "user" } };
    authState.user = { role: "user" };
    publicConfigState.isError = false;
    publicConfigState.isFetching = false;
    publicConfigState.isPending = false;
    publicConfigState.isStale = false;
    publicConfigState.refetch.mockReset();
    publicConfigState.socialLogin = { google: true, line: true };
    accountsState.data = { google: false, line: false, password: true };
    accountsState.isError = false;
    accountsState.isLoading = false;
    accountsState.refetch.mockReset();
    accountsState.refetch.mockResolvedValue({
      data: { google: false, line: false, password: true },
      isError: false,
    });
    googleMutation.isPending = false;
    googleMutation.mutate.mockReset();
    lineMutation.isPending = false;
    lineMutation.mutate.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
  });

  it("shows the verified-email explanation and full-width mobile Connect Google action in English and Thai", async () => {
    const { rerender } = renderScreen();

    const google = screen.getByRole("button", { name: "Connect Google" });
    expect(google).toHaveClass("h-11", "w-full", "sm:w-auto");
    expect(google).toHaveAttribute("type", "button");
    expect(getProviderRow("Google")).toHaveTextContent(
      "same verified email address as your TutorPal account",
    );

    await i18n.changeLanguage("th");
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );

    expect(
      screen.getByRole("button", { name: "เชื่อมต่อ Google" }),
    ).toHaveClass("h-11", "w-full", "sm:w-auto");
    expect(screen.getByText(/อีเมลยืนยันแล้วตรงกับอีเมลในบัญชี TutorPal/)).toBeVisible();
  });

  it("presents checking, config failure retry, disabled-provider, linked, and ineligible states without an action", async () => {
    publicConfigState.isPending = true;
    const { rerender } = renderScreen();
    expect(within(getProviderRow("Google")).getByRole("status")).toHaveTextContent(
      "Checking Google sign-in availability",
    );

    publicConfigState.isPending = false;
    publicConfigState.isError = true;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );
    const alert = within(getProviderRow("Google")).getByRole("alert");
    expect(alert).toHaveTextContent("couldn't check Google sign-in availability");
    await userEvent.setup().click(within(alert).getByRole("button", { name: "Retry" }));
    expect(publicConfigState.refetch).toHaveBeenCalledOnce();

    publicConfigState.isError = false;
    publicConfigState.socialLogin.google = false;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Google sign-in is unavailable right now.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();

    publicConfigState.socialLogin.google = true;
    accountsState.data = { google: true, line: false, password: true };
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(getProviderRow("Google")).toHaveTextContent("Linked");
    expect(within(getProviderRow("Google")).queryByRole("button")).not.toBeInTheDocument();

    accountsState.data = { google: false, line: false, password: true };
    authState.isImpersonating = true;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: "Connect Google" })).not.toBeInTheDocument();
    expect(screen.getByText("Google sign-in is unavailable right now.")).toBeVisible();
  });

  it("supports keyboard launch, prevents a duplicate pending launch, and keeps LINE mutually disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = renderScreen();

    const google = screen.getByRole("button", { name: "Connect Google" });
    google.focus();
    await user.keyboard("{Enter}");
    expect(googleMutation.mutate).toHaveBeenCalledOnce();

    googleMutation.isPending = true;
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen onCallbackHandled={vi.fn()} />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Connecting Google…" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Connect LINE" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Connecting Google…" }));
    expect(googleMutation.mutate).toHaveBeenCalledOnce();
  });

  it("preserves LINE launch behavior and restores Google after a launch error", async () => {
    const user = userEvent.setup();
    renderScreen();

    await user.click(screen.getByRole("button", { name: "Connect LINE" }));
    expect(lineMutation.mutate).toHaveBeenCalledOnce();

    const google = screen.getByRole("button", { name: "Connect Google" });
    await user.click(google);
    const options = googleMutation.mutate.mock.calls[0]?.[1];
    options?.onError?.(new Error("rejected"), undefined, undefined);

    expect(toast.error).toHaveBeenCalledWith("We couldn't connect Google. Please try again.");
    expect(screen.getByRole("button", { name: "Connect Google" })).toBeEnabled();
  });

  it("does not report Google callback success from the query alone, deduplicates renders, and clears the callback", async () => {
    const onCallbackHandled = vi.fn();
    accountsState.data = { google: true, line: false, password: true };
    accountsState.refetch.mockResolvedValue({
      data: { google: false, line: false, password: true },
      isError: false,
    });
    const { rerender } = renderScreen({
      googleCallback: "connected",
      onCallbackHandled,
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Google wasn't connected. Please try again."),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(onCallbackHandled).toHaveBeenCalledOnce();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <AccountSettingsScreen
          googleCallback="connected"
          onCallbackHandled={onCallbackHandled}
        />
      </QueryClientProvider>,
    );
    expect(accountsState.refetch).toHaveBeenCalledOnce();
  });

  it("reports callback refetch rejection generically and still clears the callback", async () => {
    const onCallbackHandled = vi.fn();
    accountsState.refetch.mockRejectedValue(new Error("network failure"));
    renderScreen({ googleCallback: "connected", onCallbackHandled });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "We couldn't connect Google. Please try again.",
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(onCallbackHandled).toHaveBeenCalledOnce();
  });

  it("reports a Google error callback generically even when stale data says linked", async () => {
    const onCallbackHandled = vi.fn();
    accountsState.data = { google: true, line: false, password: true };
    accountsState.refetch.mockResolvedValue({
      data: { google: true, line: false, password: true },
      isError: false,
    });
    renderScreen({ googleCallback: "error", onCallbackHandled });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "We couldn't connect Google. Please try again.",
      ),
    );
    expect(toast.success).not.toHaveBeenCalled();
    expect(onCallbackHandled).toHaveBeenCalledOnce();
  });

  it("reports Google callback success only after its refetch confirms the account is linked", async () => {
    const onCallbackHandled = vi.fn();
    accountsState.data = { google: false, line: false, password: true };
    accountsState.refetch.mockResolvedValue({
      data: { google: true, line: false, password: true },
      isError: false,
    });
    renderScreen({ googleCallback: "connected", onCallbackHandled });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("Google is connected to your account."),
    );
    expect(toast.error).not.toHaveBeenCalled();
    expect(onCallbackHandled).toHaveBeenCalledOnce();
  });

  it("retains the existing LINE callback confirmation flow", async () => {
    const onCallbackHandled = vi.fn();
    accountsState.refetch.mockResolvedValue({
      data: { google: false, line: true, password: true },
      isError: false,
    });
    renderScreen({ lineCallback: "connected", onCallbackHandled });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith("LINE is connected to your account."),
    );
    expect(onCallbackHandled).toHaveBeenCalledOnce();
  });
});
