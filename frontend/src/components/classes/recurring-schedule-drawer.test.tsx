import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { RecurringSchedule } from "@/models/recurring-schedule";

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  updateRecurring: vi.fn(),
}));

vi.mock("@/components/common/responsive-drawer", () => ({
  ResponsiveDrawer: ({ children, footer, title }: {
    children: React.ReactNode;
    footer?: React.ReactNode;
    title: string;
  }) => (
    <section aria-label={title}>
      {children}
      {footer}
    </section>
  ),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
  useCreateSchedule: () => ({ isPending: false, mutate: mutations.create }),
  useUpdateRecurringSchedule: () => ({
    isPending: false,
    mutate: mutations.updateRecurring,
  }),
}));

import { RecurringScheduleDrawer } from "@/components/classes/recurring-schedule-drawer";

describe("RecurringScheduleDrawer", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    mutations.create.mockReset();
    mutations.updateRecurring.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    [
      "no-hours",
      "No hours added yet. Add hours before creating a recurring schedule.",
    ],
    [
      "all-scheduled",
      "All hours scheduled. Add hours before creating a recurring schedule.",
    ],
    [
      "exhausted",
      "Hours exhausted. Add hours before creating a recurring schedule.",
    ],
  ] as const)(
    "shows the localized %s balance state and blocks creation",
    (balanceState, description) => {
      render(
        <RecurringScheduleDrawer
          balanceState={balanceState}
          classId="class-1"
          hasNoAvailableHours
          isOpen
          onAddHours={vi.fn()}
          onOpenChange={vi.fn()}
          schedules={[]}
        />,
      );

      const message = screen.getByText(description);
      expect(message).toBeVisible();
      expect(message).not.toHaveTextContent("{{balance}}");
      expect(
        screen.getByRole("button", { name: "Create recurring schedule" }),
      ).toBeDisabled();
    },
  );

  it("localizes the all-scheduled message in Thai", async () => {
    await i18n.changeLanguage("th");

    render(
      <RecurringScheduleDrawer
        balanceState="all-scheduled"
        classId="class-1"
        hasNoAvailableHours
        isOpen
        onAddHours={vi.fn()}
        onOpenChange={vi.fn()}
        schedules={[]}
      />,
    );

    const message = screen.getByText(
      "นัดชั่วโมงครบแล้ว เพิ่มชั่วโมงก่อนสร้างตารางเรียนซ้ำ",
    );
    expect(message).toBeVisible();
    expect(message).not.toHaveTextContent("{{balance}}");
    expect(
      screen.getByRole("button", { name: "สร้างตารางเรียนซ้ำ" }),
    ).toBeDisabled();
  });

  it("preserves an open draft when the calendar day rolls over and the drawer rerenders", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 23, 59));
    const props = {
      classId: "class-1",
      hasNoAvailableHours: false,
      isOpen: true,
      onAddHours: vi.fn(),
      onOpenChange: vi.fn(),
      schedules: [],
    };
    const { rerender } = render(<RecurringScheduleDrawer {...props} />);

    const startDate = screen.getByLabelText("Start date");
    expect(startDate).toHaveValue("October 12, 2026");
    fireEvent.click(screen.getByRole("radio", { name: "Online" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Monday" }));

    vi.setSystemTime(new Date(2026, 9, 13, 0, 1));
    rerender(<RecurringScheduleDrawer {...props} />);

    expect(screen.getByLabelText("Start date")).toHaveValue(
      "October 12, 2026",
    );
    expect(screen.getByRole("radio", { name: "Online" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Monday" })).toBeChecked();
    expect(screen.getByLabelText("Time — Monday, session 1")).toHaveValue(
      "09:00",
    );
  });

  it.each([
    [
      "en",
      "Time",
      "Duration",
      "Time — Monday, session 1",
      "Duration — Monday, session 1",
    ],
    [
      "th",
      "เวลา",
      "ระยะเวลา",
      "เวลา — วันจันทร์ ช่วงเรียนที่ 1",
      "ระยะเวลา — วันจันทร์ ช่วงเรียนที่ 1",
    ],
  ])(
    "keeps localized short labels, contextual names, and a two-column session row in %s",
    async (
      language,
      timeLabel,
      durationLabel,
      timeAccessibleName,
      durationAccessibleName,
    ) => {
      await i18n.changeLanguage(language);
      render(
        <RecurringScheduleDrawer
          classId="class-1"
          hasNoAvailableHours={false}
          isOpen
          onAddHours={vi.fn()}
          onOpenChange={vi.fn()}
          schedules={[]}
			recurringSchedule={RecurringSchedule.fromInput({
            id: "recurring-1",
            startDate: "2026-10-08",
            type: "ONLINE",
            scheduleItems: [
              { id: "monday", weekday: "MONDAY", time: 540, durationMinutes: 60 },
            ],
			})}
        />,
      );

      const time = screen.getByLabelText(timeAccessibleName);
      const duration = screen.getByRole("combobox", {
        name: durationAccessibleName,
      });
      const timeField = time.closest<HTMLElement>('[data-slot="field"]');
      const durationField = duration.closest<HTMLElement>('[data-slot="field"]');
      const row = timeField?.parentElement;

      expect(within(row as HTMLElement).getByText(timeLabel, { selector: "label" })).toBeVisible();
      expect(
        within(row as HTMLElement).getByText(durationLabel, { selector: "label" }),
      ).toBeVisible();
      expect(time.id).toMatch(/^recurring-weekday-time-/);
      expect(time).toHaveAttribute("aria-required", "true");
      expect(duration).toHaveAttribute("aria-required", "true");
      expect(timeField).toHaveClass("w-full");
      expect(durationField).toHaveClass("w-full");
      expect(row).toBe(durationField?.parentElement);
      expect(row).toHaveClass("grid", "grid-cols-2", "gap-3");
      expect(row?.className).not.toContain("sm:grid-cols");
    },
  );

  it("keeps repeated weekday values and appends the next class interval after the latest end", async () => {
    const user = userEvent.setup();
    render(
      <RecurringScheduleDrawer
        classId="class-1"
        hasNoAvailableHours={false}
        isOpen
        onAddHours={vi.fn()}
        onOpenChange={vi.fn()}
        schedules={[]}
		recurringSchedule={RecurringSchedule.fromInput({
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "late", weekday: "MONDAY", time: 840, durationMinutes: 30 },
            { id: "early", weekday: "MONDAY", time: 480, durationMinutes: 60 },
          ],
		})}
      />,
    );

    expect(screen.getAllByRole("checkbox", { name: "Monday" })).toHaveLength(1);
    expect([
      screen.getByLabelText("Time — Monday, session 1"),
      screen.getByLabelText("Time — Monday, session 2"),
    ].map((input) => (input as HTMLInputElement).value)).toEqual(["08:00", "14:00"]);

    await user.click(screen.getByRole("button", { name: "Add a session on Monday" }));

    expect([
      screen.getByLabelText("Time — Monday, session 1"),
      screen.getByLabelText("Time — Monday, session 2"),
      screen.getByLabelText("Time — Monday, session 3"),
    ].map((input) => (input as HTMLInputElement).value)).toEqual([
      "08:00",
      "14:00",
      "14:30",
    ]);
    expect(screen.getByLabelText("Duration — Monday, session 3")).toBeVisible();
  });

  it("uses the global duration combobox options and retains a saved custom duration", async () => {
    const user = userEvent.setup();
    render(
      <RecurringScheduleDrawer
        classId="class-1"
        hasNoAvailableHours={false}
        isOpen
        onAddHours={vi.fn()}
        onOpenChange={vi.fn()}
        schedules={[]}
		recurringSchedule={RecurringSchedule.fromInput({
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "custom-duration", weekday: "MONDAY", time: 540, durationMinutes: 75 },
          ],
		})}
      />,
    );

    const duration = screen.getByRole("combobox", {
      name: "Duration — Monday, session 1",
    });
    expect(duration).toHaveTextContent("1 h 15 min");

    await user.pointer({ keys: "[MouseLeft>]", target: duration });

    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "30 min",
      "1 h",
      "1 h 15 min",
      "1 h 30 min",
      "2 h",
      "2 h 30 min",
      "3 h",
    ]);
  });

  it("submits adjacent repeated intervals and blocks an overlapping class pattern", async () => {
    const user = userEvent.setup();
    render(
      <RecurringScheduleDrawer
        classId="class-1"
        hasNoAvailableHours={false}
        isOpen
        onAddHours={vi.fn()}
        onOpenChange={vi.fn()}
        schedules={[]}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Online" }));
    await user.click(screen.getByRole("checkbox", { name: "Monday" }));
    await user.click(screen.getByRole("button", { name: "Add a session on Monday" }));
    await user.click(screen.getByRole("button", { name: "Create recurring schedule" }));

    expect(mutations.create).toHaveBeenCalledWith(
      expect.objectContaining({
        classId: "class-1",
        recurring: expect.objectContaining({
          scheduleItems: [
            { weekday: "MONDAY", time: 540, durationMinutes: 60 },
            { weekday: "MONDAY", time: 600, durationMinutes: 60 },
          ],
        }),
      }),
    );

    mutations.create.mockReset();
    const firstTime = screen.getByLabelText(
      "Time — Monday, session 1",
    ) as HTMLInputElement;
    const secondTime = screen.getByLabelText(
      "Time — Monday, session 2",
    ) as HTMLInputElement;
    await user.clear(secondTime);
    await user.type(secondTime, "09:30");
    expect(secondTime).toHaveValue("09:30");

    await user.click(screen.getByRole("button", { name: "Create recurring schedule" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Recurring sessions cannot overlap");
    expect(mutations.create).not.toHaveBeenCalled();
    expect(firstTime).toHaveFocus();
    expect(firstTime).toHaveAttribute("aria-invalid", "true");
    expect(secondTime).toHaveAttribute("aria-invalid", "true");
    expect(firstTime).toHaveAttribute("aria-describedby", alert.id);
    expect(secondTime).toHaveAttribute("aria-describedby", alert.id);
    const firstDuration = screen.getByLabelText("Duration — Monday, session 1");
    const secondDuration = screen.getByLabelText("Duration — Monday, session 2");
    expect(firstDuration).toHaveAttribute("aria-invalid", "true");
    expect(secondDuration).toHaveAttribute("aria-invalid", "true");
    expect(firstDuration).toHaveAttribute("aria-describedby", alert.id);
    expect(secondDuration).toHaveAttribute("aria-describedby", alert.id);
  });
});
