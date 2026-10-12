import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { prefersReducedMotion } from "motion-dom";
import { useState } from "react";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { DateTime } from "@/lib/date-time";
import i18n from "@/lib/i18n/config";
import {
  type ScheduleViewMode,
  WeekDateSelector,
} from "./week-date-selector";

const INITIAL_DATE = DateTime.fromDateOnlyString("2026-10-14").toDate();

class ResizeObserverMock {
  constructor(_callback: ResizeObserverCallback) {}

  disconnect() {}

  observe(_target: Element) {}

  unobserve(_target: Element) {}
}

function SelectorFixture() {
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");

  return (
    <>
      <WeekDateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      <output data-testid="selected-date">
        {DateTime.from(selectedDate).toDateOnlyString()}
      </output>
      <output data-testid="view-mode">{viewMode}</output>
    </>
  );
}

function RejectingControlledSelectorFixture() {
  const [viewMode] = useState<ScheduleViewMode>("day");
  const [requestedViewMode, setRequestedViewMode] =
    useState<ScheduleViewMode | null>(null);

  return (
    <>
      <WeekDateSelector
        selectedDate={INITIAL_DATE}
        onDateSelect={() => undefined}
        viewMode={viewMode}
        onViewModeChange={setRequestedViewMode}
      />
      <output data-testid="requested-view-mode">
        {requestedViewMode ?? "none"}
      </output>
    </>
  );
}

function ParentDrivenDateFixture() {
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setSelectedDate(
            DateTime.fromDateOnlyString("2026-10-16").toDate(),
          )
        }
      >
        Change date in schedule
      </button>
      <WeekDateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        viewMode="day"
        onViewModeChange={() => undefined}
      />
    </>
  );
}

function ParentDrivenWeekDateFixture() {
  const [selectedDate, setSelectedDate] = useState(INITIAL_DATE);

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setSelectedDate(
            DateTime.fromDateOnlyString("2026-10-21").toDate(),
          )
        }
      >
        Change week in schedule
      </button>
      <WeekDateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        viewMode="week"
        onViewModeChange={() => undefined}
      />
      <output data-testid="selected-date">
        {DateTime.from(selectedDate).toDateOnlyString()}
      </output>
    </>
  );
}

function getDateRadio(dateKey: string) {
  const dateRail = screen.getByRole("radiogroup", {
    name: "Schedule date selector",
  });
  const radio = dateRail.querySelector<HTMLButtonElement>(
    `button[data-date-key="${dateKey}"]`,
  );

  if (!radio) {
    throw new Error(`Date ${dateKey} is not in the date rail.`);
  }

  return radio;
}

function getWeekRadio(weekKey: string) {
  const weekRail = screen.getByRole("radiogroup", {
    name: "Schedule week selector",
  });
  const radio = weekRail.querySelector<HTMLButtonElement>(
    `button[data-week-key="${weekKey}"]`,
  );

  if (!radio) {
    throw new Error(`Week ${weekKey} is not in the week rail.`);
  }

  return radio;
}

const scrollToMock = vi.fn();
let originalScrollTo: PropertyDescriptor | undefined;

beforeAll(() => {
  originalScrollTo = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "scrollTo",
  );
  Object.defineProperty(HTMLElement.prototype, "scrollTo", {
    configurable: true,
    writable: true,
    value: scrollToMock,
  });
});

afterAll(() => {
  if (originalScrollTo) {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", originalScrollTo);
    return;
  }

  Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
});

beforeEach(async () => {
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  scrollToMock.mockClear();
  await i18n.changeLanguage("en");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("WeekDateSelector", () => {
  it("renders the Day tab and its associated date panel by default", async () => {
    render(<SelectorFixture />);

    const tabList = screen.getByRole("tablist", { name: "Schedule view" });
    const dayTab = within(tabList).getByRole("tab", { name: "Day" });
    const weekTab = within(tabList).getByRole("tab", { name: "Week" });

    expect(dayTab).toHaveAttribute("aria-selected", "true");
    expect(weekTab).toHaveAttribute("aria-selected", "false");
    expect(
      Array.from(tabList.querySelectorAll<HTMLElement>("[aria-selected]")),
    ).toEqual([dayTab, weekTab]);
    expect(screen.getByTestId("view-mode")).toHaveTextContent("day");

    const panel = screen.getByRole("tabpanel", { name: "Day" });
    await waitFor(() => {
      expect(dayTab).toHaveAttribute("aria-controls", panel.id);
    });
    expect(panel).toHaveAttribute("aria-labelledby", dayTab.id);
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);

    const dateRail = screen.getByRole("radiogroup", {
      name: "Schedule date selector",
    });
    expect(
      within(dateRail).getAllByRole("radio", { checked: true }),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("radiogroup", { name: "Schedule week selector" }),
    ).not.toBeInTheDocument();
  });

  it("uses manual tab activation for Arrow, Home, End, Enter, and Space", async () => {
    const user = userEvent.setup();
    render(<SelectorFixture />);

    const dayTab = screen.getByRole("tab", { name: "Day" });
    const weekTab = screen.getByRole("tab", { name: "Week" });

    dayTab.focus();
    await user.keyboard("{ArrowRight}");
    expect(weekTab).toHaveFocus();
    expect(dayTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByTestId("view-mode")).toHaveTextContent("day");

    await user.keyboard("{Home}");
    expect(dayTab).toHaveFocus();
    expect(dayTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{End}");
    expect(weekTab).toHaveFocus();
    expect(dayTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(weekTab).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByTestId("view-mode")).toHaveTextContent("week");

    await user.keyboard("{ArrowLeft}");
    expect(dayTab).toHaveFocus();
    expect(weekTab).toHaveAttribute("aria-selected", "true");

    await user.keyboard(" ");
    await waitFor(() => {
      expect(dayTab).toHaveAttribute("aria-selected", "true");
    });
    expect(screen.getByTestId("view-mode")).toHaveTextContent("day");
  });

  it("keeps tab semantics, highlight, and panel controlled when an owner rejects activation", async () => {
    const user = userEvent.setup();
    render(<RejectingControlledSelectorFixture />);

    const tabList = screen.getByRole("tablist", { name: "Schedule view" });
    const dayTab = within(tabList).getByRole("tab", { name: "Day" });
    const weekTab = within(tabList).getByRole("tab", { name: "Week" });
    const getActiveHighlight = () =>
      tabList.querySelector<HTMLElement>(
        '[data-slot="motion-highlight"][data-highlight="true"]',
      );

    expect(getActiveHighlight()).toHaveAttribute("data-value", "day");

    await user.click(weekTab);

    expect(screen.getByTestId("requested-view-mode")).toHaveTextContent(
      "week",
    );
    expect(dayTab).toHaveAttribute("aria-selected", "true");
    expect(weekTab).toHaveAttribute("aria-selected", "false");
    expect(getActiveHighlight()).toHaveAttribute("data-value", "day");
    expect(screen.getByRole("tabpanel", { name: "Day" })).toBeVisible();
    expect(
      screen.queryByRole("tabpanel", { name: "Week" }),
    ).not.toBeInTheDocument();
  });

  it("keeps the selected date while switching modes and selects a later week on the same weekday", async () => {
    const user = userEvent.setup();
    render(<SelectorFixture />);

    await user.click(screen.getByRole("tab", { name: "Week" }));

    await waitFor(() => {
      expect(screen.getByTestId("view-mode")).toHaveTextContent("week");
    });
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-14",
    );
    expect(screen.getAllByRole("tabpanel")).toHaveLength(1);

    const weekTab = screen.getByRole("tab", { name: "Week" });
    const weekPanel = screen.getByRole("tabpanel", { name: "Week" });
    await waitFor(() => {
      expect(weekTab).toHaveAttribute("aria-controls", weekPanel.id);
    });
    expect(weekPanel).toHaveAttribute("aria-labelledby", weekTab.id);
    expect(
      screen.queryByRole("radiogroup", { name: "Schedule date selector" }),
    ).not.toBeInTheDocument();

    const weekRail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    expect(
      within(weekRail).getAllByRole("radio", { checked: true }),
    ).toHaveLength(1);
    expect(getWeekRadio("2026-10-12")).toHaveAttribute("aria-checked", "true");

    await user.click(getWeekRadio("2026-10-19"));
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(getWeekRadio("2026-10-19")).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("tab", { name: "Day" }));
    await waitFor(() => {
      expect(screen.getByTestId("view-mode")).toHaveTextContent("day");
    });
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(getDateRadio("2026-10-21")).toHaveAttribute("aria-checked", "true");
  });

  it("keeps the date rail click and Arrow-key selection behavior", async () => {
    const user = userEvent.setup();
    render(<SelectorFixture />);

    const thursday = getDateRadio("2026-10-15");
    await user.click(thursday);

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-15",
    );
    expect(thursday).toHaveAttribute("aria-checked", "true");

    await user.keyboard("{ArrowRight}");
    await waitFor(() => {
      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        "2026-10-16",
      );
    });
    expect(getDateRadio("2026-10-16")).toHaveFocus();
    expect(
      within(
        screen.getByRole("radiogroup", { name: "Schedule date selector" }),
      ).getAllByRole("radio", { checked: true }),
    ).toHaveLength(1);
  });

  it("smoothly centers a date changed by the schedule screen", async () => {
    const user = userEvent.setup();
    render(<ParentDrivenDateFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule date selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1600 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedDate = getDateRadio("2026-10-16");
    Object.defineProperties(selectedDate, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 56 },
    });
    scrollToMock.mockClear();

    await user.click(
      screen.getByRole("button", { name: "Change date in schedule" }),
    );

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({
        left: 568,
        behavior: "smooth",
      });
    });
  });

  it("smoothly centers Today after updating the selected date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 16, 12));

    try {
      render(<SelectorFixture />);

      const rail = screen.getByRole("radiogroup", {
        name: "Schedule date selector",
      });
      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });

      const today = getDateRadio("2026-10-16");
      Object.defineProperties(today, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: 56 },
      });
      scrollToMock.mockClear();

      fireEvent.click(screen.getByRole("button", { name: "Today" }));

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        "2026-10-16",
      );
      expect(scrollToMock).toHaveBeenCalledWith({
        left: 568,
        behavior: "smooth",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("smoothly centers a date selected from the calendar", async () => {
    const user = userEvent.setup();
    render(<SelectorFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule date selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1600 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedDate = getDateRadio("2026-10-16");
    Object.defineProperties(selectedDate, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 56 },
    });
    scrollToMock.mockClear();

    await user.click(
      screen.getByRole("button", { name: "Open calendar for October 2026" }),
    );
    const calendarDate = await screen.findByRole("button", {
      name: /Friday, October 16, 2026/,
    });
    await user.click(calendarDate);

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-16",
    );
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 568,
      behavior: "smooth",
    });
  });

  it("smoothly centers a parent-driven Week-mode date change", async () => {
    const user = userEvent.setup();
    render(<ParentDrivenWeekDateFixture />);

    const rail = screen.getByRole("radiogroup", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedWeek = getWeekRadio("2026-10-19");
    Object.defineProperties(selectedWeek, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 144 },
    });
    scrollToMock.mockClear();

    await user.click(
      screen.getByRole("button", { name: "Change week in schedule" }),
    );

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith({
        left: 612,
        behavior: "smooth",
      });
    });
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(selectedWeek).toHaveAttribute("aria-checked", "true");
  });

  it("centers parent-driven date changes instantly for reduced-motion users", async () => {
    const originalPreference = prefersReducedMotion.current;
    prefersReducedMotion.current = true;

    try {
      const user = userEvent.setup();
      render(<ParentDrivenDateFixture />);

      const rail = screen.getByRole("radiogroup", {
        name: "Schedule date selector",
      });
      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });

      const selectedDate = getDateRadio("2026-10-16");
      Object.defineProperties(selectedDate, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: 56 },
      });
      scrollToMock.mockClear();

      await user.click(
        screen.getByRole("button", { name: "Change date in schedule" }),
      );

      expect(scrollToMock).toHaveBeenCalledWith({
        left: 568,
        behavior: "auto",
      });
    } finally {
      prefersReducedMotion.current = originalPreference;
    }
  });

  it("uses the selected Day tile itself for the primary surface without an overlay", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 12));
    render(<SelectorFixture />);

    const selectedDate = getDateRadio("2026-10-14");
    const today = getDateRadio("2026-10-11");

    expect(selectedDate).toHaveClass(
      "border-primary",
      "bg-primary",
      "text-primary-foreground",
    );
    expect(
      selectedDate.querySelector("span.pointer-events-none"),
    ).not.toBeInTheDocument();
    expect(today).toHaveAttribute("aria-checked", "false");
    expect(today).toHaveClass("border-primary", "bg-card", "text-foreground");
    expect(today).not.toHaveClass("bg-primary");
  });

  it("shows the newly active panel immediately for reduced-motion users", async () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query.includes("prefers-reduced-motion"),
          media: query,
          onchange: null,
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          addListener: () => undefined,
          removeListener: () => undefined,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
    const user = userEvent.setup();
    render(<SelectorFixture />);

    await user.click(screen.getByRole("tab", { name: "Week" }));

    const panel = screen.getByRole("tabpanel", { name: "Week" });
    expect(panel).toBeVisible();
    expect(panel).not.toHaveAttribute("hidden");
    expect(
      screen.getByRole("radiogroup", { name: "Schedule week selector" }),
    ).toBeVisible();
  });
});
