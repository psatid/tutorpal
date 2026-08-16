# Marketing design direction

## Visual lane

TutorPal is an English-first SaaS landing page for independent tutors. The
page uses calm product storytelling with a light-first cool neutral surface,
TutorPal navy, and one indigo action color. It takes structural inspiration
from product walkthrough pages such as Parnuan, while keeping TutorPal's own
brand, copy, and real portal screens.

The design dials for this page are:

- `DESIGN_VARIANCE 7`: an asymmetric split hero, varied editorial value rows,
  and a two-column product tour.
- `MOTION_INTENSITY 6`: purposeful entry, reveal, and state-change motion.
- `VISUAL_DENSITY 4`: generous spacing with enough real product detail to make
  the workflow understandable.

## Section structure

The public home route keeps the existing anchors and conversion path:

1. Sticky header with Product, Workflow, Beta, and the optional portal link.
2. `#product` hero with the real TutorPal Home screen and the two actions
   `Join the beta` and `See the app`.
3. `#workflow` scroll-led product tour for Classes, Schedules, Today, and the
   connected tutoring workflow, with the Courses capture in the connected view.
4. `#benefits` What you get section covering students, classes, schedules,
   hours, revenue, and LINE messaging.
5. `#faq` short native disclosure answers.
6. `#beta` existing beta interest form and privacy notice.
7. Footer and privacy link.

## Product screenshot rules

Product previews are static assets under `public/product-previews/`. Capture
the English portal with a clean account that has no admin email, test-user
names, fixture classes, or personal data. Keep the full portal frame visible
and capture only screens that help explain the public product story.

The current approved captures are:

- `home.jpg` for the Home and Today view, with a sanitized scheduled session.
- `schedules.jpg` for planning sessions, with the same demo class selected.
- `courses.jpg` for reusable course details, filtered to the demo course.
- `classes.jpg` for the class, student, hour, and remaining-hours relationship.

The current demo capture set uses one fictional learner, one fictional class,
one course preset, and one scheduled session. Keep this dataset isolated to
public preview captures. Do not ship the signed-in account identity, existing
workspace records, or any data copied from a real tutor account.

Do not recreate these views with HTML rectangles, sample rows, fake status
labels, invented numbers, or miniature dashboard components. If a new screen
is needed, capture it from the real product and check it for private data
before adding it to the public bundle. The social preview references the real
Home capture as well.

## Motion model

Motion is CSS-first and SSR-safe. `IntersectionObserver` adds one-time reveal
classes to product-tour rows and value rows. The browser never hides content
until JavaScript runs, and there are no scroll listeners or scroll-position
calculations.

- Hero copy and the real Home capture enter in a short stagger to establish
  hierarchy.
- The tour uses a header-safe pinned screenshot stage at desktop and mobile.
  Desktop uses a full-height stage; mobile uses a shorter stage above the
  current story copy so the app screen stays readable on a narrow viewport.
  Each story row gets its own scroll interval while the next workflow beat
  enters the reading band.
- As each feature row crosses the reading band, `IntersectionObserver` changes
  the active authentic screenshot or connected capture so the scroll itself
  explains the path from creating a class to scheduling a session.
- Clicking a tour row remains available as a direct way to inspect a step.
- The preview uses a short opacity and position pop to make each workflow
  change legible. The pin uses normal CSS sticky positioning and does not
  intercept or replace page scrolling.
- On mobile, the pinned authentic screenshot stays above the current story
  copy. If JavaScript is unavailable, each row falls back to its inline
  screenshot so the workflow remains understandable in reading order.
- Value rows reveal as they enter the viewport.
- Buttons and the mobile menu use short transform and color feedback.
- FAQ answers use a CSS grid-row reveal with a coordinated plus-icon rotation,
  so opening and closing the native disclosure has visible, contained motion.
- `prefers-reduced-motion: reduce` removes entry transforms, reveal motion,
  crossfades, accordion transitions, and menu transitions while leaving every
  state and control available.

## Responsive behavior

The layout is checked at 320px, 390px, 768px, 1024px, and wide desktop.

- At desktop widths, the tour preview is pinned in a header-safe viewport stage
  and each feature row occupies one scroll interval beside it. At mobile
  widths, the preview pins above the current story row and releases after the
  connected workflow. The header stays on one line and both CTA labels stay
  unbroken.
- At tablet widths, the hero narrows while preserving the screenshot and the
  tour keeps its two-column relationship where space allows.
- Below 768px, the header uses a native keyboard-operable `details` menu, the
  hero stacks, and the tour becomes a single-column sequence where each row's
  copy is followed by its authentic screenshot.
- At 320px and 390px, the hero actions become full-width rows, controls remain
  at least 44px tall, and the page clips no content horizontally.

All visual controls have visible focus states, labels remain above form fields,
and the beta form keeps its original field names, validation, Turnstile state,
and error focus behavior.

## Language behavior

English is the server-rendered default so the page has a stable first paint and
existing links remain familiar. The header language switcher changes the
marketing and privacy copy between English and Thai, updates the document
language for assistive technology, and keeps all product screenshots as the
English captures from the real portal. Desktop places the switcher with the
portal and beta actions; mobile places it inside the keyboard-operable menu.
The switch does not change route paths, anchors, form field names, validation,
Turnstile behavior, or the native FAQ disclosure interaction.
