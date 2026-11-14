import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const publicConfigState = vi.hoisted(() => ({
  betaEnabled: true,
  isError: false,
  isFetching: false,
  publicSignupEnabled: false,
  socialLogin: { google: false, line: false },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: ReactNode; to: string }) => (
    <a href={to} {...props}>{children}</a>
  ),
  Navigate: () => null,
  useNavigate: () => vi.fn(),
  useSearch: () => ({}),
}));
vi.mock("@/components/auth/auth-shell", () => ({
  AuthShell: ({ footer }: { footer?: ReactNode }) => <div>{footer}</div>,
}));
vi.mock("@/hooks/mutations/use-login", () => ({
  useLogin: () => ({ isPending: false, mutate: vi.fn() }),
}));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { social: vi.fn() },
    useSession: () => ({ data: null }),
  },
}));
vi.mock("@/lib/public-config", () => ({
  usePublicConfig: () => ({
    ...publicConfigState,
    refetch: vi.fn(),
  }),
}));

import { LoginScreen } from "@/screens/login-screen";

describe("LoginScreen footer", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    publicConfigState.betaEnabled = true;
    publicConfigState.isError = false;
    publicConfigState.isFetching = false;
    publicConfigState.publicSignupEnabled = false;
    publicConfigState.socialLogin = { google: false, line: false };
  });

  it("shows neither beta request nor account creation while launch mode is known but capabilities are masked", () => {
    publicConfigState.betaEnabled = false;
    publicConfigState.isError = true;

    render(<LoginScreen />);

    expect(
      screen.queryByRole("link", { name: i18n.t("auth:login.betaAction") }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: i18n.t("auth:login.alternateAction") }),
    ).not.toBeInTheDocument();
  });

  it("returns the ordinary create-account link after a validated launch configuration", () => {
    publicConfigState.betaEnabled = false;
    publicConfigState.publicSignupEnabled = true;

    render(<LoginScreen />);

    expect(
      screen.getByRole("link", { name: i18n.t("auth:login.alternateAction") }),
    ).toHaveAttribute("href", "/signup");
  });
});
