# Week Date Selector Component

## Overview

`WeekDateSelector` is the persistent date navigation component for the schedules screen. Tutors can switch between a day rail and a week rail without the surrounding controls moving. Passive scrolling never changes the committed selection; an explicit tile, keyboard action, Today action, or calendar selection does.

## Architecture

```
src/components/schedules/week-date-selector/
├── week-date-selector.tsx # Header controls and bounded date buffers
├── weekday-view.tsx       # Accessible infinite date rail
├── week-view.tsx          # Accessible infinite complete-week rail
└── week-utils.ts          # Monday–Sunday range helpers and labels
```

## Component API

```typescript
interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  viewMode?: "day" | "week";
  className?: string;
}
```

## Features

### Day mode

- Starts with 28 days before and 27 days after the committed date. The DOM buffer is always 56 dates: each edge extension rotates the opposite-edge week out while retaining a continuous visible sequence.
- Passive drag, swipe, and trackpad scrolling only moves and replenishes the rail; it never calls `onDateSelect` or changes the schedule query date.
- Prepending corrects `scrollLeft` by the measured inserted track width before paint, so the visible dates do not jump, skip, or repeat.
- Date tiles remain 56px square with 8px gaps at every breakpoint. The track has screen gutters and a one-tile continuation width, does not wrap or hide dates at `md`, and intentionally exposes a partial adjacent tile at an edge.

### Selection and header controls

- The month label remains a `DateField` trigger and always reflects the committed selected date, never the passively visible dates. When the external date is `null`, the rail and header use today as an internal fallback until a date is selected.
- Today and calendar selections call `onDateSelect`; a date outside the current buffer rebuilds the bounded range around that date.
- Clicking/tapping a tile, ArrowLeft/ArrowRight, PageUp/PageDown, Today, and date-picker selections smoothly center the selected tile by default. Reduced-motion users receive instant positioning.
- Selected dates use the primary tile treatment. Unselected today has a primary outline and dot; month boundaries show a compact month marker.

### Week mode

- Uses eight complete Monday–Sunday ranges: four before the selected week, the selected week, and three after. Edge extension rotates one full week at a time and compensates the scroll position before paint.
- Week buttons are 56px high and horizontally scrollable at every viewport. They show a compact range (`Aug 10–16`, `Aug 31 – Sep 6`, or both years when needed), retain a partial adjacent button at the edge, and do not add previous/next controls.
- Choosing a week—whether from the rail or calendar—preserves the committed weekday within that target week. A calendar click identifies the target week rather than changing the active weekday.
- The header stays in the same one-line position: it morphs from the day-mode month label to the current week range. The calendar uses a controlled Monday–Sunday range highlight and closes as soon as a day is chosen.

### Accessibility and motion

- Each rail is a named radiogroup with a visually hidden instruction that explains horizontal scrolling and keyboard selection.
- Roving tab focus keeps only the selected date in the tab order. Arrow keys select and focus the adjacent day; Page Up/Page Down move seven days and request more buffer before crossing an edge. If passive scrolling has rotated the committed date out of the fixed DOM window, the radiogroup retains a screen-reader-only checked representation of that logical selection; Tab restores and focuses its visible tile without changing the committed date.
- Tile labels include the localized full date plus Today and Selected state where applicable. All controls meet the 44px target minimum and retain visible focus rings.
- There is no slide or tap-scale animation. Explicit selection centering uses native smooth scrolling by default and is instant for reduced-motion users; buffer compensation, resize re-centering, and logical selected-date restoration are always instant.
- While native smooth centering is active, its emitted scroll events cannot extend the buffer. `scrollend` clears that guard when available, with a short post-scroll fallback; wheel, pointer/touch, and date-navigation input cancel it immediately.
- Week mode uses the same focus restoration pattern: only the selected week is tabbable, ArrowLeft/ArrowRight move one week, and PageUp/PageDown move four weeks. Week labels announce their full Monday–Sunday range plus selected/current-week state.
- Day/Week changes use a focused 200ms selector-only shared-layout/crossfade transition. Reduced-motion users receive an immediate label/tile change and instant centering.

## WeekdayView API

```typescript
interface WeekdayViewProps {
  dates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onExtendDateBuffer: (direction: "previous" | "next") => void;
  onRestoreSelectedDate: () => void;
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
  dateRailInstruction: "Scroll horizontally to browse dates. Use the Left and Right Arrow keys to select a day. Use Page Up and Page Down to move by a week.",
  weekRailLabel: "Schedule week selector",
  weekRailInstruction: "Scroll horizontally to browse weeks. Use the Left and Right Arrow keys to select a week. Use Page Up and Page Down to move by four weeks.",
  weekLabel: "Week of {{start}} through {{end}}",
}
```

## Styling

```typescript
// Scrollport and internally-guttered fixed-width track
className="relative min-w-0 max-w-full overflow-x-auto py-1 scroll-py-1 overscroll-x-contain touch-pan-x"
className="flex w-max min-w-[calc(100%+4rem)] gap-2 px-3 sm:px-4 lg:px-6"

// Date tiles
className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5"

// Week tiles
className="relative flex h-14 w-32 shrink-0 items-center justify-center rounded-xl border px-3 py-1.5"
```

The component uses existing color, border, typography, motion, and focus-ring tokens. It intentionally does not add a scrollbar treatment, edge gradient, shadow, or a second toolbar.
