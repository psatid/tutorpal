---
name: TutorPal
version: alpha
description: Stripe-inspired product design for calm, precise tutoring operations
source: frontend/src/index.css (:root) and frontend/src/components/common
colors:
  primary: "#533AFD"
  primary-hover: "#4434D4"
  primary-pressed: "#2E2B8C"
  primary-foreground: "#FFFFFF"
  primary-container: "#ECEBFF"
  foreground: "#0D253D"
  secondary-foreground: "#273951"
  muted-foreground: "#61718A"
  placeholder-foreground: "#68788D"
  background: "#F6F9FC"
  card: "#FFFFFF"
  popover: "#FFFFFF"
  accent: "#EEF4F9"
  secondary: "#EDF2F7"
  secondary-hover: "#E3EBF4"
  muted: "#F1F5F9"
  border: "#E3E8EE"
  input: "#E3EBF4"
  input-hover: "#C4D3E2"
  overlay-navy: "#0D253D"
  ring: "#533AFD"
  info: "#0369A1"
  info-container: "#E0F2FE"
  info-container-foreground: "#075985"
  success: "#087443"
  success-container: "#E8F7EF"
  success-container-foreground: "#075C35"
  warning: "#9A5B00"
  warning-container: "#FFF4DB"
  warning-container-foreground: "#754400"
  destructive: "#B42318"
  destructive-container: "{colors.destructive} / 10%"
  inverse: "#0D253D"
  inverse-foreground: "#FFFFFF"
  avatar-neutral: "#273951"
  avatar-neutral-foreground: "#FFFFFF"
  name-tone-foreground: "#FFFFFF"
  name-tone-indigo: "#533AFD"
  name-tone-orange: "#A85800"
  name-tone-cyan: "#08769B"
  name-accent-indigo: "#533AFD"
  name-accent-orange: "#F79303"
  name-accent-cyan: "#17B5F3"
typography:
  fontFamily: "Inter, 'Noto Sans Thai Variable', sans-serif"
  fontFeature: "ss01"
  display:
    fontSize: "2.25rem → 3rem (sm)"
    fontWeight: 300
    letterSpacing: "-0.02em"
  page-title:
    fontSize: "1.5rem–2.5rem"
    fontWeight: 400
    lineHeight: 1.25
    letterSpacing: "-0.02em to -0.025em"
  title:
    fontSize: "1.125rem–1.25rem"
    fontWeight: "400–500"
    letterSpacing: "-0.01em"
  ui:
    fontSize: "0.875rem"
    fontWeight: "400 / 500 controls / 600 row titles"
    lineHeight: "1.25rem"
  meta:
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  label:
    fontSize: "0.75rem"
    fontWeight: 500
  numeric:
    fontFeature: "tnum"
rounded:
  base: "0.5rem (--radius)"
  sm: "4.8px"
  md: "6.4px"
  lg: "8px"
  xl: "11.2px"
  2xl: "14.4px"
  3xl: "17.6px"
  4xl: "20.8px"
  full: "9999px"
spacing:
  grid: "Tailwind 4px scale"
  screen-padding: "12px → 16px (sm) → 24px (lg)"
  hit-target: "44px (h-11 / size-11)"
shadows:
  transient-menu: "0 8px 20px rgba(31, 71, 112, 0.14)"
  transient-popover: "0 12px 28px rgba(31, 71, 112, 0.16)"
  transient-card: "0 16px 40px rgba(31, 71, 112, 0.12)"
  transient-dialog: "0 16px 40px rgba(31, 71, 112, 0.18)"
components:
  button-default:
    backgroundColor: "{colors.primary}"
    hover: "{colors.primary-hover}"
    active: "{colors.primary-pressed}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    height: "44px"
    padding: "0 12px"
    font: "14px / 500"
  button-outline:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.input}"
    textColor: "{colors.foreground}"
    hover: "{colors.muted}"
    rounded: "{rounded.full}"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    hover: "{colors.secondary-hover}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.full}"
  button-ghost:
    backgroundColor: "transparent"
    hover: "{colors.muted}"
    rounded: "{rounded.full}"
  button-destructive:
    backgroundColor: "{colors.destructive} / 10%"
    hover: "{colors.destructive} / 20%"
    textColor: "{colors.destructive}"
    rounded: "{rounded.full}"
  button-link:
    textColor: "{colors.primary}"
    hover: "underline, offset 4px"
  text-input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    placeholderColor: "{colors.placeholder-foreground}"
    placeholderWeight: 300
    border: "1px solid {colors.input}"
    hover: "border {colors.input-hover}"
    focus: "border {colors.ring} + 3px ring {colors.primary} / 35%"
    invalid: "border {colors.destructive} + 3px ring {colors.destructive} / 20%"
    rounded: "{rounded.md}"
    height: "44px"
    padding: "0 12px (36px left with icon)"
    font: "16px mobile / 14px md+"
  badge:
    height: "20px"
    rounded: "{rounded.md}"
    padding: "2px 8px"
    font: "12px / 500"
    border: "1px solid {variant} / 25%"
    variants: "primary, neutral, info, success, warning, destructive"
  card-row:
    backgroundColor: "{colors.card}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.xl}"
    hover: "{colors.background}"
  dropdown-menu:
    backgroundColor: "{colors.popover}"
    border: "1px solid {colors.border}"
    rounded: "{rounded.lg}"
    padding: "4px"
    shadow: "{shadows.transient-menu}"
    item: "14px, 8px 12px, hover {colors.accent}"
  drawer:
    mobile: "bottom sheet, top {rounded.xl}, max-h min(85dvh, 44rem), grab handle {colors.input-hover}"
    desktop: "right panel, 26rem, square corners"
    backdrop: "{colors.overlay-navy} / 45%"
    shadow: "{shadows.transient-dialog}"
  tabs:
    track: "44px, {colors.card} pill with {colors.border}"
    indicator: "{colors.primary} sliding pill"
    active-text: "{colors.primary-foreground}"
    inactive-text: "{colors.muted-foreground}"
---

# Design system: TutorPal

> This document describes what the code ships. Token values come from
> `frontend/src/index.css` (`:root`), and component specs come from
> `frontend/src/components/common`. When you change a token or a primitive,
> update this file in the same change.

## Overview

TutorPal uses a Stripe-inspired product language: precise typography, white
navigation chrome, white and cool-soft work surfaces, navy ink, and one indigo
action color. The visual system should help a private tutor understand today's
workload quickly without feeling like a spreadsheet.

The authenticated app stays light and task-oriented. A restrained organic mesh
(`/stripe-auth-mesh.svg`) appears only behind the authentication shell.

## Principles

### One action color

Indigo is used for primary actions, current navigation, focus, active tabs and
meaningful selection. It should remain rare enough to communicate importance.
Info, success, warning and destructive are semantic only.

### Surface before shadow

White (`card`) on cool-soft (`background`) creates the default hierarchy.
Hairlines (`border`) establish boundaries. Shadows are reserved for transient
overlays (menus, popovers, dialogs, drawers) and are always blue-tinted. Resting
cards and rows never carry a shadow.

### Product clarity

Entity lists (students, classes, schedules) are stacks of hairline-outlined
rows with 8px gaps. Details use progressive disclosure. Every screen has a clear
title, one primary next action, and an honest loading, empty, or error state.

### Shared controls

Search, filter, sort, reset, form, drawer, and destructive actions reuse the
shared Button, Input, Select, Badge, Drawer, and Dialog vocabulary. Screens
control layout; primitives control visual language.

## Colors

### Brand

- **Indigo** `primary` #533AFD: primary actions, links, focus ring, current
  navigation, active tab indicator.
- **Indigo hover** `primary-hover` #4434D4: button hover.
- **Indigo pressed** `primary-pressed` #2E2B8C: pressed state; also the text
  color of the primary badge.
- **Indigo container** `primary-container` #ECEBFF: primary badge and subdued
  indigo surfaces.

### Surfaces and text

| Token | Value | Use |
| --- | --- | --- |
| `background` / `surface` | #F6F9FC | App background, row hover, sidebar hover |
| `card` / `popover` / `sidebar` | #FFFFFF | Work surfaces, forms, overlays, rail |
| `accent` / `surface-container-low` | #EEF4F9 | Menu item hover and highlight |
| `secondary` | #EDF2F7 | Secondary button fill |
| `secondary-hover` | #E3EBF4 | Secondary button hover |
| `muted` | #F1F5F9 | Ghost and outline button hover |
| `border` | #E3E8EE | Dividers, card and row outlines |
| `input` | #E3EBF4 | Input and outline-button boundary |
| `input-hover` | #C4D3E2 | Input hover boundary, drawer grab handle |
| `foreground` | #0D253D | Primary text (15.6:1 on white) |
| `secondary-foreground` | #273951 | Supporting text, sidebar text (11.7:1) |
| `muted-foreground` | #61718A | Metadata and helper text (5.0:1) |
| `placeholder-foreground` | #68788D | Input, select, textarea, and time-field placeholders (4.51:1 on white; 4.92:1 on dark card) |
| `overlay-navy` | #0D253D | Drawer and dialog backdrop at 45% |
| `inverse` / `inverse-foreground` | #0D253D / #FFFFFF | Dark summary band (class balance); use `inverse-foreground/70` etc. for secondary text and `/20` for dividers |
| `avatar-neutral` / `-foreground` | #273951 / #FFFFFF | Unknown-student avatar, avatar group count |

### Semantic

Each semantic role has a foreground, a soft container and a darker container
foreground. Badges use the container and the container foreground, with a border
of the foreground at 25%.

| Role | Foreground | Container | Container text | Schedule status |
| --- | --- | --- | --- | --- |
| Info | #0369A1 | #E0F2FE | #075985 | Scheduled (calendar icon) |
| Success | #087443 | #E8F7EF | #075C35 | Completed (tick icon) |
| Warning | #9A5B00 | #FFF4DB | #754400 | No-show (alert icon) |
| Destructive | #B42318 | #B42318 at 10% | #B42318 | Cancelled (× icon) |

Semantic color is always paired with visible text or an icon. It is never the
only indicator. The status → variant → icon map lives in
`lib/schedule-utils.ts`.

The LINE connection is shown with the success badge plus a "LINE" label, not
with a dedicated LINE-green token.

### Name tones

Student avatars get a stable tone hashed from the normalized name
(`lib/name-tone.ts`), as `bg-name-tone-*` with `text-name-tone-foreground`.
Accent colors (`bg-name-accent-*`) are for small decorative marks only, never
behind text.

| Tone | Avatar fill | Accent |
| --- | --- | --- |
| Indigo | #533AFD | #533AFD |
| Orange | #A85800 | #F79303 |
| Cyan | #08769B | #17B5F3 |

### Dark mode

A `.dark` block exists, but it holds the shadcn neutral defaults and is not
themed to TutorPal. Treat dark mode as unsupported until it is designed; don't
build on those values.

## Typography

### Font family

Inter (weights 300–700, self-hosted via `@fontsource/inter`) with
`Noto Sans Thai Variable` as the fallback for Thai script. The `ss01`
stylistic set is applied to `body`, `button`, `input`, `select` and `textarea`.
Thai text needs a taller line height; don't apply negative tracking to Thai.

### Hierarchy (as used in the code)

| Role | Size | Weight | Tracking | Where |
| --- | --- | --- | --- | --- |
| Display | 36px → 48px (sm) | 300 | -0.02em | Auth shell title |
| Overview title | 36px → 40px (sm) | 400 | -0.025em | Dashboard greeting |
| Page title | 24–30px | 400 | -0.02em | Workspace and settings headings |
| Section title | 20px | 500 | -0.01em | Settings cards |
| Drawer title | 18px | 400 | -0.01em | Drawer and dialog headers |
| UI / body | 14px, line height 20px | 400 | 0 | Default product text, menu items |
| Control | 14px | 500 | 0 | Buttons, tabs |
| Row title | 14–16px | 600 | 0 | Student, class and schedule names |
| Meta | 12px, line height 16px | 400 | 0 | Times, durations, notes |
| Badge | 12px | 500 | 0 | Status and attribute badges |
| Auth eyebrow | 14px | 600 uppercase | +0.08em | Auth shell only |
| Numeric | any | 400–600 | 0 | `tabular-nums` on hours, times, counts |

Headings use weight and tracking contrast, not bold. The mobile header page
title is the one exception (`font-bold`, 16–18px). Tracking never goes tighter
than -0.04em. Uppercase eyebrows are used only in the auth shell.

> `font-headline` appears on some headings but has no definition in
> `@theme`, so it falls back to the sans stack. Either define it or remove it.

## Layout

- `ScreenLayout` pads screens at 12px, 16px from `sm`, and 24px from `lg`, on
  `background`. It is the sole owner of the page gutter. `ScreenLayoutEdge`
  cancels that gutter for horizontal rails at every width, or only below `sm`
  with `mobileOnly`; the rail still owns its scrolling and track inset.
- Keep the existing jun-layout geometry unchanged: a 280px desktop rail that
  collapses to 3rem and auto-collapses at `lg`, the mobile edge drawer, and the
  `jun-header` bar (white with a bottom hairline).
- Single-column mobile flow. Horizontal overflow is limited to date and
  refinement rails (`workspace-refinement-rail` hides its scrollbar).
- The minimum hit target for mobile-facing actions is 44px (`h-11` / `size-11`).

## Elevation and shapes

### Radius scale

The base is `--radius: 0.5rem`. Tailwind's radius steps are multiples of it.

| Token | Value | Use |
| --- | --- | --- |
| `rounded` | 4px | Dropdown menu items |
| `rounded-sm` | 4.8px | Compact chrome |
| `rounded-md` | 6.4px | Inputs, badges |
| `rounded-lg` | 8px | Dropdown menus, inner hit areas |
| `rounded-xl` | 11.2px | Rows, schedule cards, auth container, drawer top |
| `rounded-full` | pill | Buttons, icon buttons, tabs, avatars only |

Inputs are never pill-shaped.

### Depth

White on cool-soft is the primary depth cue. The four `shadow-transient-*`
tokens are blue-tinted (`rgba(31, 71, 112, …)`) and are used only on transient
surfaces: menus (`menu`), popovers and selects (`popover`), floating cards
(`card`), and dialogs and drawers (`dialog`). Don't use black shadows or
backdrop blur; the jun edge-sidebar blur is explicitly disabled.

## Components

### Buttons

- All variants are `rounded-full` with 14px / 500 labels and 16px icons at
  stroke 2.
- **Default:** indigo fill and white label. Hover is `primary-hover`; active
  is `primary-pressed`.
- **Outline:** white fill, `input` border, ink label, `muted` hover. Its
  `data-active` state shows a `primary` border, an indigo 10% fill and an indigo
  label.
- **Secondary:** `secondary` fill, `secondary-foreground` label,
  `secondary-hover` on hover.
- **Ghost:** transparent until `muted` hover. Used for in-context and ⋮
  actions.
- **Destructive:** destructive at 10% fill (20% on hover) with a destructive
  label.
- **Link:** an indigo label that underlines on hover.
- **Sizes:** `xs` 24px, `sm` 32px, `md` 44px (default, 12px padding), `lg` 44px
  (16px padding). Icon buttons are `icon-xs` 24, `icon-sm` 32, `icon-lg` 40 and
  `icon` 44.
- **Press and states:** pressing moves the button down 1px (except menu
  triggers). Focus shows a 3px `ring` at 50%. Disabled is 50% opacity.
  Loading keeps the button's width and shows three 4px dots that bob 2px over
  0.72s; the label stays readable for screen readers.

### Inputs

44px high, white (`card`) surface, 1px `input` border, `rounded-md`, 12px
horizontal padding. Text is 16px on mobile (to avoid iOS zoom) and 14px from
`md`. Hover changes the border to `input-hover`. Focus uses a `ring` border plus
a 3px indigo ring at 35%. Invalid fields (`aria-invalid`) use a destructive
border and a 3px destructive ring at 20%. Placeholders use
`placeholder-foreground` at `font-light` (300), including Select, textareas,
and the custom time-field overlay; the token keeps at least 4.5:1 contrast on
light and dark field surfaces. A leading icon sits 12px from the left in muted
ink, and the input pads to 36px. Number inputs hide their spinners and blur on
wheel.

### Badges

20px high, `rounded-md`, 2px × 8px padding, 12px / 500, with 12px icons. The
variants are `primary`, `neutral`, `info`, `success`, `warning` and
`destructive`. Semantic variants use their container fill, their
container-foreground text and a border of their foreground at 25%. `neutral`
uses a `muted` fill, `secondary-foreground` text and a `border` hairline.

### Rows and cards

- **Student row:** a white card with a `border` hairline, `rounded-xl`, at least
  80px high and 16px padding. It holds a 40px name-tone avatar, the name at 600,
  attribute badges (grade, LINE, needs relink), a muted phone line, and a ⋮
  ghost icon button. Hover and focus-within fill the card with `background`.
- **Schedule card:** a white card with a hairline, `rounded-xl` and 8–12px
  padding. It has a 64px right-aligned tabular time column (start 14/600, end
  12 muted), a 14/600 title with a status badge, a 12px meta line (type icon ·
  duration), an optional truncated note, and a ⋮ menu.
- The primary hit area of each row is a single `<button>`; the ⋮ menu sits
  outside it. Lists stack rows with 8px gaps.

### Avatars

Sizes are `sm` 24, `default` 32 and `lg` 40, circular, with an inner `border`
hairline. The fallback uses indigo at 10% with muted initials; student rows use
name-tone fills instead. Groups overlap by 8px with a 2px `background` ring. The
count chip is #273951.

### Dropdown menus

`popover` surface, 1px `border`, `rounded-lg`, 4px padding, minimum width 192px,
`shadow-transient-menu`. Items are 14px, 8px × 12px padding, `rounded`, with
16px icons; hover and highlight use `accent`. Destructive items use destructive
text with a 10% hover, and sit last after a separator. Group labels are 12px
muted.

### Tabs

- **Default:** a 44px track with a white pill (`card` and `border`) inset 4px,
  plus a sliding indigo pill indicator. The active label is white; inactive
  labels are `muted-foreground` and turn ink on hover.
- **Subtle:** no track; the indigo indicator slides between items. Inactive
  items hover to `muted`, and the active label is 600.
- The indicator animation turns off under reduced motion.

### Navigation

The desktop rail is white with a `border` divider and `secondary-foreground`
text. The current route uses `aria-current="page"` with indigo text at 600 and
no fill. Hover uses `background` (#F6F9FC). Integrations follows Students as a
direct item. Account access remains in the user menu, which sits at the bottom
with an indigo initials avatar. The mobile header is a white `jun-header` bar
with a bottom hairline.

The Integrations screen uses a centered 960px content column inside the shared
screen gutter. Provider cards use a neutral 48px mark tile containing the
bundled [theSVG](https://github.com/GLINCKER/thesvg) LINE, Zoom 2025, or Google
Meet 2026 mark beside its title and description. Each card has a text-plus-icon
status badge beside its title and an optional 44px action.
Titles, badges, and descriptions wrap without clipping in narrow cards. The
LINE action sits below the content on narrow screens and trails it from `sm`.
Messaging and Online classes are separate groups. Coming-soon providers remain
informational and are not focusable.

LINE configuration uses a centered 1040px shell with a neutral 48px provider mark,
a title, and a neutral Supported badge. The main setup column and About panel
stack until their container reaches 824px; at that threshold, the main column
takes the remaining width beside a fixed 280px About panel with a 24px gap
(736px / 24px / 280px in the 1040px shell).
The mobile breadcrumb uses a 44px “All integrations” parent link. The progress
list lives in the same bordered setup card as the credential form. A numbered
Step 1 rail aligns the heading, token field, channel fields, and action in one
content column. Only the token field has helper text. Divided Step 2 (test
recipient) and Step 3 (test message) rows follow the form and stay muted until
their API prerequisites are met. The token field has a keyboard-operable
visibility button, and the channel ID and secret fields sit side by side from
`sm`. Connection
state comes from `configured` and `testRecipientConnected`, not a local status
label. The connected summary shows only the account name, Basic ID, verification
time, and test-message action. Account details use semantic label/value rows;
credential edit fields start blank because saved secrets are never read back.
The About panel explains supported capabilities, setup requirements, and the
LINE Developers Console. The credential privacy note sits beneath the About
panel.

Breadcrumbs use a semantic navigation landmark with an ordered trail. Ancestors
are router links that underline on hover; the current page is medium weight and
truncates. In the default responsive mode, the full trail appears from `md` and
a 44px parent back link appears below it. That back link uses the indigo link
color, a `muted` hover fill and the standard 3px focus ring. `always` keeps the
parent back link at every width, while `never` keeps the full trail at every
width. When a parent has no route target, keep the full trail visible rather
than showing a noninteractive back control.

### Drawers and dialogs

- **Below `md`:** a bottom sheet with an 11.2px top radius and a maximum height
  of min(85dvh, 44rem). It has a 40×6px grab handle in `input-hover` and enters
  by translating up.
- **From `md`:** a 26rem right-hand panel with square corners that slides in from
  the right.
- **Both:** a `popover` surface with `shadow-transient-dialog` over an
  `overlay-navy` backdrop at 45%. Headers and content use 24px horizontal
  padding, and the footer uses 16px. The body scrolls and the footer stays
  reachable. Nested Select and calendar surfaces portal into the active drawer.

### Toasts

Toasts are built on Sonner (`common/sonner.tsx`, styled in `common/sonner.css`).
They appear 16px from the viewport edge (12px on mobile) and always show a
close button.

- **Surface:** `popover` with a 1px `border`, a 4px left accent edge
  (`--toast-accent`), 12px radius and `shadow-transient-popover`. Minimum
  height is 72px; padding is 14px, with 40px on the right to clear the close
  button; gap is 12px.
- **Icon disc:** a 28px circle in `--toast-icon-background` holding a 16px
  Hugeicons glyph in `--toast-icon` (`primary-foreground`).
- **Text:** title 14 / 600 / 1.3 in `popover-foreground`; description
  12 / 400 / 1.4 in `muted-foreground`. Long words wrap anywhere.
- **Close:** 24px, 8px from the top-right corner, muted ink.
- **Action:** `primary` fill with a `primary-foreground` label and 6px radius.
  **Cancel:** `secondary` with `secondary-foreground`.
- **Focus:** a 2px `ring` outline with a 2px offset.

| Type | Accent edge | Icon disc | Icon |
| --- | --- | --- | --- |
| Default | `primary` | none | none |
| Success | `success` | `success` | Tick |
| Info | `info` | `info` | Information circle |
| Warning | `warning` | `warning` | Exclamation mark (stroke 2.5) |
| Error | `destructive` | `destructive` | Multiplication sign |
| Loading | `primary` | `primary-hover` | Spinning loader |

At 600px and below: minimum height 68px, padding 12px, gap 10px, icon disc
26px. At 420px and below, a toast with an action wraps so the button drops
below the text.

Use toasts to confirm an action the user just took. Errors that block a form
belong inline. Write the title as the outcome ("Class marked as completed"),
and keep the description to one line. For reversible destructive actions,
prefer an Undo action over a confirm dialog.

## Authentication shell

The auth screens center a white `card` with a hairline and `rounded-xl` over
the local mesh SVG (70% opacity). Padding is 24 × 20px, rising to 40px from
`sm`. Inside are a 40px app icon, an optional uppercase eyebrow, and a light
display title (36 → 48px, 300) capped at 12ch. The mesh must stay behind an
opaque surface and must never appear in authenticated workspaces or as gradient
text. Don't use remote image URLs.

## States and accessibility

- Loading uses skeletons that mirror the eventual content. Standalone spinners
  are limited to the button loading dots and redirect states.
- Empty states explain the next useful action and offer one relevant CTA.
- Errors state the problem directly, preserve input where possible, and offer
  retry or correction.
- Success and warning states pair color with text or an icon.
- Keyboard users get a visible 3px focus ring, logical focus trapping, Escape
  dismissal, and focus return to the invoking control. Icon-only buttons have
  an `aria-label`, and decorative icons are `aria-hidden`.
- Test 320px, 768px, 1024px, and wide desktop layouts with no clipped content,
  page overflow, or unreachable drawer actions.
- `prefers-reduced-motion` collapses all animations and transitions to 0.01ms
  and stops the loading dots.

## Do and don't

### Do

- Do use Inter weight and tracking contrast instead of heavy all-bold headings.
- Do keep the app rail white with navy text and indigo current navigation.
- Do use tabular figures for class hours, dates, and counts.
- Do use the four `shadow-transient-*` tokens, and only on overlays.
- Do keep semantic states readable and redundant with text or icons.
- Do use the shared primitives' variants before adding classes in screens.

### Don't

- Don't use Manrope, default browser typography, or pure black.
- Don't use pill-shaped inputs.
- Don't hard-code colors in components: no `bg-[#…]`, `text-white`,
  `bg-white` or palette classes. Use a token, and add one to `index.css`
  (`:root` plus `@theme`) if none fits. Third-party brand marks (the Google and
  LINE logos) are the only exception.
- Toasts (`sonner.css`) take their accents from the semantic tokens; don't
  give them their own palette.
- Don't use generic gradients, external image services, or gradient text.
- Don't use black shadows, backdrop blur, or shadows on resting cards.
- Don't add new accent colors or invent dashboard data.
- Don't change routes, API contracts, data models, or the existing drawer
  geometry for visual work.
