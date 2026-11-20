import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_ROUTES } from "@/constants/routes";

const navigate = vi.hoisted(() => vi.fn());
const search = vi.hoisted(() => ({
  google: undefined as "connected" | "error" | undefined,
  line: undefined as "connected" | "error" | undefined,
}));

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({
    options,
    useSearch: () => search,
  }),
  useNavigate: () => navigate,
}));

vi.mock("@/components/layout/screen-layout", () => ({
  ScreenLayout: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/contexts/auth-context", () => ({
  useAuth: () => ({ isImpersonating: false }),
}));

vi.mock("@/screens/account-settings-screen", () => ({
  AccountSettingsScreen: ({
    googleCallback,
    lineCallback,
    onCallbackHandled,
  }: {
    googleCallback?: string;
    lineCallback?: string;
    onCallbackHandled: () => void;
  }) => (
    <button onClick={onCallbackHandled} type="button">
      {googleCallback ?? lineCallback ?? "no callback"}
    </button>
  ),
}));

import { Route } from "@/routes/_layout/settings/account";

function getValidatedSearch(search: Record<string, unknown>) {
  const validateSearch = Route.options.validateSearch;

  if (!validateSearch) {
    throw new Error("Expected account settings search validation.");
  }

  if (typeof validateSearch === "function") {
    return validateSearch(search);
  }

  if ("parse" in validateSearch && typeof validateSearch.parse === "function") {
    return validateSearch.parse(search);
  }

  throw new Error("Expected account settings search validation to be callable.");
}

describe("account settings callback search", () => {
  beforeEach(() => {
    navigate.mockReset();
    search.google = undefined;
    search.line = undefined;
  });

  it("accepts Google callback results alongside the existing LINE result", () => {
    expect(getValidatedSearch({ google: "connected", line: "error" })).toEqual({
      google: "connected",
      line: "error",
    });
  });

  it("rejects unknown provider callback results", () => {
    expect(() => getValidatedSearch({ google: "unexpected" })).toThrow();
    expect(() => getValidatedSearch({ line: "unexpected" })).toThrow();
  });

  it("replaces the callback URL with canonical account settings after Google handling", async () => {
    const user = userEvent.setup();
    search.google = "connected";
    const AccountSettingsRoute = Route.options.component;

    if (!AccountSettingsRoute) {
      throw new Error("Expected the account settings route component.");
    }

    render(<AccountSettingsRoute />);
    expect(screen.getByRole("button", { name: "connected" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "connected" }));

    expect(navigate).toHaveBeenCalledWith({
      replace: true,
      to: APP_ROUTES.ACCOUNT_SETTINGS,
    });
  });
});
