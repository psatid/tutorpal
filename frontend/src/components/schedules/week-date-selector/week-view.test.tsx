import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";
import { WeekView } from "./week-view";

const WEEK_TILE_WIDTH = 144;
const WEEK_TILE_GAP = 8;
const WEEK_ITEM_WIDTH = WEEK_TILE_WIDTH + WEEK_TILE_GAP;
const WEEK_RAIL_WIDTH = 320;
const WEEK_BUFFER_LENGTH = 8;
const WEEK_SCROLL_WIDTH = 1400;
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

function getWeekBuffer() {
  const firstWeek = DateTime.fromDateOnlyString("2026-09-14");

  return Array.from({ length: WEEK_BUFFER_LENGTH }, (_, index) =>
    firstWeek.addWeeks(index).toDate(),
  );
}

function getDateKey(date: Date) {
  return DateTime.from(date).toDateOnlyString();
}

function getWeekKey(index: number) {
  return getDateKey(getWeekBuffer()[index]!);
}

function getWeekdayKey(index: number) {
  return getDateKey(getWeekdayDate(index));
}

function getWeekdayDate(index: number) {
  const date = DateTime.getWeekDates(getWeekBuffer()[index]!)[2];

  if (!date) {
    throw new Error(`Expected Wednesday for week ${getWeekKey(index)}.`);
  }

  return date.toDate();
}

function getWeekButton(rail: HTMLElement, index: number) {
  const button = rail.querySelector<HTMLButtonElement>(
    `button[data-week-key="${getWeekKey(index)}"]`,
  );

  if (!button) {
    throw new Error(`Expected week button ${getWeekKey(index)} to be rendered.`);
  }

  return button;
}

function configureWeekRail(
  rail: HTMLElement,
  {
    scrollLeft = 0,
    scrollWidth = WEEK_SCROLL_WIDTH,
    clientWidth = WEEK_RAIL_WIDTH,
  }: {
    scrollLeft?: number;
    scrollWidth?: number;
    clientWidth?: number;
  } = {},
) {
  Object.defineProperties(rail, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollWidth: { configurable: true, value: scrollWidth },
    scrollLeft: { configurable: true, writable: true, value: scrollLeft },
  });

  rail
    .querySelector("button[data-week-key]")
    ?.parentElement?.style.setProperty("column-gap", "0px");
}

function WeekRailFixture({
  initialIndex = 4,
  isActive = true,
  showExternalSelectionControls = false,
}: {
  initialIndex?: number;
  isActive?: boolean;
  showExternalSelectionControls?: boolean;
}) {
  const [weekStarts, setWeekStarts] = useState(getWeekBuffer);
  const [selectedDate, setSelectedDate] = useState(() => {
    const selectedDate = DateTime.getWeekDates(weekStarts[initialIndex]!)[2];

    if (!selectedDate) {
      throw new Error("Expected an initial Wednesday in the week buffer.");
    }

    return selectedDate.toDate();
  });
  const [selectionCount, setSelectionCount] = useState(0);
  const [extensionCount, setExtensionCount] = useState(0);
  const [externalCenterRequest, setExternalCenterRequest] = useState<{
    id: number;
    behavior: ScrollBehavior;
  } | null>(null);

  const selectDate = (date: Date) => {
    setSelectionCount((count) => count + 1);
    setSelectedDate(date);
  };
  const selectCalendarWeek = (index: number) => {
    setExternalCenterRequest((currentRequest) => ({
      id: (currentRequest?.id ?? 0) + 1,
      behavior: "smooth",
    }));
    selectDate(getWeekdayDate(index));
  };
  const extendWeekBuffer = (
    direction: "previous" | "next",
    count = 1,
  ) => {
    setExtensionCount((currentCount) => currentCount + 1);
    setWeekStarts((currentWeeks) => {
      let nextWeeks = currentWeeks;

      for (let index = 0; index < count; index += 1) {
        const edgeWeek =
          direction === "previous" ? nextWeeks[0] : nextWeeks.at(-1);

        if (!edgeWeek) return nextWeeks;

        const adjacentWeek = DateTime.from(edgeWeek)
          .addWeeks(direction === "previous" ? -1 : 1)
          .toDate();

        nextWeeks =
          direction === "previous"
            ? [adjacentWeek, ...nextWeeks.slice(0, -1)]
            : [...nextWeeks.slice(1), adjacentWeek];
      }

      return nextWeeks;
    });
  };
  const moveBufferForward = () => {
    setWeekStarts((currentWeeks) => {
      const lastWeek = currentWeeks.at(-1);

      if (!lastWeek) return currentWeeks;

      return [
        ...currentWeeks.slice(1),
        DateTime.from(lastWeek).addWeeks(1).toDate(),
      ];
    });
  };

  return (
    <>
      <button type="button">Keep passive-scroll focus</button>
      <button type="button" onClick={moveBufferForward}>
        Move week buffer forward
      </button>
      {showExternalSelectionControls ? (
        <button type="button" onClick={() => selectCalendarWeek(6)}>
          Select calendar week
        </button>
      ) : null}
      <WeekView
        weekStarts={weekStarts}
        selectedDate={selectedDate}
        onDateSelect={selectDate}
        onExtendWeekBuffer={extendWeekBuffer}
        centerRequest={externalCenterRequest ?? { id: 0, behavior: "auto" }}
        isActive={isActive}
      />
      <output data-testid="selected-date">{getDateKey(selectedDate)}</output>
      <output data-testid="result-date">{getDateKey(selectedDate)}</output>
      <output data-testid="selection-count">{selectionCount}</output>
      <output data-testid="extension-count">{extensionCount}</output>
    </>
  );
}

function HiddenWeekRailFixture({ initialIndex = 4 }: { initialIndex?: number }) {
  const [isActive, setIsActive] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsActive(true)}>
        Show week rail
      </button>
      <WeekRailFixture initialIndex={initialIndex} isActive={isActive} />
    </>
  );
}

describe("WeekView rail behavior", () => {
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
          if (!this.matches("button[data-week-key]")) return 0;

          const buttons = Array.from(
            this.parentElement?.querySelectorAll<HTMLButtonElement>(
              "button[data-week-key]",
            ) ?? [],
          );

          return (
            Math.max(buttons.indexOf(this as HTMLButtonElement), 0) *
            WEEK_ITEM_WIDTH
          );
        },
      },
      offsetWidth: {
        configurable: true,
        get(this: HTMLElement) {
          return this.matches("button[data-week-key]") ? WEEK_TILE_WIDTH : 0;
        },
      },
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.matches("button[data-week-key]")
          ? WEEK_TILE_WIDTH
          : 0;

        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: width,
          bottom: 56,
          width,
          height: 56,
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
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;

      configureWeekRail(rail);
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

      rail.scrollLeft = 500;
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
        "Scroll horizontally to browse weeks without changing the selected week. Select a week with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused week.",
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

  it("does not turn a Week mode switch's programmatic center near an edge into a browse session", async () => {
    vi.useFakeTimers();
    render(<HiddenWeekRailFixture initialIndex={1} />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const centeredScrollLeft =
      WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2;

    configureWeekRail(rail);
    scrollToMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Show week rail" }));

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
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });

    configureWeekRail(rail, { scrollLeft: 1 });
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

  it("measures the Week stride once per active wheel session", () => {
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const firstWeek = getWeekButton(rail, 0);

    configureWeekRail(rail, { scrollLeft: WEEK_RAIL_WIDTH });
    const measureStride = vi.spyOn(firstWeek, "getBoundingClientRect");
    measureStride.mockClear();

    fireEvent.wheel(rail, { deltaX: 144 });
    fireEvent.wheel(rail, { deltaX: 144 });

    expect(measureStride).toHaveBeenCalledTimes(1);

    fireEvent(rail, new Event("scrollend"));
    fireEvent.wheel(rail, { deltaX: 144 });

    expect(measureStride).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      "mouse wheel",
      "previous",
      WEEK_TILE_WIDTH - 1,
      WEEK_TILE_WIDTH - 1 + WEEK_TILE_WIDTH,
    ],
    [
      "trackpad",
      "previous",
      WEEK_TILE_WIDTH - 1,
      WEEK_TILE_WIDTH - 1 + WEEK_TILE_WIDTH,
    ],
    [
      "mouse drag",
      "previous",
      WEEK_TILE_WIDTH - 1,
      WEEK_TILE_WIDTH - 1 + WEEK_TILE_WIDTH,
    ],
    [
      "mouse wheel",
      "next",
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1),
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1) - WEEK_TILE_WIDTH,
    ],
    [
      "trackpad",
      "next",
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1),
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1) - WEEK_TILE_WIDTH,
    ],
    [
      "mouse drag",
      "next",
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1),
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1) - WEEK_TILE_WIDTH,
    ],
  ] as const)(
    "prefetches the %s Week range once when %s movement enters the zone before the hard edge",
    async (input, _direction, prefetchScrollLeft, expectedScrollLeft) => {
      vi.useFakeTimers();
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;

      const browseStartScrollLeft =
        (WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH) / 2;

      configureWeekRail(rail, { scrollLeft: browseStartScrollLeft });
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
          input === "trackpad" ? { deltaX: 144 } : { deltaY: 144 },
        );
      }

      expect(prefetchScrollLeft).toBeGreaterThan(0);
      expect(prefetchScrollLeft).toBeLessThan(
        WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH,
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

  it("extends the Week buffer when wheel handling follows a native right-edge position update", () => {
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH;
    const edgeThreshold = Math.min(
      Math.max(128, WEEK_TILE_WIDTH),
      maxScrollLeft / 2,
    );
    const beforeEdgeScrollLeft = maxScrollLeft - edgeThreshold - 1;
    const expectedFirstWeek = DateTime.fromDateOnlyString(getWeekKey(0))
      .addWeeks(1)
      .toDateOnlyString();
    const expectedLastWeek = DateTime.fromDateOnlyString(
      getWeekKey(WEEK_BUFFER_LENGTH - 1),
    )
      .addWeeks(1)
      .toDateOnlyString();

    configureWeekRail(rail, { scrollLeft: beforeEdgeScrollLeft });
    scrollToMock.mockClear();
    passiveFocus.focus();
    fireEvent.scroll(rail);
    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

    rail.scrollLeft = maxScrollLeft;
    fireEvent.wheel(rail, { deltaX: edgeThreshold + 1 });
    fireEvent.scroll(rail);

    const renderedWeekKeys = Array.from(
      rail.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
    ).map((button) => button.dataset.weekKey);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(renderedWeekKeys.at(0)).toBe(expectedFirstWeek);
    expect(renderedWeekKeys.at(-1)).toBe(expectedLastWeek);
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

  it("extends the Week buffer again when uninterrupted rightward scrolling reaches the next edge zone", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH;
    const prefetchScrollLeft = maxScrollLeft - (WEEK_TILE_WIDTH - 1);
    const expectedFirstWeek = DateTime.fromDateOnlyString(getWeekKey(0))
      .addWeeks(2)
      .toDateOnlyString();
    const expectedLastWeek = DateTime.fromDateOnlyString(
      getWeekKey(WEEK_BUFFER_LENGTH - 1),
    )
      .addWeeks(2)
      .toDateOnlyString();

    configureWeekRail(rail);
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
    fireEvent.wheel(rail, { deltaX: WEEK_TILE_WIDTH });

    rail.scrollLeft = prefetchScrollLeft;
    fireEvent.scroll(rail);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");

    const nextMaxScrollLeft = Math.max(
      rail.scrollWidth - rail.clientWidth,
      0,
    );
    const nextEdgeThreshold = Math.min(
      Math.max(128, WEEK_TILE_WIDTH),
      nextMaxScrollLeft / 2,
    );
    const nextPrefetchScrollLeft = nextMaxScrollLeft - nextEdgeThreshold;

    expect(nextPrefetchScrollLeft).toBeGreaterThan(rail.scrollLeft);
    rail.scrollLeft = nextPrefetchScrollLeft;
    fireEvent.scroll(rail);

    const renderedWeekKeys = Array.from(
      rail.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
    ).map((button) => button.dataset.weekKey);

    expect(screen.getByTestId("extension-count")).toHaveTextContent("2");
    expect(renderedWeekKeys.at(0)).toBe(expectedFirstWeek);
    expect(renderedWeekKeys.at(-1)).toBe(expectedLastWeek);
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

  it("extends the Week buffer once after activation when native scroll enters an edge zone", async () => {
    vi.useFakeTimers();
    render(<HiddenWeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const passiveFocus = screen.getByRole("button", {
      name: "Keep passive-scroll focus",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const maxScrollLeft = WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH;
    const prefetchScrollLeft = maxScrollLeft - (WEEK_TILE_WIDTH - 1);
    const centeredScrollLeft =
      4 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2;

    configureWeekRail(rail);
    scrollToMock.mockImplementation(function (
      this: HTMLElement,
      options: ScrollToOptions,
    ) {
      this.scrollLeft = options.left ?? this.scrollLeft;
    });
    fireEvent.click(screen.getByRole("button", { name: "Show week rail" }));

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: centeredScrollLeft,
      behavior: "auto",
    });
    expect(rail.scrollLeft).toBe(centeredScrollLeft);

    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
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
    ["previous", WEEK_TILE_WIDTH - 1, WEEK_TILE_WIDTH - 1 + WEEK_TILE_WIDTH],
    [
      "next",
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1),
      WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH - (WEEK_TILE_WIDTH - 1) - WEEK_TILE_WIDTH,
    ],
  ] as const)(
    "queues a touch prefetch at the %s zone until touch end, then extends once",
    async (_direction, prefetchScrollLeft, expectedScrollLeft) => {
      vi.useFakeTimers();
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const passiveFocus = screen.getByRole("button", {
        name: "Keep passive-scroll focus",
      });
      const selectedDate = screen.getByTestId("selected-date").textContent;
      const browseStartScrollLeft =
        (WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH) / 2;

      configureWeekRail(rail, { scrollLeft: browseStartScrollLeft });
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
        WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH,
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

  it("discards a queued touch-edge rotation when a calendar week is selected before its idle fallback", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<WeekRailFixture showExternalSelectionControls />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const initialCenteredScrollLeft =
      4 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2;
    const selectedWeek = getWeekButton(rail, 6);
    const expectedCenteredScrollLeft =
      selectedWeek.offsetLeft +
      selectedWeek.offsetWidth / 2 -
      WEEK_RAIL_WIDTH / 2;

    configureWeekRail(rail);
    act(() => {
      resizeObserver?.trigger();
    });
    rail.scrollLeft = initialCenteredScrollLeft;
    scrollToMock.mockClear();
    scrollToMock.mockImplementation(function (
      this: HTMLElement,
      options: ScrollToOptions,
    ) {
      this.scrollLeft = options.left ?? this.scrollLeft;
    });

    fireEvent.pointerDown(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 120,
      clientY: 20,
    });
    rail.scrollLeft = 1;
    fireEvent.scroll(rail);
    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 80,
      clientY: 20,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select calendar week" }),
    );

    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: expectedCenteredScrollLeft,
      behavior: "smooth",
    });
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      getWeekdayKey(6),
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("1");

    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(151);
    });

    const explicitSelection = rail.querySelector<HTMLButtonElement>(
      'button[data-selected="true"]',
    );

    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    expect(rail.scrollLeft).toBe(expectedCenteredScrollLeft);
    expect(explicitSelection).toBe(selectedWeek);
    expect(
      explicitSelection!.offsetLeft + explicitSelection!.offsetWidth / 2,
    ).toBe(rail.scrollLeft + rail.clientWidth / 2);
  });

  it("allows a later prefetch session after duplicate scrollend is ignored", () => {
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const maxScrollLeft = WEEK_SCROLL_WIDTH - WEEK_RAIL_WIDTH;

    const prefetchScrollLeft = maxScrollLeft - (WEEK_TILE_WIDTH - 1);
    const browseStartScrollLeft = maxScrollLeft / 2;

    configureWeekRail(rail, { scrollLeft: browseStartScrollLeft });
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
    "selects a week exactly once through explicit %s activation and preserves the weekday",
    async (activation) => {
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const target = getWeekButton(rail, 5);

      configureWeekRail(rail);

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
        getWeekdayKey(5),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getWeekdayKey(5),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
      expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    },
  );

  it.each([
    ["first", 0],
    ["last", WEEK_BUFFER_LENGTH - 1],
  ] as const)(
    "centers an explicitly selected %s buffered week without selecting again when the rail later scrolls",
    (edge, index) => {
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const target = getWeekButton(rail, index);

      configureWeekRail(rail, {
        scrollWidth: WEEK_BUFFER_LENGTH * WEEK_ITEM_WIDTH,
      });
      scrollToMock.mockClear();
      fireEvent.click(target);

      const selectedButton = rail.querySelector<HTMLButtonElement>(
        'button[data-selected="true"]',
      );

      if (!selectedButton) {
        throw new Error(`Expected the ${edge} week to be selected.`);
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

      expect(selectedButton).toHaveAttribute("data-week-key", getWeekKey(index));
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getWeekdayKey(index),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getWeekdayKey(index),
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
        getWeekdayKey(index),
      );
      expect(screen.getByTestId("result-date")).toHaveTextContent(
        getWeekdayKey(index),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
      expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    },
  );

  it("moves roving focus and the viewport with Arrow and Page keys, then commits only on Space", async () => {
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const selected = getWeekButton(rail, 4);
    const arrowTarget = getWeekButton(rail, 5);
    const pageTarget = getWeekButton(rail, 1);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureWeekRail(rail);
    scrollToMock.mockClear();
    selected.focus();
    fireEvent.keyDown(selected, { key: "ArrowRight" });

    expect(arrowTarget).toHaveFocus();
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 5 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    fireEvent.keyDown(arrowTarget, { key: "PageUp" });

    expect(pageTarget).toHaveFocus();
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      selectedDate ?? "",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("0");
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    const user = userEvent.setup();

    await user.keyboard(" ");

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      getWeekdayKey(1),
    );
    expect(screen.getByTestId("result-date")).toHaveTextContent(
      getWeekdayKey(1),
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
  });

  it("moves focus into a visible browse target when the selected week falls out of the buffer", async () => {
    const user = userEvent.setup();
    render(<WeekRailFixture initialIndex={0} />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureWeekRail(rail, { scrollLeft: 500 });
    scrollToMock.mockClear();
    await user.click(
      screen.getByRole("button", { name: "Move week buffer forward" }),
    );

    const browseTarget = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key][tabindex="0"]',
    );

    if (!browseTarget) {
      throw new Error("Expected a visible week browse target.");
    }

    const browseTargetCenter =
      browseTarget.offsetLeft + browseTarget.offsetWidth / 2;

    expect(
      rail.querySelector(`button[data-week-key="${getWeekKey(0)}"]`),
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
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const target = getWeekButton(rail, 5);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureWeekRail(rail);
    fireEvent.pointerDown(target, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 500;
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
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const draggedWeek = getWeekButton(rail, 4);
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureWeekRail(rail);
    fireEvent.touchStart(rail, {
      changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
      touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
    });
    fireEvent.pointerDown(draggedWeek, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 500;
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

    rail.scrollLeft = 600;
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
      render(<WeekRailFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const draggedWeek = getWeekButton(rail, 5);
      const selectedDate = screen.getByTestId("selected-date").textContent;

      configureWeekRail(rail);
      fireEvent.touchStart(rail, {
        changedTouches: [{ clientX: 100, clientY: 20, identifier: 1 }],
        touches: [{ clientX: 100, clientY: 20, identifier: 1 }],
      });
      fireEvent.pointerDown(draggedWeek, {
        pointerId: 1,
        pointerType: "touch",
        isPrimary: true,
        clientX: 100,
        clientY: 20,
      });
      rail.scrollLeft = 500;
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

      fireEvent.pointerDown(draggedWeek, {
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
      fireEvent.click(draggedWeek, { detail: 1 });

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        getWeekdayKey(5),
      );
      expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
    },
  );

  it("centers the initial layout and preserves a later browsed week viewport through orientation resize", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;
    const browseTarget = getWeekButton(rail, 2);
    const selectedButton = getWeekButton(rail, 4);

    configureWeekRail(rail);
    scrollToMock.mockClear();
    act(() => {
      resizeObserver?.trigger();
    });

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 4 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2,
      behavior: "auto",
    });

    rail.scrollLeft = 200;
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

    expect(rail.scrollLeft).toBe(200);
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

  it("keeps hidden Week initialization pending until it becomes measurable, then preserves its browse position through later observers", () => {
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    render(<HiddenWeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const selectedDate = screen.getByTestId("selected-date").textContent;

    configureWeekRail(rail, { clientWidth: 0, scrollWidth: 0 });
    scrollToMock.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Show week rail" }));

    expect(resizeObserver).not.toBeNull();
    act(() => {
      resizeObserver?.trigger();
    });
    expect(scrollToMock).not.toHaveBeenCalled();

    configureWeekRail(rail);
    act(() => {
      resizeObserver?.trigger();
    });

    const initialCenteredScrollLeft =
      4 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2;

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: initialCenteredScrollLeft,
      behavior: "auto",
    });

    rail.scrollLeft = initialCenteredScrollLeft;
    scrollToMock.mockClear();
    Object.defineProperty(rail, "clientWidth", {
      configurable: true,
      value: 400,
    });
    act(() => {
      resizeObserver?.trigger();
    });
    Object.defineProperty(rail, "scrollWidth", {
      configurable: true,
      value: WEEK_SCROLL_WIDTH + WEEK_ITEM_WIDTH,
    });
    act(() => {
      resizeObserver?.trigger();
    });

    expect(rail.scrollLeft).toBe(initialCenteredScrollLeft);
    expect(scrollToMock).not.toHaveBeenCalled();
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
    render(<WeekRailFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    const target = getWeekButton(rail, 5);

    configureWeekRail(rail);
    act(() => {
      resizeObserver?.trigger();
    });
    scrollToMock.mockClear();
    fireEvent.click(target);

    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 5 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2,
      behavior: "smooth",
    });

    rail.scrollLeft = 400;
    fireEvent.scroll(rail);
    act(() => {
      resizeObserver?.trigger();
      resizeObserver?.trigger();
    });

    expect(scrollToMock).toHaveBeenCalledTimes(1);

    rail.scrollLeft =
      5 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 5 * WEEK_ITEM_WIDTH + WEEK_TILE_WIDTH / 2 - WEEK_RAIL_WIDTH / 2,
      behavior: "auto",
    });
    expect(scrollToMock).toHaveBeenCalledTimes(2);
  });
});
