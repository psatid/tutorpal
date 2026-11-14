import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const searchState = vi.hoisted(() => ({
  value: {} as { error?: string },
}));
const navigationState = vi.hoisted(() => ({
  value: {} as { email?: string; verificationNeeded?: boolean },
}));
const verificationMutation = vi.hoisted(() => ({
  isPending: false,
  mutate: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>{children}</a>
  ),
  useSearch: () => searchState.value,
  useRouterState: ({ select }: { select: (state: unknown) => unknown }) =>
    select({ location: { state: navigationState.value } }),
}));

vi.mock("@/hooks/mutations/use-send-verification-email", () => ({
  useSendVerificationEmail: () => verificationMutation,
}));
vi.mock("@/lib/public-config", () => ({
  usePublicConfig: () => ({ betaEnabled: false, publicSignupEnabled: true }),
}));

import { VerifyEmailScreen } from "@/screens/verify-email-screen";

describe("VerifyEmailScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    searchState.value = {};
    navigationState.value = {};
    verificationMutation.isPending = false;
    verificationMutation.mutate.mockReset();
  });

  it("prefills an editable resend form from transient unverified-login state", async () => {
    const user = userEvent.setup();
    navigationState.value = {
      email: "tutor@example.com",
      verificationNeeded: true,
    };
    render(<VerifyEmailScreen />);

    expect(
      screen.getByRole("heading", {
        name: i18n.t("auth:verifyEmail.verificationNeededTitle"),
      }),
    ).toBeVisible();
    expect(screen.getByLabelText(i18n.t("common:form.email"))).toHaveValue(
      "tutor@example.com",
    );

    const resend = screen.getByRole("button", { name: i18n.t("auth:verifyEmail.resend") });
    await user.click(resend);

    expect(verificationMutation.mutate).toHaveBeenCalledOnce();
    expect(verificationMutation.mutate.mock.calls[0]?.[0]).toBe("tutor@example.com");

    const callbacks = verificationMutation.mutate.mock.calls[0]?.[1] as {
      onError: () => void;
      onSuccess: () => void;
    };
    callbacks.onSuccess();

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        i18n.t("auth:verifyEmail.resendStatus"),
      ),
    );
  });

  it("keeps the entered address and reports a real resend failure without a false sent status", async () => {
    const user = userEvent.setup();
    navigationState.value = {
      email: "tutor@example.com",
      verificationNeeded: true,
    };
    render(<VerifyEmailScreen />);

    await user.click(
      screen.getByRole("button", { name: i18n.t("auth:verifyEmail.resend") }),
    );

    const callbacks = verificationMutation.mutate.mock.calls[0]?.[1] as {
      onError: () => void;
    };
    callbacks.onError();

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        i18n.t("auth:verifyEmail.resendError"),
      ),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByLabelText(i18n.t("common:form.email"))).toHaveValue(
      "tutor@example.com",
    );
  });

  it("offers dedicated email entry for an unverified callback without an email query", () => {
    searchState.value = { error: "EMAIL_NOT_VERIFIED" };
    render(<VerifyEmailScreen />);

    expect(screen.getByLabelText(i18n.t("common:form.email"))).toHaveValue("");
    expect(
      screen.getByRole("button", { name: i18n.t("auth:verifyEmail.resend") }),
    ).toBeVisible();
  });

  it("keeps expired-token failures as the generic recovery surface", () => {
    searchState.value = { error: "TOKEN_EXPIRED" };
    render(<VerifyEmailScreen />);

    expect(
      screen.getByRole("heading", {
        name: i18n.t("auth:verifyEmail.errorTitle"),
      }),
    ).toBeVisible();
    expect(screen.getByText(i18n.t("auth:verifyEmail.errors.TOKEN_EXPIRED"))).toBeVisible();
    expect(screen.queryByLabelText(i18n.t("common:form.email"))).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: i18n.t("auth:verifyEmail.resend") }),
    ).not.toBeInTheDocument();
  });

  it("keeps a successful verification callback free of resend controls", () => {
    render(<VerifyEmailScreen />);

    expect(
      screen.getByRole("heading", { name: i18n.t("auth:verifyEmail.title") }),
    ).toBeVisible();
    expect(screen.queryByLabelText(i18n.t("common:form.email"))).not.toBeInTheDocument();
  });
});
