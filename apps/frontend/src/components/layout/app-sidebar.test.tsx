import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const queryState = vi.hoisted(() => ({
  data: undefined as { pages: Array<{ pagination: { total: number } }> } | undefined,
  isError: false,
  isLoading: false,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a {...props} href={to}>{children}</a>
  ),
  useLocation: () => ({ pathname: "/schedules" }),
}));
vi.mock("@/hooks/queries/use-infinite-awaiting-confirmation-schedules", () => ({
  useInfiniteAwaitingConfirmationSchedules: () => queryState,
}));
vi.mock("@/hooks/use-session", () => ({
  useSession: () => ({
    session: { user: { email: "tutor@example.com", name: "Tutor Test" } },
  }),
}));
vi.mock("@/components/layout/triggers", () => ({
  RailCollapse: () => null,
  TriggerLeftSidebarCollapse: () => null,
  TriggerMobileSidebar: () => null,
}));
vi.mock("@/components/layout/user-settings", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@tutorpal/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuContent: () => null,
  DropdownMenuGroup: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuRadioGroup: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuRadioItem: ({ children }: { children: React.ReactNode }) => children,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("tailwindcss-jun-layout", () => ({ triggerEdgeDrawer: vi.fn() }));

import { AppSidebar } from "@/components/layout/app-sidebar";

function renderSidebar() {
  return render(
    <AppSidebar
      isExitingTutorView={false}
      isImpersonating={false}
      onExitTutorView={vi.fn()}
    />,
  );
}

function sidebar() {
  return (
    <AppSidebar
      isExitingTutorView={false}
      isImpersonating={false}
      onExitTutorView={vi.fn()}
    />
  );
}

describe("AppSidebar awaiting-confirmation badge", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    queryState.data = undefined;
    queryState.isError = false;
    queryState.isLoading = false;
  });

  it("caps the visual primary badge at 99+ while retaining the exact accessible count", () => {
    queryState.data = { pages: [{ pagination: { total: 123 } }] };
    renderSidebar();

    const schedules = screen.getByRole("link", {
      name: "Schedules, 123 sessions to confirm",
    });
    const badge = within(schedules).getByText("99+");

    expect(badge).toHaveAttribute("aria-hidden", "true");
    expect(badge).toHaveClass("bg-primary-container", "text-primary-pressed");
    expect(schedules).toHaveClass("relative");
  });

  it("hides the badge without cached data and for zero, but retains it during a cached refresh", () => {
    queryState.isLoading = true;
    const { rerender } = renderSidebar();

    expect(screen.getByRole("link", { name: "Schedules" })).toBeVisible();
    expect(screen.queryByText("99+")).not.toBeInTheDocument();

    queryState.isLoading = false;
    queryState.isError = true;
    rerender(sidebar());
    expect(screen.getByRole("link", { name: "Schedules" })).toBeVisible();

    queryState.isError = false;
    queryState.data = { pages: [{ pagination: { total: 0 } }] };
    rerender(sidebar());
    expect(screen.getByRole("link", { name: "Schedules" })).toBeVisible();

    queryState.data = { pages: [{ pagination: { total: 7 } }] };
    queryState.isLoading = true;
    rerender(sidebar());
    expect(
      screen.getByRole("link", { name: "Schedules, 7 sessions to confirm" }),
    ).toBeVisible();
    expect(screen.getByText("7")).toHaveAttribute("aria-hidden", "true");
  });

  it("localizes the exact Thai accessible count without changing the visual value", async () => {
    await i18n.changeLanguage("th");
    queryState.data = { pages: [{ pagination: { total: 2 } }] };
    renderSidebar();

    const schedules = screen.getByRole("link", {
      name: "ตารางเรียน มี 2 ช่วงเรียนที่ต้องยืนยัน",
    });
    expect(within(schedules).getByText("2")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
