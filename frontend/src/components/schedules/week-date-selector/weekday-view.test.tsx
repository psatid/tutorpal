import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";
import { WeekdayView } from "./weekday-view";

const DAY_TILE_WIDTH = 56;
const DAY_TILE_GAP = 8;
const DAY_ITEM_WIDTH = DAY_TILE_WIDTH + DAY_TILE_GAP;
const DAY_RAIL_WIDTH = 320;
const DAY_BUFFER_LENGTH = 35;
const originalScrollTo = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);
const originalOffsetLeft = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetLeft",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
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

function restoreProperty(
  target: object,
  property: string,
  descriptor: PropertyDescriptor | undefined,
) {
  if (descriptor) {
    Object.defineProperty(target, property, descriptor);
  } else {
    Reflect.deleteProperty(target, property);
  }
}

function getDayBuffer() {
  const firstWeek = DateTime.fromDateOnlyString("2026-09-14");

  return Array.from({ length: DAY_BUFFER_LENGTH / 7 }, (_, weekIndex) =>
    DateTime.getWeekDates(firstWeek.addWeeks(weekIndex)).map((date) =>
      date.toDate(),
    ),
  ).flat();
}

function getDateKey(date: Date) {
  return DateTime.from(date).toDateOnlyString();
}

function getDayKey(index: number) {
  return getDateKey(getDayBuffer()[index]!);
}

function getDayButton(rail: HTMLElement, index: number) {
  const button = rail.querySelector<HTMLButtonElement>(
    `button[data-date-key="${getDayKey(index)}"]`,
  );

  if (!button) {
    throw new Error(`Expected date button ${getDayKey(index)} to be rendered.`);
  }

  return button;
}

function configureDayRail(
  rail: HTMLElement,
  {
    scrollLeft = 0,
    scrollWidth = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH,
  }: { scrollLeft?: number; scrollWidth?: number } = {},
) {
  Object.defineProperties(rail, {
    clientWidth: { configurable: true, value: DAY_RAIL_WIDTH },
    scrollWidth: { configurable: true, value: scrollWidth },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });

  rail
    .querySelector("button[data-date-key]")
    ?.parentElement?.style.setProperty("column-gap", "0px");
}

function DayRailFixture({ initialIndex = 17 }: { initialIndex?: number }) {
  const [dates, setDates] = useState(getDayBuffer);
  const [selectedDate, setSelectedDate] = useState(() => dates[initialIndex]!);
  const [selectionCount, setSelectionCount] = useState(0);
  const [extensionCount, setExtensionCount] = useState(0);

  const selectDate = (date: Date) => {
    setSelectionCount((count) => count + 1);
    setSelectedDate(date);
  };
  const extendDateBuffer = (
    direction: "previous" | "next",
    count = 1,
  ) => {
    setExtensionCount((count) => count + 1);
    setDates((currentDates) => {
      let nextDates = currentDates;

      for (let index = 0; index < count; index += 1) {
        const firstDate = nextDates[0];
        const lastDate = nextDates.at(-1);

        if (!firstDate || !lastDate) return nextDates;

        nextDates =
          direction === "previous"
            ? [
                ...DateTime.getWeekDates(
                  DateTime.from(firstDate).subWeeks(1),
                ).map((date) => date.toDate()),
                ...nextDates.slice(0, -7),
              ]
            : [
                ...nextDates.slice(7),
                ...DateTime.getWeekDates(
                  DateTime.from(lastDate).addWeeks(1),
                ).map((date) => date.toDate()),
              ];
      }

      return nextDates;
    });
  };
  const moveBufferForward = () => {
    setDates((currentDates) => {
      const lastDate = currentDates.at(-1);

      if (!lastDate) return currentDates;

      return [
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
      <button type="button" onClick={moveBufferForward}>
        Move date buffer forward
      </button>
      <WeekdayView
        dates={dates}
        selectedDate={selectedDate}
        onDateSelect={selectDate}
        onExtendDateBuffer={extendDateBuffer}
        centerRequest={{ id: 0, behavior: "auto" }}
      />
      <output data-testid="selected-date">{getDateKey(selectedDate)}</output>
      <output data-testid="result-date">{getDateKey(selectedDate)}</output>
      <output data-testid="selection-count">{selectionCount}</output>
      <output data-testid="extension-count">{extensionCount}</output>
    </>
  );
}

describe("WeekdayView rail behavior", () => {
  beforeEach(async () => {
    resizeObserver = null;
    scrollToMock.mockReset();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: scrollToMock,
    });
    Object.defineProperties(HTMLElement.prototype, {
      offsetLeft: {
        configurable: true,
        get(this: HTMLElement) {
          if (!this.matches("button[data-date-key]")) return 0;

          const buttons = Array.from(
            this.parentElement?.querySelectorAll<HTMLButtonElement>(
              "button[data-date-key]",
            ) ?? [],
          );

          return (
            Math.max(buttons.indexOf(this as HTMLButtonElement), 0) *
            DAY_ITEM_WIDTH
          );
        },
      },
      offsetWidth: {
        configurable: true,
        get(this: HTMLElement) {
          return this.matches("button[data-date-key]") ? DAY_TILE_WIDTH : 0;
        },
      },
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
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    restoreProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
    restoreProperty(HTMLElement.prototype, "offsetLeft", originalOffsetLeft);
    restoreProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  it.each(["wheel", "native", "touch"] as const)(
    "keeps selection, result selection, and focus unchanged when a %s scroll settles away from an edge",
    async (input) => {
      vi.useFakeTimers();
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;

      configureDayRail(rail);
      scrollToMock.mockClear();
      passiveFocus.focus();

      if (input === "wheel") {
        fireEvent.wheel(rail);
      } else if (input === "touch") {
        fireEvent.pointerDown(rail, {
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          clientX: 120,
          clientY: 20,
        });
      }

      rail.scrollLeft = 800;
      fireEvent.scroll(rail);

      if (input === "touch") {
        fireEvent.pointerUp(rail, {
          pointerId: 1,
          pointerType: "touch",
          isPrimary: true,
          clientX: 80,
          clientY: 20,
        });
      }

      fireEvent(rail, new Event("scrollend"));

      expect(rail).toHaveAccessibleDescription(
        "Scroll horizontally to browse dates without changing the selected date. Select a date with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused date.",
      );
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
      expect(passiveFocus).toHaveFocus();
      expect(scrollToMock).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    },
  );

  it("does not turn an initial programmatic center near an edge into a browse session", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<DayRailFixture initialIndex={3} />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const centeredScrollLeft =
      3 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2;

    configureDayRail(rail);
    scrollToMock.mockClear();
    expect(resizeObserver).not.toBeNull();
    act(() => {
      resizeObserver?.trigger();
    });

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: centeredScrollLeft,
      behavior: "auto",
    });

    rail.scrollLeft = centeredScrollLeft;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it("does not load an edge after a touch press without scroll movement", async () => {
    vi.useFakeTimers();
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });

    configureDayRail(rail, { scrollLeft: 1 });
    fireEvent.pointerDown(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 120,
      clientY: 20,
    });
    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 120,
      clientY: 20,
    });
    fireEvent(rail, new Event("scrollend"));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it("measures the Day stride once per active wheel session", () => {
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const firstDate = getDayButton(rail, 0);

    configureDayRail(rail, { scrollLeft: DAY_RAIL_WIDTH });
    const measureStride = vi.spyOn(firstDate, "getBoundingClientRect");
    measureStride.mockClear();

    fireEvent.wheel(rail, { deltaX: 56 });
    fireEvent.wheel(rail, { deltaX: 56 });

    expect(measureStride).toHaveBeenCalledTimes(1);

    fireEvent(rail, new Event("scrollend"));
    fireEvent.wheel(rail, { deltaX: 56 });

    expect(measureStride).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "mouse wheel",
      "previous",
      DAY_TILE_WIDTH,
      DAY_TILE_WIDTH + DAY_TILE_WIDTH * 7,
    ],
    [
      "trackpad",
      "previous",
      DAY_TILE_WIDTH,
      DAY_TILE_WIDTH + DAY_TILE_WIDTH * 7,
    ],
    [
      "mouse drag",
      "previous",
      DAY_TILE_WIDTH,
      DAY_TILE_WIDTH + DAY_TILE_WIDTH * 7,
    ],
    [
      "mouse wheel",
      "next",
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH - DAY_TILE_WIDTH,
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH -
        DAY_RAIL_WIDTH -
        DAY_TILE_WIDTH -
        DAY_TILE_WIDTH * 7,
    ],
    [
      "trackpad",
      "next",
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH - DAY_TILE_WIDTH,
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH -
        DAY_RAIL_WIDTH -
        DAY_TILE_WIDTH -
        DAY_TILE_WIDTH * 7,
    ],
    [
      "mouse drag",
      "next",
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH - DAY_TILE_WIDTH,
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH -
        DAY_RAIL_WIDTH -
        DAY_TILE_WIDTH -
        DAY_TILE_WIDTH * 7,
    ],
  ] as const)(
    "prefetches the %s Day range once when %s movement enters the zone before the hard edge",
    async (input, _direction, prefetchScrollLeft, expectedScrollLeft) => {
      vi.useFakeTimers();
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;

      const browseStartScrollLeft =
        (DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH) / 2;

      configureDayRail(rail, { scrollLeft: browseStartScrollLeft });
      scrollToMock.mockClear();
      passiveFocus.focus();

      if (input === "mouse drag") {
        fireEvent.pointerDown(rail, {
          pointerId: 1,
          pointerType: "mouse",
          isPrimary: true,
          clientX: 120,
          clientY: 20,
        });
      } else {
        fireEvent.wheel(
          rail,
          input === "trackpad" ? { deltaX: 56 } : { deltaY: 56 },
        );
      }

      expect(prefetchScrollLeft).toBeGreaterThan(0);
      expect(prefetchScrollLeft).toBeLessThan(
        DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH,
      );
      rail.scrollLeft = prefetchScrollLeft;
      fireEvent.scroll(rail);

      // Prefetch happens as directional movement enters the zone, before scrollend.
      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
      expect(rail.scrollLeft).toBe(expectedScrollLeft);
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
      expect(passiveFocus).toHaveFocus();
      expect(scrollToMock).not.toHaveBeenCalled();

      fireEvent(rail, new Event("scrollend"));
      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");

      const compensatedScrollLeft = rail.scrollLeft;
      fireEvent.scroll(rail);
      fireEvent(rail, new Event("scrollend"));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
      expect(rail.scrollLeft).toBe(compensatedScrollLeft);
    },
  );

  it("extends the Day buffer when wheel handling follows a native right-edge position update", () => {
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH;
    const edgeThreshold = Math.min(
      Math.max(128, DAY_TILE_WIDTH),
      maxScrollLeft / 2,
    );
    const beforeEdgeScrollLeft = maxScrollLeft - edgeThreshold - 1;
    const expectedFirstDate = DateTime.fromDateOnlyString(getDayKey(0))
      .addWeeks(1)
      .toDateOnlyString();
    const expectedLastDate = DateTime.fromDateOnlyString(
      getDayKey(DAY_BUFFER_LENGTH - 1),
    )
      .addWeeks(1)
      .toDateOnlyString();

    configureDayRail(rail, { scrollLeft: beforeEdgeScrollLeft });
    scrollToMock.mockClear();
    passiveFocus.focus();
    fireEvent.scroll(rail);
    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

    rail.scrollLeft = maxScrollLeft;
    fireEvent.wheel(rail, { deltaX: edgeThreshold + 1 });
    fireEvent.scroll(rail);

    const renderedDateKeys = Array.from(
      rail.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
    ).map((button) => button.dataset.dateKey);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(renderedDateKeys.at(0)).toBe(expectedFirstDate);
    expect(renderedDateKeys.at(-1)).toBe(expectedLastDate);
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(passiveFocus).toHaveFocus();
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it("extends the Day buffer again when uninterrupted rightward scrolling reaches the next edge zone", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH;
    const prefetchScrollLeft = maxScrollLeft - DAY_TILE_WIDTH;
    const expectedFirstDate = DateTime.fromDateOnlyString(getDayKey(0))
      .addWeeks(2)
      .toDateOnlyString();
    const expectedLastDate = DateTime.fromDateOnlyString(
      getDayKey(DAY_BUFFER_LENGTH - 1),
    )
      .addWeeks(2)
      .toDateOnlyString();

    configureDayRail(rail);
    scrollToMock.mockImplementation(function (
      this: HTMLElement,
      options: ScrollToOptions,
    ) {
      this.scrollLeft = options.left ?? this.scrollLeft;
    });
    act(() => {
      resizeObserver?.trigger();
    });
    scrollToMock.mockClear();
    passiveFocus.focus();
    fireEvent.wheel(rail, { deltaX: DAY_TILE_WIDTH });

    rail.scrollLeft = prefetchScrollLeft;
    fireEvent.scroll(rail);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");

    const nextMaxScrollLeft = Math.max(
      rail.scrollWidth - rail.clientWidth,
      0,
    );
    const nextEdgeThreshold = Math.min(
      Math.max(128, DAY_TILE_WIDTH),
      nextMaxScrollLeft / 2,
    );
    const nextPrefetchScrollLeft = nextMaxScrollLeft - nextEdgeThreshold;

    expect(nextPrefetchScrollLeft).toBeGreaterThan(rail.scrollLeft);
    rail.scrollLeft = nextPrefetchScrollLeft;
    fireEvent.scroll(rail);

    const renderedDateKeys = Array.from(
      rail.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
    ).map((button) => button.dataset.dateKey);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("2");
    expect(renderedDateKeys.at(0)).toBe(expectedFirstDate);
    expect(renderedDateKeys.at(-1)).toBe(expectedLastDate);
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(passiveFocus).toHaveFocus();
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it("extends the Day buffer once when its first native scroll enters an edge zone", async () => {
    vi.useFakeTimers();
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH;
    const browseStartScrollLeft = maxScrollLeft / 2;
    const prefetchScrollLeft = maxScrollLeft - DAY_TILE_WIDTH;

    configureDayRail(rail, { scrollLeft: browseStartScrollLeft });
    scrollToMock.mockClear();
    passiveFocus.focus();

    rail.scrollLeft = prefetchScrollLeft;
    fireEvent.scroll(rail);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(passiveFocus).toHaveFocus();
    expect(scrollToMock).not.toHaveBeenCalled();

    const compensatedScrollLeft = rail.scrollLeft;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
    fireEvent(rail, new Event("scrollend"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(compensatedScrollLeft);
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it.each([
    ["previous", DAY_TILE_WIDTH, DAY_TILE_WIDTH + DAY_TILE_WIDTH * 7],
    [
      "next",
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH - DAY_TILE_WIDTH,
      DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH -
        DAY_RAIL_WIDTH -
        DAY_TILE_WIDTH -
        DAY_TILE_WIDTH * 7,
    ],
  ] as const)(
    "queues a touch prefetch at the %s zone until touch end, then extends once",
    async (_direction, prefetchScrollLeft, expectedScrollLeft) => {
      vi.useFakeTimers();
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;
      const browseStartScrollLeft =
        (DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH) / 2;

      configureDayRail(rail, { scrollLeft: browseStartScrollLeft });
      scrollToMock.mockClear();
      passiveFocus.focus();
      fireEvent.pointerDown(rail, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        clientX: 120,
        clientY: 20,
      });
      expect(prefetchScrollLeft).toBeGreaterThan(0);
      expect(prefetchScrollLeft).toBeLessThan(
        DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH,
      );
      rail.scrollLeft = prefetchScrollLeft;
      fireEvent.scroll(rail);
      fireEvent(rail, new Event("scrollend"));

      expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

      fireEvent.pointerUp(rail, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        clientX: 80,
        clientY: 20,
      });

      expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
      expect(rail.scrollLeft).toBe(expectedScrollLeft);
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
      expect(passiveFocus).toHaveFocus();
      expect(scrollToMock).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(150);
      });

      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    },
  );

  it("allows a later prefetch session after duplicate scrollend is ignored", () => {
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const maxScrollLeft = DAY_BUFFER_LENGTH * DAY_ITEM_WIDTH - DAY_RAIL_WIDTH;

    const prefetchScrollLeft = maxScrollLeft - DAY_TILE_WIDTH;
    const browseStartScrollLeft = maxScrollLeft / 2;

    configureDayRail(rail, { scrollLeft: browseStartScrollLeft });
    fireEvent.wheel(rail);
    rail.scrollLeft = prefetchScrollLeft;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");

    rail.scrollLeft = browseStartScrollLeft;
    fireEvent.wheel(rail);
    rail.scrollLeft = prefetchScrollLeft;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it.each(["click", "touch tap", "Enter", "Space"] as const)(
    "selects a date exactly once through explicit %s activation",
    async (activation) => {
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const target = getDayButton(rail, 20);

      configureDayRail(rail);

      if (activation === "click") {
        fireEvent.click(target);
      } else if (activation === "touch tap") {
        fireEvent.pointerDown(target, {
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
        fireEvent.click(target, { detail: 1 });
      } else {
        const user = userEvent.setup();

        target.focus();
        await user.keyboard(activation === "Enter" ? "{Enter}" : " ");
      }

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getDayKey(20),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getDayKey(20),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
      expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    },
  );

  it.each([
    ["first", 0],
    ["last", DAY_BUFFER_LENGTH - 1],
  ] as const)(
    "centers an explicitly selected %s buffered date without selecting again when the rail later scrolls",
    (edge, index) => {
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const target = getDayButton(rail, index);

      configureDayRail(rail);
      scrollToMock.mockClear();
      fireEvent.click(target);

      const selectedButton = rail.querySelector<HTMLButtonElement>(
        'button[data-selected="true"]',
      );

      if (!selectedButton) {
        throw new Error(`Expected the ${edge} date to be selected.`);
      }

      const centeredScrollLeft = Math.min(
        Math.max(
          selectedButton.offsetLeft +
            selectedButton.offsetWidth / 2 -
            rail.clientWidth / 2,
          0,
        ),
        rail.scrollWidth - rail.clientWidth,
      );

      expect(selectedButton).toHaveAttribute("data-date-key", getDayKey(index));
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getDayKey(index),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getDayKey(index),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
      expect(scrollToMock).toHaveBeenLastCalledWith({
        left: centeredScrollLeft,
        behavior: "auto",
      });

      rail.scrollLeft = (rail.scrollWidth - rail.clientWidth) / 2;
      fireEvent.wheel(rail);
      fireEvent.scroll(rail);
      fireEvent(rail, new Event("scrollend"));

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getDayKey(index),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getDayKey(index),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    },
  );

  it("moves roving focus and the viewport with Arrow and Page keys, then commits only on Enter", async () => {
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const selected = getDayButton(rail, 17);
    const arrowTarget = getDayButton(rail, 18);
    const pageTarget = getDayButton(rail, 25);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureDayRail(rail);
    scrollToMock.mockClear();
    selected.focus();
    fireEvent.keyDown(selected, { key: "ArrowRight" });

    expect(arrowTarget).toHaveFocus();
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 18 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    fireEvent.keyDown(arrowTarget, { key: "PageDown" });

    expect(pageTarget).toHaveFocus();
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 25 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    const user = userEvent.setup();

    await user.keyboard("{Enter}");

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      getDayKey(25),
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      getDayKey(25),
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
  });

  it("moves focus into a visible browse target when the selected date falls out of the buffer", async () => {
    const user = userEvent.setup();
    render(<DayRailFixture initialIndex={0} />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureDayRail(rail, { scrollLeft: 900 });
    scrollToMock.mockClear();
    await user.click(
      screen.getByRole("button", { name: "Move date buffer forward" }),
    );

    const browseTarget = rail.querySelector<HTMLButtonElement>(
      'button[data-date-key][tabindex="0"]',
    );

    if (!browseTarget) {
      throw new Error("Expected a visible date browse target.");
    }

    const browseTargetCenter =
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2;

    expect(
      rail.querySelector(`button[data-date-key="${selectedDate}"]`),
    ).toBeNull();
    expect(browseTargetCenter).toBeGreaterThanOrEqual(rail.scrollLeft);
    expect(browseTargetCenter).toBeLessThanOrEqual(
      rail.scrollLeft + rail.clientWidth,
    );
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(scrollToMock).not.toHaveBeenCalled();

    await user.tab();

    expect(browseTarget).toHaveFocus();
    expect(scrollToMock).not.toHaveBeenCalled();
  });

  it("does not select after a touch swipe followed by its synthetic click", () => {
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const target = getDayButton(rail, 20);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureDayRail(rail);
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 800;
    fireEvent.pointerMove(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 80,
      clientY: 20,
    });
    fireEvent.scroll(rail);
    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 80,
      clientY: 20,
    });
    fireEvent.click(target, { detail: 1 });
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it("waits for native touchend after an iOS pointercancel before settling its inertial tail", async () => {
    vi.useFakeTimers();
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const draggedDate = getDayButton(rail, 17);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureDayRail(rail);
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
    rail.scrollLeft = 800;
    fireEvent.pointerMove(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 70,
      clientY: 20,
    });
    fireEvent.scroll(rail);
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
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );

    rail.scrollLeft = 900;
    fireEvent.scroll(rail);
    fireEvent.touchEnd(rail, {
      changedTouches: [{ clientX: 40, clientY: 20, identifier: 1 }],
      touches: [],
    });
    fireEvent.scroll(rail);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
  });

  it.each(["touchcancel", "blur", "pagehide"] as const)(
    "discards an interrupted touch swipe after %s and allows the next tap to select once",
    async (cancellation) => {
      vi.useFakeTimers();
      render(<DayRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const draggedDate = getDayButton(rail, 20);
      const selectedDate = screen.getByTestId("selected-date").textContent;

      configureDayRail(rail);
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
      rail.scrollLeft = 800;
      fireEvent.pointerMove(rail, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        clientX: 70,
        clientY: 20,
      });
      fireEvent.scroll(rail);
      fireEvent.pointerCancel(rail, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        clientX: 70,
        clientY: 20,
      });

      if (cancellation === "touchcancel") {
        fireEvent.touchCancel(rail, {
          changedTouches: [{ clientX: 70, clientY: 20, identifier: 1 }],
          touches: [],
        });
      } else if (cancellation === "blur") {
        fireEvent.blur(window);
      } else {
        fireEvent(window, new Event("pagehide"));
      }

      await act(async () => {
        await vi.advanceTimersByTimeAsync(151);
      });

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        selectedDate ?? "",
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("0");

      fireEvent.pointerDown(draggedDate, {
        pointerId: 2,
        pointerType: "touch",
        isPrimary: true,
        clientX: 100,
        clientY: 20,
      });
      fireEvent.pointerUp(rail, {
        pointerId: 2,
        pointerType: "touch",
        isPrimary: true,
        clientX: 100,
        clientY: 20,
      });
      fireEvent.click(draggedDate, { detail: 1 });

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getDayKey(20),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
    },
  );

  it("centers the initial layout and preserves a later browsed date viewport through orientation resize", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const browseTarget = getDayButton(rail, 8);
    const selectedButton = getDayButton(rail, 17);

    configureDayRail(rail);
    scrollToMock.mockClear();
    act(() => {
      resizeObserver?.trigger();
    });

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 17 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    rail.scrollLeft = 500;
    fireEvent.wheel(rail);
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
    expect(
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2,
    ).toBeGreaterThanOrEqual(rail.scrollLeft);
    expect(
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2,
    ).toBeLessThanOrEqual(rail.scrollLeft + rail.clientWidth);
    expect(selectedButton.offsetLeft).toBeGreaterThan(
      rail.scrollLeft + rail.clientWidth,
    );
    Object.defineProperty(rail, "clientWidth", {
      configurable: true,
      value: 400,
    });
    scrollToMock.mockClear();

    act(() => {
      resizeObserver?.trigger();
    });

    expect(rail.scrollLeft).toBe(500);
    expect(scrollToMock).not.toHaveBeenCalled();
    expect(
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2,
    ).toBeGreaterThanOrEqual(rail.scrollLeft);
    expect(
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2,
    ).toBeLessThanOrEqual(rail.scrollLeft + rail.clientWidth);
    expect(selectedButton.offsetLeft).toBeGreaterThan(
      rail.scrollLeft + rail.clientWidth,
    );
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
  });

  it("defers resize reconciliation until smooth explicit centering settles", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<DayRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    const target = getDayButton(rail, 20);

    configureDayRail(rail);
    act(() => {
      resizeObserver?.trigger();
    });
    scrollToMock.mockClear();
    fireEvent.click(target);

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 20 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2,
      behavior: "smooth",
    });

    rail.scrollLeft = 600;
    fireEvent.scroll(rail);
    act(() => {
      resizeObserver?.trigger();
      resizeObserver?.trigger();
    });

    expect(scrollToMock).toHaveBeenCalledTimes(1);

    rail.scrollLeft =
      20 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 20 * DAY_ITEM_WIDTH + DAY_TILE_WIDTH / 2 - DAY_RAIL_WIDTH / 2,
      behavior: "auto",
    });
    expect(scrollToMock).toHaveBeenCalledTimes(2);
  });
});
