# Marketing asset provenance

The Astro homepage in `marketing-frontend/` uses original semantic HTML/CSS
product illustrations on a light canvas. The approved Concept A draws on the
centered headline, generous whitespace, and floating-card composition of
[ChronoTask](https://dribbble.com/shots/25000009-ChronoTask-Landing-Page), with
[Sleek CoreShift](https://dribbble.com/shots/25869450-Sleek-Landing-Page-for-CoreShift)
and [AI Project Management Assistant](https://dribbble.com/shots/27190142-AI-Project-Management-Assistant-SaaS-Landing-Page)
as secondary references. No paid template source, customer screenshots, or private
student information is included. The user's selected image is a design reference,
not a production raster asset; live product details remain readable HTML.

## Fictional tutoring story

The example is a two-hour SAT Math lesson for Min on October 8, 2026 in
Asia/Bangkok. Scheduling 16:00–18:00 reserves two hours from a ten-hour balance,
leaving eight. Its upcoming reminder is at 15:00. This featured math lesson is
not a weekly calendar event.

The separate English-only weekly view covers 5–11 October with twelve lessons:

| Day | Earlier lesson | Later lesson |
| --- | --- | --- |
| Monday | Ploy · IELTS · Foundation · 10:00–12:00 | Nath · SAT English · Intensive · 16:00–18:00 |
| Tuesday | Mook · A-Level English · Basic · 11:00–13:00 | Beam · IELTS Speaking · Intensive · 17:00–19:00 |
| Wednesday | Fai · SAT English · Foundation · 10:00–12:00 | Nath · A-Level English · Intensive · 15:00–17:00 |
| Thursday | Ploy · IELTS · Basic · 10:00–12:00 | Earn · SAT English · Intensive · 16:00–18:00 |
| Friday | Mook · A-Level English · Foundation · 11:00–13:00 | Beam · IELTS · Intensive · 17:00–19:00 |
| Saturday | Fai · SAT English · Basic · 10:00–12:00 | Nath · A-Level English · Intensive · 14:00–16:00 |

Sunday has no lessons. The independent math workspace shows four students:
Min (SAT Math, Foundation), Ploy (A-Level Mathematics, Intensive), Kiet (SAT Math,
Basic), and Fern (A-Level Mathematics, Advanced). Its lesson record concerns
quadratic equations and problem solving.

Completing a lesson does not deduct reserved hours a second time. The product
copy applies to tutoring generally, and repeated demo captions are omitted.

Names, lessons, dates, and balances are illustrative. They are not testimonials,
customer counts, learning results, or claims of exam-specific capabilities.
The composed scenes demonstrate supported workflows rather than pixel-exact
screenshots. Illustrative controls do not impersonate working application actions.

## LINE reminder

The notification uses the real message shape from
`backend/src/repositories/class-reminder.repository.ts`:

```text
Class reminder

Hi Min, your SAT Math class starts in 1 hour.

Date: Oct 8, 2026
Time: 4:00 PM–6:00 PM
Time zone: Asia/Bangkok
```

The message remains English in both website languages because the backend
template is English. Thai translates its surrounding explanation. An upcoming
reminder preview is not a delivery receipt. No real LINE messages are sent to
create or test the landing page.

## Identity and decorative assets

Reuse the existing TutorPal app icon. The 96px UI/favicon derivative preserves its
appearance while reducing the asset from 391,358 to 6,878 bytes; organization
metadata retains the original. Inter and Noto Sans Thai are self-hosted
from their Fontsource packages, with OFL license copies in
`marketing-frontend/public/licenses/`. Optional hero entrance/floating motion uses CSS with small script coordination;
static HTML is the default when scripts are disabled, motion is reduced, or
enhancement setup fails. A bounded landing-only head guard prepares optional
reveal targets before paint and permanently releases unclaimed preparation after
two seconds. It does not conceal navigation, hero copy/actions, or FAQ controls.
No procedural light, canvas, or WebGL asset remains.

The closing CTA uses six original inline SVG objects inspired by the substantial
white-tile and filled-symbol style of the [live ChronoTask footer](https://chronotasks.vercel.app/).
Calendar, clock, pencil, book, student, and chat silhouettes are authored locally;
no reference assets are copied or downloaded. The supplied timeline screenshot
informs blue/orange product hues and is not shipped as an asset. Schedule and
student avatars now use the requested `#17B5F3` and `#F79303` with white text;
these pairs have approximately 2.35:1 and 2.30:1 contrast and are explicitly
approved exceptions. The illustrated book's deeper spine remains independent
of avatar colors. Indigo and all remaining-hour bars retain `#533AFD`.

Social previews are original light vector compositions of the site's identity and
product story. `social.svg` embeds the existing small logo bytes unmodified and is
deterministically rasterized with Sharp. Its output and regeneration command live
with the marketing implementation.

## Historical material

The previous TanStack Start marketing site was deleted before this Astro build.
Old references to screenshots, image-generation experiments, beta forms, and
marketing components describe that retired implementation. The
[prototype archive](../prototypes/README.md) and [old LINE composition](line-reminder-demo.html)
are historical references, not current page assets.
