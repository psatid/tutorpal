# Week Date Selector Component

## Overview

`WeekDateSelector` is the persistent date navigation component for the schedules screen. Tutors can switch between a day rail and a week rail without the surrounding controls moving. Scrolling moves the rail viewport and can load adjacent ranges without changing the selected range or schedule query. Direct choices from a tile, Enter or Space on a focused tile, Today, or the calendar select a range.

`SchedulesScreen` owns the controlled `viewMode`; the selector reports activated tabs and can render its date rails into that outer Tabs context. Standalone use owns a local Tabs root but still requires the controlled mode and change callback. Switching modes preserves the committed date and changes the schedule query shape.

## Architecture

```
src/components/schedules/week-date-selector/
├── week-date-selector.tsx # Header controls and range loading
├── weekday-view.tsx       # Accessible infinite date rail
├── week-view.tsx          # Accessible infinite complete-week rail
└── week-utils.ts          # Monday–Sunday range helpers and labels
```

The header composes the vendored Animate UI Base Tabs wrapper at
`src/components/animate-ui/components/base/tabs.tsx`. Its primitives remain
local under `src/components/animate-ui/` so the selector uses the project's
existing Base UI and Framer Motion dependencies.

## Component API

```typescript
import type { ReactNode } from "react";

type ScheduleViewMode = "day" | "week";

type WeekDateSelectorCommonProps = {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
};

type WeekDateSelectorProps = WeekDateSelectorCommonProps &
  (
    | {
        viewMode: ScheduleViewMode;
        onViewModeChange: (viewMode: ScheduleViewMode) => void;
        children?: never;
      }
    | {
        viewMode: ScheduleViewMode;
        onViewModeChange?: never;
        children: (rails: { day: ReactNode; week: ReactNode }) => ReactNode;
      }
  );
```

## Features

### Day mode

- Keeps a continuous date range that can move independently of the selected date. Directional user scrolling loads one adjacent week as soon as it enters the edge prefetch zone (`max(128px, one tile stride)`, capped at half the scrollable span); settling leaves the selected date and schedule query unchanged. Wheel, mouse, and trackpad input extend at threshold crossing even when the wheel event arrives after the browser updates its scroll offset; touch queues the rotation until the gesture is safe to settle.
- Loading at either edge preserves the visible dates' screen positions. The selected date may fall outside the loaded buffer while browsing continues.
- Date tiles remain 56px square with 8px gaps at every breakpoint. The track has screen gutters and a one-tile continuation width, does not wrap or hide dates at `md`, and intentionally exposes a partial adjacent tile at an edge.

### Selection and header controls

- `WeekDateSelector` owns the shared header controls: the calendar period trigger precedes Today and the controlled Day/Week tabs. Today and the tabs stay together on one line. Standalone callers provide `viewMode` and `onViewModeChange`; composed callers provide `viewMode` and a `children` render prop for the two rails, while their parent Tabs root owns mode changes.
- From 480px, the trigger shows the full period label; from 360px, the localized compact period label, Today, and Day/Week controls share one row. Below 360px, the period label may sit above while Today and the tabs stay paired. The complete month or week range remains in the accessible calendar label. The tab track has a 36px visible surface with 44px tab targets; Today keeps its 32px outlined surface inside a 44px target.
- The month label remains a `DateField` trigger and reflects the selected date or week. When the external date is `null`, the rail and header use today as an internal fallback until a date is selected.
- Today and calendar selections call `onDateSelect`; the rail loads around an out-of-range target before centering it.
- Clicking/tapping a tile, Enter or Space on a focused tile, Today, and date-picker selections smoothly center the selected tile by default. Reduced-motion users receive instant positioning.
- ArrowLeft/ArrowRight and PageUp/PageDown move the roving button focus and viewport without selecting. Day arrows move one day and Page keys move one week; Week arrows move one week and Page keys move four weeks.
- Parent-driven date or week changes, such as changing the schedule date from another control, also smoothly center the selected tile once it is present in the rail. Initial positioning and reduced-motion positioning remain instant.
- A tile tap selects and smoothly centers its target. Native scrolling settles on centered snap points and may load an adjacent range after actual directional user scroll movement enters the edge prefetch zone, without changing selection or keyboard focus during passive touch, wheel, or trackpad scrolling. Programmatic centering, mode switches, and resize adjustments never start edge loading.
- Selected dates use the primary tile treatment. Unselected today has a primary outline only; month boundaries show a compact month marker.

### Week mode

- Keeps a continuous sequence of complete Monday–Sunday ranges. Directional user scrolling loads one adjacent week when it enters the edge prefetch zone (`max(128px, one tile stride)`, capped at half the scrollable span); wheel, mouse, and trackpad input extend at threshold crossing even when the wheel event arrives after the browser updates its scroll offset, while touch queues rotation until the gesture is safe to settle. Browsing and settling leave the selected week unchanged.
- Week buttons are horizontally scrollable at every viewport, keep a 128px minimum width, and show compact ranges (`Aug 10–16`, `Aug 31 – Sep 6`, or both years when needed). The current week keeps its primary border and accessible “Contains today” label without an extra dot.
- Choosing a week—whether from the rail or calendar—preserves the committed weekday within that target week. A calendar click identifies the target week rather than changing the active weekday.
- The header keeps the same layout in both modes and updates from the day-mode month label to the current week range directly. The calendar uses a controlled Monday–Sunday range highlight and closes as soon as a day is chosen.
- Day and Week rails use the same compact vertical spacing at every breakpoint. On mobile Week, `SchedulesScreen` places the labeled icon-only Add control beside search; larger viewports retain the text Add action.

### Accessibility and motion

- Each rail is a named group of native buttons with a visually hidden instruction that separates browsing from selection.
- The Day/Week control is a named `tablist` with associated `tab` and `tabpanel` roles. It uses manual activation: ArrowLeft, ArrowRight, Home, and End move tab focus; Enter and Space activate the focused mode. The active date rail is the only one exposed to assistive technology; a rail retained for its exit animation becomes inert and hidden from accessibility APIs immediately.
- Roving tab focus uses the selected range when it is buffered; otherwise it uses a visible browse target. Arrow keys and Page keys move focus and the viewport without selection. Enter and Space activate the focused native button. Receiving focus never restores or recenters an older selected range.
- Tile labels include the localized full date plus Today and Selected state where applicable. All controls meet the 44px target minimum and retain visible focus rings.
- Explicit selection centering uses native smooth scrolling by default and is instant for reduced-motion users. Resize and orientation changes preserve the current browse viewport after initial layout, except while an explicit selection is centering. Range loading and scroll-position compensation are immediate.
- Rail settlement uses the native `scrollend` event with a quiet-period fallback where needed. Only a user-initiated directional scroll session can load an adjacent range, and it does so on entering the edge prefetch zone rather than waiting for the hard edge or settlement. Once the buffer advances, continued scrolling can load another range when it enters the next edge zone; duplicate movement inside the same zone does not rotate the buffer again. Programmatic centering, compensation, click-only input, and layout changes do not trigger edge loading. An explicit selection or mode switch cancels any unsettled browse session before centering. Scrolling never selects or focuses a tile. Programmatic centering is reserved for explicit selection.
- Week labels announce their full Monday–Sunday range plus selected/current-week state. Selecting a week preserves the active weekday, while Today selects the actual current day.
- The selector exposes one active date rail. `SchedulesScreen` uses its single controlled Animate UI Tabs root to apply matching 180ms transitions to the rail and result panel, so the day list and week timeline change with the rail. The period label and selected rail fills update directly; rails do not share a cross-mode tile morph. `MotionConfig` follows the user’s reduced-motion preference, and the highlight and panels receive zero-duration transitions when motion is reduced.

## WeekdayView API

```typescript
interface WeekdayViewProps {
  dates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onExtendDateBuffer: (direction: "previous" | "next") => void;
  centerRequest: {
    id: number;
    behavior: ScrollBehavior;
  };
  className?: string;
}
```

## Translations

```typescript
weekSelector: {
  openCalendar: "Open calendar for {{month}}",
  openWeekCalendar: "Open calendar for {{week}}",
  today: "Today",
  selected: "Selected",
  selectedWeek: "Selected week",
  containsToday: "Contains today",
  dateRailLabel: "Schedule date selector",
  dateRailInstruction: "Scroll horizontally to browse dates without changing the selected date. Select a date with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused date.",
  weekRailLabel: "Schedule week selector",
  weekRailInstruction: "Scroll horizontally to browse weeks without changing the selected week. Select a week with its button. Use the Left and Right Arrow keys or Page Up and Page Down to move focus without selecting. Press Enter or Space to select the focused week.",
  weekLabel: "Week of {{start}} through {{end}}",
}
```

## Styling

```typescript
// Both scrollports use centered snap points and responsive scroll gutters
className="snap-x snap-mandatory scroll-px-3 sm:scroll-px-4 lg:scroll-px-6"

// Date and week tiles are centered snap targets
className="snap-center snap-always"
```

The component uses existing color, border, typography, motion, and focus-ring tokens. It intentionally does not add a scrollbar treatment, edge gradient, shadow, or a second toolbar.
