# Weekly Schedule Timeline

**Overview**: Added local Day/Week tabs to the Schedules screen. Day remains the default list view; Week provides a Monday–Sunday timeline for scanning sessions across an entire week.

## Behavior

- Day and Week use one persistent date selector. A screen-owned controlled Day/Week tablist drives the active date rail and the matching schedule result panel: Day shows date buttons and the schedule list; Week shows complete Monday–Sunday range buttons and the timeline.
- Selecting a week preserves the active weekday in the target week. The week calendar highlights the full Monday–Sunday range and a clicked calendar day identifies its containing week.
- In either rail, scrolling and settlement browse the rail without changing the selected range, header, or schedule query. A user scroll that moves the rail near either edge loads adjacent ranges and preserves the visible viewport; programmatic centering, mode switches, and resize adjustments do not trigger edge loading. Taps, Enter or Space on a focused tile, calendar choices, and Today select and smoothly center the chosen range, with instant positioning for reduced motion. Arrow and Page keys move focus and the viewport only. Selecting a week preserves the selected weekday, while Today selects the actual current day.
- The timeline always displays the full day, from 00:00 through 24:00, with localized hourly labels from 12 AM through 11 PM. It has 24 88px hourly rows, each split into two 44px create targets at `:00` and `:30`. An empty week still renders this interactive grid instead of empty-state copy or an inline Add action.
- Activating a blank half-hour target selects that day and opens Add New Schedule with the cell's date and exact start time prefilled; the one-time duration is left unselected and must be chosen before saving. Day toolbar Add and the Week header Add action continue to use their 09:00 default.
- In the schedule drawer, each class result is a full-card action: choosing a class selects it and closes the picker immediately. Reopening the picker keeps the committed class visibly and accessibly marked as selected.
- Only scheduled and completed sessions are positioned in the Week timeline. Cancelled and no-show sessions remain available in Day view and are excluded before weekly date grouping and lane allocation; overlapping displayed sessions are split into separate lanes.
- A current-time line appears only in today's column when that day is in the displayed week. It follows the local time at minute boundaries, uses a 2px primary line with 8px edge dots, and ignores pointer input so cells and schedule blocks remain interactive.
- Timeline blocks use the matching light Badge status tones: info for scheduled and success for completed. Each block keeps the class name on its first line and shows the time followed by status and delivery icons on the next line. Blocks remain above cells so they open the existing schedule details drawer when clicked or focused with the keyboard.
- Search and status chips apply only in Day view. Switching to Week hides search and requests the unfiltered seven-day range; its Day search text and selected Day status remain ready when returning to Day.
- The populated Week timeline fills the available content width and remaining screen height at every viewport. On phones it spans the viewport width. The seven-day grid scrolls horizontally with 104px minimum day columns below `sm` and 144px columns from `sm` upward; the sticky time axis stays fully visible at the left edge.
- Week mode hides both the mobile floating Add Schedule button and the mobile header Add action; blank half-hour slots remain the mobile create path. The labeled Week header Add action remains from `sm` upward. Week does not reserve FAB bottom spacing. Day mode keeps its desktop toolbar Add and mobile FAB.

## Scroll and motion polish

- Week mode uses the available viewport height and keeps page scrolling fixed while the timeline owns vertical and horizontal scrolling. The populated mobile timeline is full bleed, with no FAB-sized bottom gap.
- Both rails use native horizontal scrolling with centered snap points. Only a user-initiated scroll session that actually moves the rail can load an adjacent range near either edge; a settled rail position leaves the selected day or week untouched. Programmatic centering during a mode switch, resize, or explicit selection never starts an edge-loading session, and an explicit selection or mode switch cancels any unsettled browse session. Prepending or rotating ranges preserves the browsing viewport, as do resize and orientation changes after the initial layout. Duplicate settlement notifications do not rotate the buffer twice, while a later user movement toward an edge can load again. Programmatic smooth centering is reserved for explicit selection, and reduced-motion users receive immediate centering.
- The shared selector header remains above the scrollport, while the weekday/date header stays sticky at the top and the time axis stays sticky on the left. The empty grid follows the same full-bleed and sticky-axis behavior as populated weeks.
- Day and Week use the shared Animate UI Base Tabs content transition across each mode's date rail, Day search and toolbar Add, status filters, and result panel, including list, timeline, loading, error, and empty states. The panel uses the shared 0.5-second `easeInOut` fade/blur transition; its layout container uses the shared spring transition. Reduced-motion users receive immediate panel and layout changes. The shared period label, Today control, and Day/Week tabs stay in place; the labeled Week Add action appears beside the tabs from `sm` upward, while search and status filters remain Day-only.
- `WeekDateSelector` shows an outlined Today control with a calendar icon and a bordered Day/Week tablist with an indigo active pill. At 480px and wider it shows the full period label; from 360px the compact period label, Today, and Day/Week controls share one row. Below 360px the period label may sit above the remaining controls. Week Add appears only at `sm` and wider. The tab track has a 36px visible surface and 44px tab targets; Today has a 32px outlined surface inside a 44px target. The current week has a primary border and accessible “Contains today” label without a dot.
- Timeline labels fall back to on-site delivery data when a legacy schedule record omits its type, so accessible labels never expose `undefined`.
- The selected timeline-day header applies a subtle primary surface and primary weekday/date text. A non-selected Today column keeps its distinct weekday emphasis. Selected Day-rail dates use a direct primary surface and border, without an overlay layer.

## API contract

`GET /v1/schedules` accepts an inclusive date range through `startDate` and `endDate` in `YYYY-MM-DD` format. The two parameters must be supplied together, cannot be combined with the exact `date` filter, must be ordered from earliest to latest, and may cover at most 31 calendar days. The weekly UI requests exactly seven days.

The existing tutor scoping, class filtering, Day search behavior, exact-date filtering, and date/time ordering are unchanged.

## Accessibility and states

- Day/Week controls expose real tab, tabpanel, and association semantics. ArrowLeft/ArrowRight/Home/End move focus without changing the query; Enter and Space activate the focused mode. The selector shows only the active date rail, and the screen exposes the active mode's semantic result panel.
- Date and week rails are named groups of native buttons, not radio groups. Their roving tab stop begins on the selected range when it is buffered, or a visible browse target when it is not. Arrow and Page keys move focus without selecting; Enter and Space select the focused button. Focusing a rail never restores or recenters an off-buffer selected range.
- Each session is a labeled button that announces class, date, time, status, and delivery type before opening the details drawer. Every half-hour interval is a labeled native button with a localized create action; cells use a roving tab stop that begins at 09:00 on the selected date, ArrowUp/ArrowDown moves by 30 minutes, and ArrowLeft/ArrowRight moves by a day. Enter or Space activates a cell, and focused cells scroll into view.
- The current-time marker has a localized accessible label and is not a live region, so it does not interrupt screen-reader users as the minute changes. The hourly axis and marker time are localized for English and Thai.
- Cells use primary hover and pressed states plus the shared indigo focus ring. The scrollport keeps native two-axis touch panning; touch creation requires movement below 8px, so scroll gestures do not create a schedule. Drawer close returns focus to the originating cell, event, or toolbar Add button. If an open event is removed after its status changes, focus falls back to the active timeline cell when no visible trigger remains.
- Loading and error states remain in use. A successfully loaded empty Week renders the default interactive grid.
- Timeline motion uses the existing reduced-motion utilities.
- Week scrolling keeps the selector, weekday/date header, and time axis available while the grid moves.

## Key files

- `backend/src/schemas/schedule.schema.ts` — Range validation and type inference.
- `backend/src/routes/schedules.ts` — Documented range query parameters.
- `backend/src/repositories/schedule.repository.ts` — Inclusive range filtering.
- `frontend/src/components/animate-ui/components/base/tabs.tsx` — Local Animate UI Base Tabs composition used by the selector.
- `frontend/src/components/schedules/weekly-schedule-timeline.tsx` — Timeline grid.
- `frontend/src/components/schedules/week-date-selector/` — Shared schedule header, persistent day/week rail, and week-range calendar trigger.
- `frontend/src/screens/schedules-screen.tsx` — View state, queries, filters, and drawer wiring.
- `frontend/src/lib/i18n/locales/en/schedules.ts` — Week view and accessibility copy.

## Verification

- Backend schema, route, and repository tests pass for range validation and filtering.
- The frontend TypeScript check and production build pass after regenerating the local OpenAPI client.
- Browser verification passed at 320px and 390px for the responsive toolbar, 44px Today/tab targets, a full-width Week timeline, no page overflow, and fully visible sticky time labels after vertical and horizontal scrolling. Existing coverage also passed at 768px and 1280px for the desktop inline Add action. Loading and error states were not naturally exercised, and no pixel-baseline visual regression was captured.
- In the prior refinement, manual browser checks at 320px, 390px, 768px, and 1440px confirmed no page overflow, the then-present mobile Week Add action, the desktop text Add action, the selected-week fill, consistent compact vertical spacing, and panel alignment to the viewport bottom. The mobile Week Add action has since been removed; the local dataset was empty, so populated timeline scrolling and event layout were not re-exercised; the 104px/144px grid sizing was verified from source.
- For the Day/Week polish, the empty Week view was visually checked at 320px, 526px, and 889px. Week Add stayed beside the tabs as an icon button on mobile and a labeled button at desktop width; the selected Oct 7 timeline header highlighted both weekday and date. Focused tests cover the seamless Day tile and motion/accessibility states. The local dataset remains empty, so populated-event layout was not visually rechecked.
- For the half-hour timeline update, the Week view was visually checked at a compact viewport. The accessibility tree exposed 48 distinct create buttons per day, including separate `00:00` and `00:30` targets, and schedule blocks remained detail buttons. Source review confirmed the fixed 24-hour grid, minute-updated current-time marker, and 30-minute keyboard step. The frontend production build passed; tests were not run.
