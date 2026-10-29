import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { RefObject } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import type { Class } from "@/models/class";
import { Schedule, type ScheduleDisplayInput } from "@/models/schedule";

const queryState = vi.hoisted(() => ({
  classData: null as Class | null,
  schedules: [] as Schedule[],
}));

const completeMutation = vi.hoisted(() => ({
  error: null as Error | null,
  isError: false,
  isPending: false,
  mutateAsync: vi.fn(),
  reset: vi.fn(),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/queries/use-class-details", () => ({
  useClassDetails: () => ({
    data: queryState.classData,
    error: null,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/queries/use-class-schedules", () => ({
  useClassSchedules: () => ({
    data: queryState.schedules,
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
  useCompleteSchedule: () => completeMutation,
  useDeleteSchedule: () => ({ mutate: vi.fn() }),
  useRestoreHours: () => ({ mutate: vi.fn() }),
}));

vi.mock("@/components/classes/class-info-header", () => ({
  ClassInfoHeader: () => <div data-testid="class-info-header" />,
}));

vi.mock("@/components/classes/class-hour-additions-drawer", () => ({
  ClassHourAdditionsDrawer: () => null,
}));

vi.mock("@/components/classes/class-hour-additions-section", () => ({
  ClassHourAdditionsSection: () => null,
}));

vi.mock("@/components/classes/recurring-schedule-drawer", () => ({
  RecurringScheduleDrawer: () => null,
}));

vi.mock("@/components/classes/recurring-schedule-section", () => ({
  RecurringScheduleSection: () => null,
}));

vi.mock("@/components/classes/schedule-log", () => ({
  ScheduleLog: ({
    headingRef,
    onCompleteSchedule,
    schedules,
    section,
  }: {
    headingRef?: RefObject<HTMLHeadingElement | null>;
    onCompleteSchedule?: (schedule: Schedule) => void;
    schedules: Schedule[];
    section: "recent" | "upcoming";
  }) => {
    const schedule = schedules[0];

    return section === "upcoming" && schedule ? (
      <section>
        <h2 ref={headingRef} tabIndex={-1}>
          Upcoming sessions
        </h2>
        <button onClick={() => onCompleteSchedule?.(schedule)} type="button">
          Complete upcoming schedule
        </button>
      </section>
    ) : null;
  },
}));

vi.mock("@/components/classes/class-drawer", () => ({
  ClassDrawer: () => null,
}));

vi.mock("@/components/schedules/schedule-drawer", () => ({
  ScheduleDrawer: () => null,
}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
  NoShowScheduleDialog: () => null,
}));

import { ClassDetailScreen } from "@/screens/class-detail-screen";

function makeClass(): Class {
  return {
    getBalanceState: () => "available" as const,
    getRecurringSchedule: () => null,
    hasNoAvailableHours: () => false,
  } as unknown as Class;
}

function makeSchedule(
  overrides: Partial<ScheduleDisplayInput> = {},
): Schedule {
  return Schedule.fromInput({
    classId: "class-1",
    className: "Class one",
    date: "2026-10-08",
    durationMinutes: 90,
    id: "schedule-1",
    time: 540,
    type: "ONLINE",
    ...overrides,
  });
}

describe("ClassDetailScreen completion", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    queryState.classData = makeClass();
    queryState.schedules = [makeSchedule()];
    completeMutation.error = null;
    completeMutation.isError = false;
    completeMutation.isPending = false;
    completeMutation.mutateAsync.mockReset();
    completeMutation.mutateAsync.mockResolvedValue(undefined);
    completeMutation.reset.mockReset();
  });

  it("opens the shared completion dialog before mutating a class schedule", async () => {
    const user = userEvent.setup();
    const schedule = queryState.schedules[0];

    if (!schedule) {
      throw new Error("Expected a class schedule fixture.");
    }

    render(<ClassDetailScreen classId="class-1" />);

    await user.click(
      screen.getByRole("button", { name: "Complete upcoming schedule" }),
    );

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

  it("returns cancellation focus to the upcoming ScheduleLog heading", async () => {
    const user = userEvent.setup();
    render(<ClassDetailScreen classId="class-1" />);

    const heading = screen.getByRole("heading", {
      name: "Upcoming sessions",
    });
    await user.click(
      screen.getByRole("button", { name: "Complete upcoming schedule" }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(heading).toHaveFocus());
  });
});
