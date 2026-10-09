import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const mutations = vi.hoisted(() => ({
  create: vi.fn(),
  updateRecurring: vi.fn(),
}));

vi.mock("@/components/ui/responsive-drawer", () => ({
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
        recurringSchedule={{
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "late", weekday: "MONDAY", time: 840, durationMinutes: 30 },
            { id: "early", weekday: "MONDAY", time: 480, durationMinutes: 60 },
          ],
        }}
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
        recurringSchedule={{
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "custom-duration", weekday: "MONDAY", time: 540, durationMinutes: 75 },
          ],
        }}
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
	expect(screen.getByRole("alert")).toHaveTextContent("Recurring sessions cannot overlap");
    expect(mutations.create).not.toHaveBeenCalled();
    expect(firstTime).toHaveFocus();
    expect(firstTime).toHaveAttribute("aria-invalid", "true");
    expect(secondTime).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByLabelText("Duration — Monday, session 1"),
    ).toHaveAttribute("aria-invalid", "true");
    expect(
      screen.getByLabelText("Duration — Monday, session 2"),
    ).toHaveAttribute("aria-invalid", "true");
  });
});
