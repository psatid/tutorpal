import { describe, expect, it } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import type { GetV1SchedulesAwaitingConfirmation200DataItem } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200DataItem";
import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import { DateTime } from "@/lib/date-time";
import { Schedule } from "@/models/schedule";

function makeListItem(
	overrides: Partial<GetV1Schedules200Item> = {},
): GetV1Schedules200Item {
	return {
		classId: "class-1",
		className: "Algebra",
		createdAt: "2026-10-01T00:00:00.000Z",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		noShowNote: null,
		notes: "Bring workbook",
		recurringScheduleId: "recurring-1",
		status: "SCHEDULED",
		time: 540,
		type: "ONLINE",
		updatedAt: "2026-10-01T00:00:00.000Z",
		...overrides,
	};
}

function makeDetail(
	overrides: Partial<GetV1SchedulesById200> = {},
): GetV1SchedulesById200 {
	return {
		...makeListItem(),
		...overrides,
	};
}

function makeAwaitingConfirmationItem(
	overrides: Partial<GetV1SchedulesAwaitingConfirmation200DataItem> = {},
): GetV1SchedulesAwaitingConfirmation200DataItem {
	return {
		...makeListItem(),
		...overrides,
	};
}

describe("Schedule", () => {
	it("maps list, detail, awaiting-confirmation, and display inputs into focused fields", () => {
		const list = Schedule.fromListItem(makeListItem({ id: "list-1" }));
		const detail = Schedule.fromGetScheduleByIdResponse(
			makeDetail({ id: "detail-1", noShowNote: "Parent called" }),
		);
		const awaiting = Schedule.fromAwaitingConfirmationListItem(
			makeAwaitingConfirmationItem({ id: "awaiting-1", remainingHours: 4 }),
		);
		const display = Schedule.fromInput({
			className: "Unmapped class",
			date: "2026-10-13",
			durationMinutes: 30,
			id: "display-1",
			time: 600,
		});

		expect(list.getClassId()).toBe("class-1");
		expect(list.getRecurringScheduleId()).toBe("recurring-1");
		expect(list.getNotes()).toBe("Bring workbook");
		expect(detail.getNoShowNote()).toBe("Parent called");
		expect(awaiting.getDurationMinutes()).toBe(60);
		expect(awaiting.getType()).toBe("ONLINE");
		expect(display.getClassId()).toBe("");
		expect(display.getRecurringScheduleId()).toBeNull();
		expect(display.getStatus()).toBe("SCHEDULED");
		expect(display.getType()).toBe("ON_SITE");
		expect(Schedule.fromInput(list)).toBe(list);
	});

	it("owns lifecycle eligibility and upcoming-session decisions", () => {
		const scheduled = Schedule.fromInput(makeListItem({ status: "SCHEDULED" }));
		const completed = Schedule.fromInput(makeListItem({ status: "COMPLETED" }));
		const noShow = Schedule.fromInput(makeListItem({ status: "NO_SHOW" }));
		const cancelled = Schedule.fromInput(makeListItem({ status: "CANCELLED" }));
		const start = DateTime.from("2026-10-12T09:00:00");

		expect(scheduled.canComplete()).toBe(true);
		expect(scheduled.canMarkNoShow()).toBe(true);
		expect(scheduled.canRestore()).toBe(false);
		expect(scheduled.isTimelineEligible()).toBe(true);
		expect(scheduled.isRecurringPatternReplaceable()).toBe(true);
		expect(scheduled.isUpcoming(start)).toBe(true);
		expect(scheduled.isUpcoming(DateTime.from("2026-10-12T09:01:00"))).toBe(
			false,
		);

		expect(completed.canComplete()).toBe(false);
		expect(completed.canMarkNoShow()).toBe(false);
		expect(completed.canRestore()).toBe(true);
		expect(completed.isTimelineEligible()).toBe(true);
		expect(completed.isRecurringPatternReplaceable()).toBe(false);

		expect(noShow.canRestore()).toBe(true);
		expect(noShow.isTimelineEligible()).toBe(false);
		expect(noShow.isRecurringPatternReplaceable()).toBe(false);

		expect(cancelled.canRestore()).toBe(false);
		expect(cancelled.isTimelineEligible()).toBe(false);
		expect(cancelled.isRecurringPatternReplaceable()).toBe(true);
	});

	it("keeps cross-midnight duration facts explicit while preserving the existing end label", () => {
		const schedule = Schedule.fromInput(
			makeListItem({
				date: "2026-10-12",
				durationMinutes: 90,
				time: 23 * 60 + 30,
			}),
		);

		expect(schedule.getDurationHours()).toBe(1.5);
		expect(schedule.getStartTimeLabel()).toBe("23:30");
		expect(schedule.getEndTimeMinutes()).toBe(25 * 60);
		expect(schedule.getEndTimeLabel()).toBe("25:00");
		expect(schedule.getEndClockTimeLabel()).toBe("01:00");
		expect(schedule.getStartDateTime().toDateOnlyString()).toBe("2026-10-12");
		expect(schedule.getEndDateData().endDayOffset).toBe(1);
		expect(schedule.getEndDateData().endDate.toDateOnlyString()).toBe(
			"2026-10-13",
		);
	});

	it("converts forms to commands and compares schedule starts deterministically", () => {
		expect(Schedule.getFormDefaults("2026-10-12", 13 * 60)).toEqual({
			classId: "",
			date: "2026-10-12",
			durationMinutes: undefined,
			notes: "",
			recurring: undefined,
			time: "13:00",
			type: undefined,
		});
		expect(
			Schedule.toCreateCommand({
				classId: "class-1",
				date: "2026-10-12",
				durationMinutes: 60,
				notes: "Bring workbook",
				recurring: undefined,
				time: "13:00",
				type: "ONLINE",
			}),
		).toEqual({
			classId: "class-1",
			date: "2026-10-12",
			durationMinutes: 60,
			notes: "Bring workbook",
			time: 13 * 60,
			type: "ONLINE",
		});
		expect(
			Schedule.toUpdateCommand({
				classId: "class-1",
				date: "2026-10-12",
				durationMinutes: 90,
				notes: "Rescheduled",
				recurring: undefined,
				time: "14:30",
				type: "ON_SITE",
			}),
		).toEqual({
			classId: "class-1",
			date: "2026-10-12",
			durationMinutes: 90,
			notes: "Rescheduled",
			time: 14 * 60 + 30,
			type: "ON_SITE",
		});
		expect(
			Schedule.toCreateCommand({
				classId: "class-1",
				date: "2026-10-12",
				recurring: undefined,
				time: "09:00",
				type: undefined,
			}),
		).toBeUndefined();

		const earlier = Schedule.fromInput(
			makeListItem({ date: "2026-10-11", time: 23 * 60 }),
		);
		const laterOnSameDay = Schedule.fromInput(
			makeListItem({ date: "2026-10-12", time: 10 * 60 }),
		);
		const earlierOnSameDay = Schedule.fromInput(
			makeListItem({ date: "2026-10-12", time: 9 * 60 }),
		);

		expect(earlier.compareStart(earlierOnSameDay)).toBeLessThan(0);
		expect(laterOnSameDay.compareStart(earlierOnSameDay)).toBeGreaterThan(0);
		expect(Schedule.formatTimeLabel(9 * 60 + 5)).toBe("09:05");
	});
});
