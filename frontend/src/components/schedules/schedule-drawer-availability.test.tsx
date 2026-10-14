import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const availability = vi.hoisted(() => ({
	hasNoAvailableHours: false,
	state: "available" as
		| "all-scheduled"
		| "available"
		| "exhausted"
		| "no-hours",
}));

vi.mock("@tanstack/react-router", () => ({
	useNavigate: () => vi.fn(),
}));

vi.mock("@/components/common/responsive-drawer", () => ({
	ResponsiveDrawer: ({
		children,
		footer,
		title,
	}: {
		children: React.ReactNode;
		footer?: React.ReactNode;
		title: string;
	}) => (
		<section aria-label={title}>
			{children}
			<footer>{footer}</footer>
		</section>
	),
}));

vi.mock("@/components/schedules/class-selector-drawer", () => ({
	ClassSelectorDrawer: ({
		isOpen,
		onSelect,
	}: {
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
	NoShowScheduleDialog: () => null,
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useCreateSchedule: () => ({ isPending: false, mutate: vi.fn() }),
	useDeleteSchedule: () => ({ isPending: false, mutate: vi.fn() }),
	useCompleteSchedule: () => ({ isPending: false, mutate: vi.fn() }),
	useRestoreHours: () => ({ isPending: false, mutate: vi.fn() }),
	useUpdateSchedule: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-class-details", () => ({
	useClassDetails: (classId: string | null) => ({
		data: classId
			? {
				getBalanceState: () => availability.state,
				getDisplayName: () => "Class one",
				hasNoAvailableHours: () => availability.hasNoAvailableHours,
			}
			: undefined,
		isError: false,
		isFetching: false,
		isLoading: false,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/queries/use-get-schedule", () => ({
	useGetSchedule: () => ({ data: undefined }),
}));

import { ScheduleDrawer } from "@/components/schedules/schedule-drawer";

async function selectClass(classButtonName: RegExp) {
	const user = userEvent.setup();

	render(
		<ScheduleDrawer
			isOpen
			mode="create"
			onModeChange={vi.fn()}
			onOpenChange={vi.fn()}
			scheduleId={null}
			selectedDate={new Date(2026, 9, 12)}
		/>,
	);

	await user.click(screen.getByRole("button", { name: classButtonName }));
	await user.click(screen.getByRole("button", { name: "Choose class one" }));
}

describe("ScheduleDrawer availability", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		availability.hasNoAvailableHours = false;
		availability.state = "available";
	});

	it.each([
		[
			"no-hours",
			"No hours added yet. Add hours before scheduling a session.",
		],
		[
			"all-scheduled",
			"All hours scheduled. Add hours before scheduling a session.",
		],
		[
			"exhausted",
			"Hours exhausted. Add hours before scheduling a session.",
		],
	] as const)(
		"blocks creation and identifies the selected %s class in English",
		async (state, message) => {
			availability.hasNoAvailableHours = true;
			availability.state = state;

			await selectClass(/^Class/);

			expect(
				screen.getByRole("button", { name: "Add Schedule" }),
			).toBeDisabled();
			expect(screen.getByText(message)).toBeVisible();
		},
	);

	it.each([
		[
			"no-hours",
			"ยังไม่ได้เพิ่มชั่วโมง เพิ่มชั่วโมงก่อนนัดช่วงเรียน",
		],
		[
			"all-scheduled",
			"นัดชั่วโมงครบแล้ว เพิ่มชั่วโมงก่อนนัดช่วงเรียน",
		],
		[
			"exhausted",
			"ใช้ชั่วโมงหมดแล้ว เพิ่มชั่วโมงก่อนนัดช่วงเรียน",
		],
	] as const)(
		"blocks creation and identifies the selected %s class in Thai",
		async (state, message) => {
			await i18n.changeLanguage("th");
			availability.hasNoAvailableHours = true;
			availability.state = state;

			await selectClass(/^ชั้นเรียน/);

			expect(
				screen.getByRole("button", { name: "เพิ่มช่วงเรียน" }),
			).toBeDisabled();
			expect(screen.getByText(message)).toBeVisible();
		},
	);

	it("leaves creation enabled when the selected class still has capacity", async () => {
		await selectClass(/^Class/);

		expect(screen.getByRole("button", { name: "Add Schedule" })).toBeEnabled();
	});
});
