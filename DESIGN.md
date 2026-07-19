---
name: TutorPal
description: Warm, approachable tutoring management for private tutors
colors:
  primary: "#6C63FF"
  primary-container: "#675DF9"
  primary-foreground: "#FFFFFF"
  secondary: "#59579A"
  secondary-container: "#B7B4FF"
  tertiary: "#914800"
  tertiary-container: "#B65C00"
  surface: "#FCF8FF"
  surface-container-low: "#F6F2FF"
  surface-container-lowest: "#FFFFFF"
  surface-container-highest: "#E4E1EE"
  outline: "#777587"
  outline-variant: "#C7C4D8"
  on-surface: "#1B1B24"
  on-surface-variant: "#464555"
  destructive: "#D4423D"
  destructive-foreground: "#FFFFFF"
  background: "#FCF8FF"
  foreground: "#1B1B24"
  card: "#FFFFFF"
  card-foreground: "#1B1B24"
  muted: "#F6F2FF"
  muted-foreground: "#777587"
  input: "#C7C4D8"
  ring: "#6C63FF"
  border: "#C7C4D8"
  accent: "#F6F2FF"
  accent-foreground: "#1B1B24"
  popover: "#FFFFFF"
  popover-foreground: "#1B1B24"
  sidebar: "#F6F2FF"
  sidebar-foreground: "#1B1B24"
  sidebar-primary: "#6C63FF"
  sidebar-primary-foreground: "#FFFFFF"
typography:
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "16px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.secondary}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  button-destructive:
    backgroundColor: "rgba(212,66,61,0.1)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.full}"
    padding: "10px 16px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.card-foreground}"
    rounded: "{rounded.xl}"
    padding: "16px"
  input:
    backgroundColor: "rgba(199,196,216,0.3)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-outline:
    backgroundColor: "rgba(199,196,216,0.3)"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  avatar:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    padding: "0"
  bottom-nav:
    backgroundColor: "{colors.card}"
    textColor: "{colors.muted-foreground}"
    rounded: "{rounded.xl}"
    padding: "12px 16px 24px"
---

# Design System: TutorPal

## 1. Overview

**Creative North Star: "The Scholar's Desk"**

TutorPal is a tutoring management tool for private tutors who juggle students, classes, and schedules. The design system embraces **Modern Functionalism** — a high-contrast, mathematically precise aesthetic stripped of visual noise. No gradients, no transparency, no decorative depth. Sophistication comes from masterful control of white space, bold Manrope typography, and a "Border-First" architectural logic.

This system explicitly rejects the corporate spreadsheet look (dense data tables, monochrome grids, overwhelming numbers) and the SaaS-cream AI default (warm beige backgrounds, soft shadows, gradient accents). TutorPal feels like a well-organized desk — warm, precise, calm — not accounting software or a generic dashboard.

**Key Characteristics:**
- Border-first architecture: solid 1px outlines create hierarchy, not shadows or gradients
- Surface color shifts for depth: layering solid blocks of color, not elevation
- Bold Manrope typography: high-contrast headlines, scannable body text
- Warm violet identity: `#6C63FF` as the singular accent, used with restraint
- Clean & restrained components: content does the talking, surfaces stay quiet

## 2. Colors

The palette is a restrained system built around a single saturated violet accent against warm-tinted neutrals. One accent carries the brand; the rest serve hierarchy.

### Primary
- **Scholar's Ink** (#6C63FF): The brand anchor. Used on primary actions (FAB, active nav, submit buttons), form focus rings, and brand markers. Its rarity on screen is the point — it signals "this matters."
- **Ink Deep** (#675DF9): Hover state for primary elements. Slightly deeper for interactive feedback.
- **Ink Light** (#B7B4FF): Secondary container backgrounds (chips, badges). Rarely used as a surface.

### Tertiary
- **Amber Warning** (#914800): Urgent notifications, destructive-adjacent states. A sophisticated warm tone that reads as "pay attention" without the harshness of pure red.
- **Amber Container** (#B65C00): Backgrounds for urgent highlights and warning badges.

### Neutral
- **Page** (#FCF8FF): The base layer. A barely-there violet tint — warm but not cream.
- **Section** (#F6F2FF): Section backgrounds, sidebar, muted areas. One step deeper than page.
- **Card** (#FFFFFF): Elevated surfaces. Cards, modals, popovers. The lightest neutral.
- **Float** (#E4E1EE): Floating elements, tooltips, highest-elevation surfaces.
- **Ink** (#1B1B24): Primary text. Never pure black.
- **Slate** (#464555): Secondary text, metadata, descriptions.
- **Mist** (#777587): Borders, icons, disabled text. The workhorse divider.
- **Frost** (#C7C4D8): Subtle dividers, input borders, card outlines.

### Named Rules
**The Solid Boundary Rule.** No gradients, no transparency (except disabled states), no standard box-shadows. Depth is communicated through surface color layering and solid 1px borders. The system is unapologetically flat.

**The One Accent Rule.** The primary violet is used on ≤10% of any given screen. Its rarity creates hierarchy. When in doubt, use a neutral surface shift instead of adding more purple.

## 3. Typography

**Display Font:** Manrope (sans-serif)
**Body Font:** Manrope (sans-serif)

**Character:** A single geometric sans-serif in multiple weights. Manrope balances modern tech with high readability — not cold or corporate, not soft or rounded. It carries the "warm, approachable, professional" personality through weight contrast alone.

### Hierarchy
- **Display** (800 weight, 1.875rem, line-height 1.1): Hero moments, dashboard greetings, high-impact numbers. Tight letter-spacing (-0.02em) for gravitas without cramming.
- **Headline** (700 weight, 1.25rem, line-height 1.2): Primary section headers. The workhorse heading.
- **Title** (600 weight, 1.125rem, line-height 1.3): Card titles, drawer headings. Clear but not shouting.
- **Body** (400 weight, 0.875rem, line-height 1.5): Primary reading text. Comfortable at this size for daily use.
- **Label** (700 weight, 0.75rem, letter-spacing 0.05em, ALL CAPS): Form labels, metadata, chips. The archival kicker — used sparingly, not on every section.

### Named Rules
**The Label Restraint Rule.** The uppercase label style is used for functional metadata (form labels, chip text, nav labels), not as a decorative kicker above every section heading. One label per context, not a uniform scaffold.

## 4. Elevation

Flat by default. Depth is conveyed entirely through surface color layering — objects appear closer when lighter (white card on tinted section on page background). No shadows, no blur, no gradient depth cues.

### Depth Vocabulary
- **Page** (#FCF8FF): The deepest layer. Everything sits on top.
- **Section** (#F6F2FF): Mid-depth. Sidebar, section backgrounds, grouping containers.
- **Card** (#FFFFFF): Surface level. Cards, inputs, interactive elements.
- **Float** (#E4E1EE): Topmost. Tooltips, dropdowns, floating elements.

### Named Rules
**The No-Shadow Rule.** Standard `box-shadow` is prohibited. If an element needs to feel elevated, make it lighter (shift toward white) or add a 2px border in the primary color for active states. Depth through color, not lighting effects.

## 5. Components

Components are clean, restrained, and functional. Content is the focus; surfaces stay quiet. Every component follows the Border-First architecture with solid outlines instead of shadows.

### Buttons
- **Shape:** Full pill (rounded-full). Confident and approachable, never boxy.
- **Primary:** Violet background (#6C63FF), white text. Used sparingly — one primary action per view.
- **Outline:** Transparent background, 1px border input, foreground text. The default for most actions.
- **Secondary:** Secondary-container background (#B7B4FF), secondary text (#59579A). For supporting actions.
- **Ghost:** No background, no border. Appears on hover only. For in-context actions.
- **Destructive:** Tinted red background (rgba(212,66,61,0.1)), red text. Never a solid red block.
- **Focus:** 3px ring in primary color with 50% opacity. Clear without being garish.

### Cards
- **Corner Style:** 16px radius (rounded-xl). Gentle curve, not a pill.
- **Background:** White (#FFFFFF). The lightest surface.
- **Border:** 1px solid outline-variant (#C7C4D8). The primary hierarchy signal.
- **Hover:** Border shifts to primary (#6C63FF). The card "activates."
- **Internal Padding:** 16px. Consistent rhythm across all card types.
- **Shadow Strategy:** None. Depth comes from being white on a tinted section background.

### Inputs
- **Style:** Full pill (rounded-full). Tinted background (rgba(199,196,216,0.3)), 1px input border.
- **Focus:** Border becomes 2px solid primary, 3px ring with 40% opacity.
- **Placeholder:** Muted foreground color. Never gray on white — always the tinted muted tone.
- **Error:** Border shifts to destructive, ring in destructive/20.

### Chips / Badges
- **Default:** Primary background, white text. For counts and active states.
- **Outline:** Tinted background, foreground text with border. For metadata and labels.
- **Shape:** Full pill. Small, scannable, never dominant.

### Navigation
- **Bottom Nav:** White card background with rounded top corners (16px). Active tab gets a primary-colored icon with a subtle spring animation. Inactive tabs are muted.
- **Top App Bar:** Clean, minimal. Title left-aligned, actions right-aligned.
- **Mobile-first:** Fixed bottom nav, scrolling content above. Thumb-friendly zones.

### Avatar
- **Shape:** Full circle. Accent background with on-surface text.
- **Sizes:** Small (24px), Large (40px). Used in cards, lists, and groups.
- **Fallback:** Initials extracted from name. Always readable.

### Drawer / Modal
- **Background:** White card surface.
- **Overlay:** Semi-transparent dark backdrop.
- **Responsive behavior:** Below `md`, a bottom sheet with 16px top corners and a drag handle slides up. At `md` and above, the same surface slides in from the right as a fixed-width panel.
- **Structure:** A fixed header and optional action footer frame one scrollable body. Form footers use one primary action (full width on mobile, compact and right-aligned at `md` and above); the close button always has a 44px target. Nested pickers use the same shell and a higher overlay layer.
- **Overlay portals:** Floating controls opened inside a drawer, including Selects and calendar Popovers, portal into the active drawer surface rather than the document body.

## 6. Do's and Don'ts

### Do:
- **Do** use solid 1px borders for all card and input outlines. The border IS the design.
- **Do** use surface color shifts (page → section → card → float) for depth hierarchy.
- **Do** use the primary violet sparingly — one accent per view, rare enough to create hierarchy.
- **Do** use Manrope weight contrast (400/600/700/800) for typographic hierarchy instead of size alone.
- **Do** use full pill shapes for buttons, badges, and inputs. Confident and approachable.
- **Do** use ALL CAPS labels (0.05em tracking) for functional metadata only — form labels, chip text, nav labels.
- **Do** use `tertiary` (#914800) for urgent notifications — sophisticated warmth vs harsh red.
- **Do** use 16px border-radius on cards and modals. Gentle curve, never boxy.

### Don't:
- **Don't** use gradients of any kind — even subtle ones. The system is unapologetically flat.
- **Don't** use standard `box-shadow` for elevation. Use surface color shifts instead.
- **Don't** use pure black (#000000) for text — always use on-surface (#1B1B24).
- **Don't** use transparency (alpha < 100%) except for disabled states and tinted backgrounds.
- **Don't** use border-left or border-right greater than 1px as a colored stripe. Never intentional.
- **Don't** use glassmorphism, backdrop-blur, or decorative transparency. Purposeful only.
- **Don't** use corporate spreadsheet layouts — dense data tables, monochrome grids, overwhelming numbers.
- **Don't** use the SaaS-cream AI default — warm beige backgrounds, soft shadows, gradient accents.
- **Don't** put uppercase label kicker text above every section heading. One label per context, not a uniform scaffold.
- **Don't** use 32px+ border-radius on cards. Cards top out at 16px; full pill is for buttons and badges.
- **Don't** pair 1px border + box-shadow with blur ≥ 16px on the same element. Pick one, never both.
