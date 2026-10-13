import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";

const queryState = vi.hoisted(() => ({
  calls: [] as Array<Record<string, string | undefined>>,
  refetch: vi.fn(),
  schedules: [] as GetV1Schedules200Item[],
}));

vi.mock("@/hooks/queries/use-schedules", () => ({
  useSchedules: (params?: Record<string, string | undefined>) => {
    queryState.calls.push(params ?? {});
    return {
      data: queryState.schedules,
      isError: false,
      isLoading: false,
      refetch: queryState.refetch,
    };
  },
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
  useCompleteSchedule: () => ({ mutate: vi.fn() }),
  useDeleteSchedule: () => ({ mutate: vi.fn() }),
  useRestoreHours: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/components/schedules/weekly-schedule-timeline", () => ({
  WeeklyScheduleTimeline: ({
    onCreateSchedule,
  }: {
    onCreateSchedule: (date: Date, time: number, trigger: HTMLButtonElement) => void;
  }) => (
    <section aria-label="Weekly schedule timeline">
      <button
        onClick={(event) =>
          onCreateSchedule(new Date(2026, 9, 8), 13 * 60, event.currentTarget)
        }
        type="button"
      >
        Create Thursday 13:00
      </button>
    </section>
  ),
}));

vi.mock("@/components/schedules/schedule-drawer", () => ({
  ScheduleDrawer: ({
    initialTime,
    isOpen,
    onCloseAutoFocus,
    onOpenChange,
    selectedDate,
  }: {
    initialTime?: number;
    isOpen: boolean;
    onCloseAutoFocus?: () => void;
    onOpenChange: (open: boolean) => void;
    selectedDate?: Date;
  }) =>
    isOpen ? (
      <section aria-label="Schedule drawer" role="dialog">
        <output data-testid="drawer-date">
          {selectedDate ? DateTime.from(selectedDate).toDateOnlyString() : ""}
        </output>
        <output data-testid="drawer-time">{initialTime ?? "default"}</output>
        <button
          onClick={() => {
            onOpenChange(false);
            onCloseAutoFocus?.();
          }}
          type="button"
        >
          Close schedule drawer
        </button>
      </section>
    ) : null,
}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
  NoShowScheduleDialog: () => null,
}));

vi.mock("@/components/workspaces/workspace-fab", () => ({
  WorkspaceFab: ({
    label,
    onClick,
    triggerRef,
  }: {
    label: string;
    onClick: () => void;
    triggerRef?: RefObject<HTMLButtonElement | null>;
  }) => (
    <button
      data-testid="workspace-fab"
      onClick={onClick}
      ref={triggerRef}
      type="button"
    >
      {label}
    </button>
  ),
}));

import { SchedulesScreen } from "@/screens/schedules-screen";

function getAddButtonWithClass(className: string) {
  const button = screen
    .getAllByRole("button", { name: "Add Schedule" })
    .find((candidate) => candidate.classList.contains(className));

  if (!button) {
    throw new Error(`Expected an Add Schedule button with ${className}.`);
  }

  return button;
}

function getSharedHeaderControls() {
  const controls = screen
    .getByRole("tablist", { name: "Schedule view" })
    .closest<HTMLElement>(".ml-auto");

  if (!controls) {
    throw new Error("Expected the shared period and view controls.");
  }

  return controls;
}

function makeSchedule(): GetV1Schedules200Item {
  return {
    classId: "class-1",
    className: "Mathematics",
    createdAt: "2026-10-01T00:00:00.000Z",
    date: "2026-10-11",
    durationMinutes: 60,
    id: "schedule-1",
    noShowNote: null,
    notes: null,
    status: "SCHEDULED",
    time: 9 * 60,
    type: "ONLINE",
    updatedAt: "2026-10-01T00:00:00.000Z",
  };
}

describe("SchedulesScreen weekly timeline integration", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    queryState.calls = [];
    queryState.refetch.mockReset();
    queryState.schedules = [];
    const rect = {} as DOMRect;
    vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue({
      0: rect,
      item: () => rect,
      length: 1,
    } as unknown as DOMRectList);
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps the Day search text while Week queries the unfiltered seven-day range", async () => {
    const user = userEvent.setup();
    render(<SchedulesScreen />);

    const search = screen.getByPlaceholderText("Search by class...");
    await user.type(search, "algebra");

    await waitFor(() => {
      expect(queryState.calls.at(-1)).toMatchObject({ search: "algebra" });
    });

    await user.click(screen.getByRole("tab", { name: "Week" }));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText("Search by class...")).not.toBeInTheDocument();
      expect(queryState.calls.at(-1)).toMatchObject({
        endDate: expect.any(String),
        startDate: expect.any(String),
      });
      expect(queryState.calls.at(-1)).not.toHaveProperty("search");
    });

    await user.click(screen.getByRole("tab", { name: "Day" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search by class...")).toHaveValue(
        "algebra",
      );
    });
    await waitFor(() => {
      expect(queryState.calls.at(-1)).toMatchObject({ search: "algebra" });
    });
  });

  it("updates the selected date and create defaults from a timeline cell, then returns focus to it", async () => {
    const user = userEvent.setup();
    render(<SchedulesScreen />);

    await user.click(screen.getByRole("tab", { name: "Week" }));
    const cell = await screen.findByRole("button", {
      name: "Create Thursday 13:00",
    });

    await user.click(cell);

    expect(screen.getByRole("dialog", { name: "Schedule drawer" })).toBeInTheDocument();
    expect(screen.getByTestId("drawer-date")).toHaveTextContent("2026-10-08");
    expect(screen.getByTestId("drawer-time")).toHaveTextContent("780");

    await user.click(screen.getByRole("button", { name: "Close schedule drawer" }));

    expect(document.activeElement).toBe(cell);
  });

  it("keeps the toolbar Add action on its standard 09:00 default", async () => {
    const user = userEvent.setup();
    render(<SchedulesScreen />);
    const toolbarAdd = getAddButtonWithClass("sm:inline-flex");

    await user.click(toolbarAdd);

    expect(screen.getByTestId("drawer-time")).toHaveTextContent("default");
  });

  it("keeps Week Add beside the view tabs and preserves the Day Add and FAB", async () => {
    const user = userEvent.setup();
    render(<SchedulesScreen />);

    const dayToolbarAdd = getAddButtonWithClass("sm:inline-flex");
    const sharedControls = getSharedHeaderControls();
    expect(sharedControls).not.toContainElement(dayToolbarAdd);
    expect(screen.getByTestId("workspace-fab")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Week" }));

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Search by class..."),
      ).not.toBeInTheDocument();
    });

    const mobileWeekAdd = getAddButtonWithClass("sm:hidden");
    const desktopWeekAdd = getAddButtonWithClass("sm:inline-flex");

    expect(sharedControls).toContainElement(mobileWeekAdd);
    expect(sharedControls).toContainElement(desktopWeekAdd);
    expect(
      screen.getAllByRole("button", { name: "Add Schedule" }),
    ).toEqual([mobileWeekAdd, desktopWeekAdd]);
    expect(mobileWeekAdd).toHaveAttribute("aria-haspopup", "dialog");
    expect(mobileWeekAdd).toHaveClass("sm:hidden", "size-11");
    expect(mobileWeekAdd).not.toHaveTextContent("Add Schedule");
    expect(desktopWeekAdd).toHaveClass("hidden", "sm:inline-flex");
    expect(desktopWeekAdd).toHaveTextContent("Add Schedule");
    expect(screen.queryByTestId("workspace-fab")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Day" }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search by class...")).toBeInTheDocument();
      expect(screen.getByTestId("workspace-fab")).toBeInTheDocument();
    });
    expect(getSharedHeaderControls()).not.toContainElement(
      getAddButtonWithClass("sm:inline-flex"),
    );
  });

  it("transitions the active mode block while keeping shared controls outside it", async () => {
    const user = userEvent.setup();
    queryState.schedules = [makeSchedule()];
    render(<SchedulesScreen />);

    const search = screen.getByPlaceholderText("Search by class...");
    const modeContent = search.closest(".flex.min-h-0.flex-1.flex-col");

    if (!modeContent) {
      throw new Error("Expected the Day mode content wrapper.");
    }

    expect(modeContent).toContainElement(
      screen.getByRole("group", { name: "Schedule date selector" }),
    );
    expect(modeContent).toContainElement(
      screen.getByRole("button", { name: "All" }),
    );
    expect(modeContent).toContainElement(screen.getByText("Mathematics"));
    const sharedControls = getSharedHeaderControls();
    const periodControl = sharedControls.previousElementSibling;

    expect(modeContent).not.toContainElement(sharedControls);
    expect(periodControl).not.toBeNull();
    expect(modeContent).not.toContainElement(periodControl as HTMLElement);
    expect(modeContent).not.toContainElement(
      screen.getByRole("button", { name: "Today" }),
    );

    await user.click(screen.getByRole("tab", { name: "Week" }));

    const exitingSearch = document.querySelector<HTMLInputElement>(
      'input[placeholder="Search by class..."]',
    );
    const exitingModeContent = exitingSearch?.closest(
      ".flex.min-h-0.flex-1.flex-col",
    );

    expect(exitingModeContent).toHaveAttribute("aria-hidden", "true");
    expect(exitingModeContent).toHaveAttribute("inert");

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Weekly schedule timeline" }),
      ).toBeInTheDocument();
    });
    expect(getSharedHeaderControls()).toContainElement(
      getAddButtonWithClass("sm:inline-flex"),
    );
  });

  it("switches mode without retaining exiting content for reduced-motion users", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<SchedulesScreen />);

    await user.click(screen.getByRole("tab", { name: "Week" }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Weekly schedule timeline" }),
      ).toBeInTheDocument();
    });
    expect(
      document.querySelector('input[placeholder="Search by class..."]'),
    ).not.toBeInTheDocument();
  });
});
