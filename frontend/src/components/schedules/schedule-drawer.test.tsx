import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import i18n from "@/lib/i18n/config";

const mutations = vi.hoisted(() => ({
	create: vi.fn(),
	delete: vi.fn(),
	complete: vi.fn(),
	restore: vi.fn(),
	update: vi.fn(),
}));

const drawerState = vi.hoisted(() => ({
	completePending: false,
	deletePending: false,
	restorePending: false,
	schedule: null as GetV1SchedulesById200 | null,
}));

const noShowDialogState = vi.hoisted(() => ({
	finalFocus: undefined as { current: HTMLElement | null } | undefined,
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("@/components/ui/responsive-drawer", () => ({
	ResponsiveDrawer: ({ children, footer, title }: {
		children: React.ReactNode;
		footer?: React.ReactNode;
		title: string;
	}) => (
		<section aria-label={title} data-testid={`responsive-drawer-${title}`}>
			{children}
			<footer data-testid="schedule-drawer-footer">{footer}</footer>
		</section>
	),
}));

vi.mock("@/components/schedules/class-selector-drawer", () => ({
	ClassSelectorDrawer: ({ isOpen, onSelect }: {
		isOpen: boolean;
		onSelect: (classId: string) => void;
	}) =>
		isOpen ? (
			<button onClick={() => onSelect("class-1")} type="button">
				Choose class one
			</button>
		) : null,
	}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
	NoShowScheduleDialog: ({
		finalFocus,
		open,
		schedule,
	}: {
		finalFocus?: { current: HTMLElement | null };
		open: boolean;
		schedule: { id: string } | null;
	}) => {
		noShowDialogState.finalFocus = finalFocus;
		return (
			<div data-open={open ? "true" : "false"} data-testid="no-show-schedule-dialog">
				{schedule?.id}
			</div>
		);
	},
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useCreateSchedule: () => ({ isPending: false, mutate: mutations.create }),
	useDeleteSchedule: () => ({
		isPending: drawerState.deletePending,
		mutate: mutations.delete,
	}),
	useCompleteSchedule: () => ({
		isPending: drawerState.completePending,
		mutate: mutations.complete,
	}),
	useRestoreHours: () => ({
		isPending: drawerState.restorePending,
		mutate: mutations.restore,
	}),
	useUpdateSchedule: () => ({ isPending: false, mutate: mutations.update }),
}));

vi.mock("@/hooks/queries/use-class-details", () => ({
	useClassDetails: (classId: string | null) => ({
		data: classId
			? {
					getBalanceState: () => "available",
					getDisplayName: () => "Class one",
					hasNoAvailableHours: () => false,
				}
			: undefined,
		isError: false,
		isFetching: false,
		isLoading: false,
	}),
}));

vi.mock("@/hooks/queries/use-get-schedule", () => ({
	useGetSchedule: () => ({ data: drawerState.schedule }),
}));

import { ScheduleDrawer } from "@/components/schedules/schedule-drawer";

function makeSchedule(
	status: GetV1SchedulesById200["status"],
): GetV1SchedulesById200 {
	return {
		classId: "class-1",
		className: "Class one",
		createdAt: "2026-10-08T00:00:00.000Z",
		date: "2026-10-08",
		durationMinutes: 60,
		id: "schedule-1",
		noShowNote: null,
		notes: null,
		status,
		time: 540,
		type: "ONLINE",
		updatedAt: "2026-10-08T00:00:00.000Z",
	};
}

function renderScheduleDrawer(
	status: GetV1SchedulesById200["status"],
	mode: "view" | "edit" = "view",
) {
	drawerState.schedule = makeSchedule(status);

	return render(
		<ScheduleDrawer
			isOpen
			mode={mode}
			onModeChange={vi.fn()}
			onOpenChange={vi.fn()}
			scheduleId="schedule-1"
		/>,
	);
}

const scheduleStatusLabels: Record<GetV1SchedulesById200["status"], string> = {
	SCHEDULED: "Scheduled",
	COMPLETED: "Completed",
	NO_SHOW: "No Show",
	CANCELLED: "Cancelled",
};

describe("ScheduleDrawer", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		mutations.create.mockReset();
		mutations.delete.mockReset();
		mutations.complete.mockReset();
		mutations.restore.mockReset();
		mutations.update.mockReset();
		drawerState.completePending = false;
		drawerState.deletePending = false;
		drawerState.restorePending = false;
		drawerState.schedule = null;
		noShowDialogState.finalFocus = undefined;
	});

	it("allows recurring schedules by default and keeps the selected date", async () => {
		const user = userEvent.setup();
		render(
			<ScheduleDrawer
				isOpen
				mode="create"
				onModeChange={vi.fn()}
				onOpenChange={vi.fn()}
				scheduleId={null}
				selectedDate={new Date(2026, 9, 8)}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Class" }));
		await user.click(screen.getByRole("button", { name: "Choose class one" }));
		await user.click(screen.getByRole("radio", { name: "Online" }));
		await user.click(screen.getByRole("checkbox", { name: "Make this recurring" }));
		await user.click(screen.getByRole("checkbox", { name: "Monday" }));
		await user.click(screen.getByRole("button", { name: "Add Schedule" }));

		expect(mutations.create).toHaveBeenCalledWith(
			expect.objectContaining({
				date: "2026-10-08",
				recurring: {
					startDate: "2026-10-08",
					scheduleItems: [
						{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
					],
				},
			}),
		);
	});

	it("uses a timeline cell's date and hour after selecting a one-time duration", async () => {
		const user = userEvent.setup();
		render(
			<ScheduleDrawer
				initialTime={13 * 60}
				isOpen
				mode="create"
				onModeChange={vi.fn()}
				onOpenChange={vi.fn()}
				scheduleId={null}
				selectedDate={new Date(2026, 9, 8)}
			/>,
		);

		const duration = screen.getByRole("combobox", { name: "Duration" });
		expect(duration).toHaveTextContent("Select duration");

		await user.click(screen.getByRole("button", { name: "Class" }));
		await user.click(screen.getByRole("button", { name: "Choose class one" }));
		await user.click(screen.getByRole("radio", { name: "Online" }));
		await user.click(duration);
		await user.click(await screen.findByRole("option", { name: "1 h" }));
		await user.click(screen.getByRole("button", { name: "Add Schedule" }));

		expect(mutations.create).toHaveBeenCalledWith(
			expect.objectContaining({
				date: "2026-10-08",
				durationMinutes: 60,
				time: 13 * 60,
			}),
		);
	});

	it("uses 09:00 when create opens without a timeline cell time", () => {
		render(
			<ScheduleDrawer
				isOpen
				mode="create"
				onModeChange={vi.fn()}
				onOpenChange={vi.fn()}
				scheduleId={null}
				selectedDate={new Date(2026, 9, 8)}
			/>,
		);

		expect(screen.getByDisplayValue("09:00")).toHaveAttribute(
			"type",
			"time",
		);
	});

	it("prefills duration when schedule details arrive after the drawer opens", async () => {
		drawerState.schedule = null;
		const props = {
			isOpen: true,
			mode: "view" as const,
			onModeChange: vi.fn(),
			onOpenChange: vi.fn(),
			scheduleId: "schedule-1",
		};
		const { rerender } = render(<ScheduleDrawer {...props} />);

		const duration = screen.getByRole("combobox", { name: "Duration" });
		expect(duration).toHaveTextContent("Select duration");

		drawerState.schedule = { ...makeSchedule("SCHEDULED"), durationMinutes: 90 };
		rerender(<ScheduleDrawer {...props} />);

		await waitFor(() => {
			expect(
				screen.getByRole("combobox", { name: "Duration" }),
			).toHaveTextContent("1 h 30 min");
		});
	});

	it("focuses the first conflicting recurring time when overlap validation fails", async () => {
		const user = userEvent.setup();
		render(
			<ScheduleDrawer
				isOpen
				mode="create"
				onModeChange={vi.fn()}
				onOpenChange={vi.fn()}
				scheduleId={null}
				selectedDate={new Date(2026, 9, 8)}
			/>,
		);

		await user.click(screen.getByRole("button", { name: "Class" }));
		await user.click(screen.getByRole("button", { name: "Choose class one" }));
		await user.click(screen.getByRole("radio", { name: "Online" }));
		await user.click(screen.getByRole("checkbox", { name: "Make this recurring" }));
		await user.click(screen.getByRole("checkbox", { name: "Monday" }));
		await user.click(screen.getByRole("button", { name: "Add a session on Monday" }));

		const firstTime = screen.getByLabelText("Time — Monday, session 1");
		const secondTime = screen.getByLabelText("Time — Monday, session 2");
		await user.clear(secondTime);
		await user.type(secondTime, "09:30");
		await user.click(screen.getByRole("button", { name: "Add Schedule" }));

		expect(screen.getByRole("alert")).toHaveTextContent("Recurring sessions cannot overlap");
		expect(firstTime).toBe(document.activeElement);
		expect(mutations.create).not.toHaveBeenCalled();
	});

	it.each([
		["SCHEDULED", ["Complete", "No Show", "Delete"], ["Restore"]],
		["COMPLETED", ["Restore", "Delete"], ["Complete", "No Show"]],
		["NO_SHOW", ["Restore", "Delete"], ["Complete", "No Show"]],
		["CANCELLED", ["Delete"], ["Complete", "No Show", "Restore"]],
	] as const)(
		"renders the %s view-mode action matrix and status badge",
		(status, visibleActions, hiddenActions) => {
			renderScheduleDrawer(status);

			const actions = screen.getByRole("group", {
				name: "Schedule actions",
			});
			expect(actions).toHaveAttribute("role", "group");
			for (const action of visibleActions) {
				expect(within(actions).getByRole("button", { name: action })).toBeEnabled();
			}
			for (const action of hiddenActions) {
				expect(
					within(actions).queryByRole("button", { name: action }),
				).not.toBeInTheDocument();
			}

			expect(actions).toHaveClass("grid-cols-1", "sm:grid-cols-2");
			expect(
				within(actions).getByRole("button", { name: "Delete" }),
			).toHaveClass("sm:col-span-2");
			expect(screen.getByText("Status").parentElement).toHaveTextContent(
				scheduleStatusLabels[status],
			);

			const footer = within(
				screen.getByTestId("responsive-drawer-Schedule Details"),
			)
				.getAllByTestId("schedule-drawer-footer")
				.find((candidate) =>
					within(candidate).queryByRole("button", { name: "Edit" }),
				);
			expect(footer).toBeDefined();
			const footerActions = Array.from(
				footer?.querySelectorAll("button") ?? [],
			).map((button) => button.textContent?.trim());
			expect(footerActions).toEqual(["Edit", ...visibleActions]);
		},
	);

	it("updates the view-mode status badge and actions after a no-show succeeds", () => {
		drawerState.schedule = makeSchedule("SCHEDULED");
		const props = {
			isOpen: true,
			mode: "view" as const,
			onModeChange: vi.fn(),
			onOpenChange: vi.fn(),
			scheduleId: "schedule-1",
		};
		const { rerender } = render(<ScheduleDrawer {...props} />);

		expect(
			within(screen.getByLabelText("Schedule actions")).getByRole("button", {
				name: "No Show",
			}),
		).toBeInTheDocument();

		drawerState.schedule = makeSchedule("NO_SHOW");
		rerender(<ScheduleDrawer {...props} />);

		const actions = screen.getByLabelText("Schedule actions");
		expect(within(actions).getByRole("button", { name: "Restore" })).toBeEnabled();
		expect(
			within(actions).queryByRole("button", { name: "No Show" }),
		).not.toBeInTheDocument();
		expect(screen.getByText("Status").parentElement).toHaveTextContent(
			"No Show",
		);
	});

	it("opens the shared no-show dialog from a scheduled drawer", async () => {
		const user = userEvent.setup();
		renderScheduleDrawer("SCHEDULED");

		const dialog = screen.getByTestId("no-show-schedule-dialog");
		expect(dialog).toHaveAttribute("data-open", "false");
		expect(dialog).toHaveTextContent("schedule-1");

		await user.click(
			within(screen.getByLabelText("Schedule actions")).getByRole("button", {
				name: "No Show",
			}),
		);

		expect(dialog).toHaveAttribute("data-open", "true");
	});

	it("provides the Edit button as the dialog's focus-return target", () => {
		renderScheduleDrawer("SCHEDULED");

		expect(noShowDialogState.finalFocus?.current).toBe(
			screen.getByRole("button", { name: "Edit" }),
		);
	});

	it("hides the status display and action group in edit mode", () => {
		renderScheduleDrawer("NO_SHOW", "edit");

		expect(screen.queryByText("Status")).not.toBeInTheDocument();
		expect(screen.queryByLabelText("Schedule actions")).not.toBeInTheDocument();
		expect(
			screen.queryByRole("combobox", { name: "Status" }),
		).not.toBeInTheDocument();
	});

	it("locks drawer actions while a schedule action is pending", () => {
		drawerState.completePending = true;
		renderScheduleDrawer("SCHEDULED");

		const actions = screen.getByLabelText("Schedule actions");
		expect(screen.getByRole("button", { name: "Edit" })).toBeDisabled();
		expect(
			within(actions).getByRole("button", { name: "Complete" }),
		).toBeDisabled();
		expect(
			within(actions).getByRole("button", { name: "No Show" }),
		).toBeDisabled();
		expect(
			within(actions).getByRole("button", { name: "Delete" }),
		).toBeDisabled();
	});
});
