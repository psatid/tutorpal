import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RefObject } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";
import { Schedule } from "@/models/schedule";

const queryState = vi.hoisted(() => ({
  calls: [] as Array<Record<string, string | undefined>>,
  refetch: vi.fn(),
	schedules: [] as Schedule[],
}));

const sessionsToConfirm = vi.hoisted(() => ({
  onCloseAutoFocus: null as (() => void) | null,
}));

const completeMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
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
  useCompleteSchedule: () => completeMutation,
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

vi.mock("@/components/schedules/sessions-to-confirm", () => ({
  SessionsToConfirm: ({ onCloseAutoFocus }: { onCloseAutoFocus: () => void }) => {
    sessionsToConfirm.onCloseAutoFocus = onCloseAutoFocus;
    return null;
  },
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

function makeSchedule(
  overrides: Partial<GetV1Schedules200Item> = {},
): Schedule {
	return Schedule.fromListItem({
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
    ...overrides,
  });
}

describe("SchedulesScreen weekly timeline integration", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    queryState.calls = [];
    queryState.refetch.mockReset();
    queryState.schedules = [];
    sessionsToConfirm.onCloseAutoFocus = null;
    completeMutation.error = null;
    completeMutation.isError = false;
    completeMutation.isPending = false;
    completeMutation.mutateAsync.mockReset();
    completeMutation.mutateAsync.mockResolvedValue(undefined);
    completeMutation.reset.mockReset();
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

  it("returns drawer-close focus to the Day search through SessionsToConfirm", () => {
    render(<SchedulesScreen />);

    const search = screen.getByPlaceholderText("Search by class...");
    sessionsToConfirm.onCloseAutoFocus?.();

    expect(search).toHaveFocus();
  });

  it("returns final caught-up drawer-close focus to the visible Week date selector", async () => {
    const user = userEvent.setup();
    render(<SchedulesScreen />);

    await user.click(screen.getByRole("tab", { name: "Week" }));
    await waitFor(() =>
      expect(
        screen.queryByPlaceholderText("Search by class..."),
      ).not.toBeInTheDocument(),
    );

    const dateSelectorTrigger = document.querySelector<HTMLButtonElement>(
      "[data-schedules-date-selector-trigger]",
    );
    expect(dateSelectorTrigger).toBeVisible();

    sessionsToConfirm.onCloseAutoFocus?.();

    expect(dateSelectorTrigger).toHaveFocus();
  });

  it("opens the shared completion dialog from a Day card before mutating", async () => {
    const user = userEvent.setup();
    const schedule = makeSchedule();
    queryState.schedules = [schedule];
    render(<SchedulesScreen />);

    await user.click(
      screen.getByRole("button", { name: "Actions for Mathematics" }),
    );
    await user.click(await screen.findByRole("menuitem", { name: "Complete" }));

    const dialog = screen.getByRole("alertdialog", {
      name: "Complete this schedule?",
    });
    expect(completeMutation.reset).toHaveBeenCalledTimes(1);
    expect(completeMutation.mutateAsync).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Complete" }));

    await waitFor(() => {
      expect(completeMutation.mutateAsync).toHaveBeenCalledWith(
        schedule.getId(),
      );
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

	it("keeps the Day toolbar Add and FAB out of the Week timeline", async () => {
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

		expect(
			screen.queryByRole("button", { name: "Add Schedule" }),
		).not.toBeInTheDocument();
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

	it("renders the active mode panel while keeping shared controls outside it", async () => {
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
    const dateSelector = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    expect(dateSelector.closest(".-mx-3")).toBeNull();
    expect(modeContent).toContainElement(
      screen.getByRole("tab", { name: "All" }),
    );
    expect(modeContent).toContainElement(screen.getByText("Mathematics"));
    const sharedControls = getSharedHeaderControls();
    const periodControl = sharedControls.previousElementSibling;
    const scheduleHeader = sharedControls.parentElement?.parentElement;

    expect(modeContent).not.toContainElement(sharedControls);
    expect(periodControl).not.toBeNull();
    expect(modeContent).not.toContainElement(periodControl as HTMLElement);
    expect(scheduleHeader).toHaveClass(
      "shrink-0",
      "px-3",
      "sm:px-4",
      "lg:px-6",
    );
    expect(modeContent).not.toContainElement(
      screen.getByRole("button", { name: "Today" }),
    );

    await user.click(screen.getByRole("tab", { name: "Week" }));

    await waitFor(() => {
      expect(
        screen.getByRole("region", { name: "Weekly schedule timeline" }),
      ).toBeInTheDocument();
    });
    const weeklyTimeline = screen.getByRole("region", {
      name: "Weekly schedule timeline",
    });
    expect(weeklyTimeline.closest(".-mx-3")).toBeNull();
    expect(weeklyTimeline.parentElement).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
      "pb-0",
    );
		expect(
			screen.queryByPlaceholderText("Search by class..."),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Add Schedule" }),
		).not.toBeInTheDocument();
  });

  it("filters Day schedules through manual-activation status tabs and preserves the selection across Week", async () => {
    const user = userEvent.setup();
    queryState.schedules = [
      makeSchedule({ className: "Scheduled algebra", id: "schedule-scheduled" }),
      makeSchedule({
        className: "Completed geometry",
        id: "schedule-completed",
        status: "COMPLETED",
      }),
    ];
    render(<SchedulesScreen />);

    const statusTabs = screen.getByRole("tablist", { name: "Status" });
    const allTab = within(statusTabs).getByRole("tab", { name: "All" });
    const scheduledTab = within(statusTabs).getByRole("tab", {
      name: "Scheduled",
    });
    const completedTab = within(statusTabs).getByRole("tab", {
      name: "Completed",
    });

    for (const tab of within(statusTabs).getAllByRole("tab")) {
      const panelId = tab.getAttribute("aria-controls");

      expect(panelId).not.toBeNull();

      const panel = document.getElementById(panelId!);
      expect(panel).toHaveAttribute("role", "tabpanel");
      expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    }

    expect(allTab).toHaveAttribute("aria-selected", "true");
    scheduledTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(completedTab).toHaveFocus();
    expect(allTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard(" ");

    await waitFor(() => {
      expect(completedTab).toHaveAttribute("aria-selected", "true");
      expect(screen.getByText("Completed geometry")).toBeInTheDocument();
      expect(screen.queryByText("Scheduled algebra")).not.toBeInTheDocument();
    });

    const cancelledTab = within(statusTabs).getByRole("tab", {
      name: "Cancelled",
    });
    await user.click(cancelledTab);

    const cancelledPanel = screen.getByRole("tabpanel", { name: "Cancelled" });
    expect(cancelledPanel).toHaveTextContent("No schedules found");

    await user.click(screen.getByRole("tab", { name: "Week" }));
    await waitFor(() => {
      expect(
        screen.queryByRole("tablist", { name: "Status" }),
      ).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole("tab", { name: "Day" }));
    await waitFor(() => {
      expect(
        screen.getByRole("tab", { name: "Cancelled" }),
      ).toHaveAttribute("aria-selected", "true");
      expect(screen.getByRole("tabpanel", { name: "Cancelled" })).toHaveTextContent(
        "No schedules found",
      );
    });
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
