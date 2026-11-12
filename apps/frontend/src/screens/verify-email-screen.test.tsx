import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const searchState = vi.hoisted(() => ({
  value: {} as { email?: string; error?: string },
}));
const verificationMutation = vi.hoisted(() => ({
  isPending: false,
  mutate: vi.fn(),
}));
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>{children}</a>
  ),
  useSearch: () => searchState.value,
}));

vi.mock("@/hooks/mutations/use-send-verification-email", () => ({
  useSendVerificationEmail: () => verificationMutation,
}));

vi.mock("sonner", () => ({ toast }));

import { VerifyEmailScreen } from "@/screens/verify-email-screen";

describe("VerifyEmailScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    searchState.value = {};
    verificationMutation.isPending = false;
    verificationMutation.mutate.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
  });

  it("resends only for a valid email supplied by an expired callback", async () => {
    const user = userEvent.setup();
    searchState.value = { email: "tutor@example.com", error: "TOKEN_EXPIRED" };
    render(<VerifyEmailScreen />);

    const resend = screen.getByRole("button", { name: i18n.t("auth:verifyEmail.resend") });
    await user.click(resend);

    expect(verificationMutation.mutate).toHaveBeenCalledOnce();
    expect(verificationMutation.mutate.mock.calls[0]?.[0]).toBe("tutor@example.com");

    const callbacks = verificationMutation.mutate.mock.calls[0]?.[1] as {
      onError: () => void;
      onSuccess: () => void;
    };
    callbacks.onSuccess();
    callbacks.onError();

    expect(toast.success).toHaveBeenCalledWith(i18n.t("auth:verifyEmail.resendSuccess"));
    expect(toast.error).toHaveBeenCalledWith(i18n.t("auth:verifyEmail.resendError"));
  });

  it.each([
    [{}, "without an email"],
    [{ email: "not-an-email" }, "with an invalid email"],
    [{ email: "not-an-email", error: "TOKEN_EXPIRED" }, "when an error has an invalid email"],
    [{ email: "tutor@example.com" }, "after a successful callback"],
  ])("does not offer resend %s", (search, _description) => {
    searchState.value = search;
    render(<VerifyEmailScreen />);

    expect(screen.queryByRole("button", { name: i18n.t("auth:verifyEmail.resend") })).not.toBeInTheDocument();
  });
});
