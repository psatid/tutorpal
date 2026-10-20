import { act, render, screen, within } from "@testing-library/react";
import {
	forwardRef,
	type AnchorHTMLAttributes,
	type ReactNode,
} from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import i18n from "@/lib/i18n/config";
import type { AwaitingConfirmationSchedule } from "@/types/awaiting-confirmation-schedule";

const queryState = vi.hoisted(() => ({
	schedules: [] as GetV1Schedules200Item[],
	todayIsError: false,
	todayIsLoading: false,
	setupSchedules: [] as GetV1Schedules200Item[] | undefined,
	setupSchedulesIsError: false,
	setupSchedulesIsFetching: false,
	setupSchedulesIsLoading: false,
	classes: [] as Array<{ getHoursData: () => { totalHours: number } }>,
	classTotal: 0,
	classesHasData: true,
	classesIsError: false,
	classesIsFetching: false,
	classesIsLoading: false,
	awaitingConfirmation: [] as AwaitingConfirmationSchedule[],
	awaitingConfirmationError: false,
}));

const completeMutation = vi.hoisted(() => ({
	isPending: false,
	mutate: vi.fn(),
}));

const confirmationToast = vi.hoisted(() => vi.fn());

const noShowDialog = vi.hoisted(() => ({
	props: null as unknown,
}));

const classDrawer = vi.hoisted(() => ({
	props: null as unknown,
}));

const scheduleDrawer = vi.hoisted(() => ({
	props: null as unknown,
}));

vi.mock("@tanstack/react-router", () => ({
	Link: forwardRef<
		HTMLAnchorElement,
		{ children: ReactNode; to: string } & AnchorHTMLAttributes<HTMLAnchorElement>
	>(({ children, to, ...props }, ref) => (
		<a {...props} href={to} ref={ref}>
			{children}
		</a>
	)),
	useNavigate: () => vi.fn(),
	useSearch: () => ({}),
}));

vi.mock("@/contexts/auth-context", () => ({
	useAuth: () => ({ user: { id: "tutor-1" } }),
}));

vi.mock("@/hooks/mutations/use-schedules", () => ({
	useCompleteSchedule: () => completeMutation,
}));

vi.mock("sonner", () => ({ toast: confirmationToast }));

vi.mock("@/hooks/queries/use-classes", () => ({
	useClasses: () => ({
		data: queryState.classesHasData
			? {
					classes: queryState.classes,
					pagination: {
						hasNext: false,
						hasPrev: false,
						limit: 100,
						page: 1,
						total: queryState.classTotal,
						totalPages: 1,
					},
				}
			: undefined,
		isError: queryState.classesIsError,
		isFetching: queryState.classesIsFetching,
		isLoading: queryState.classesIsLoading,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/hooks/queries/use-schedules", () => ({
	useSchedules: (params?: { date?: string }) => {
		const isTodayAgenda = params?.date !== undefined;

		return {
			data: isTodayAgenda ? queryState.schedules : queryState.setupSchedules,
			isError: isTodayAgenda
				? queryState.todayIsError
				: queryState.setupSchedulesIsError,
			isFetching: isTodayAgenda
				? false
				: queryState.setupSchedulesIsFetching,
			isLoading: isTodayAgenda
				? queryState.todayIsLoading
				: queryState.setupSchedulesIsLoading,
			refetch: vi.fn(),
		};
	},
}));

vi.mock("@/hooks/queries/use-infinite-awaiting-confirmation-schedules", () => ({
	useInfiniteAwaitingConfirmationSchedules: () => ({
		data: {
			pageParams: [],
			pages: [
				{
					pagination: { hasNext: false, nextCursor: null },
					schedules: queryState.awaitingConfirmation,
				},
			],
		},
		fetchNextPage: vi.fn(),
		hasNextPage: false,
		isError: queryState.awaitingConfirmationError,
		isFetchNextPageError: false,
		isFetchingNextPage: false,
		isLoading: false,
		refetch: vi.fn(),
	}),
}));

vi.mock("@/components/classes/class-drawer", () => ({
	ClassDrawer: (props: { isOpen: boolean }) => {
		classDrawer.props = props;
		return <div data-open={props.isOpen} data-testid="class-drawer" />;
	},
}));

vi.mock("@/components/schedules/no-show-schedule-dialog", () => ({
	NoShowScheduleDialog: (props: { open: boolean }) => {
		noShowDialog.props = props;
		return props.open ? <div role="dialog" /> : null;
	},
}));

vi.mock("@/components/schedules/schedule-drawer", () => ({
	ScheduleDrawer: (props: { isOpen: boolean }) => {
		scheduleDrawer.props = props;
		return <div data-open={props.isOpen} data-testid="schedule-drawer" />;
	},
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

function makeAwaitingConfirmationSchedule(
	overrides: Partial<AwaitingConfirmationSchedule> = {},
): AwaitingConfirmationSchedule {
	return {
		className: "Biology refresher",
		date: "2026-10-11",
		durationMinutes: 60,
		id: "awaiting-schedule-1",
		time: 540,
		...overrides,
	};
}

function makeSetupClass(totalHours = 2) {
	return {
		getHoursData: () => ({ totalHours }),
	};
}

type MockNoShowDialogProps = {
	finalFocus: () => HTMLElement | null;
	onOpenChange: (open: boolean) => void;
	onSuccess: (schedule: AwaitingConfirmationSchedule) => void;
	open: boolean;
	schedule: AwaitingConfirmationSchedule | null;
};

type CompleteMutationOptions = {
	onSettled: () => void;
	onSuccess: () => void;
};

type MockScheduleDrawerProps = {
	isOpen: boolean;
	onCreateSuccess: () => void;
	onOpenChange: (open: boolean) => void;
};

function stubSynchronousAnimationFrame() {
	vi.stubGlobal(
		"requestAnimationFrame",
		(callback: FrameRequestCallback) => {
			callback(0);
			return 1;
		},
	);
}

function expectConfirmationHeadingFocus() {
	const heading = screen.getByRole("heading", {
		name: "Sessions to confirm",
	});

	expect(heading).toHaveFocus();
	expect(heading).toHaveClass(
		"focus:ring-[3px]",
		"focus:ring-primary/35",
		"focus:ring-offset-2",
	);
}

function expectSingleAgendaScheduleLink() {
	const agenda = screen.getByRole("region", { name: "Today's agenda" });
	const link = within(agenda).getByRole("link", { name: "Open schedule" });

	expect(screen.getAllByRole("link", { name: "Open schedule" })).toHaveLength(1);
	expect(agenda.querySelector("header")).toContainElement(link);
	expect(link).toHaveClass("p-0!", "h-8", "gap-1");

	return link;
}

describe("DashboardScreen", () => {
	beforeEach(async () => {
		window.localStorage.clear();
		await i18n.changeLanguage("en");
		queryState.schedules = [makeSchedule()];
		queryState.todayIsError = false;
		queryState.todayIsLoading = false;
		queryState.setupSchedules = [];
		queryState.setupSchedulesIsError = false;
		queryState.setupSchedulesIsFetching = false;
		queryState.setupSchedulesIsLoading = false;
		queryState.classes = [];
		queryState.classTotal = 0;
		queryState.classesHasData = true;
		queryState.classesIsError = false;
		queryState.classesIsFetching = false;
		queryState.classesIsLoading = false;
		queryState.awaitingConfirmation = [];
		queryState.awaitingConfirmationError = false;
		completeMutation.isPending = false;
		completeMutation.mutate.mockReset();
		confirmationToast.mockReset();
		noShowDialog.props = null;
		classDrawer.props = null;
		scheduleDrawer.props = null;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
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

	it.each([
		[
			"populated",
			() => {
				queryState.schedules = [makeSchedule()];
			},
			"Today's agenda",
		],
		[
			"loading",
			() => {
				queryState.todayIsLoading = true;
			},
			"Loading today's sessions…",
		],
		[
			"error",
			() => {
				queryState.todayIsError = true;
			},
			"We couldn't load today's sessions.",
		],
		[
			"empty",
			() => {
				queryState.schedules = [];
			},
			"No sessions scheduled",
		],
	])(
		"keeps one agenda-header schedule link without a hero duplicate when Today is %s",
		(_state, configure, expectedContent) => {
			configure();
			render(<DashboardScreen />);

			expectSingleAgendaScheduleLink();
			expect(screen.getByText(expectedContent)).toBeVisible();
		},
	);

	it("unmounts a fully complete getting-started checklist while keeping its drawers mounted", () => {
		queryState.classes = [makeSetupClass()];
		queryState.classTotal = 1;
		queryState.setupSchedules = [makeSchedule()];

		render(<DashboardScreen />);

		expect(
			screen.queryByRole("heading", { name: "Getting started" }),
		).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: "Show getting started" })).not.toBeInTheDocument();
		expect(screen.getByTestId("class-drawer")).toBeInTheDocument();
		expect(screen.getByTestId("schedule-drawer")).toBeInTheDocument();
	});

	it("keeps the getting-started checklist for unresolved setup", () => {
		render(<DashboardScreen />);

		expect(
			screen.getByRole("heading", { name: "Getting started" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Create class" }),
		).toBeEnabled();
	});

	it("keeps the getting-started checklist for a partially completed setup", () => {
		queryState.classes = [makeSetupClass()];
		queryState.classTotal = 1;

		render(<DashboardScreen />);

		expect(
			screen.getByRole("heading", { name: "Getting started" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Create schedule" }),
		).toBeEnabled();
	});

	it("keeps the getting-started checklist when setup progress fails to load", () => {
		queryState.classesHasData = false;
		queryState.classesIsError = true;

		render(<DashboardScreen />);

		expect(
			screen.getByRole("heading", { name: "Getting started" }),
		).toBeVisible();
		expect(
			screen.getByText(/Classes couldn.?t refresh/),
		).toBeVisible();
	});

	it("announces final setup success and focuses the persistent schedule link", () => {
		queryState.classes = [makeSetupClass()];
		queryState.classTotal = 1;
		stubSynchronousAnimationFrame();
		const { rerender } = render(<DashboardScreen />);

		act(() => {
			screen.getByRole("button", { name: "Create schedule" }).click();
		});

		const drawer = scheduleDrawer.props as MockScheduleDrawerProps;
		expect(drawer.isOpen).toBe(true);
		act(() => {
			drawer.onCreateSuccess();
			drawer.onOpenChange(false);
		});

		queryState.setupSchedules = [makeSchedule()];
		act(() => rerender(<DashboardScreen />));

		const announcement = screen.getByText(
			"Schedule created. Your setup is complete.",
		);
		expect(announcement).toHaveAttribute("aria-live", "polite");
		expect(
			screen.queryByRole("heading", { name: "Getting started" }),
		).not.toBeInTheDocument();
		expect(expectSingleAgendaScheduleLink()).toHaveFocus();
	});

	it("does not move passive checklist completion focus when the checklist did not have focus", () => {
		queryState.classes = [makeSetupClass()];
		queryState.classTotal = 1;
		stubSynchronousAnimationFrame();
		const { rerender } = render(<DashboardScreen />);
		const scheduleLink = expectSingleAgendaScheduleLink();

		queryState.setupSchedules = [makeSchedule()];
		act(() => rerender(<DashboardScreen />));

		expect(scheduleLink).not.toHaveFocus();
	});

	it("moves passive checklist completion focus when the checklist had focus", () => {
		queryState.classes = [makeSetupClass()];
		queryState.classTotal = 1;
		stubSynchronousAnimationFrame();
		const { rerender } = render(<DashboardScreen />);

		const createSchedule = screen.getByRole("button", {
			name: "Create schedule",
		});
		act(() => createSchedule.focus());
		expect(createSchedule).toHaveFocus();

		queryState.setupSchedules = [makeSchedule()];
		act(() => rerender(<DashboardScreen />));

		expect(expectSingleAgendaScheduleLink()).toHaveFocus();
	});

	it("keeps the Today agenda available when the confirmation rail cannot load", () => {
		queryState.awaitingConfirmationError = true;
		render(<DashboardScreen />);

		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn't load sessions to confirm.",
		);
		expect(
			screen.getByRole("list", { name: "Today's agenda" }),
		).toBeVisible();
	});

	it("keeps the Today agenda available when there are no sessions to confirm", () => {
		render(<DashboardScreen />);

		expect(screen.getByText("Nothing to confirm")).toBeVisible();
		expect(
			screen.getByRole("list", { name: "Today's agenda" }),
		).toBeVisible();
	});

	it("returns completed last-card success focus to the visibly focusable confirmation heading", () => {
		const schedule = makeAwaitingConfirmationSchedule();
		queryState.awaitingConfirmation = [schedule];
		stubSynchronousAnimationFrame();
		render(<DashboardScreen />);

		const complete = screen.getByRole("button", {
			name: /Complete Biology refresher/i,
		});
		act(() => complete.click());

		expect(confirmationToast).toHaveBeenCalledTimes(1);
		expect(complete).toBeDisabled();
		expect(
			screen.getByRole("region", { name: "Sessions to confirm" }),
		).toHaveAttribute("aria-busy", "true");

		const [, toastOptions] = confirmationToast.mock.calls[0] ?? [];
		act(() => {
			(toastOptions as { action: { onClick: () => void } }).action.onClick();
		});

		expect(completeMutation.mutate).toHaveBeenCalledWith(
			schedule.id,
			expect.any(Object),
		);
		const [, mutationOptions] = completeMutation.mutate.mock.calls[0] ?? [];
		act(() => {
			(mutationOptions as CompleteMutationOptions).onSuccess();
			(mutationOptions as CompleteMutationOptions).onSettled();
		});

		expect(screen.queryByText(schedule.className)).not.toBeInTheDocument();
		expectConfirmationHeadingFocus();
	});

	it("moves completed-session success focus to the next remaining Complete action", () => {
		const completedSchedule = makeAwaitingConfirmationSchedule();
		const nextSchedule = makeAwaitingConfirmationSchedule({
			className: "Chemistry practice",
			id: "awaiting-schedule-2",
		});
		queryState.awaitingConfirmation = [completedSchedule, nextSchedule];
		stubSynchronousAnimationFrame();
		render(<DashboardScreen />);

		const complete = screen.getByRole("button", {
			name: /Complete Biology refresher/i,
		});
		act(() => complete.click());
		const [, toastOptions] = confirmationToast.mock.calls[0] ?? [];
		act(() => {
			(toastOptions as { action: { onClick: () => void } }).action.onClick();
		});
		const [, mutationOptions] = completeMutation.mutate.mock.calls[0] ?? [];
		act(() => {
			(mutationOptions as CompleteMutationOptions).onSuccess();
			(mutationOptions as CompleteMutationOptions).onSettled();
		});

		expect(screen.queryByText(completedSchedule.className)).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Complete Chemistry practice/i }),
		).toHaveFocus();
	});

	it("keeps a failed completion actionable after its mutation settles", () => {
		const schedule = makeAwaitingConfirmationSchedule();
		queryState.awaitingConfirmation = [schedule];
		render(<DashboardScreen />);

		const complete = screen.getByRole("button", {
			name: /Complete Biology refresher/i,
		});
		act(() => complete.click());
		const [, toastOptions] = confirmationToast.mock.calls[0] ?? [];
		act(() => {
			(toastOptions as { action: { onClick: () => void } }).action.onClick();
		});
		const [, mutationOptions] = completeMutation.mutate.mock.calls[0] ?? [];
		act(() => {
			(mutationOptions as CompleteMutationOptions).onSettled();
		});

		expect(screen.getByText(schedule.className)).toBeVisible();
		expect(complete).toBeEnabled();
	});

	it("moves no-show success focus to the next remaining Complete action", () => {
		const noShowSchedule = makeAwaitingConfirmationSchedule();
		const nextSchedule = makeAwaitingConfirmationSchedule({
			className: "Chemistry practice",
			id: "awaiting-schedule-2",
		});
		queryState.awaitingConfirmation = [noShowSchedule, nextSchedule];
		stubSynchronousAnimationFrame();
		render(<DashboardScreen />);

		const noShow = screen.getByRole("button", {
			name: /Mark Biology refresher as no-show/i,
		});
		act(() => noShow.click());
		const dialog = noShowDialog.props as MockNoShowDialogProps;
		act(() => {
			dialog.onSuccess(noShowSchedule);
			dialog.onOpenChange(false);
		});

		expect(screen.queryByText(noShowSchedule.className)).not.toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Complete Chemistry practice/i }),
		).toHaveFocus();
	});

	it("releases a dismissed no-show lock and returns last-card success focus to the heading", () => {
		const schedule = makeAwaitingConfirmationSchedule();
		queryState.awaitingConfirmation = [schedule];
		stubSynchronousAnimationFrame();
		render(<DashboardScreen />);

		const noShow = screen.getByRole("button", {
			name: /Mark Biology refresher as no-show/i,
		});
		act(() => noShow.click());
		expect(screen.getByRole("dialog")).toBeVisible();
		expect(noShow).toBeDisabled();

		const dismissedDialog = noShowDialog.props as MockNoShowDialogProps;
		act(() => dismissedDialog.onOpenChange(false));
		expect(noShow).toBeEnabled();
		expect(screen.getByText(schedule.className)).toBeVisible();

		act(() => noShow.click());
		const successfulDialog = noShowDialog.props as MockNoShowDialogProps;
		act(() => {
			successfulDialog.onSuccess(schedule);
			successfulDialog.onOpenChange(false);
		});

		expect(screen.queryByText(schedule.className)).not.toBeInTheDocument();
		expectConfirmationHeadingFocus();
	});
});
