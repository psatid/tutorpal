# Tutor Getting Started Checklist — October 7, 2026

The Dashboard includes a non-blocking Getting started checklist after the Today hub. It derives progress from existing classes and schedules:

- A class is complete when at least one class exists. Students remain optional.
- Class hours are complete when any class has `totalHours > 0`; using scheduled hours does not change this result.
- A schedule is complete when any schedule record exists, including recurring, completed, no-show, and cancelled records.

The active step reuses existing forms. Creating a class or a schedule opens its existing drawer directly on the Dashboard. The schedule drawer starts with the current date and allows a tutor to choose a one-time or recurring schedule. Adding hours first opens Classes; selecting a class from that guided route opens the existing class-detail Add hours drawer. After the existing cache invalidation confirms added hours, a short-lived Dashboard route signal announces the completed hours step and moves focus to the next action. Closing a drawer leaves the tutor at the current destination.

Checklist dismissal is stored in browser storage under the authenticated user ID, so it does not carry to another account. The Dashboard provides a Show getting started link while dismissed. When all steps are complete, the card stays compact and offers an expandable schedule-management guide. The guide is informational: Complete confirms the lesson while its hours remain counted against the class balance once because the scheduled session already reserves them; No-show keeps hours reserved; Cancelled through Edit → Status restores reserved hours while retaining the record; deletion removes the record.
