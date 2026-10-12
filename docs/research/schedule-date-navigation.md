# Schedule date navigation research

This note records documented calendar navigation patterns and browser behavior
that informed the schedule date rail rebuild. Product documentation describes
the available controls and accessibility semantics; it does not prescribe the
exact swipe physics or lazy-loading policy for this rail.

## Product patterns

- Microsoft Teams combines a date picker, previous/next navigation that moves
  by a day or week depending on the current view, and a **Today** action.
  [Manage your calendar in Microsoft Teams](https://support.microsoft.com/en-au/teams/meetings/manage-your-calendar-in-microsoft-teams)
- Google Calendar documents week-view scrolling separately from moving focus
  to the start of that week. Its iPhone and iPad screen-reader guidance also
  separates opening the date picker from moving to the previous or next week.
  These are accessibility-specific examples, not documentation of ordinary
  touch swipes.
  [Google Calendar screen-reader guide for computer](https://support.google.com/calendar/answer/6101541?hl=en) ·
  [Google Calendar screen-reader guide for iPhone and iPad](https://support.google.com/calendar/answer/6101541?co=GENIE.Platform%3DiOS&hl=en)
- Apple documents weekly calendar presentation and week-start preferences,
  but does not describe animated range navigation.
  [Change how you view events in Calendar on iPhone](https://support.apple.com/en-gb/guide/iphone/iphfd1054569/ios) ·
  [Change Calendar settings](https://support.apple.com/guide/iphone/change-calendar-settings-iphc37be2016/27/ios)

Together, these sources support keeping range navigation, date selection,
keyboard focus, and the **Today** shortcut distinct. Treating a settled swipe
as selecting its centered date is a product decision for TutorPal rather than
a behavior specified by these products.

## Browser behavior

- CSS Scroll Snap defines snap positions and settlement, while leaving the
  precise animation and gesture physics to the user agent. `scroll-snap-stop:
  always` can keep a gesture from passing over an intervening snap point.
  [CSS Scroll Snap Module Level 1](https://www.w3.org/TR/css-scroll-snap-1/)
- Safari supports smooth scrolling through CSS and JavaScript scroll options.
  [Safari 15.4 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-15_4-release-notes)
- WebKit documents accelerated overflow scrolling on iOS and recommends relying
  on native scrolling rather than adding legacy momentum-scroll behavior.
  [New WebKit features in Safari 13](https://webkit.org/blog/9674/new-webkit-features-in-safari-13/)
- WebKit has documented fixes involving scroll snapping and programmatic
  scrolling during momentum. Behavior can still differ by Safari release, so
  real-device verification is appropriate for changes that insert rail content
  near the viewport.
  [WebKit features for Safari 27](https://webkit.org/blog/18325/webkit-features-for-safari-27-0/)

## Design implications

Use native horizontal scrolling and centered snap points so touch inertia stays
under browser control. Detect settlement before committing the centered range
or changing the rail's contents. Load more items before a user reaches either
end, and preserve the visible item when adding items before it. Explicit choices
from a tile, keyboard, calendar, or **Today** should center the target with
smooth scrolling unless reduced motion is requested. Verify these interactions
on physical iOS Safari in addition to desktop browsers.

The cited product and platform documentation does not define a universal
prefetch distance, a requirement to select the centered range on every swipe,
or one-range-per-gesture semantics. Those are TutorPal interaction requirements
and should be covered directly by component tests.
