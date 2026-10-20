import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ScheduleLog } from "@/components/classes/schedule-log";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";
import { Schedule, type ScheduleDisplayInput } from "@/models/schedule";

const referenceTime = DateTime.from("2026-10-12T09:00:00");

function makeSchedule(
	overrides: Partial<ScheduleDisplayInput> = {},
): Schedule {
	return Schedule.fromInput({
		className: "Algebra",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		notes: null,
		status: "SCHEDULED",
		time: 10 * 60,
		type: "ONLINE",
		...overrides,
	});
}

type ScheduleLogOverrides = Partial<
	React.ComponentProps<typeof ScheduleLog>
>;

function renderScheduleLog(overrides: ScheduleLogOverrides = {}) {
	const props = {
		errorOwner: true,
		hasData: true,
		isError: false,
		isLoading: false,
		onAddSchedule: vi.fn(),
		onRetry: vi.fn(),
		onViewSchedule: vi.fn(),
		referenceTime,
		schedules: [] as Schedule[],
		section: "upcoming" as const,
		...overrides,
	};

	return {
		...render(<ScheduleLog {...props} />),
		props,
	};
}

describe("ScheduleLog", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		vi.clearAllMocks();
	});

	it("uses Schedule lifecycle and deterministic starts to order upcoming rows and dispatch actions", async () => {
		const user = userEvent.setup();
		const next = makeSchedule({
			id: "next",
			notes: "First upcoming",
			time: 10 * 60,
		});
		const later = makeSchedule({
			id: "later",
			notes: "Later upcoming",
			time: 11 * 60,
		});
		const alreadyStarted = makeSchedule({
			id: "already-started",
			notes: "Already started",
			time: 8 * 60,
		});
		const completed = makeSchedule({
			id: "completed",
			notes: "Completed",
			status: "COMPLETED",
			time: 12 * 60,
		});
		const onCompleteSchedule = vi.fn();
		const { props } = renderScheduleLog({
			onCompleteSchedule,
			schedules: [later, completed, alreadyStarted, next],
		});

		const list = screen.getByRole("list");
		const scheduleRows = within(list)
			.getAllByRole("button")
			.filter((button) => !button.getAttribute("aria-label"));
		expect(scheduleRows).toHaveLength(2);
		expect(scheduleRows[0]).toHaveTextContent("10:00 – 11:00");
		expect(scheduleRows[1]).toHaveTextContent("11:00 – 12:00");
		expect(screen.queryByText("Already started")).not.toBeInTheDocument();
		expect(screen.queryByText("Completed")).not.toBeInTheDocument();

		const nextRow = screen.getByRole("button", {
			name: /10:00 – 11:00.*First upcoming/,
		});
		fireEvent.click(nextRow);
		expect(props.onViewSchedule).toHaveBeenCalledWith(next);

		await user.click(
			screen.getByRole("button", {
				name: "Actions for 10:00 – 11:00",
			}),
		);
		await user.click(await screen.findByRole("menuitem", { name: "Complete" }));
		expect(onCompleteSchedule).toHaveBeenCalledWith(next);
	});

	it("groups recent Schedule models and exposes only their eligible lifecycle actions", async () => {
		const user = userEvent.setup();
		const pastScheduled = makeSchedule({
			id: "past-scheduled",
			date: "2026-10-12",
			time: 8 * 60,
		});
		const completed = makeSchedule({
			id: "completed",
			date: "2026-10-11",
			status: "COMPLETED",
			time: 14 * 60,
		});
		const onRestoreSchedule = vi.fn();
		renderScheduleLog({
			onCompleteSchedule: vi.fn(),
			onNoShowSchedule: vi.fn(),
			onRestoreSchedule,
			section: "recent",
			schedules: [completed, pastScheduled],
		});

		const lists = screen.getAllByRole("list");
		expect(lists).toHaveLength(2);
		expect(lists[0]).toHaveTextContent("08:00 – 09:00");
		expect(lists[1]).toHaveTextContent("14:00 – 15:00");

		await user.click(
			screen.getByRole("button", {
				name: "Actions for 14:00 – 15:00",
			}),
		);
		expect(await screen.findByRole("menuitem", { name: "Restore" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Complete" })).not.toBeInTheDocument();
		expect(screen.queryByRole("menuitem", { name: "No Show" })).not.toBeInTheDocument();
		await user.click(screen.getByRole("menuitem", { name: "Restore" }));
		expect(onRestoreSchedule).toHaveBeenCalledWith(completed);
	});

	it("renders loading, empty, and retryable error states", async () => {
		const user = userEvent.setup();
		const { props, rerender } = renderScheduleLog({
			hasData: false,
			isLoading: true,
		});

		expect(screen.getByRole("status")).toHaveTextContent("Loading...");

		rerender(
			<ScheduleLog
				{...props}
				hasData={false}
				isLoading={false}
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: "Schedule a session" }),
		);
		expect(props.onAddSchedule).toHaveBeenCalledTimes(1);

		rerender(
			<ScheduleLog
				{...props}
				hasData={false}
				isError
				isLoading={false}
			/>,
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Sessions couldn’t load. Try again.",
		);
		await user.click(screen.getByRole("button", { name: "Retry" }));
		expect(props.onRetry).toHaveBeenCalledTimes(1);
	});
});
