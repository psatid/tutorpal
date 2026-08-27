# TutorPal marketing site

## Product intent

This is TutorPal's public English-first and Thai-ready brand surface for
independent tutors. It explains the product through real tutoring workflows and
collects interest in the private beta. It is separate from the authenticated
TutorPal portal and does not offer public signup or login flows.

## Routes

- `/` - product story, product tour, FAQ, and beta interest form
- `/privacy` - beta interest privacy notice
- `/api/beta-interest` - same-origin form endpoint
- `/robots.txt` and `/sitemap.xml` - crawler support

## Public page story

The page starts with the real Home screen, then uses a scroll-led story to walk
through the Classes list, Add hours, Add schedule, Schedule Day, Schedule Week,
and Today. On desktop, a substantial preview stays pinned beside compact story
intervals; on tablet it stacks before the story rail so the source UI stays
readable. On mobile, a shorter pinned preview stays above the current story
copy and releases after the Today step. The sequence explains how a tutor can
start from a class record, add the hours they teach, schedule the first session,
and review that same session in Day, Week, and Today before covering students,
hours, revenue, and LINE messaging. English is the default language, and the
public copy can be switched to Thai without changing the form contract or the
product screenshot asset set.

## Beta interest flow

The form validates name, email, subject, consent, and a Turnstile token. The
Worker verifies Turnstile, applies KV-backed limits, then sends the lead to the
configured Discord webhook. It does not create product accounts or persist
leads in the application database.

The v1 KV windows are best-effort under concurrency because Cloudflare KV does
not provide atomic read-modify-write behavior. Strict enforcement would be a
separate infrastructure decision requiring a strongly consistent coordinator.

## Asset and data boundary

Marketing screenshots live in `public/product-previews/` and are treated as
public, static assets. Use English captures from a clean account only. Never
ship current admin emails, real student names, fixture classes, test-user data,
or other private portal content. A small fictional demo dataset is allowed for
capture when it is isolated to the screenshots and filtered so unrelated
workspace records are not visible. The current set uses one fictional learner,
one class, one course preset, and one scheduled session across the base
captures plus the workflow captures. The landing page starts the workflow with
`classes.jpg`, then uses `workflow-02-add-hours.jpg`,
`workflow-03-add-schedule.jpg`, `workflow-04-schedule-day.jpg`,
`workflow-05-schedule-week.jpg`, and `workflow-06-today-connected.jpg`.
`workflow-01-create-class.jpg` remains in the public asset folder as a verified
source capture but is not referenced by the current page. The landing page must
use authentic captures or plain explanatory copy, not fake product interfaces.
