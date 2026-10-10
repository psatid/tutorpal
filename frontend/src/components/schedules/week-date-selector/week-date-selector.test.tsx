import { render, screen, waitFor, within } from "@testing-library/react";
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
