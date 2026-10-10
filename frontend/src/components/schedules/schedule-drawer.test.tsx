import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";

const mutations = vi.hoisted(() => ({
	create: vi.fn(),
	update: vi.fn(),
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
		<section aria-label={title}>
			{children}
			{footer}
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

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useCreateSchedule: () => ({ isPending: false, mutate: mutations.create }),
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
	useGetSchedule: () => ({ data: undefined }),
}));

import { ScheduleDrawer } from "@/components/schedules/schedule-drawer";

describe("ScheduleDrawer", () => {
	beforeEach(async () => {
		await i18n.changeLanguage("en");
		mutations.create.mockReset();
		mutations.update.mockReset();
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
});
