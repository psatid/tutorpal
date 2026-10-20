import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurringScheduleSection } from "@/components/classes/recurring-schedule-section";
import i18n from "@/lib/i18n/config";
import { RecurringSchedule } from "@/models/recurring-schedule";

describe("RecurringScheduleSection", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

	it("renders each weekday once with ordered time and duration entries", () => {
    render(
      <RecurringScheduleSection
        hasNoAvailableHours={false}
        onAddHours={vi.fn()}
        onCreate={vi.fn()}
        onEdit={vi.fn()}
			recurringSchedule={RecurringSchedule.fromInput({
          id: "recurring-1",
          startDate: "2026-10-08",
          type: "ONLINE",
          scheduleItems: [
            { id: "monday-late", weekday: "MONDAY", time: 840, durationMinutes: 30 },
            { id: "tuesday", weekday: "TUESDAY", time: 540, durationMinutes: 60 },
            { id: "monday-early", weekday: "MONDAY", time: 480, durationMinutes: 60 },
          ],
			})}
      />,
    );

		const section = screen.getByRole("region", { name: "Recurring schedule" });
		expect(within(section).getAllByText("Monday")).toHaveLength(1);
		expect(within(section).getAllByText("Tuesday")).toHaveLength(1);
		expect(section.textContent).toMatch(/Monday.*08:00.*14:00.*Tuesday.*09:00/);
		expect(within(section).getByText("08:00 · 1 h")).toBeVisible();
		expect(within(section).getByText("14:00 · 30 min")).toBeVisible();
		expect(
			within(section).getByRole("button", { name: "Edit recurring schedule" }),
		).toBeVisible();
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
