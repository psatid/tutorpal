# TutorPal marketing design

The approved direction is light Concept A, an airy perimeter composition inspired
by ChronoTask's centered headline and floating product UI. The design uses generous
whitespace, large sans-serif typography, strong alignment, cool-white surfaces,
and restrained indigo accents. Live product examples are original HTML/CSS.

The page tells one useful story: schedule a lesson, reserve its hours, see the
teaching week take shape, and keep the upcoming reminder aligned. A broad student
workspace supplies product context. The weekly calendar is an English-only
example with twelve lessons; the separate four-student workspace is math-only.
Min’s featured SAT Math lesson remains separate from the weekly calendar. The
examples are fictional; no customer outcomes, testimonials, or pricing are invented.

## Visual system

- White `#FFFFFF` and soft `#F6F9FC` backgrounds, navy `#0D253D` primary ink,
  `#273951` secondary text, `#61718A` muted text, and indigo `#533AFD` CTAs.
  Yellow `#FFD447` echoes the logo in small decorative accents. Desktop hero
  cards use opaque white surfaces with subtle rims and a soft shadow.
  The lesson card has a `#FDF6DA` Scheduled tag with `#CCA77B` text and icon;
  at 12px this exact requested pair has about 2.06:1 contrast. Other card text
  retains dark plum `#4F3954`. These cards also render without
  JavaScript or motion; compact screens show feature icons. Calendar events and
  matching workspace avatars share solid indigo `#533AFD`, orange `#F79303`,
  and blue `#17B5F3`; all use white labels or initials. White on orange and blue
  is an explicitly approved contrast exception at about 2.30:1 and 2.35:1;
  white on indigo is 6.19:1. Quiet calendar gridlines use `#E8E8E8`. The preserved
  light-coral reference token `--schedule-orange-light` remains `#FC9A7A`.
  Existing hourglass and LINE icon accents retain their vivid colors.
  Toolbar/sidebar tutor initials use indigo and white.
  Remaining-hour fills use indigo for every student, independent of avatar tone.
  Named tokens keep schedule, avatar, and decorative roles explicit. Book-spine
  color has its own deeper-blue token and does not inherit the avatar palette.
- Keep the existing TutorPal app icon unmodified. Inter supplies Latin typography
  and Noto Sans Thai the Thai glyphs. Thai headings use zero negative tracking and
  at least 1.4 line height. English display typography tops out at 88px with
  tracking no tighter than −0.04em; body text is 16–20px and details at least 12px.
- A 1240px content width contains the centered headline, supporting copy, and CTAs.
  At 1200px and above, four compact cards sit at the left and right perimeter:
  featured lesson, a student count from `studentSummaries`, hours, and LINE reminder.
  Lesson, student, hours, and LINE cards use subtle borders and shadows; their
  existing colorful icon accents remain. All enter from their
  nearest page edge. Cards never form a row below the hero copy.
- Below 1200px cards are hidden. Four distinct feature icons remain for lesson,
  students, hours, and LINE. The lesson calendar and hourglass use neutral gray,
  the student group uses navy, and the rounded three-dot LINE chat uses LINE green.
  At phone widths below 768px, hide the calendar and center the group, hourglass,
  and LINE icons evenly across the top row. Tablet retains all four upper icons.
  The brand pencil and book occupy lower-left and lower-right positions in a
  reserved band at every compact width, in yellow-orange `#F79303` and cyan. The
  mobile CTAs stay full width. At 1024px and above the calendar shows all
  seven days with the 5–11 label. Below 1024px it shows Monday–Wednesday only
  with the 5–7 label in English and Thai, without a disclosure. The semantic
  student table becomes readable stacked rows below 768px, retaining header
  associations and each student's last lesson.
- Calendar, workspace, LINE, FAQ, closing CTA, and footer retain their order and
  use the same light system. Later headings have no repeated numbered or kicker
  scaffolding. The native FAQ, mobile menu, and skip link remain available.
- The user removed the bottom hero note and pause button from the approved image.
  Neither is rendered in either locale. The underlying independent-tutor
  positioning remains in metadata, explanation, and FAQ content.

## Motion

Content is present in static HTML. Finite CSS animations reveal hero copy, cards,
and icons on page load and finish visibly without JavaScript. Their CTA links remain
focusable and clickable; navigation and native FAQ controls are immediately available.
The optional browser script prepares only rendered scroll targets wholly below the
viewport. Pending targets retain layout at zero opacity without blur, and pending
decorative fills use scaleX(0). Content already visible or passed stays static; a
late script can still reveal unseen lower sections. Unsupported APIs, initial hashes,
and reduced motion leave scroll content static. Once initialized, resize settles
active or newly visible effects and prepares newly rendered targets still below the
viewport without consuming unseen pending reveals.

The desktop hero keeps the four cards white, with no colored field behind them.
The hero copy and four desktop cards begin their entrances together without
delay. Cards enter from their nearest page edges over 850ms with a brief 5px blur
that ends at zero. The six hero icons
reveal from outward offsets over one second. The pencil and book use lower outward
offsets from the reserved bottom band at compact widths. Separate
outer entrance and inner floating wrappers avoid transform conflicts. After
settling, cards float vertically by 14px on desktop and 10px below 1024px;
hero tiles float by 10px, or 8px on phones. On a normal first load, `.hero-copy`
runs once over 850ms from 24px below with
6px blur and no delay. It is excluded from scroll reveals and never replays; after
it settles, the copy and CTA remain stationary. Reduced motion leaves sharp final
content; the CSS entrance finishes even when JavaScript is disabled or fails. CTA
links remain focusable and clickable during the entrance.

Section headings and supporting copy reveal once when their top reaches a point
200px above the viewport bottom, with 24px travel, 6px blur, and an 850ms ease-out;
paired copy follows headings by 100ms. The weekly calendar frame uses the same
trigger and settles over 700ms before desktop events enter over 800ms with 90ms
chronological staggering capped at 450ms. Monday–Wednesday events below 1024px
enter at that point after the frame settles. The LINE check list uses the same trigger.
Children remain opacity-only pending while
the frame blurs, so parent and child blur never animate together.
Workspace balance fills animate with scaleX over 750ms and 80ms staggering after
the workspace reveal. Their existing 48/72/36/60% widths remain decorative, are
visible at all sizes, and carry no progress denominator or ARIA progress claim;
numeric hours are authoritative.

The closing CTA uses five substantial white tiles with distinct filled learning
symbols: graduation cap, lightbulb, simple ruler, folded document, and bookmark.
The cap glyph is neutral gray, the bulb and ruler are yellow, the document is
cyan, and the bookmark is mint. These glyphs occupy approximately 55–65% of each
tile face, with simple negative space and no thin multicolor line
drawing. The dedicated closing shadow is `0 14px 36px rgb(13 37 61 / .09)`,
without an outline. Desktop closing tiles retain fixed angles and float 12px over
6–8-second cycles. The closing CTA reserves space above and below the copy on
tablet and retains the cap, bulb, ruler, and document tiles on mobile; bookmark
remains hidden there. The hero
keeps six distinct lesson, student, hours, LINE, pencil, and book icons below
1200px. Their maximum extents keep
headline and action clear. Decorative wrappers are hidden from accessibility APIs
and cannot intercept pointer input.

Hero and closing floating pause offscreen, in hidden documents, and while focus
is inside their section. Scroll reveals already in progress continue when they
leave the 200px trigger band but remain visible in the viewport; they settle
when fully offscreen. Other interrupted entrances/reveals settle sharply; cleanup
cannot launch queued descendant animations. Reduced motion disables animations
and angles. Preference changes and BFCache restores preserve completed one-shot
reveals. Pending and active targets settle on bailout, focus/hash navigation,
visibility changes, and cleanup; resizing reconciles rendered targets while
closed disclosure items are not mistaken for items above the viewport. Static
content, the responsive native calendar range, and filled bars remain the default
on initialization failure, unavailable animation APIs, or disabled scripts. The
compact calendar therefore remains Monday–Wednesday below 1024px. Scroll reveals
do not require a page-head guard. No scroll pinning, decorative light
trail, or visible motion control remains.

FAQ uses native, independently openable details. An optional 320ms measured-height
and opacity transition keeps details open until a close finishes. Rapid toggles
reverse from the current height; resize, cleanup, and reduced-motion changes
settle to the intended natural state and clear temporary styles. Disabled scripts
and unsupported APIs retain immediate native disclosure behavior.

## Acceptance

Review English and Thai at 320, 390, 768, 1024, and 1440px, plus 200% zoom. Confirm
no page overflow, clear hero actions, hidden phone cards, readable tablet/desktop
product details, intact Thai marks,
keyboard focus, 44px interactive touch targets, contrast, and complete static and
reduced-motion states. Verify unchanged app/locale links and exact English LINE
message in both locales. See [verification](VERIFICATION.md) for current evidence.
