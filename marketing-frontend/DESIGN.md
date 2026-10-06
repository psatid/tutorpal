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
  Yellow `#FFD447` echoes the logo in small decorative accents; green denotes
  LINE. Schedule tone mappings are saturated: lavender `#533AFD` with white
  text, bright orange `#F79303` and blue `#17B5F3` with white text. Workspace
  avatars use the same indigo, orange, and blue, all with white initials; toolbar/sidebar tutor initials use indigo and white.
  Remaining-hour fills use indigo for every student, independent of avatar tone.
  Named tokens keep schedule, avatar, and decorative roles explicit. The user
  explicitly approved the white-on-blue/orange contrast exception (approximately
  2.35:1 and 2.30:1); those exact colors must not be darkened. Book-spine color
  has its own deeper-blue token and does not inherit the avatar palette.
- Keep the existing TutorPal app icon unmodified. Inter supplies Latin typography
  and Noto Sans Thai the Thai glyphs. Thai headings use zero negative tracking and
  at least 1.4 line height. English display typography tops out at 88px with
  tracking no tighter than −0.04em; body text is 16–20px and details at least 12px.
- A 1240px content width contains the centered headline, supporting copy, and CTAs.
  The lesson card floats at lower left, hours near bottom center, and reminder at
  lower right, with a clear space around the text and actions. Cards use solid
  white, 16px radii, subtle blue shadows, and restrained desktop tilts.
- Below 1200px, cards move below the copy. Below 1024px, all three stack in a
  readable composition. Phone cards below 768px retain gentle fixed tilts
  of −3°, +2°, and −2° for lesson, hours, and reminder; tablet cards remain
  straight. The phone composition reserves 16px inner side padding, 12px above,
  16px below, a 48px gap after the CTAs, and 36px between cards. Mobile CTAs
  precede cards. The weekly calendar becomes a day-grouped agenda below 1024px.
  After successful early enhancement it starts with Monday–Wednesday; a native
  disclosure immediately after Wednesday exposes Thursday–Sunday. Desktop
  always opens the remainder into four nested columns. SSR defaults to all
  seven days, and a closed native disclosure keeps a desktop recovery control. The semantic
  student table becomes readable stacked rows below 768px, retaining header
  associations and each student's last lesson.
- Calendar, workspace, LINE, FAQ, closing CTA, and footer retain their order and
  use the same light system. Later headings have no repeated numbered or kicker
  scaffolding. The native FAQ, mobile menu, and skip link remain available.
- The user removed the bottom hero note and pause button from the approved image.
  Neither is rendered in either locale. The underlying independent-tutor
  positioning remains in metadata, explanation, and FAQ content.

## Motion

Content is visible static HTML by default. A tiny landing-only synchronous head
guard may prepare hero cards, section reveals, calendar frame/events, and balance
fills before paint. Pending targets keep their layout at zero opacity without
blur; pending fills use scaleX(0). Hero copy, CTAs, navigation, and native FAQ
controls remain immediately visible. The entry claims ownership only after
observers and release handlers initialize successfully. An unclaimed two-second
deadline or setup failure permanently expires preparation and releases sharp
content and full fills. Late entry cannot conceal targets or shorten the week.
Initial hashes, restored scroll, early interaction, unsupported APIs, and reduced
motion bypass preparation. Ordinary viewport resize during preparation does not
expire the guard: no entrance has started, and controllers measure the current
viewport before claiming. Once initialized, resize settles active effects and
reconciles rendered targets. The two-second deadline is never extended or reset.

The script optionally brings cards
from a shared origin below the CTA to their final positions over 900ms, staggered
80ms. A brief 5px blur ends at zero. Separate outer entrance and inner floating
wrappers avoid transform conflicts. After settling, cards float vertically by
14px on desktop and 10px below 1024px over distinct 5.5, 6.3, and 7-second
cycles; headline and CTA remain stationary.

Section headings and supporting copy reveal once on approach with 24px travel,
6px blur, and an 850ms ease-out; paired copy follows headings by 100ms. The weekly
calendar frame settles over 700ms before desktop events enter over 800ms with
80ms chronological staggering. Agenda events below 1024px enter individually on
approach after the frame settles. Children remain opacity-only pending while
the frame blurs, so parent and child blur never animate together. Closed
disclosure items stay eligible for later approach; expanding exposes the same
lesson elements, and collapsing settles active effects inside it. Actual native
summary activation records compact expansion intent independently of responsive
open/close changes, without forced scrolling.
Workspace balance fills animate with scaleX over 750ms and 80ms staggering after
the workspace reveal. Their existing 48/72/36/60% widths remain decorative, are
visible at all sizes, and carry no progress denominator or ARIA progress claim;
numeric hours are authoritative.

The closing CTA has six substantial white tiles with original, mostly filled
SVG symbols, following the visual weight of the ChronoTask footer reference:
neutral-gray calendar with white date dots and one darker selected day; navy
clock with bold white hands; broad golden-orange pencil with a clear point;
cyan book with a deeper same-hue spine; neutral-gray student; and neutral-gray
chat bubble with white dots. Glyphs occupy approximately 55–65% of each tile face,
with simple negative space and no thin multicolor line drawing. The dedicated
closing shadow is `0 14px 36px rgb(13 37 61 / .09)`, without an outline.
Desktop tiles retain fixed angles and float 12px over
6–8-second cycles. Tablet reserves space above and below the copy; mobile has four
tiles floating 8px in those reserved areas. Their maximum extents keep headline
and action clear. Decorative wrappers are hidden from accessibility APIs and
cannot intercept pointer input.

Hero and closing floating pause offscreen, in hidden documents, and while focus
is inside their section. Interrupted entrances/reveals settle sharply; cleanup
cannot launch queued descendant animations. Reduced motion disables animations
and angles. Preference changes and BFCache restores preserve completed one-shot
reveals. Pending and active targets settle on bailout, focus/hash navigation,
visibility changes, and cleanup; resizing reconciles rendered targets while
closed disclosure items are not mistaken for items above the viewport. Static
content, a full native week, and filled bars remain the default on initialization
failure, unavailable animation APIs, or disabled scripts. The bounded preparation
guard has no WebGL dependency. No scroll pinning, decorative light trail, or
visible motion control remains.

FAQ uses native, independently openable details. An optional 320ms measured-height
and opacity transition keeps details open until a close finishes. Rapid toggles
reverse from the current height; resize, cleanup, and reduced-motion changes
settle to the intended natural state and clear temporary styles. Disabled scripts
and unsupported APIs retain immediate native disclosure behavior.

## Acceptance

Review English and Thai at 320, 390, 768, 1024, and 1440px, plus 200% zoom. Confirm
no page overflow, clear hero actions, readable product details, intact Thai marks,
keyboard focus, 44px interactive touch targets, contrast, and complete static and
reduced-motion states. Verify unchanged app/locale links and exact English LINE
message in both locales. See [verification](VERIFICATION.md) for current evidence.
