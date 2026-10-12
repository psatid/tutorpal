import { act, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18n from "@/lib/i18n/config";
import { DateTime } from "@/lib/date-time";
import { WeekdayView } from "./weekday-view";

const INITIAL_DATE = DateTime.fromDateOnlyString("2026-10-14").toDate();
const TARGET_DATE = DateTime.fromDateOnlyString("2026-10-16").toDate();
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

describe("WeekdayView resize during smooth centering", () => {
  beforeEach(async () => {
    resizeObserver = null;
    scrollToMock.mockReset();
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: scrollToMock,
    });
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();

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
});
