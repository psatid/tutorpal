import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { WeeklyScheduleTimeline } from "@/components/schedules/weekly-schedule-timeline";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";

const selectedDate = new Date(2026, 9, 7);

function formatCellName(date: Date, time: string) {
  return `Create schedule on ${DateTime.formatDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} at ${time}.`;
}

function getCell(date: Date, time: string) {
  return screen.getByRole("button", { name: formatCellName(date, time) });
}

function makeSchedule(
  overrides: Partial<GetV1Schedules200Item> = {},
): GetV1Schedules200Item {
  return {
    classId: "class-1",
    className: "Mathematics",
    createdAt: "2026-10-01T00:00:00.000Z",
    date: "2026-10-07",
    durationMinutes: 60,
    id: "schedule-1",
    noShowNote: null,
    notes: null,
    status: "SCHEDULED",
    time: 9 * 60,
    type: "ONLINE",
    updatedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

function renderTimeline(schedules: GetV1Schedules200Item[] = []) {
  const onCreateSchedule = vi.fn();
  const onViewSchedule = vi.fn();

  render(
    <WeeklyScheduleTimeline
      onCreateSchedule={onCreateSchedule}
      onViewSchedule={onViewSchedule}
      schedules={schedules}
      selectedDate={selectedDate}
    />,
  );

  return { onCreateSchedule, onViewSchedule };
}

describe("WeeklyScheduleTimeline", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.clearAllMocks();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

	it("renders the default empty-week grid with a half-hour target for every day", () => {
    renderTimeline();

    const cells = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-label")?.startsWith("Create schedule on"));

		expect(cells).toHaveLength(7 * 48);
    expect(screen.queryByText("No schedules this week")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Schedule" })).not.toBeInTheDocument();
  });

  it("keeps a non-Today selected header current but visually neutral while highlighting only Today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 12));
    renderTimeline();

    const selectedHeader = document.querySelector<HTMLElement>(
      '[aria-current="date"]',
    );

    if (!selectedHeader?.parentElement) {
      throw new Error("Expected the selected timeline header.");
    }

    const todayHeader = Array.from(selectedHeader.parentElement.children).find(
      (header) => header.textContent?.toUpperCase() === "SUN11",
    ) as HTMLElement | undefined;

    if (!todayHeader) {
      throw new Error("Expected the unselected Today timeline header.");
    }

    const [selectedWeekday, selectedDay] = Array.from(selectedHeader.children);
    const [todayWeekday, todayDay] = Array.from(todayHeader.children);
    const selectedColumn = getCell(selectedDate, "09:00").parentElement
      ?.parentElement;
    const todayColumn = getCell(new Date(2026, 9, 11), "09:00").parentElement
      ?.parentElement;

    if (!selectedColumn || !todayColumn) {
      throw new Error("Expected selected and Today timeline columns.");
    }

    expect(selectedHeader).toHaveAttribute("aria-current", "date");
    expect(selectedHeader).not.toHaveClass("bg-primary/5");
    expect(selectedWeekday).not.toHaveClass("text-primary");
    expect(selectedDay).toHaveClass("text-foreground");
    expect(selectedDay).not.toHaveClass("text-primary");
    expect(selectedColumn).not.toHaveClass("bg-primary/2");
    expect(todayHeader).not.toHaveAttribute("aria-current");
    expect(todayHeader).toHaveClass("bg-primary/5");
    expect(todayWeekday).toHaveClass("text-primary");
    expect(todayDay).toHaveClass("text-foreground");
    expect(todayDay).not.toHaveClass("text-primary");
    expect(todayColumn).toHaveClass("bg-primary/2");
  });

  it("creates at the exact day and hour selected from a cell", async () => {
    const user = userEvent.setup();
    const { onCreateSchedule } = renderTimeline();
    const thursday = new Date(2026, 9, 8);
    const cell = getCell(thursday, "13:00");

    await user.click(cell);

    expect(onCreateSchedule).toHaveBeenCalledOnce();
    const [date, time, trigger] = onCreateSchedule.mock.calls[0] ?? [];
    expect(DateTime.from(date as Date).toDateOnlyString()).toBe("2026-10-08");
    expect(time).toBe(13 * 60);
    expect(trigger).toBe(cell);
  });

  it("keeps one roving cell tab stop, moves it with arrow keys, and activates it with Enter and Space", async () => {
    const user = userEvent.setup();
    const { onCreateSchedule } = renderTimeline();
    const wednesdayNine = getCell(selectedDate, "09:00");
    const thursday = new Date(2026, 9, 8);
    const thursdayNine = getCell(thursday, "09:00");
		const thursdayNineThirty = getCell(thursday, "09:30");
    const cells = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("aria-label")?.startsWith("Create schedule on"));

    expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([wednesdayNine]);

    wednesdayNine.focus();
    await user.keyboard("{ArrowRight}");

    expect(document.activeElement).toBe(thursdayNine);
    expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([thursdayNine]);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });

    await user.keyboard("{ArrowDown}");

		expect(document.activeElement).toBe(thursdayNineThirty);
		expect(cells.filter((cell) => cell.tabIndex === 0)).toEqual([
			thursdayNineThirty,
		]);

    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(onCreateSchedule).toHaveBeenCalledTimes(2);
		expect(onCreateSchedule).toHaveBeenNthCalledWith(
			1,
			thursday,
			9 * 60 + 30,
			thursdayNineThirty,
		);
		expect(onCreateSchedule).toHaveBeenNthCalledWith(
			2,
			thursday,
			9 * 60 + 30,
			thursdayNineThirty,
		);
  });

  it("opens a visible event above its keyboard-focused cell while blank hour cells still create schedules", async () => {
    const user = userEvent.setup();
    const schedule = makeSchedule();
    const { onCreateSchedule, onViewSchedule } = renderTimeline([schedule]);
    const event = screen.getByRole("button", {
      name: "Mathematics on Wednesday, October 7, 09:00 to 10:00, Scheduled, Online",
    });
    const coveredCell = getCell(selectedDate, "09:00");
    const blankCell = getCell(selectedDate, "10:00");

    coveredCell.focus();

    expect(document.activeElement).toBe(coveredCell);
    expect(coveredCell).toHaveAttribute("tabindex", "0");

    await user.click(event);

    expect(onViewSchedule).toHaveBeenCalledWith(schedule, event);
    expect(onCreateSchedule).not.toHaveBeenCalled();
    expect(event).toHaveClass("z-10");

    await user.click(blankCell);

    expect(onCreateSchedule).toHaveBeenCalledWith(selectedDate, 10 * 60, blankCell);
  });

  it("creates on a touch tap below the movement threshold and ignores a touch drag", () => {
    const { onCreateSchedule } = renderTimeline();
    const cell = getCell(selectedDate, "11:00");

    fireEvent.pointerDown(cell, {
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerMove(cell, {
      clientX: 10,
      clientY: 19,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.pointerUp(cell, {
      clientX: 10,
      clientY: 19,
      pointerId: 1,
      pointerType: "touch",
    });
    fireEvent.click(cell);

    expect(onCreateSchedule).not.toHaveBeenCalled();

    fireEvent.pointerDown(cell, {
      clientX: 10,
      clientY: 10,
      isPrimary: true,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerMove(cell, {
      clientX: 10,
      clientY: 17,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.pointerUp(cell, {
      clientX: 10,
      clientY: 17,
      pointerId: 2,
      pointerType: "touch",
    });
    fireEvent.click(cell);

    expect(onCreateSchedule).toHaveBeenCalledWith(selectedDate, 11 * 60, cell);
  });
});
