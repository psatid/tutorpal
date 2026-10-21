import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const motionPreferences = vi.hoisted(() => ({
  reducedMotion: false,
}));

vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();

  return {
    ...actual,
    useReducedMotion: () => motionPreferences.reducedMotion,
  };
});

const INITIAL_DATE = DateTime.fromDateOnlyString("2026-10-14").toDate();

let resizeObservers: ResizeObserverMock[] = [];

class ResizeObserverMock {
  private observedTarget: Element | null = null;

  constructor(private readonly callback: ResizeObserverCallback) {
    resizeObservers.push(this);
  }

  disconnect() {}

  observe(target: Element) {
    this.observedTarget = target;
  }

  unobserve(_target: Element) {}

  trigger() {
    this.callback([], this as unknown as ResizeObserver);
  }

  observes(target: Element) {
    return this.observedTarget === target;
  }
}

function triggerResizeObserver(target: Element) {
  for (let index = resizeObservers.length - 1; index >= 0; index -= 1) {
    const resizeObserver = resizeObservers[index];

    if (resizeObserver?.observes(target)) {
      resizeObserver.trigger();
      return;
    }
  }

  throw new Error("Expected the active rail to register a ResizeObserver.");
}

function establishInitialDateRailLayout(rail: HTMLElement) {
  const initialDate = getDateButton("2026-10-14");

  Object.defineProperties(initialDate, {
    offsetLeft: { configurable: true, value: 600 },
    offsetWidth: { configurable: true, value: 56 },
  });

  act(() => {
    triggerResizeObserver(rail);
  });
}

function establishInitialWeekRailLayout(rail: HTMLElement) {
  const initialWeek = getWeekButton("2026-10-12");

  Object.defineProperties(initialWeek, {
    offsetLeft: { configurable: true, value: 400 },
    offsetWidth: { configurable: true, value: 144 },
  });

  act(() => {
    triggerResizeObserver(rail);
  });
}

function SelectorFixture({
  initialDate = INITIAL_DATE,
  initialViewMode = "day",
}: {
  initialDate?: Date;
  initialViewMode?: ScheduleViewMode;
} = {}) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [viewMode, setViewMode] = useState<ScheduleViewMode>(initialViewMode);

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

function getDateButton(dateKey: string) {
  const dateRail = screen.getByRole("group", {
    name: "Schedule date selector",
  });
  const button = dateRail.querySelector<HTMLButtonElement>(
    `button[data-date-key="${dateKey}"]`,
  );

  if (!button) {
    throw new Error(`Date ${dateKey} is not in the date rail.`);
  }

  return button;
}

function getWeekButton(weekKey: string) {
  const weekRail = screen.getByRole("group", {
    name: "Schedule week selector",
  });
  const button = weekRail.querySelector<HTMLButtonElement>(
    `button[data-week-key="${weekKey}"]`,
  );

  if (!button) {
    throw new Error(`Week ${weekKey} is not in the week rail.`);
  }

  return button;
}

function getDateRailKeys(rail: HTMLElement) {
  return Array.from(
    rail.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
  ).map((button) => {
    const key = button.dataset.dateKey;

    if (!key) {
      throw new Error("Expected every date button to have a date key.");
    }

    return key;
  });
}

function getWeekRailKeys(rail: HTMLElement) {
  return Array.from(
    rail.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
  ).map((button) => {
    const key = button.dataset.weekKey;

    if (!key) {
      throw new Error("Expected every week button to have a week key.");
    }

    return key;
  });
}

function extendDateRailAtBoundary(
  rail: HTMLElement,
  direction: "previous" | "next",
) {
  const buttons = Array.from(
    rail.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
  );
  const boundaryButton =
    direction === "previous" ? buttons[0] : buttons.at(-1);

  if (!boundaryButton) {
    throw new Error("Expected a date button at the active rail boundary.");
  }

  fireEvent.keyDown(boundaryButton, {
    key: direction === "previous" ? "ArrowLeft" : "ArrowRight",
  });
}

function extendWeekRailAtBoundary(
  rail: HTMLElement,
  direction: "previous" | "next",
) {
  const buttons = Array.from(
    rail.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
  );
  const boundaryButton =
    direction === "previous" ? buttons[0] : buttons.at(-1);

  if (!boundaryButton) {
    throw new Error("Expected a week button at the active rail boundary.");
  }

  fireEvent.keyDown(boundaryButton, {
    key: direction === "previous" ? "ArrowLeft" : "ArrowRight",
  });
}

function expectUniqueChronologicalKeys(keys: string[]) {
  expect(new Set(keys)).toHaveLength(keys.length);
  expect(keys).toEqual([...keys].sort());
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
  resizeObservers = [];
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

    const dateRail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    expect(
      dateRail.querySelectorAll('button[data-selected="true"]'),
    ).toHaveLength(1);
    expect(
      screen.queryByRole("group", { name: "Schedule week selector" }),
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
      screen.queryByRole("group", { name: "Schedule date selector" }),
    ).not.toBeInTheDocument();

    const weekRail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    expect(
      weekRail.querySelectorAll('button[data-selected="true"]'),
    ).toHaveLength(1);
    expect(getWeekButton("2026-10-12")).toHaveAttribute(
      "data-selected",
      "true",
    );

    await user.click(getWeekButton("2026-10-19"));
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(getWeekButton("2026-10-19")).toHaveAttribute(
      "data-selected",
      "true",
    );

    await user.click(screen.getByRole("tab", { name: "Day" }));
    await waitFor(() => {
      expect(screen.getByTestId("view-mode")).toHaveTextContent("day");
    });
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-21",
    );
    expect(getDateButton("2026-10-21")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("keeps date rail browsing separate from explicit activation", async () => {
    const user = userEvent.setup();
    render(<SelectorFixture />);

    const thursday = getDateButton("2026-10-15");
    await user.click(thursday);

    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-15",
    );
    expect(thursday).toHaveAttribute("data-selected", "true");

    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-15",
    );
    expect(getDateButton("2026-10-16")).toHaveFocus();
    expect(
      screen
        .getByRole("group", { name: "Schedule date selector" })
        .querySelectorAll('button[data-selected="true"]'),
    ).toHaveLength(1);

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("selected-date")).toHaveTextContent(
      "2026-10-16",
    );
    expect(getDateButton("2026-10-16")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it.each([
    ["next", "2026-09-16", "2026-11-24"],
    ["previous", "2026-09-02", "2026-11-10"],
  ] as const)(
    "keeps a contiguous growing Day rail after two %s extensions",
    (direction, expectedFirstKey, expectedLastKey) => {
      render(<SelectorFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      const initialKeys = getDateRailKeys(rail);
      const retainedBoundaryKey =
        direction === "next" ? initialKeys[0] : initialKeys.at(-1);

      extendDateRailAtBoundary(rail, direction);
      extendDateRailAtBoundary(rail, direction);

      const renderedKeys = getDateRailKeys(rail);

      expect(renderedKeys).toHaveLength(initialKeys.length + 14);
      expect(renderedKeys).toHaveLength(70);
      expect(renderedKeys).toContain(retainedBoundaryKey);
      expect(renderedKeys.at(0)).toBe(expectedFirstKey);
      expect(renderedKeys.at(-1)).toBe(expectedLastKey);
      expectUniqueChronologicalKeys(renderedKeys);
    },
  );

  it.each([
    ["next", "2026-09-14", "2026-11-16"],
    ["previous", "2026-08-31", "2026-11-02"],
  ] as const)(
    "keeps a contiguous growing Week rail after two %s extensions",
    (direction, expectedFirstKey, expectedLastKey) => {
      render(<SelectorFixture initialViewMode="week" />);

      const rail = screen.getByRole("group", {
        name: "Schedule week selector",
      });
      const initialKeys = getWeekRailKeys(rail);
      const retainedBoundaryKey =
        direction === "next" ? initialKeys[0] : initialKeys.at(-1);

      extendWeekRailAtBoundary(rail, direction);
      extendWeekRailAtBoundary(rail, direction);

      const renderedKeys = getWeekRailKeys(rail);

      expect(renderedKeys).toHaveLength(initialKeys.length + 2);
      expect(renderedKeys).toHaveLength(10);
      expect(renderedKeys).toContain(retainedBoundaryKey);
      expect(renderedKeys.at(0)).toBe(expectedFirstKey);
      expect(renderedKeys.at(-1)).toBe(expectedLastKey);
      expectUniqueChronologicalKeys(renderedKeys);
    },
  );

  it.each([
    {
      viewMode: "day" as const,
      railName: "Schedule date selector",
      itemSelector: 'button[data-date-key="2026-10-16"]',
      targetLeft: 568,
      targetWidth: 56,
      extend: extendDateRailAtBoundary,
    },
    {
      viewMode: "week" as const,
      railName: "Schedule week selector",
      itemSelector: 'button[data-week-key="2026-10-12"]',
      targetLeft: 612,
      targetWidth: 144,
      extend: extendWeekRailAtBoundary,
    },
  ])(
    "recenters Today in the $viewMode rail when the controlled date key is unchanged",
    ({
      viewMode,
      railName,
      itemSelector,
      targetLeft,
      targetWidth,
      extend,
    }) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 9, 16, 12));
      render(
        <SelectorFixture
          initialDate={DateTime.fromDateOnlyString("2026-10-16").toDate()}
          initialViewMode={viewMode}
        />,
      );

      const rail = screen.getByRole("group", { name: railName });
      const currentTarget = rail.querySelector<HTMLButtonElement>(itemSelector);

      if (!currentTarget) {
        throw new Error("Expected Today to be present before browsing the rail.");
      }

      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });
      Object.defineProperties(currentTarget, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: targetWidth },
      });
      scrollToMock.mockImplementation(function (
        this: HTMLElement,
        options: ScrollToOptions,
      ) {
        this.scrollLeft = options.left ?? this.scrollLeft;
      });

      for (let index = 0; index < 5; index += 1) {
        extend(rail, "next");
      }

      rail.scrollLeft = 0;
      scrollToMock.mockClear();
      fireEvent.click(screen.getByRole("button", { name: "Today" }));

      expect(screen.getByTestId("selected-date")).toHaveTextContent(
        "2026-10-16",
      );
      expect(rail.querySelector(itemSelector)).not.toBeNull();
      expect(scrollToMock).toHaveBeenCalledWith({
        left: targetLeft,
        behavior: "smooth",
      });
    },
  );

  it("smoothly centers a date changed by the schedule screen", async () => {
    const user = userEvent.setup();
    render(<ParentDrivenDateFixture />);

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1600 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedDate = getDateButton("2026-10-16");
    Object.defineProperties(selectedDate, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 56 },
    });
    establishInitialDateRailLayout(rail);
    expect(scrollToMock).toHaveBeenCalledWith({
      left: 468,
      behavior: "auto",
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

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });

      const today = getDateButton("2026-10-16");
      Object.defineProperties(today, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: 56 },
      });
      establishInitialDateRailLayout(rail);
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

    const rail = screen.getByRole("group", {
      name: "Schedule date selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1600 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedDate = getDateButton("2026-10-16");
    Object.defineProperties(selectedDate, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 56 },
    });
    establishInitialDateRailLayout(rail);
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

    const rail = screen.getByRole("group", {
      name: "Schedule week selector",
    });
    Object.defineProperties(rail, {
      clientWidth: { configurable: true, value: 320 },
      scrollWidth: { configurable: true, value: 1200 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    const selectedWeek = getWeekButton("2026-10-19");
    Object.defineProperties(selectedWeek, {
      offsetLeft: { configurable: true, value: 700 },
      offsetWidth: { configurable: true, value: 144 },
    });
    establishInitialWeekRailLayout(rail);
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
    expect(selectedWeek).toHaveAttribute("data-selected", "true");
  });

  it("centers parent-driven date changes instantly for reduced-motion users", async () => {
    motionPreferences.reducedMotion = true;

    try {
      const user = userEvent.setup();
      render(<ParentDrivenDateFixture />);

      const rail = screen.getByRole("group", {
        name: "Schedule date selector",
      });
      Object.defineProperties(rail, {
        clientWidth: { configurable: true, value: 320 },
        scrollWidth: { configurable: true, value: 1600 },
        scrollLeft: { configurable: true, writable: true, value: 0 },
      });

      const selectedDate = getDateButton("2026-10-16");
      Object.defineProperties(selectedDate, {
        offsetLeft: { configurable: true, value: 700 },
        offsetWidth: { configurable: true, value: 56 },
      });
      establishInitialDateRailLayout(rail);
      scrollToMock.mockClear();

      await user.click(
        screen.getByRole("button", { name: "Change date in schedule" }),
      );

      expect(scrollToMock).toHaveBeenCalledWith({
        left: 568,
        behavior: "auto",
      });
    } finally {
      motionPreferences.reducedMotion = false;
    }
  });

  it("uses the selected Day tile itself for the primary surface without an overlay", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 11, 12));
    render(<SelectorFixture />);

    const selectedDate = getDateButton("2026-10-14");
    const today = getDateButton("2026-10-11");

    expect(selectedDate).toHaveClass(
      "border-primary",
      "bg-primary",
      "text-primary-foreground",
    );
    expect(
      selectedDate.querySelector("span.pointer-events-none"),
    ).not.toBeInTheDocument();
    expect(today).not.toHaveAttribute("data-selected");
    expect(today).toHaveClass("border-primary", "bg-card", "text-foreground");
    expect(today).not.toHaveClass("bg-primary");
  });

  it("shows the newly active panel immediately for reduced-motion users", async () => {
    motionPreferences.reducedMotion = true;

    try {
      const user = userEvent.setup();
      render(<SelectorFixture />);

      await user.click(screen.getByRole("tab", { name: "Week" }));

      const panel = screen.getByRole("tabpanel", { name: "Week" });
      expect(panel).toBeVisible();
      expect(panel).not.toHaveAttribute("hidden");
      expect(
        screen.getByRole("group", { name: "Schedule week selector" }),
      ).toBeVisible();
    } finally {
      motionPreferences.reducedMotion = false;
    }
  });
});
