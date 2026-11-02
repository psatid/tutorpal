import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	ClassNextSession,
	ClassSessions,
} from "@/components/classes/schedule-log";
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

type ClassSessionsOverrides = Partial<React.ComponentProps<typeof ClassSessions>>;

function renderClassSessions(overrides: ClassSessionsOverrides = {}) {
	const props = {
		hasData: true,
		isError: false,
		isLoading: false,
		onAddSchedule: vi.fn(),
		onRetry: vi.fn(),
		onViewSchedule: vi.fn(),
		referenceTime,
		schedules: [] as Schedule[],
		studentCount: 4,
		...overrides,
	};

	return { ...render(<ClassSessions {...props} />), props };
}

describe("class session surfaces", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		vi.clearAllMocks();
	});

	it("separates upcoming and recent sessions, shows date rows, and dispatches row actions", async () => {
		const user = userEvent.setup();
		const next = makeSchedule({ id: "next", notes: "First upcoming" });
		const later = makeSchedule({
			id: "later",
			notes: "Later upcoming",
			time: 11 * 60,
		});
		const completed = makeSchedule({
			id: "completed",
			date: "2026-10-11",
			status: "COMPLETED",
			time: 14 * 60,
		});
		const { props } = renderClassSessions({
			onCompleteSchedule: vi.fn(),
			onRestoreSchedule: vi.fn(),
			schedules: [later, completed, next],
		});

		expect(screen.getByRole("heading", { name: "Sessions" })).toHaveAttribute(
			"tabindex",
			"-1",
		);
		expect(screen.getByRole("tab", { name: "Upcoming (2)" })).toHaveAttribute(
			"aria-selected",
			"true",
		);
		expect(screen.getByText("10:00 – 11:00")).toBeVisible();
		expect(screen.getByText("4 students")).toBeVisible();
		expect(screen.getByText("Mon, Oct 12")).toBeVisible();

		await user.click(
			screen.getByRole("button", { name: /11:00 – 12:00.*Online/ }),
		);
		expect(props.onViewSchedule).toHaveBeenCalledWith(later);

		await user.click(screen.getByRole("tab", { name: "Recent (1)" }));
		expect(screen.getByText("Sun, Oct 11")).toBeVisible();
		await user.click(
			screen.getByRole("button", { name: "Actions for 14:00 – 15:00" }),
		);
		expect(await screen.findByRole("menuitem", { name: "Restore" })).toBeVisible();
		expect(screen.queryByRole("menuitem", { name: "Complete" })).not.toBeInTheDocument();
	});

	it("renders the nearest next session with the actual student count and opens it", async () => {
		const user = userEvent.setup();
		const nearer = makeSchedule({ id: "nearer", time: 10 * 60 });
		const later = makeSchedule({ id: "later", time: 12 * 60 });
		const onViewSchedule = vi.fn();

		render(
			<ClassNextSession
				hasData
				isError={false}
				isLoading={false}
				onRetry={vi.fn()}
				onViewSchedule={onViewSchedule}
				referenceTime={referenceTime}
				schedules={[later, nearer]}
				studentCount={3}
			/>,
		);

		expect(screen.getByRole("heading", { name: "Next session" })).toBeVisible();
		expect(screen.getByText("Oct")).toBeVisible();
		expect(screen.getByText("12")).toBeVisible();
		expect(screen.getByText("3 students")).toBeVisible();
		await user.click(screen.getByRole("button", { name: "View" }));
		expect(onViewSchedule).toHaveBeenCalledWith(nearer);
	});

	it("keeps Delete available from the featured session on desktop and mobile", async () => {
		const user = userEvent.setup();
		const schedule = makeSchedule({ id: "only-upcoming" });
		const onDeleteSchedule = vi.fn();
		const desktop = renderClassSessions({
			onDeleteSchedule,
			schedules: [schedule],
		});

		await user.click(
			screen.getByRole("button", { name: "Actions for 10:00 – 11:00" }),
		);
		await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
		expect(onDeleteSchedule).toHaveBeenCalledWith(schedule);
		desktop.unmount();

		render(
			<ClassNextSession
				hasData
				isError={false}
				isLoading={false}
				onDeleteSchedule={onDeleteSchedule}
				onRetry={vi.fn()}
				onViewSchedule={vi.fn()}
				referenceTime={referenceTime}
				schedules={[schedule]}
				studentCount={1}
			/>,
		);

		await user.click(
			screen.getByRole("button", { name: "Actions for 10:00 – 11:00" }),
		);
		await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
		expect(onDeleteSchedule).toHaveBeenCalledTimes(2);
	});

	it("previews three upcoming sessions and expands the remaining loaded sessions on request", async () => {
		const user = userEvent.setup();
		renderClassSessions({
			schedules: [
				makeSchedule({ id: "one", time: 10 * 60 }),
				makeSchedule({ id: "two", time: 11 * 60 }),
				makeSchedule({ id: "three", time: 12 * 60 }),
				makeSchedule({ id: "four", time: 13 * 60 }),
			],
		});

		expect(screen.getByText("10:00 – 11:00")).toBeVisible();
		expect(screen.getByText("11:00 – 12:00")).toBeVisible();
		expect(screen.getByText("12:00 – 13:00")).toBeVisible();
		expect(screen.queryByText("13:00 – 14:00")).not.toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: "Show all upcoming sessions" }),
		);
		expect(screen.getByText("13:00 – 14:00")).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Show fewer upcoming sessions" }),
		).toBeVisible();
	});

	it("keeps loading, empty, and refresh-error states accessible", async () => {
		const user = userEvent.setup();
		const { props, rerender } = renderClassSessions({
			hasData: false,
			isLoading: true,
		});

		expect(screen.getByRole("status")).toHaveTextContent("Loading...");

		rerender(<ClassSessions {...props} hasData isLoading={false} schedules={[]} />);
		await user.click(screen.getByRole("button", { name: "Schedule a session" }));
		expect(props.onAddSchedule).toHaveBeenCalledTimes(1);

		rerender(
			<ClassSessions
				{...props}
				hasData
				isError
				isLoading={false}
				schedules={[makeSchedule()]}
			/>,
		);
		const refreshError = screen.getByRole("alert");
		expect(refreshError).toHaveTextContent("Sessions may be out of date");
		await user.click(within(refreshError).getByRole("button", { name: "Retry" }));
		expect(props.onRetry).toHaveBeenCalledTimes(1);
	});
});
