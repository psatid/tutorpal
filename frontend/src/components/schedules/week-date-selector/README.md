# Week Date Selector Component

## Overview

The `WeekDateSelector` is a week-based date navigation component for the schedules screen. It allows users to:
- Navigate weeks by swiping left/right or using navigation arrows
- Select specific days within the current week
- Jump to today's date
- Open a full calendar drawer for date selection

## Architecture

```
src/components/schedules/week-date-selector/
├── index.tsx              # Main component controller
├── weekday-view.tsx       # 7-day week row display
├── calendar-drawer.tsx    # Bottom sheet calendar
├── calendar-view.tsx      # Calendar body (reused from shadcn)
└── constants.ts           # Animation constants
```

## Component API

```typescript
interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}
```

## Usage

```typescript
import { WeekDateSelector } from "@/components/schedules/week-date-selector";
import { DateTime } from "@/lib/date-time";

function SchedulesScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(
    DateTime.today().toDate(),
  );

  return (
    <WeekDateSelector
      selectedDate={selectedDate}
      onDateSelect={setSelectedDate}
    />
  );
}
```

## Features

### Week-Based Navigation

- **Week starts on Monday**: Uses `DateTime.startOfWeek()`
- **Fixed 7-day display**: Shows exactly 7 days from Monday to Sunday
- **Swipe gestures**: Touch swipe left/right changes weeks
- **Arrow buttons**: Click arrows to navigate weeks

### Date Selection

- **Tap to select**: Click any day in the week to select it
- **Visual feedback**: Selected day uses a tinted card with a solid primary number chip
- **Today indicator**: Unselected today shows a subtle primary ring on the date plus a small dot

### Header Controls

- **Month label**: Clickable month/year display (e.g., "June 2026")
  - Opens full calendar drawer when clicked
- **Today button**: Quick jump to current date with calendar icon

### Calendar Drawer

- **Bottom sheet**: Full calendar in modal bottom drawer
- **Month navigation**: Browse months with arrow buttons
- **Date selection**: Tap any date to select and close drawer
- **Proper drawer primitives**: Uses Base UI drawer components

## Component Details

### WeekdayView

```typescript
interface WeekdayViewProps {
  dates: Date[];              // Exactly 7 days (Monday-Sunday)
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: "prev" | "next") => void;
  className?: string;
}
```

**Features:**
- Displays 7 date buttons in a horizontal row
- Each button shows: month abbreviation, day number, weekday name
- Uses max-width day buttons with distributed spacing on tablet so the row stays compact instead of inflating into oversized squares
- Swipe detection for week navigation
- Animation on tap (scale down effect)
- Selected state with calmer product-style emphasis instead of a full saturated tile
- Today indicator (small dot)

**Touch Behavior:**
- Swipe left (>50px): Move to next week
- Swipe right (>50px): Move to previous week

### CalendarDrawer

```typescript
interface CalendarDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}
```

**Features:**
- Bottom sheet drawer with backdrop
- Reuses `CalendarView` component
- Closes automatically on date selection
- Uses Base UI drawer primitives

## Styling

### Design System Tokens

```css
/* Colors */
bg-primary-container  /* Selected day card background */
text-on-primary-container /* Selected day card text */
bg-primary            /* Selected day number chip */
text-primary-foreground /* Selected day number chip text */
bg-surface           /* Component background */
text-on-surface       /* Default text */
text-on-surface-variant /* Weekday names */

/* Spacing */
rounded-2xl          /* Component corners */
rounded-[20px]       /* Day buttons */
rounded-full         /* Today indicator, day circle */

/* Typography */
font-headline        /* Month label */
font-body            /* Day numbers, weekday names */
```

### Component Styling

```typescript
// Main container
className="bg-surface rounded-2xl mb-4 overflow-hidden"

// Week day buttons
className={cn(
  "min-h-24 min-w-0 flex flex-col items-center justify-center gap-1 rounded-xl border px-1.5 py-3 md:max-w-[96px] md:flex-1",
  isSelected
    ? "border-primary bg-primary-container text-on-primary-container"
    : "bg-card border border-outline-variant text-on-surface hover:border-primary/30 hover:bg-surface-container-low"
)}

// Month label button
className="px-3 py-1.5 rounded-full hover:bg-card transition-colors font-headline font-semibold text-base text-on-surface"
```

## Animation

### Motion Variants

```typescript
const weekdayItemVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: [0.23, 1, 0.32, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.95,
    transition: {
      duration: 0.15,
      ease: [0.23, 1, 0.32, 1],
    },
  },
};
```

**Interactions:**
- Tap animation: `whileTap={{ scale: 0.97 }}`
- Selected item: `layoutId` for smooth transitions

## Accessibility

- **ARIA labels**: Proper labels for buttons (e.g., "Previous week", "Today")
- **Keyboard navigation**: Tab through week days, Enter/Space to select
- **Touch support**: Swipe gestures for week navigation
- **Screen reader**: Descriptive labels include day name and "today" indicator

## Translations

```typescript
// locales/en/schedules.ts
weekSelector: {
  today: "Today",
}
```

## Behavior Notes

### Week Navigation

1. **Navigation arrows**: Click left/right arrows to change weeks
2. **Swipe gestures**: Touch swipe left/right on week row
3. **Week preservation**: When changing weeks, maintains the same weekday
4. **Month updates**: Week navigation updates the displayed month

### Date Selection

1. **No auto-scroll**: Selected date does NOT auto-scroll to center (removed old behavior)
2. **Week update**: Selecting a date outside current week updates the week view
3. **Calendar drawer**: Closing drawer after selection shows new week

### Month Display

- **Single month**: Shows month of selected date (e.g., "June 2026")
- **Cross-month weeks**: Still shows selected date's month for consistency
- **Clickable**: Opens calendar drawer for quick month navigation

## Migration Notes

### Previous Behavior (Removed)

- ❌ Infinite horizontal scroll
- ❌ Sentinel-based lazy loading
- ❌ Auto-scroll to center on selection
- ❌ Inline expand/collapse calendar
- ❌ Buffer days concept

### New Behavior

- ✅ Fixed 7-day week display
- ✅ Week-based navigation
- ✅ Bottom drawer calendar
- ✅ Month header with click-to-open
- ✅ Today quick action

## Troubleshooting

### Week Not Updating

**Issue**: Date selection doesn't change week view

**Solution**: Ensure `selectedDate` prop is updated via `onDateSelect` callback

### Swipe Not Working

**Issue**: Touch swipe doesn't change weeks

**Solution**: Check that `WeekdayView` has touch event handlers and threshold is >50px

### Calendar Not Opening

**Issue**: Month label doesn't open calendar drawer

**Solution**: Verify `isCalendarDrawerOpen` state is managed and `onOpenChange` is called

### TypeScript Errors

**Issue**: Type errors with touch events

**Solution**: Use optional chaining for touch coordinates:
```typescript
touchStartX = e.touches[0]?.clientX || 0;
```
