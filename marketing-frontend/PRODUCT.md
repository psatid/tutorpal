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
through Classes, Schedules, Today, and the connected tutoring workflow. On
desktop, the workflow becomes a full-height pinned stage while each story beat
passes through the viewport. On mobile, a shorter pinned preview stays above
the current story copy and releases after the connected workflow. The connected view also includes the real Courses capture. It explains
how a tutor can create a class, schedule the first session, and see the day take
shape before covering students, hours, revenue, and LINE messaging. English is the
default language, and the public copy can be switched to Thai without changing
the form contract or the product screenshot asset set.

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
one class, one course preset, and one scheduled session across `home.jpg`,
`schedules.jpg`, `courses.jpg`, and `classes.jpg`. The landing page must use
authentic captures or plain explanatory copy, not fake product interfaces.
