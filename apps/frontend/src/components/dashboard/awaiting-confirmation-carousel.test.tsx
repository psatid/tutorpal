import { act, fireEvent, render, screen } from "@testing-library/react";
import { createRef, type ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AwaitingConfirmationCarousel } from "@/components/dashboard/awaiting-confirmation-carousel";
import i18n from "@/lib/i18n/config";
import { Schedule, type ScheduleDisplayInput } from "@/models/schedule";

function makeSchedule(
	overrides: Partial<ScheduleDisplayInput> = {},
): Schedule {
	return Schedule.fromInput({
		className: "Algebra foundations",
		date: "2026-10-12",
		durationMinutes: 60,
		id: "schedule-1",
		time: 540,
		type: "ONLINE",
		...overrides,
	});
}

function renderCarousel(
	overrides: Partial<ComponentProps<typeof AwaitingConfirmationCarousel>> = {},
) {
	const props: ComponentProps<typeof AwaitingConfirmationCarousel> = {
		completingScheduleId: null,
		headingRef: createRef<HTMLHeadingElement>(),
		hasNextPage: false,
		isBusy: false,
		isError: false,
		isFetchNextPageError: false,
		isFetchingNextPage: false,
		isLoading: false,
		onComplete: vi.fn(),
		onLoadMore: async () => undefined,
		onNoShow: vi.fn(),
		onRetry: vi.fn(),
		schedules: [makeSchedule()],
		...overrides,
	};

	return {
		...render(<AwaitingConfirmationCarousel {...props} />),
		props,
	};
}

function setNearEndScrollMetrics(scrollport: HTMLElement) {
	Object.defineProperties(scrollport, {
		clientWidth: { configurable: true, value: 320 },
		scrollLeft: { configurable: true, value: 480 },
		scrollWidth: { configurable: true, value: 800 },
	});
}

function getScrollport() {
	expect(
		screen.getAllByRole("region", { name: "Sessions to confirm" }),
	).toHaveLength(1);

	return screen.getByRole("group", {
		name: "Scrollable sessions awaiting confirmation",
	});
}

describe("AwaitingConfirmationCarousel", () => {
	beforeEach(async () => {
		window.localStorage.clear();
		await i18n.changeLanguage("en");
	});

	it("renders the first page in a keyboard-focusable native horizontal rail without pager controls", () => {
		const schedule = makeSchedule({
			className: "Night algebra",
			durationMinutes: 90,
			time: 23 * 60,
		});
		const { props } = renderCarousel({ schedules: [schedule] });

		const rail = getScrollport();
		const complete = screen.getByRole("button", {
			name:
				"Complete Night algebra on Mon, Oct 12, 2026, 23:00 – Ends Tuesday, October 13, 2026 at 00:30",
		});
		const noShow = screen.getByRole("button", {
			name:
				"Mark Night algebra as no-show on Mon, Oct 12, 2026, 23:00 – Ends Tuesday, October 13, 2026 at 00:30",
		});

		expect(screen.getByText("Mon, Oct 12, 2026")).toBeVisible();
		expect(screen.getByText("23:00")).toHaveAttribute(
			"datetime",
			"2026-10-12T23:00",
		);
		const endTime = screen.getByText("00:30");
		expect(endTime).toHaveAttribute(
			"datetime",
			"2026-10-13T00:30",
		);
		expect(endTime).toHaveAccessibleName(
			"Ends Tuesday, October 13, 2026 at 00:30",
		);
		expect(screen.getByText("(+1 day)")).toBeVisible();
		expect(rail).toHaveAttribute("tabindex", "0");
		expect(rail).toHaveClass("overflow-x-auto", "snap-x", "snap-mandatory");
		expect(rail).toHaveAttribute("aria-describedby");
		expect(complete).toHaveClass("h-11");
		expect(noShow).toHaveClass("h-11");
		expect(screen.getAllByRole("button")).toHaveLength(2);

		fireEvent.click(complete);
		fireEvent.click(noShow);
		expect(props.onComplete).toHaveBeenCalledWith(schedule);
		expect(props.onNoShow).toHaveBeenCalledWith(schedule, noShow);
	});

	it("uses the shared mobile edge rail without trailing track padding", () => {
		renderCarousel();

		const rail = getScrollport();
		const track = rail.querySelector("ol");

		expect(rail).toHaveClass(
			"-mx-3",
			"sm:mx-0",
		);
		expect(rail).not.toHaveClass("w-[calc(100%+1.5rem)]", "max-w-none");
		expect(track).toHaveClass("flex", "min-w-max", "gap-3", "sm:gap-4");
		expect(track?.className).not.toMatch(/(?:^|\s)pr-\S+/);
	});

	it("localizes the full cross-midnight end date in Thai", async () => {
		await i18n.changeLanguage("th");
		const schedule = makeSchedule({
			className: "Night algebra",
			durationMinutes: 90,
			time: 23 * 60,
		});
		renderCarousel({ schedules: [schedule] });

		const endTime = screen.getByText("00:30");
		expect(endTime).toHaveAccessibleName(
			"สิ้นสุดวันที่ วันอังคารที่ 13 ตุลาคม 2026 เวลา 00:30",
		);
		expect(screen.getByText("(+1 วัน)")).toBeVisible();
		expect(
			screen.getByRole("button", {
				name:
					"บันทึก Night algebra ในวันที่ จันทร์ 12 ต.ค. 2026 เวลา 23:00 – สิ้นสุดวันที่ วันอังคารที่ 13 ตุลาคม 2026 เวลา 00:30 ว่าเสร็จสิ้น",
			}),
		).toBeVisible();
	});

	it("clamps a long class name while retaining its full text and title", () => {
		const className =
			"Advanced Algebra preparation with an intentionally long class name";
		renderCarousel({ schedules: [makeSchedule({ className })] });

		const classNameElement = screen.getByText(className);
		expect(classNameElement).toHaveClass("line-clamp-2");
		expect(classNameElement).toHaveAttribute("title", className);
		expect(classNameElement).toHaveTextContent(className);
		expect(
			screen.getByRole("button", { name: new RegExp(`Complete ${className}`) }),
		).toHaveAccessibleName(expect.stringContaining(className));
	});

	it("locks every card action while a confirmation action is open", () => {
		renderCarousel({ isBusy: true });

		const section = screen.getByRole("region", {
			name: "Sessions to confirm",
		});
		expect(section).toHaveAttribute("aria-busy", "true");
		for (const action of screen.getAllByRole("button")) {
			expect(action).toBeDisabled();
		}
	});

	it("uses Left and Right Arrow keys to scroll the focused rail", () => {
		renderCarousel();
		const rail = getScrollport();
		const scrollBy = vi.fn();
		Object.defineProperties(rail, {
			clientWidth: { configurable: true, value: 400 },
			scrollBy: { configurable: true, value: scrollBy },
		});

		rail.focus();
		fireEvent.keyDown(rail, { key: "ArrowRight" });
		fireEvent.keyDown(rail, { key: "ArrowLeft" });

		expect(rail).toHaveFocus();
		expect(scrollBy).toHaveBeenNthCalledWith(1, {
			behavior: "auto",
			left: 320,
		});
		expect(scrollBy).toHaveBeenNthCalledWith(2, {
			behavior: "auto",
			left: -320,
		});
	});

	it("uses Page Up, Page Down, Home, and End to move only the focused rail", () => {
		const { props } = renderCarousel();
		const rail = getScrollport();
		const scrollBy = vi.fn();
		const scrollTo = vi.fn();
		Object.defineProperties(rail, {
			clientWidth: { configurable: true, value: 400 },
			scrollBy: { configurable: true, value: scrollBy },
			scrollTo: { configurable: true, value: scrollTo },
			scrollWidth: { configurable: true, value: 1_280 },
		});

		rail.focus();
		fireEvent.keyDown(rail, { key: "PageDown" });
		fireEvent.keyDown(rail, { key: "PageUp" });
		fireEvent.keyDown(rail, { key: "Home" });
		fireEvent.keyDown(rail, { key: "End" });

		expect(scrollBy).toHaveBeenNthCalledWith(1, {
			behavior: "auto",
			left: 320,
		});
		expect(scrollBy).toHaveBeenNthCalledWith(2, {
			behavior: "auto",
			left: -320,
		});
		expect(scrollTo).toHaveBeenNthCalledWith(1, {
			behavior: "auto",
			left: 0,
		});
		expect(scrollTo).toHaveBeenNthCalledWith(2, {
			behavior: "auto",
			left: 1_280,
		});
		expect(props.onComplete).not.toHaveBeenCalled();
		expect(props.onNoShow).not.toHaveBeenCalled();
	});

	it("requests the next page exactly once while a near-end request is in flight", async () => {
		let resolveLoadMore: (() => void) | undefined;
		const onLoadMore = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveLoadMore = resolve;
				}),
		);
		renderCarousel({ hasNextPage: true, onLoadMore });
		const rail = getScrollport();
		setNearEndScrollMetrics(rail);

		fireEvent.scroll(rail);
		fireEvent.scroll(rail);

		expect(onLoadMore).toHaveBeenCalledTimes(1);

		await act(async () => {
			resolveLoadMore?.();
			await Promise.resolve();
		});
	});

	it("does not request a page at the end of the terminal result set", () => {
		const onLoadMore = vi.fn(async () => undefined);
		renderCarousel({ hasNextPage: false, onLoadMore });
		const rail = getScrollport();
		setNearEndScrollMetrics(rail);

		fireEvent.scroll(rail);

		expect(onLoadMore).not.toHaveBeenCalled();
	});

	it("shows an initial loading state before the first page arrives", () => {
		renderCarousel({ isLoading: true, schedules: [] });

		const skeleton = screen.getByRole("status", {
			name: "Sessions to confirm",
		});
		const track = skeleton.querySelector("div.flex");

		expect(skeleton).toHaveTextContent("Loading sessions to confirm…");
		expect(skeleton).toHaveClass(
			"-mx-3",
			"sm:mx-0",
		);
		expect(skeleton).not.toHaveClass("w-[calc(100%+1.5rem)]", "max-w-none");
		expect(track).toHaveClass("flex", "min-w-max", "gap-3", "sm:gap-4");
		expect(track?.className).not.toMatch(/(?:^|\s)pr-\S+/);
		expect(
			screen.queryByRole("group", {
				name: "Scrollable sessions awaiting confirmation",
			}),
		).not.toBeInTheDocument();
	});

	it("keeps loaded cards visible and retries a later-page failure", () => {
		const onLoadMore = vi.fn(async () => undefined);
		renderCarousel({
			hasNextPage: true,
			isFetchNextPageError: true,
			onLoadMore,
		});

		expect(screen.getByText("Algebra foundations")).toBeVisible();
		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn't load more sessions to confirm.",
		);

		fireEvent.click(screen.getByRole("button", { name: "Try again" }));

		expect(onLoadMore).toHaveBeenCalledTimes(1);
	});

	it("renders distinct empty and first-page error states", () => {
		const onRetry = vi.fn();
		const { rerender } = renderCarousel({ isError: true, onRetry, schedules: [] });

		expect(screen.getByRole("alert")).toHaveTextContent(
			"We couldn't load sessions to confirm.",
		);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(onRetry).toHaveBeenCalledTimes(1);

		rerender(
			<AwaitingConfirmationCarousel
				completingScheduleId={null}
				headingRef={createRef<HTMLHeadingElement>()}
				hasNextPage={false}
				isBusy={false}
				isError={false}
				isFetchNextPageError={false}
				isFetchingNextPage={false}
				isLoading={false}
				onComplete={vi.fn()}
				onLoadMore={async () => undefined}
				onNoShow={vi.fn()}
				onRetry={vi.fn()}
				schedules={[]}
			/>,
		);

		expect(screen.getByText("Nothing to confirm")).toBeVisible();
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
