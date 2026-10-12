import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { DateTime } from "@/lib/date-time";
import { WeekdayView } from "./weekday-view";

const INITIAL_DATE = DateTime.fromDateOnlyString("2026-10-14").toDate();
const TARGET_DATE = DateTime.fromDateOnlyString("2026-10-16").toDate();
const DAY_TILE_WIDTH = 56;
const DAY_TILE_GAP = 8;
const DAY_ITEM_WIDTH = DAY_TILE_WIDTH + DAY_TILE_GAP;
const DAY_RAIL_WIDTH = 320;
const DAY_BUFFER_LENGTH = 35;
const originalScrollTo = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);
const scrollToMock = vi.fn();

let resizeObserver: ResizeObserverMock | null = null;

class ResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObserver = this;
  }

  disconnect() {}

  observe(_target: Element) {}

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }
}

function SmoothCenterFixture() {
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const [dates] = useState(() =>
    Array.from({ length: 9 }, (_, weekIndex) =>
      DateTime.getWeekDates(
        DateTime.from(INITIAL_DATE).startOfWeek().addWeeks(weekIndex - 4),
      ),
    )
      .flat()
      .slice(2, 58)
      .map((date) => date.toDate()),
  );

  return (
    <>
      <button type="button" onClick={() => setSelectedDate(TARGET_DATE)}>
        Select another date
      </button>
      <WeekdayView
        dates={dates}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onExtendDateBuffer={() => undefined}
        onRestoreSelectedDate={() => undefined}
        centerRequest={{ id: 0, behavior: "auto" }}
      />
    </>
  );
}

function getDayBuffer() {
	const firstWeek = DateTime.fromDateOnlyString("2026-09-14");

	return Array.from({ length: DAY_BUFFER_LENGTH / 7 }, (_, weekIndex) =>
		DateTime.getWeekDates(firstWeek.addWeeks(weekIndex)).map((date) =>
			date.toDate(),
		),
	).flat();
}

function getDayKey(index: number) {
	return DateTime.from(getDayBuffer()[index]!).toDateOnlyString();
}

function DayRailFixture({ initialIndex = 17 }: { initialIndex?: number }) {
	const [dates, setDates] = useState(getDayBuffer);
	const [selectedDate, setSelectedDate] = useState(() => dates[initialIndex]!);
	const [extensionCount, setExtensionCount] = useState(0);
	const [selectionCount, setSelectionCount] = useState(0);

	const selectDate = (date: Date) => {
		setSelectionCount((count) => count + 1);
		setSelectedDate(date);
	};
	const extendDateBuffer = (direction: "previous" | "next") => {
		setExtensionCount((count) => count + 1);
		setDates((currentDates) => {
			const firstDate = currentDates[0];
			const lastDate = currentDates.at(-1);

			if (!firstDate || !lastDate) return currentDates;

			return direction === "previous"
				? [
						...DateTime.getWeekDates(DateTime.from(firstDate).subWeeks(1)).map(
							(date) => date.toDate(),
						),
						...currentDates.slice(0, -7),
					]
				: [
						...currentDates.slice(7),
						...DateTime.getWeekDates(DateTime.from(lastDate).addWeeks(1)).map(
							(date) => date.toDate(),
						),
					];
		});
	};

	return (
		<>
			<button type="button">Keep passive-scroll focus</button>
			<WeekdayView
				dates={dates}
				selectedDate={selectedDate}
				onDateSelect={selectDate}
				onExtendDateBuffer={extendDateBuffer}
				onRestoreSelectedDate={() => undefined}
				centerRequest={{ id: 0, behavior: "auto" }}
			/>
			<output data-testid="selected-date">
				{DateTime.from(selectedDate).toDateOnlyString()}
			</output>
			<output data-testid="selection-count">{selectionCount}</output>
			<output data-testid="extension-count">{extensionCount}</output>
		</>
	);
}

function configureDayRail(
	rail: HTMLElement,
	{ scrollLeft = 0, scrollWidth = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH } = {},
) {
	Object.defineProperties(rail, {
		clientWidth: { configurable: true, value: DAY_RAIL_WIDTH },
		scrollWidth: { configurable: true, value: scrollWidth },
		scrollLeft: { configurable: true, writable: true, value: scrollLeft },
	});

	const buttons = Array.from(
		rail.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
	);

	buttons.forEach((button, index) => {
		Object.defineProperties(button, {
			offsetLeft: {
				configurable: true,
				value: index * DAY_ITEM_WIDTH,
			},
			offsetWidth: { configurable: true, value: DAY_TILE_WIDTH },
		});
	});

	buttons[0]?.parentElement?.style.setProperty("column-gap", "0px");
}

function getCenteredDayScrollLeft(index: number) {
	return index * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2;
}

describe("WeekdayView rail behavior", () => {
  beforeEach(async () => {
    resizeObserver = null;
    scrollToMock.mockReset();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: scrollToMock,
    });
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
			function (this: HTMLElement) {
				const width = this.matches("button[data-date-key]")
					? DAY_TILE_WIDTH
					: 0;

				return {
					x: 0,
					y: 0,
					left: 0,
					top: 0,
					right: width,
					bottom: DAY_TILE_WIDTH,
					width,
					height: DAY_TILE_WIDTH,
					toJSON: () => ({}),
				};
			},
		);
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
		vi.restoreAllMocks();

    if (originalScrollTo) {
      Object.defineProperty(
        HTMLElement.prototype,
        "scrollTo",
        originalScrollTo,
      );
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    }
  });

  it.each(["scrollend", "idle fallback"])(
    "defers resize reconciliation until %s settles smooth centering",
    async (settlement) => {
      vi.useFakeTimers();
      render(<SmoothCenterFixture />);

      const rail = screen.getByRole("radiogroup", {
        name: "Schedule date selector",
      });
      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });

      const selectedDate = rail.querySelector<HTMLButtonElement>(
        'button[data-date-key="2026-10-16"]',
      );

      if (!selectedDate || !resizeObserver) {
        throw new Error(
          "Expected the date rail and ResizeObserver to be present.",
        );
      }

      Object.defineProperties(selectedDate, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: 56 },
      });
      scrollToMock.mockClear();

      fireEvent.click(
        screen.getByRole("button", { name: "Select another date" }),
      );
      expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
        left: 568,
        behavior: "smooth",
      });

      rail.scrollLeft = 300;
      fireEvent.scroll(rail);
      Object.defineProperty(selectedDate, "offsetLeft", {
        configurable: true,
        value: 720,
      });

      act(() => {
        resizeObserver?.trigger();
        resizeObserver?.trigger();
      });

      expect(rail.scrollLeft).toBe(300);
      expect(scrollToMock).toHaveBeenCalledTimes(1);

      rail.scrollLeft = 568;
      fireEvent.scroll(rail);

      if (settlement === "scrollend") {
        fireEvent(rail, new Event("scrollend"));
      } else {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(150);
        });
      }

      expect(scrollToMock).toHaveBeenCalledTimes(2);
      expect(scrollToMock).toHaveBeenLastCalledWith({
        left: 588,
        behavior: "auto",
      });

      fireEvent(rail, new Event("scrollend"));
      expect(scrollToMock).toHaveBeenCalledTimes(2);
    },
  );

	it("selects the natively centered day once without moving passive-scroll focus", async () => {
		vi.useFakeTimers();
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		const passiveFocus = screen.getByRole("button", {
			name: "Keep passive-scroll focus",
		});

		configureDayRail(rail);
		passiveFocus.focus();
		fireEvent.wheel(rail);
		rail.scrollLeft = getCenteredDayScrollLeft(18);
		fireEvent.scroll(rail);
		fireEvent(rail, new Event("scrollend"));

		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(18),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
		expect(passiveFocus).toHaveFocus();

		fireEvent(rail, new Event("scrollend"));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(150);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
	});

	it("keeps a held touch swipe unsettled through a quiet pause until pointerup and its inertial tail", async () => {
		vi.useFakeTimers();
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		configureDayRail(rail);

		const draggedDate = rail.querySelector<HTMLButtonElement>(
			`button[data-date-key="${getDayKey(17)}"]`,
		);

		if (!draggedDate) {
			throw new Error("Expected the dragged date to be present in the rail.");
		}

		fireEvent.touchStart(rail, {
			changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
			touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
		});
		fireEvent.pointerDown(draggedDate, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 100,
			clientY: 20,
		});
		rail.scrollLeft = getCenteredDayScrollLeft(18);
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 70,
			clientY: 20,
		});
		fireEvent.scroll(rail);

		await act(async () => {
			await vi.advanceTimersByTimeAsync(151);
		});
		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(17),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		rail.scrollLeft = getCenteredDayScrollLeft(19);
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 40,
			clientY: 20,
		});
		fireEvent.scroll(rail);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(151);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		fireEvent.pointerUp(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 40,
			clientY: 20,
		});
		fireEvent.scroll(rail);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(149);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(18),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
	});

	it.each(["native touchcancel", "window blur", "window pagehide"] as const)(
		"discards a %s interrupted touch swipe without selecting and lets the next touch settle",
		async (cancellation) => {
			vi.useFakeTimers();
			render(<DayRailFixture />);

			const rail = screen.getByRole("radiogroup", {
				name: "Schedule date selector",
			});
			configureDayRail(rail);

			const draggedDate = rail.querySelector<HTMLButtonElement>(
				`button[data-date-key="${getDayKey(17)}"]`,
			);

			if (!draggedDate) {
				throw new Error("Expected the dragged date to be present in the rail.");
			}

			fireEvent.touchStart(rail, {
				changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
				touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
			});
			fireEvent.pointerDown(draggedDate, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 100,
				clientY: 20,
			});
			rail.scrollLeft = getCenteredDayScrollLeft(18);
			fireEvent.pointerMove(rail, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 70,
				clientY: 20,
			});
			fireEvent.scroll(rail);

			await act(async () => {
				await vi.advanceTimersByTimeAsync(151);
			});
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			fireEvent.pointerCancel(rail, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 70,
				clientY: 20,
			});
			await act(async () => {
				await vi.advanceTimersByTimeAsync(151);
			});
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			rail.scrollLeft = getCenteredDayScrollLeft(19);
			fireEvent.scroll(rail);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(151);
			});
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			if (cancellation === "native touchcancel") {
				fireEvent.touchCancel(rail, {
					changedTouches: [{ clientX: 70, clientY: 20, identifier: 1 }],
					touches: [],
				});
			} else if (cancellation === "window blur") {
				fireEvent.blur(window);
			} else {
				fireEvent(window, new Event("pagehide"));
			}
			await act(async () => {
				await vi.advanceTimersByTimeAsync(151);
			});
			fireEvent(rail, new Event("scrollend"));
			expect(screen.getByTestId("selected-date")).toHaveTextContent(
				getDayKey(17),
			);
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			fireEvent.pointerUp(draggedDate, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 70,
				clientY: 20,
			});
			expect(screen.getByTestId("selected-date")).toHaveTextContent(
				getDayKey(17),
			);
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			fireEvent.touchStart(rail, {
				changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
				touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
			});
			fireEvent.pointerDown(draggedDate, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 100,
				clientY: 20,
			});
			rail.scrollLeft = getCenteredDayScrollLeft(18);
			fireEvent.pointerMove(rail, {
				pointerId: 1,
				pointerType: "touch",
				isPrimary: true,
				clientX: 70,
				clientY: 20,
			});
			fireEvent.scroll(rail);
			fireEvent.touchEnd(rail, {
				changedTouches: [{ clientX: 70, clientY: 20, identifier: 1 }],
				touches: [],
			});
			fireEvent.scroll(rail);
			await act(async () => {
				await vi.advanceTimersByTimeAsync(150);
			});
			expect(screen.getByTestId("selected-date")).toHaveTextContent(
				getDayKey(18),
			);
			expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
		},
	);

	it("keeps an iOS-taken-over touch swipe unsettled through pointercancel until native touchend and its inertial tail", async () => {
		vi.useFakeTimers();
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		configureDayRail(rail);

		const draggedDate = rail.querySelector<HTMLButtonElement>(
			`button[data-date-key="${getDayKey(17)}"]`,
		);

		if (!draggedDate) {
			throw new Error("Expected the dragged date to be present in the rail.");
		}

		fireEvent.touchStart(rail, {
			changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
			touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
		});
		fireEvent.pointerDown(draggedDate, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 100,
			clientY: 20,
		});
		rail.scrollLeft = getCenteredDayScrollLeft(18);
		fireEvent.pointerMove(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 70,
			clientY: 20,
		});
		fireEvent.scroll(rail);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(151);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		fireEvent.pointerCancel(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 70,
			clientY: 20,
		});
		await act(async () => {
			await vi.advanceTimersByTimeAsync(151);
		});
		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(17),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		rail.scrollLeft = getCenteredDayScrollLeft(19);
		fireEvent.scroll(rail);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(151);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		const nativeTouchEnd = {
			changedTouches: [{ clientX: 40, clientY: 20, identifier: 1 }],
			touches: [],
		};
		fireEvent.touchEnd(rail, nativeTouchEnd);
		fireEvent.scroll(rail);
		await act(async () => {
			await vi.advanceTimersByTimeAsync(149);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

		await act(async () => {
			await vi.advanceTimersByTimeAsync(1);
		});
		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(18),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
	});

	it.each([
		["previous", 2, 0, DAY_TILE_WIDTH * 7],
		[
			"next",
			32,
			DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH,
			DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH - DAY_TILE_WIDTH * 7,
		],
	] as const)(
		"extends the %s date buffer once after native edge settlement and preserves the viewport",
		async (_direction, initialIndex, scrollLeft, expectedScrollLeft) => {
			vi.useFakeTimers();
			render(<DayRailFixture initialIndex={initialIndex} />);

			const rail = screen.getByRole("radiogroup", {
				name: "Schedule date selector",
			});
			configureDayRail(rail, { scrollLeft });
			fireEvent.wheel(rail);
			fireEvent.scroll(rail);
			fireEvent(rail, new Event("scrollend"));

			expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
			expect(rail.scrollLeft).toBe(expectedScrollLeft);
			expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

			fireEvent(rail, new Event("scrollend"));
			await act(async () => {
				await vi.advanceTimersByTimeAsync(150);
			});
			expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
		},
	);

	it("limits a wide date fling to one tile and smoothly centers that tile", () => {
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		configureDayRail(rail);
		scrollToMock.mockClear();

		fireEvent.wheel(rail);
		rail.scrollLeft = getCenteredDayScrollLeft(22);
		fireEvent.scroll(rail);
		fireEvent(rail, new Event("scrollend"));

		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(18),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
		expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
		expect(scrollToMock).toHaveBeenLastCalledWith({
			left: getCenteredDayScrollLeft(18),
			behavior: "smooth",
		});
	});

	it("uses a mouse-clicked day as the origin of the next wheel scroll", async () => {
		vi.useFakeTimers();
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		const passiveFocus = screen.getByRole("button", {
			name: "Keep passive-scroll focus",
		});
		configureDayRail(rail);

		const clickedDate = rail.querySelector<HTMLButtonElement>(
			`button[data-date-key="${getDayKey(20)}"]`,
		);

		if (!clickedDate) {
			throw new Error("Expected the clicked day to be present in the rail.");
		}

		fireEvent.pointerDown(clickedDate, { pointerType: "mouse" });
		fireEvent.click(clickedDate);
		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(20),
		);

		passiveFocus.focus();
		fireEvent.wheel(rail);
		rail.scrollLeft = getCenteredDayScrollLeft(21);
		fireEvent.scroll(rail);
		fireEvent(rail, new Event("scrollend"));

		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(21),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("2");
		expect(passiveFocus).toHaveFocus();

		fireEvent(rail, new Event("scrollend"));
		await act(async () => {
			await vi.advanceTimersByTimeAsync(150);
		});
		expect(screen.getByTestId("selection-count")).toHaveTextContent("2");
	});

	it("starts an independent touch swipe from a just-tapped day", () => {
		render(<DayRailFixture />);

		const rail = screen.getByRole("radiogroup", {
			name: "Schedule date selector",
		});
		configureDayRail(rail);

		const tappedDate = rail.querySelector<HTMLButtonElement>(
			`button[data-date-key="${getDayKey(20)}"]`,
		);

		if (!tappedDate) {
			throw new Error("Expected the tapped day to be present in the rail.");
		}

		fireEvent.pointerDown(tappedDate, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 100,
			clientY: 20,
		});
		fireEvent.pointerUp(rail, {
			pointerId: 1,
			pointerType: "touch",
			isPrimary: true,
			clientX: 100,
			clientY: 20,
		});
		fireEvent.click(tappedDate, { detail: 1 });
		expect(screen.getByTestId("selection-count")).toHaveTextContent("1");

		fireEvent.pointerDown(rail, {
			pointerId: 2,
			pointerType: "touch",
			isPrimary: true,
			clientX: 100,
			clientY: 20,
		});
		rail.scrollLeft = getCenteredDayScrollLeft(21);
		fireEvent.scroll(rail);
		fireEvent.pointerUp(rail, {
			pointerId: 2,
			pointerType: "touch",
			isPrimary: true,
			clientX: 60,
			clientY: 20,
		});
		fireEvent(rail, new Event("scrollend"));

		expect(screen.getByTestId("selected-date")).toHaveTextContent(
			getDayKey(21),
		);
		expect(screen.getByTestId("selection-count")).toHaveTextContent("2");
	});
});
