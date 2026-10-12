import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { DateTime } from "@/lib/date-time";
import { WeekView } from "./week-view";

const SELECTED_DATE = DateTime.fromDateOnlyString("2026-10-14").toDate();
const originalScrollTo = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollTo",
);
const scrollToMock = vi.fn();

let resizeObservers: ResizeObserverMock[] = [];

class ResizeObserverMock {
  private isDisconnected = false;

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }

  disconnect() {
    this.isDisconnected = true;
  }

  observe(_target: Element) {}

  unobserve(_target: Element) {}

  trigger() {
    if (this.isDisconnected) return;

    this.callback([], this as unknown as ResizeObserver);
  }
}

function triggerLatestResizeObserver() {
  const resizeObserver = resizeObservers.at(-1);

  if (!resizeObserver) {
    throw new Error("Expected the week rail to register a ResizeObserver.");
  }

  resizeObserver.trigger();
}

function TouchScrollFixture() {
  const [weekStarts, setWeekStarts] = useState(() => {
    const selectedWeek = DateTime.from(SELECTED_DATE).startOfWeek();

    return Array.from({ length: 8 }, (_, index) =>
      selectedWeek.addWeeks(index - 4).toDate(),
    );
  });
  const [extensionCount, setExtensionCount] = useState(0);

  const extendWeekBuffer = (direction: "previous" | "next") => {
    setExtensionCount((count) => count + 1);
    setWeekStarts((currentWeeks) => {
      const edgeWeek =
        direction === "previous" ? currentWeeks[0] : currentWeeks.at(-1);

      if (!edgeWeek) return currentWeeks;

      const adjacentWeek = DateTime.from(edgeWeek)
        .addWeeks(direction === "previous" ? -1 : 1)
        .toDate();

      return direction === "previous"
        ? [adjacentWeek, ...currentWeeks.slice(0, -1)]
        : [...currentWeeks.slice(1), adjacentWeek];
    });
  };

  return (
    <>
      <WeekView
        weekStarts={weekStarts}
        selectedDate={SELECTED_DATE}
        onDateSelect={() => undefined}
        onExtendWeekBuffer={extendWeekBuffer}
        onRestoreSelectedWeek={() => undefined}
        centerRequest={{ id: 0, behavior: "auto" }}
      />
      <output data-testid="extension-count">{extensionCount}</output>
    </>
  );
}

function TouchSelectionFixture() {
  const [selectedDate, setSelectedDate] = useState(SELECTED_DATE);
  const [selectionCount, setSelectionCount] = useState(0);
  const [weekStarts] = useState(() => {
    const selectedWeek = DateTime.from(SELECTED_DATE).startOfWeek();

    return Array.from({ length: 8 }, (_, index) =>
      selectedWeek.addWeeks(index - 4).toDate(),
    );
  });

  return (
    <>
      <WeekView
        weekStarts={weekStarts}
        selectedDate={selectedDate}
        onDateSelect={(date) => {
          setSelectionCount((count) => count + 1);
          setSelectedDate(date);
        }}
        onExtendWeekBuffer={() => undefined}
        onRestoreSelectedWeek={() => undefined}
        centerRequest={{ id: 0, behavior: "auto" }}
      />
      <output data-testid="selected-date">
        {DateTime.from(selectedDate).toDateOnlyString()}
      </output>
      <output data-testid="selection-count">{selectionCount}</output>
    </>
  );
}

function SmoothEdgeCenterFixture() {
  const [selectedDate, setSelectedDate] = useState(SELECTED_DATE);
  const [weekStarts, setWeekStarts] = useState(() => {
    const selectedWeek = DateTime.from(SELECTED_DATE).startOfWeek();

    return Array.from({ length: 8 }, (_, index) =>
      selectedWeek.addWeeks(index - 4).toDate(),
    );
  });
  const [extensionCount, setExtensionCount] = useState(0);

  const extendWeekBuffer = (direction: "previous" | "next") => {
    setExtensionCount((count) => count + 1);
    setWeekStarts((currentWeeks) => {
      const edgeWeek =
        direction === "previous" ? currentWeeks[0] : currentWeeks.at(-1);

      if (!edgeWeek) return currentWeeks;

      const adjacentWeek = DateTime.from(edgeWeek)
        .addWeeks(direction === "previous" ? -1 : 1)
        .toDate();

      return direction === "previous"
        ? [adjacentWeek, ...currentWeeks.slice(0, -1)]
        : [...currentWeeks.slice(1), adjacentWeek];
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setSelectedDate(DateTime.fromDateOnlyString("2026-09-16").toDate())
        }
      >
        Select first buffered week
      </button>
      <button
        type="button"
        onClick={() =>
          setSelectedDate(DateTime.fromDateOnlyString("2026-11-04").toDate())
        }
      >
        Select last buffered week
      </button>
      <button
        type="button"
        onClick={() =>
          setSelectedDate(DateTime.fromDateOnlyString("2026-10-21").toDate())
        }
      >
        Select middle buffered week
      </button>
      <WeekView
        weekStarts={weekStarts}
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        onExtendWeekBuffer={extendWeekBuffer}
        onRestoreSelectedWeek={() => undefined}
        centerRequest={{ id: 0, behavior: "auto" }}
      />
      <output data-testid="selected-date">
        {DateTime.from(selectedDate).toDateOnlyString()}
      </output>
      <output data-testid="extension-count">{extensionCount}</output>
    </>
  );
}

describe("WeekView touch scrolling", () => {
  beforeEach(async () => {
    resizeObservers = [];
    scrollToMock.mockReset();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: scrollToMock,
    });
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
      function (this: HTMLElement) {
        const width = this.matches("button[data-week-key]") ? 144 : 0;

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

  it("waits for a long touch fling to settle before rotating the week buffer once", async () => {
    vi.useFakeTimers();
    render(<TouchScrollFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    fireEvent.pointerDown(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });

    rail.scrollLeft = 400;
    fireEvent.scroll(rail);

    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 40,
      clientY: 20,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(70);
    });
    rail.scrollLeft = 550;
    fireEvent.scroll(rail);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(70);
    });
    rail.scrollLeft = 700;
    fireEvent.scroll(rail);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(11);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

    rail.scrollLeft = 800;
    fireEvent.scroll(rail);
    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(656);
    expect(
      rail.querySelector('button[data-week-key="2026-10-12"]'),
    ).toHaveAttribute("aria-checked", "true");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
  });

  it("uses the idle fallback to settle an edge rotation when scrollend is absent", async () => {
    vi.useFakeTimers();
    render(<TouchScrollFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    fireEvent.pointerDown(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 400;
    fireEvent.scroll(rail);
    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 40,
      clientY: 20,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(70);
    });
    rail.scrollLeft = 800;
    fireEvent.scroll(rail);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(149);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(656);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
  });

  it("extends the week buffer when smooth centering clamps to its last week", async () => {
    vi.useFakeTimers();
    render(<SmoothEdgeCenterFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const lastWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-11-02"]',
    );

    if (!lastWeek) {
      throw new Error("Expected the last buffered week to be present.");
    }

    Object.defineProperties(lastWeek, {
      offsetLeft: { configurable: true, value: 1050 },
      offsetWidth: { configurable: true, value: 144 },
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Select last buffered week" }),
    );

    expect(lastWeek).toHaveAttribute("aria-checked", "true");
    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      left: 880,
      behavior: "smooth",
    });

    rail.scrollLeft = 880;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(
      rail.querySelector('button[data-week-key="2026-11-09"]'),
    ).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
  });

  it("uses the smooth-centering fallback once when scrollend arrives late", async () => {
    vi.useFakeTimers();
    render(<SmoothEdgeCenterFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const lastWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-11-02"]',
    );
    const selectLastWeek = screen.getByRole("button", {
      name: "Select last buffered week",
    });

    if (!lastWeek) {
      throw new Error("Expected the last buffered week to be present.");
    }

    Object.defineProperties(lastWeek, {
      offsetLeft: { configurable: true, value: 1050 },
      offsetWidth: { configurable: true, value: 144 },
    });

    selectLastWeek.focus();
    fireEvent.click(selectLastWeek);

    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      left: 880,
      behavior: "smooth",
    });
    expect(selectLastWeek).toHaveFocus();

    rail.scrollLeft = 880;
    fireEvent.scroll(rail);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(736);
    expect(lastWeek).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-11-04",
    );
    expect(
      rail.querySelectorAll('button[role="radio"][aria-checked="true"]'),
    ).toHaveLength(1);
    expect(selectLastWeek).toHaveFocus();

    fireEvent(rail, new Event("scrollend"));
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
  });

  it("extends the previous buffer edge after smooth centering without changing selection or focus", () => {
    render(<SmoothEdgeCenterFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 500 },
    });

    const firstWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-09-14"]',
    );
    const selectFirstWeek = screen.getByRole("button", {
      name: "Select first buffered week",
    });

    if (!firstWeek) {
      throw new Error("Expected the first buffered week to be present.");
    }

    Object.defineProperties(firstWeek, {
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 144 },
    });

    selectFirstWeek.focus();
    fireEvent.click(selectFirstWeek);

    expect(HTMLElement.prototype.scrollTo).toHaveBeenCalledWith({
      left: 0,
      behavior: "smooth",
    });
    expect(selectFirstWeek).toHaveFocus();

    rail.scrollLeft = 0;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(144);
    expect(
      rail.querySelector('button[data-week-key="2026-09-07"]'),
    ).toBeInTheDocument();
    expect(firstWeek).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-09-16",
    );
    expect(
      rail.querySelectorAll('button[role="radio"][aria-checked="true"]'),
    ).toHaveLength(1);
    expect(selectFirstWeek).toHaveFocus();
  });

  it("defers a resize during smooth edge centering until its one rotation settles", () => {
    vi.useFakeTimers();
    render(<SmoothEdgeCenterFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const lastWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-11-02"]',
    );

    if (!lastWeek) {
      throw new Error("Expected the last buffered week to be present.");
    }

    Object.defineProperties(lastWeek, {
      offsetLeft: { configurable: true, value: 1050 },
      offsetWidth: { configurable: true, value: 144 },
    });
    scrollToMock.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: "Select last buffered week" }),
    );
    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 880,
      behavior: "smooth",
    });

    rail.scrollLeft = 500;
    fireEvent.scroll(rail);
    const scrollLeftBeforeResize = rail.scrollLeft;

    act(() => {
      triggerLatestResizeObserver();
    });

    expect(rail.scrollLeft).toBe(scrollLeftBeforeResize);
    expect(scrollToMock).toHaveBeenCalledTimes(1);

    rail.scrollLeft = 880;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(736);
    expect(scrollToMock).toHaveBeenCalledTimes(1);

    fireEvent(rail, new Event("scrollend"));
    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(scrollToMock).toHaveBeenCalledTimes(1);
  });

  it("coalesces resize reconciliation until non-edge smooth centering settles", () => {
    vi.useFakeTimers();
    render(<SmoothEdgeCenterFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const middleWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-10-19"]',
    );

    if (!middleWeek) {
      throw new Error("Expected the middle buffered week to be present.");
    }

    Object.defineProperties(middleWeek, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 144 },
    });
    scrollToMock.mockClear();

    fireEvent.click(
      screen.getByRole("button", { name: "Select middle buffered week" }),
    );
    expect(scrollToMock).toHaveBeenCalledExactlyOnceWith({
      left: 612,
      behavior: "smooth",
    });

    rail.scrollLeft = 300;
    fireEvent.scroll(rail);
    Object.defineProperty(middleWeek, "offsetLeft", {
      configurable: true,
      value: 720,
    });

    act(() => {
      triggerLatestResizeObserver();
      triggerLatestResizeObserver();
    });

    expect(rail.scrollLeft).toBe(300);
    expect(scrollToMock).toHaveBeenCalledTimes(1);

    rail.scrollLeft = 612;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("0");
    expect(scrollToMock).toHaveBeenCalledTimes(2);
    expect(scrollToMock).toHaveBeenLastCalledWith({
      left: 632,
      behavior: "auto",
    });

    fireEvent(rail, new Event("scrollend"));
    expect(scrollToMock).toHaveBeenCalledTimes(2);
  });

  it("allows a second touch gesture to rotate once after the first settles", async () => {
    vi.useFakeTimers();
    render(<TouchScrollFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    fireEvent.pointerDown(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 400;
    fireEvent.scroll(rail);
    fireEvent.pointerUp(rail, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 40,
      clientY: 20,
    });
    rail.scrollLeft = 800;
    fireEvent.scroll(rail);
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    expect(rail.scrollLeft).toBe(656);

    fireEvent.pointerDown(rail, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    rail.scrollLeft = 800;
    fireEvent.scroll(rail);
    fireEvent.pointerUp(rail, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 40,
      clientY: 20,
    });

    expect(screen.getByTestId("extension-count")).toHaveTextContent("1");
    fireEvent(rail, new Event("scrollend"));

    expect(screen.getByTestId("extension-count")).toHaveTextContent("2");
    expect(rail.scrollLeft).toBe(656);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });
    expect(screen.getByTestId("extension-count")).toHaveTextContent("2");
  });

  it("selects a stationary touch once and leaves the selection unchanged after an 8px swipe", () => {
    render(<TouchSelectionFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    const tappedWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-10-19"]',
    );
    const swipedWeek = rail.querySelector<HTMLButtonElement>(
      'button[data-week-key="2026-10-26"]',
    );

    if (!tappedWeek || !swipedWeek) {
      throw new Error("Expected fixture weeks are missing from the rail.");
    }

    fireEvent.pointerDown(tappedWeek, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    fireEvent.pointerUp(tappedWeek, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    fireEvent.click(tappedWeek, { detail: 1 });

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("1");

    fireEvent.pointerDown(swipedWeek, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 100,
      clientY: 20,
    });
    fireEvent.pointerMove(rail, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 108,
      clientY: 20,
    });
    fireEvent.pointerUp(rail, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 108,
      clientY: 20,
    });
    fireEvent.click(swipedWeek, { detail: 1 });

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(screen.getByTestId("selection-count")).toHaveTextContent("1");
  });
});
