# Week Date Selector Component

## Overview

`WeekDateSelector` is an infinite date navigation component for the schedules screen. Tutors can scroll through dates without changing the committed schedule date, then explicitly select a day from the rail, keyboard, Today action, or date picker.

## Architecture

```
src/components/schedules/week-date-selector/
├── index.tsx              # Header controls and bounded date buffer
└── weekday-view.tsx       # Accessible infinite date rail
```

## Component API

```typescript
interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}
```

## Features

### Infinite date rail

- Starts with 28 days before and 27 days after the committed date. The DOM buffer is always 56 dates: each edge extension rotates the opposite-edge week out while retaining a continuous visible sequence.
- Passive drag, swipe, and trackpad scrolling only moves and replenishes the rail; it never calls `onDateSelect` or changes the schedule query date.
- Prepending corrects `scrollLeft` by the measured inserted track width before paint, so the visible dates do not jump, skip, or repeat.
- Date tiles remain 56px square with 8px gaps at every breakpoint. The track has screen gutters and a one-tile continuation width, does not wrap or hide dates at `md`, and intentionally exposes a partial adjacent tile at an edge.

### Selection and header controls

- The month label remains a `DateField` trigger and always reflects the committed selected date, never the passively visible dates. When the external date is `null`, the rail and header use today as an internal fallback until a date is selected.
- Today and calendar selections call `onDateSelect`; a date outside the current buffer rebuilds the bounded range around that date.
- Clicking/tapping a tile, ArrowLeft/ArrowRight, PageUp/PageDown, Today, and date-picker selections smoothly center the selected tile by default. Reduced-motion users receive instant positioning.
- Selected dates use the primary tile treatment. Unselected today has a primary outline and dot; month boundaries show a compact month marker.

### Accessibility and motion

- The rail is a named radiogroup with a visually hidden instruction that explains horizontal scrolling and keyboard selection.
- Roving tab focus keeps only the selected date in the tab order. Arrow keys select and focus the adjacent day; Page Up/Page Down move seven days and request more buffer before crossing an edge. If passive scrolling has rotated the committed date out of the fixed DOM window, the radiogroup retains a screen-reader-only checked representation of that logical selection; Tab restores and focuses its visible tile without changing the committed date.
- Tile labels include the localized full date plus Today and Selected state where applicable. All controls meet the 44px target minimum and retain visible focus rings.
- There is no slide or tap-scale animation. Explicit selection centering uses native smooth scrolling by default and is instant for reduced-motion users; buffer compensation, resize re-centering, and logical selected-date restoration are always instant.
- While native smooth centering is active, its emitted scroll events cannot extend the buffer. `scrollend` clears that guard when available, with a short post-scroll fallback; wheel, pointer/touch, and date-navigation input cancel it immediately.

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
  today: "Today",
  selected: "Selected",
  dateRailLabel: "Schedule date selector",
  dateRailInstruction: "Scroll horizontally to browse dates. Use the Left and Right Arrow keys to select a day. Use Page Up and Page Down to move by a week.",
}
```

## Styling

```typescript
// Scrollport and internally-guttered fixed-width track
className="relative min-w-0 max-w-full overflow-x-auto py-1 scroll-py-1 overscroll-x-contain touch-pan-x"
className="flex w-max min-w-[calc(100%+4rem)] gap-2 px-3 sm:px-4 lg:px-6"

// Date tiles
className="relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5"
```

The component uses existing color, border, typography, and focus-ring tokens. It intentionally does not add a scrollbar treatment, edge gradient, or shadow.
