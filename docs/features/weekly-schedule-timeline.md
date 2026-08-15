# Weekly Schedule Timeline

**Overview**: Added a local Day/Week switch to the Schedules screen. Day remains the default list view; Week provides a Monday–Sunday timeline for scanning sessions across an entire week.

## Behavior

- Day and Week use one persistent date selector. The day rail stays available in Day mode; Week mode turns that rail into complete Monday–Sunday range buttons.
- Selecting a week preserves the active weekday in the target week. The week calendar highlights the full Monday–Sunday range and a clicked calendar day identifies its containing week.
- In either rail, a touch tap commits immediately on `pointerup` before smooth centering. Horizontal swipes scroll without changing the committed day or week selection.
- The timeline displays 06:00–22:00 by default and expands to include sessions outside that range.
- Sessions are positioned by start time and duration. Overlapping sessions are split into separate lanes.
- Timeline blocks reuse schedule status colors and delivery-type icons, and activate the existing schedule details drawer when clicked or focused with the keyboard.
- Search and status filters apply in both views. Empty timeline cells are display-only and never create schedules.
- On narrow screens the seven-day grid scrolls horizontally while keeping a readable minimum width for each day.

## Scroll and motion polish

- Week mode uses the available viewport height and keeps page scrolling fixed while the timeline owns vertical and horizontal scrolling.
- The shared selector header remains above the scrollport, while the weekday/date header stays sticky at the top and the time axis stays sticky on the left.
- Day and Week share one compact switch and one date-selection footprint. The selector locally morphs its period label and selected rail item with restrained 200ms motion; reduced-motion users receive an immediate update.
- `WeekDateSelector` owns the shared 44px header: its calendar period trigger remains on the left, with a non-wrapping Today then Day/Week control cluster on the right. At narrow widths it uses a localized short visible period label and 8px control spacing; at `sm` and wider it restores the full label and standard gutters.
- Timeline labels fall back to on-site delivery data when a legacy schedule record omits its type, so accessible labels never expose `undefined`.

## API contract

`GET /v1/schedules` accepts an inclusive date range through `startDate` and `endDate` in `YYYY-MM-DD` format. The two parameters must be supplied together, cannot be combined with the exact `date` filter, must be ordered from earliest to latest, and may cover at most 31 calendar days. The weekly UI requests exactly seven days.

The existing tutor scoping, class filtering, search behavior, exact-date filtering, and date/time ordering are unchanged.

## Accessibility and states

- Day/Week controls expose pressed state and remain keyboard reachable.
- Each session is a labeled button that announces class, date, time, status, and delivery type before opening the details drawer.
- Existing loading, error, empty, and filtered-empty patterns remain in use, with week-specific empty-state copy.
- Timeline motion uses the existing reduced-motion utilities.
- Week scrolling keeps the selector, weekday/date header, and time axis available while the grid moves.

## Key files

- `backend/src/schemas/schedule.schema.ts` — Range validation and type inference.
- `backend/src/routes/schedules.ts` — Documented range query parameters.
- `backend/src/repositories/schedule.repository.ts` — Inclusive range filtering.
- `frontend/src/components/schedules/schedule-view-switch.tsx` — Shared Day/Week switch owner.
- `frontend/src/components/schedules/weekly-schedule-timeline.tsx` — Timeline grid.
- `frontend/src/components/schedules/week-date-selector/` — Shared schedule header, persistent day/week rail, and week-range calendar trigger.
- `frontend/src/screens/schedules-screen.tsx` — View state, queries, filters, and drawer wiring.
- `frontend/src/lib/i18n/locales/en/schedules.ts` — Week view and accessibility copy.

## Verification

- Backend schema, route, and repository tests pass for range validation and filtering.
- The frontend TypeScript check and production build pass after regenerating the local OpenAPI client.
- Browser verification passed at 320px, 393px, 768px, 1024px, and 1280px for compact shared controls, no page overflow, mode switching, rails, timeline, keyboard/date interactions, and Thai compact labels. Loading and error states were not naturally exercised, and no pixel-baseline visual regression was captured.
