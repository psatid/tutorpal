import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurringScheduleSection } from "@/components/classes/recurring-schedule-section";
import i18n from "@/lib/i18n/config";

describe("RecurringScheduleSection", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("renders each weekday once with ordered time and duration entries when collapsed and expanded", async () => {
    const user = userEvent.setup();
    render(
      <RecurringScheduleSection
        hasNoAvailableHours={false}
        onAddHours={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
        recurringSchedule={{
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "monday-late", weekday: "MONDAY", time: 840, durationMinutes: 30 },
            { id: "tuesday", weekday: "TUESDAY", time: 540, durationMinutes: 60 },
            { id: "monday-early", weekday: "MONDAY", time: 480, durationMinutes: 60 },
          ],
        }}
      />,
    );

    const trigger = screen.getByRole("button", { name: /Recurring schedule/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(within(trigger).getAllByText("Monday")).toHaveLength(1);
    expect(within(trigger).getAllByText("Tuesday")).toHaveLength(1);
    expect(trigger.textContent).toMatch(/Monday.*08:00.*14:00.*Tuesday.*09:00/);

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const expandedSummary = screen.getByRole("list");
    expect(within(expandedSummary).getAllByText("Monday")).toHaveLength(1);
    expect(within(expandedSummary).getAllByText("Tuesday")).toHaveLength(1);
    expect(expandedSummary.textContent).toMatch(/Monday.*08:00.*14:00.*Tuesday.*09:00/);
    expect(within(expandedSummary).getByText("08:00 · 1 h")).toBeVisible();
    expect(within(expandedSummary).getByText("14:00 · 30 min")).toBeVisible();
  });

  it("keeps the empty-state action full width only below the parent row breakpoint", () => {
    render(
      <RecurringScheduleSection
        hasNoAvailableHours={false}
        onAddHours={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    const createAction = screen.getByRole("button", {
      name: "Create recurring schedule",
    });
    const content = screen.getByRole("heading", {
      name: "Recurring schedule",
    }).parentElement;

    expect(createAction).toHaveClass("w-full", "sm:w-auto");
    expect(createAction).not.toHaveClass("lg:w-auto");
    expect(content).toHaveClass("flex-1");
  });
});
