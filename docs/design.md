# Design System: The Curated Study

> **Creative North Star**: "The Digital Atelier" — An editorial-first framework designed for deep focus and academic rigor.

## Overview

Moving away from ephemeral gradients and soft shadows, this system embraces the precision of a physical workspace. By stripping away visual noise—such as gradients, blurs, and decorative depth—we elevate content to the level of a curated manuscript.

The aesthetic is **Modern Functionalism**: high-contrast, mathematically precise, and unapologetically flat. Sophistication comes not from "effects," but from masterful control of white space, bold Manrope typography, and a "Border-First" architectural logic.

---

## Color System

### Primary Identity
- **Primary**: `#6C63FF` — The "Scholar's Ink", a vibrant violet for critical actions and brand markers
- **On-Primary**: `#FFFFFF` — Text/icons on primary backgrounds

### Surface Hierarchy
Colors create hierarchy through "nesting" solid blocks:

1. **Base Layer**: `surface` (`#FCF8FF`)
2. **Sectioning**: `surface-container-low` (`#F6F2FF`)
3. **Component Cards**: `surface-container-lowest` (`#FFFFFF`) with 1px solid `outline-variant` border
4. **Floating Elements**: `surface-container-highest` (`#E4E1EE`) with 2px solid `primary` border

### Complete Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#6C63FF` | Primary actions, brand elements |
| `primary-container` | `#675DF9` | Primary hover states, badges |
| `on-primary` | `#FFFFFF` | Text on primary backgrounds |
| `secondary` | `#59579A` | Secondary actions, icons |
| `secondary-container` | `#B7B4FF` | Secondary backgrounds |
| `tertiary` | `#914800` | Warnings, urgent states |
| `tertiary-container` | `#B65C00` | Urgent highlights |
| `surface` | `#FCF8FF` | Page background |
| `surface-container-low` | `#F6F2FF` | Section backgrounds |
| `surface-container-lowest` | `#FFFFFF` | Cards, elevated surfaces |
| `outline` | `#777587` | Primary borders |
| `outline-variant` | `#C7C4D8` | Subtle dividers |
| `on-surface` | `#1B1B24` | Primary text |
| `on-surface-variant` | `#464555` | Secondary text, metadata |

### The "Solid Boundary" Rule

**Prohibitions**:
- No gradients (even subtle ones)
- No transparency (alpha < 100%) except disabled states
- No standard box-shadows

**Allowed**:
- Solid borders using `outline` or `outline-variant`
- High-contrast sectioning via surface color shifts
- "Solid Shadow" — 4px offset of `secondary-container` behind cards

---

## Typography

**Manrope** is the sole typeface—a geometric sans-serif balancing modern tech with high readability.

### Type Scale

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| **Display-LG** | 3.5rem | 800 | Hero moments, high-impact data |
| **Display-MD** | 2.75rem | 700 | Dashboard greetings |
| **Headline-MD** | 1.75rem | 700 | Primary section headers |
| **Headline-SM** | 1.5rem | 700 | Secondary headers |
| **Title-LG** | 1.375rem | 600 | Card titles |
| **Title-SM** | 1.0rem | 600 | Sub-navigation, form labels |
| **Body-LG** | 1.0rem | 400 | Primary reading text |
| **Body-MD** | 0.875rem | 400 | Default body text |
| **Label-MD** | 0.75rem | 700 | Form labels, metadata (ALL CAPS) |

### Visual Hierarchy Tip
Use `label-md` in all caps with 0.05em letter-spacing for a "curated" archival feel above headlines.

---

## Spacing

A strict rhythm following a 4px base unit:

| Token | Value |
|-------|-------|
| `spacing-1` | 0.25rem (4px) |
| `spacing-2` | 0.5rem (8px) |
| `spacing-3` | 0.75rem (12px) |
| `spacing-4` | 1rem (16px) |
| `spacing-5` | 1.25rem (20px) |
| `spacing-6` | 1.5rem (24px) |
| `spacing-8` | 2rem (32px) |
| `spacing-10` | 2.5rem (40px) |
| `spacing-12` | 3rem (48px) |

Internal padding for cards must follow 24px or 32px rhythm.

---

## Border Radius (Roundness)

Following the `ROUND_FOUR` convention:

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 0.25rem (4px) | Small components, chips |
| `radius-md` | 0.375rem (6px) | Buttons |
| `radius-lg` | 0.5rem (8px) | Cards, inputs |
| `radius-xl` | 1rem (16px) | Large containers, modals |

---

## Components

### Buttons: The Action Blocks

**Primary**:
- Background: `#6C63FF`
- Text: White
- Border-radius: `0.375rem` (md)
- No shadow, no border

**Secondary**:
- Background: `#B7B4FF`
- Text: `#150F54`
- No border

**Tertiary (Ghost)**:
- Background: Transparent
- Border: 1px solid `outline`

### Cards: The Document Container

**Construction**:
- Background: `surface-container-lowest`
- Border: 1px solid `outline-variant`
- Padding: 24px or 32px

**Interaction**:
- On hover: border changes from `outline-variant` to `primary`

### Input Fields: The Scholarly Entry

**Static State**:
- Background: `surface-container-low`
- Border-bottom: 2px solid `outline`
- Border-radius: `0.375rem` top corners only

**Focus State**:
- Border becomes 2px solid `primary`
- Label shifts to `primary` color

### Chips & Tags

- Background: `surface-variant`
- Text: `label-sm` (0.75rem, 700 weight, ALL CAPS)
- Border-radius: `0.25rem` (sm) — avoid pill shapes

---

## Elevation & Depth

Since gradients and shadows are prohibited, depth is communicated via:

1. **Physical Stacking** — Layering surface colors
2. **Solid Offsets** — 4px offset shadow using `secondary-container`
3. **Tonal Layering** — Objects appear closer when lighter (white = closest)
4. **Active States** — Background shift to `primary-fixed` or 2px border

### The "No-Line" Philosophy

- **Don't** use 1px dividers to separate list items
- **Do** use vertical white space (16px/24px gaps)
- **Do** use solid background shifts between rows

---

## Do's and Don'ts

### Do
- Use intentional asymmetry (text left-aligned, actions right-aligned)
- Use 2px solid borders for active/focused states
- Lean on primary color for "Information Scaffolding"
- Prioritize negative space to prevent visual fatigue
- Use `tertiary` (#914800) for urgent notifications (sophisticated warmth vs harsh red)

### Don't
- Use gradients of any kind
- Use transparency (alpha < 100%) except disabled states
- Use standard Material "Shadow 1/2/3"
- Use pure black (#000000) for text — always use `on-surface` (#1B1B24)
- Use 1px solid borders for sectioning — use background color shifts
- Use drop shadows on buttons — use color shift or ghost border

---

## Implementation

### CSS Variables

All colors and tokens are defined in `frontend/src/index.css`:

```css
@theme {
  --color-primary: #6C63FF;
  --color-primary-container: #675df9;
  --color-on-primary: #ffffff;
  /* ... etc */
}
```

### Font Import

```css
@import "@fontsource/manrope/400.css";
@import "@fontsource/manrope/600.css";
@import "@fontsource/manrope/700.css";
@import "@fontsource/manrope/800.css";
```

### Utility Classes

```css
/* Solid borders */
.border-outline { border: 1px solid var(--color-outline); }
.border-outline-variant { border: 1px solid var(--color-outline-variant); }
.border-primary { border: 1px solid var(--color-primary); }
.border-primary-thick { border: 2px solid var(--color-primary); }

/* Solid shadow offset */
.solid-shadow { box-shadow: 4px 4px 0 var(--color-secondary-container); }
```

---

## Migration from Previous System

If migrating from the old "Academic Atelier" system:

1. ✅ Replace all instances of `Inter` font with `Manrope`
2. ✅ Update color values to match new palette (especially tertiary: green → orange)
3. ✅ Remove all `btn-gradient`, `.glass`, `.ambient-shadow` classes
4. ✅ Replace `rounded-xl` with `rounded-lg` or `rounded-xl` (check: new xl is 16px vs old 0.75rem)
5. ✅ Replace blur/backdrop-filter effects with solid borders
6. ✅ Update surface colors: `#faf8ff` → `#fcf8ff`
7. ✅ Remove toast-specific colors (use standard color tokens)

---

*Last updated: April 2026*  
*Source: Stitch "Curated Study" Design System*  
*Project: TutorFlow Management System*
