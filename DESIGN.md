---
name: TutorPal
version: alpha
description: Stripe-inspired product design for calm, precise tutoring operations
colors:
  primary: "#533AFD"
  primary-hover: "#4434D4"
  primary-press: "#2E2B8C"
  primary-soft: "#B9B9F9"
  brand-dark: "#0D253D"
  brand-dark-900: "#1C1E54"
  ink: "#0D253D"
  ink-secondary: "#273951"
  ink-muted: "#61718A"
  on-primary: "#FFFFFF"
  canvas: "#FFFFFF"
  canvas-soft: "#F6F9FC"
  canvas-cream: "#F5E9D4"
  hairline: "#E3E8EE"
  hairline-input: "#E3EBF4"
  ruby: "#EA2261"
  success: "#16835B"
  success-soft: "#E7F6EF"
  warning: "#9B6829"
  warning-soft: "#FFF2D9"
  destructive: "#C93755"
  destructive-soft: "#FCE8EE"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 300
    lineHeight: 1.03
    letterSpacing: "-0.025em"
  heading:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.04em"
  numeric:
    fontFeature: "tnum"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  pill: "9999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  huge: "64px"
components:
  button-primary-pill:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.primary}"
    border: "1px solid {colors.primary}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  button-on-dark:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.brand-dark}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline-input}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card-feature-light:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "24px"
  pill-tag-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.primary-press}"
    rounded: "{rounded.pill}"
    padding: "4px 8px"
---

# Design system: TutorPal

## Overview

TutorPal uses a Stripe-inspired product language: precise editorial typography,
white navigation chrome, dark-navy product bands, white and cool-soft work surfaces, and one
indigo action color. The visual system should help a private tutor understand
today's workload quickly without feeling like a spreadsheet.

The system is adapted for an operational product rather than a marketing site.
The authenticated app stays light and task-oriented. The dark product track is
reserved for top product chrome and meaningful summary bands. A restrained organic
mesh is allowed only on public authentication surfaces.

## Principles

### One action color

Indigo is used for primary actions, current navigation, focus, and meaningful
selection. It should remain rare enough to communicate importance. Ruby,
success, warning, and LINE green are semantic only.

### Surface before shadow

White on cool-soft creates the default hierarchy. Hairlines establish
boundaries. Shadows are reserved for transient overlays and stay blue-tinted
and light; cards do not need broad soft shadows.

### Product clarity

List workspaces use divider-led rows and restrained grouping. Details use
progressive disclosure instead of a grid of boxed cards. Every screen has a
clear title, one primary next action, and an honest loading, empty, or error
state.

### Shared controls

Search, filter, sort, reset, form, drawer, and destructive actions reuse the
shared Button, Input, Select, Badge, Drawer, and Dialog vocabulary. Screens
control layout; primitives control visual language.

## Colors

### Brand

- **Indigo** (#533AFD): primary actions, links, focus, current selection.
- **Indigo hover** (#4434D4): hover and active navigation feedback.
- **Indigo press** (#2E2B8C): pressed state.
- **Indigo soft** (#B9B9F9): selected filters and subdued tags.
- **Brand dark** (#0D253D): top product chrome and dark summary bands.
- **Brand dark 900** (#1C1E54): deep app chrome and dark summary surfaces.

### Surfaces and text

- **Canvas** (#FFFFFF): primary work surface and form surface.
- **Canvas soft** (#F6F9FC): app background and grouped panel surface.
- **Canvas cream** (#F5E9D4): rare warm product interlude.
- **Hairline** (#E3E8EE): dividers and card outlines.
- **Input hairline** (#E3EBF4): quiet form and outline-control boundary.
- **Ink** (#0D253D): primary text.
- **Ink secondary** (#273951): supporting text.
- **Ink muted** (#61718A): metadata, helper text, and disabled text.
- **On primary** (#FFFFFF): text on indigo and dark surfaces.

### Semantic

- **Success** uses a readable green foreground with a soft green container.
- **Warning** uses a warm brown foreground with a soft amber container.
- **Destructive** uses ruby/red foreground with a soft ruby container.
- **LINE** green appears only when communicating the external LINE connection.

Semantic color is always paired with visible text or an icon. It is never the
only indicator.

## Typography

### Font family

Inter is the open-source runtime substitute for the proprietary Sohne family
described in the Stripe reference. Load the required weights locally and use
system-ui only as fallback. Apply the ss01 feature globally where supported.

### Hierarchy

| Token | Size | Weight | Line height | Tracking | Use |
| --- | ---: | ---: | ---: | ---: | --- |
| Display | 56px | 300 | 1.03 | -0.025em | Auth and high-impact overview |
| Heading | 24px | 400 | 1.15 | -0.02em | Page titles and major sections |
| Title | 18px | 500 | 1.3 | -0.01em | Entity and drawer titles |
| Body | 15px | 400 | 1.4 | 0 | Default reading text |
| Caption | 13px | 400 | 1.4 | 0 | Helper and metadata |
| Label | 12px | 600 | 1.3 | 0.04em | Functional labels only |
| Numeric | 14–32px | 400–500 | 1.2–1.4 | 0 | Hours, dates, and counts |

Numeric roles use tabular figures. Display headings use negative tracking but
never tighter than -0.04em. Labels are sentence-case or functional small
caps, not decorative eyebrows above every section.

## Layout

- Use a centered content container with a maximum width around 1200–1440px.
- Keep existing ScreenLayout padding and jun-layout geometry unchanged.
- Use 32–48px section spacing in authenticated product surfaces and 64px or
  more only for quiet public/auth composition.
- Use a single-column mobile flow. Horizontal overflow is limited to date and
  refinement rails.
- Preserve the desktop side rail, mobile edge drawer, safe-area spacing, and
  drawer footer reachability.

## Elevation and shapes

### Radius scale

- 4px: hairline tags and compact table chrome.
- 6px: inputs and compact controls.
- 8px: alerts and small grouped surfaces.
- 12px: feature cards, drawers, and product panels.
- 16px: major app surfaces and auth form container.
- Full pill: buttons, tags, and compact status chips only.

### Depth

White on cool-soft is the primary depth cue. Use a subtle blue-tinted shadow
only for dropdowns, dialogs, drawers, and other transient overlays. Do not add
generic black card shadows or blur-heavy glass effects.

## Components

### Buttons

- Primary: indigo fill, white label, full pill, 8px × 16px padding.
- Secondary: white surface, indigo label, 1px indigo border, full pill.
- Ghost: transparent until hover, used for in-context actions.
- Destructive: soft ruby container and readable ruby label.
- On dark: white surface or light label treatment with a visible focus ring.
- Hover shifts color; press uses the deeper indigo and a 1px downward movement.
- All interactive buttons expose a visible 3px indigo focus ring and a minimum
  44px hit target where the action is mobile-facing.

### Inputs

Inputs use a white surface, 1px input hairline, 6–8px radius, and 8px × 12px
padding. Focus changes the boundary to indigo and adds a 3px indigo ring.
Invalid fields use destructive boundary and ring tokens. Placeholder text uses
muted ink and remains readable.

### Cards, rows, and badges

Cards are white with a hairline and 12px radius when elevation communicates
hierarchy. Routine list content uses divider-led rows instead of repeating
outlined cards. Badges and compact status tags are pills with subdued
semantic or indigo-soft containers.

### Navigation

The authenticated desktop rail is white with a cool hairline divider, dark-navy
inactive navigation, and an indigo active treatment. Hover uses a cool-soft
surface instead of a saturated fill. The compact mobile header and edge-sidebar
drawer remain. Current routes use aria-current="page" and a visible visual state.

### Drawers and dialogs

Small screens use a bottom sheet with a 16px top radius and a 44px close
target. At md and above, the same surface enters from the right. Headers stay
fixed, the body scrolls, and optional action footers remain reachable. Nested
Select and calendar surfaces portal into the active drawer surface.

## Authentication mesh

Authentication surfaces may use a local SVG organic mesh with low-contrast
indigo, lavender, ruby, and peach shapes. The mesh is an intentional exception
to the flat product surfaces, must remain behind an opaque white form surface,
and must not be used in authenticated workspaces or as gradient text. Do not
use remote image URLs or flat CSS gradient bands.

## States and accessibility

- Loading uses skeletons that mirror the eventual content; standalone spinners
  are limited to brief button or redirect states.
- Empty states explain the next useful action and offer one relevant CTA.
- Errors state the problem directly, preserve input where possible, and offer
  retry or correction.
- Success and warning states pair color with text or an icon.
- Keyboard users receive visible focus, logical focus trapping, Escape
  dismissal, and focus return to the invoking control.
- Test 320px, 768px, 1024px, and wide desktop layouts with no clipped content,
  page overflow, or unreachable drawer actions.
- Respect prefers-reduced-motion; use short transform/opacity transitions and
  disable choreography when reduction is requested.

## Do and don't

### Do

- Do use Inter weight and tracking contrast instead of heavy all-bold headings.
- Do keep the app rail white with navy text, indigo current navigation, and
  product content light.
- Do use tabular figures for class hours, dates, and counts.
- Do use local mesh artwork only on auth backgrounds.
- Do keep semantic states readable and redundant with text or icons.
- Do prefer rows, dividers, and grouping over card grids.

### Don't

- Don't use Manrope, default browser typography, or pure black.
- Don't use pill-shaped inputs or oversized rounded controls.
- Don't use generic gradients, external image services, or gradient text.
- Don't use broad black shadows, backdrop blur, or card-per-row repetition.
- Don't add new accent colors or invent dashboard data.
- Don't change routes, API contracts, data models, or the existing drawer
  geometry for visual work.
