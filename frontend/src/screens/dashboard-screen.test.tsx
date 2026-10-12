import { render, screen, within } from "@testing-library/react";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import i18n from "@/lib/i18n/config";

const queryState = vi.hoisted(() => ({
	schedules: [] as GetV1Schedules200Item[],
}));

vi.mock("@tanstack/react-router", () => ({
	Link: ({
		children,
		to: _to,
		...props
	}: {
		children: ReactNode;
		to: string;
	} & AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
}));

vi.mock("@/contexts/auth-context", () => ({
	useAuth: () => ({ user: { id: "tutor-1" } }),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useCompleteSchedule: () => ({ isPending: false, mutate: vi.fn() }),
}));

vi.mock("@/hooks/queries/use-classes", () => ({
	useClasses: () => ({
		data: {
			classes: [],
			pagination: {
				hasNext: false,
				hasPrev: false,
				limit: 100,
				page: 1,
				total: 0,
				totalPages: 0,
			},
		},
		isError: false,
		isFetching: false,
		isLoading: false,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/queries/use-schedules", () => ({
	useSchedules: () => ({
		data: queryState.schedules,
		isError: false,
		isFetching: false,
		isLoading: false,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/components/classes/class-drawer", () => ({
	ClassDrawer: () => null,
}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
	NoShowScheduleDialog: () => null,
}));

vi.mock("@/components/schedules/schedule-drawer", () => ({
	ScheduleDrawer: () => null,
}));

import { DashboardScreen } from "@/screens/dashboard-screen";

const longClassName =
	"Advanced Algebra preparation with an intentionally long class name";

function makeSchedule(): GetV1Schedules200Item {
	return {
		classId: "class-1",
		className: longClassName,
		createdAt: "2026-10-12T00:00:00.000Z",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		noShowNote: null,
		notes: null,
		status: "SCHEDULED",
		time: 540,
		type: "ONLINE",
		updatedAt: "2026-10-12T00:00:00.000Z",
	};
}

describe("DashboardScreen", () => {
	beforeEach(async () => {
		window.localStorage.clear();
		await i18n.changeLanguage("en");
		queryState.schedules = [makeSchedule()];
	});

	it("keeps a long agenda class name truncated beside its visible status badge", () => {
		render(<DashboardScreen />);

		const agenda = screen.getByRole("list", { name: "Today's agenda" });
		const className = within(agenda).getByText(longClassName);
		const status = within(agenda).getByText("Scheduled");

		expect(className).toHaveClass("min-w-0", "flex-1", "truncate");
		expect(status).toHaveAttribute("data-slot", "badge");
		expect(status).toHaveClass("shrink-0", "border-info/25");
		expect(className.parentElement).toHaveClass("flex", "min-w-0", "items-center");
		expect(className.parentElement).toContainElement(status);
	});
});
