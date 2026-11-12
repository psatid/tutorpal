import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const signupMutation = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));
const resendMutation = vi.hoisted(() => ({ isPending: false, mutate: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...props}>{children}</a>
  ),
  Navigate: () => null,
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: { useSession: () => ({ data: null }) },
}));

vi.mock("@/hooks/mutations/use-signup", () => ({
  AuthFlowError: class AuthFlowError extends Error { code?: string; },
  useSignup: () => signupMutation,
}));

vi.mock("@/hooks/mutations/use-send-verification-email", () => ({
  useSendVerificationEmail: () => resendMutation,
}));

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { SignupScreen } from "@/screens/signup-screen";

describe("SignupScreen", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    signupMutation.isPending = false;
    signupMutation.mutate.mockReset();
    resendMutation.isPending = false;
    resendMutation.mutate.mockReset();
  });

  it("keeps values across steps, focuses the active field, and submits exactly once through Enter", async () => {
    const user = userEvent.setup();
    render(<SignupScreen />);

    const name = screen.getByLabelText(i18n.t("common:form.name"));
    await waitFor(() => expect(name).toHaveFocus());
    await user.type(name, "Mali Tutor");
    await user.keyboard("{Enter}");

    const email = screen.getByLabelText(i18n.t("common:form.email"));
    await waitFor(() => expect(email).toHaveFocus());
    await user.type(email, "mali@example.com");
    await user.keyboard("{Enter}");

    const password = screen.getByLabelText(i18n.t("common:form.password"));
    await waitFor(() => expect(password).toHaveFocus());
    await user.type(password, "correct-horse-battery-staple");

    await user.click(screen.getByRole("button", { name: i18n.t("auth:signup.back") }));
    expect(screen.getByLabelText(i18n.t("common:form.email"))).toHaveValue("mali@example.com");
    await user.click(screen.getByRole("button", { name: i18n.t("common:buttons.continue") }));
    expect(screen.getByLabelText(i18n.t("common:form.password"))).toHaveValue("correct-horse-battery-staple");

    await user.keyboard("{Enter}");

    expect(signupMutation.mutate).toHaveBeenCalledTimes(1);
    expect(signupMutation.mutate.mock.calls[0]?.[0]).toEqual({
      name: "Mali Tutor",
      email: "mali@example.com",
      password: "correct-horse-battery-staple",
    });
  });
});
