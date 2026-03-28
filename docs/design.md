# Design System Strategy: The Academic Atelier

## 1. Overview & Creative North Star

**Creative North Star: The Curated Scriptory**
This design system moves away from the sterile, "SaaS-blue" dashboard aesthetic to create a digital workspace that feels like a private library or a high-end atelier. We are building an environment for deep thought, not just data entry.

To break the "template" look, we utilize **Editorial Asymmetry**. This means we avoid perfectly centered, symmetrical grids in favor of layouts that feel like a modern academic journal—generous white space, purposeful off-center groupings, and high-contrast typography scales that guide the eye through hierarchy rather than borders.

---

## 2. Colors: Tonal Architecture

The palette is rooted in a scholarly purple, but its application is disciplined. We treat color as a functional "wash" rather than a decorative element.

- **The "No-Line" Rule:** Explicitly prohibit the use of 1px solid borders for sectioning. Boundaries are defined solely through background shifts. For instance, a `surface-container-low` (#f8f1fa) sidebar should sit against a `surface` (#fdf7fe) main content area.
- **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of fine vellum.
  - **Level 0 (Base):** `surface` (#fdf7fe)
  - **Level 1 (Sections):** `surface-container-low` (#f8f1fa)
  - **Level 2 (Cards):** `surface-container-lowest` (#ffffff)
- **The "Glass & Gradient" Rule:** To move beyond a standard flat look, floating elements (like navigation bars or modals) must use **Glassmorphism**. Apply `surface` with a 70% opacity and a `20px` backdrop-blur.
- **Signature Textures:** For primary CTAs, use a subtle linear gradient from `primary` (#6b46c1) to `primary-container` (#a480fe) at a 135-degree angle. This adds a "soul" to the interactive elements that flat hex codes lack.

---

## 3. Typography: The Editorial Voice

Our typography pairing balances the structural elegance of **Manrope** with the utilitarian precision of **Inter**.

- **Display & Headlines (Manrope):** These are our "authoritative" voices. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero sections to create a high-end editorial feel.
- **Body & Labels (Inter):** Inter handles the "labor" of the interface. It should always be set with generous line-height (1.6 for `body-lg`) to ensure long-form educational content remains legible and unstrained.
- **Hierarchy as Identity:** Use a dramatic jump between `headline-lg` and `body-md`. This contrast signals a refined, curated experience where the "titles" act as landmarks in a vast field of information.

---

## 4. Elevation & Depth: Atmospheric Layering

Traditional drop shadows are too "software-heavy" for an atelier. We achieve depth through **Tonal Layering**.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-high` background to create a soft, natural lift. The eye perceives the color shift as a change in physical height.
- **Ambient Shadows:** When a float is required (e.g., a dropdown), use a "Shadow-Wash": `0px 12px 32px rgba(107, 70, 193, 0.06)`. Note the use of the `primary` tint in the shadow—this prevents the UI from looking "dirty" with grey shadows.
- **The Ghost Border:** If a divider is mandatory for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
- **Motion Depth:** When elements hover, do not just lift them; shift their background from `surface-container` to `surface-bright` to simulate light hitting a surface.

---

## 5. Components: Primatives for the Atelier

### Buttons

- **Primary:** Gradient fill (`primary` to `primary-container`), white text, 8px radius. High-elevation feeling.
- **Secondary:** `surface-container-highest` fill with `on-surface` text. No border.
- **Tertiary:** Ghost style. No background, `primary` text. Use for low-emphasis actions.

### Inputs & Fields

- **Field Style:** Forgo the 4-sided box. Use a `surface-container-low` fill with a `2px` bottom-stroke of `primary` only upon focus. This mimics a "fill-in-the-blank" academic form.
- **Radius:** Strict adherence to `DEFAULT` (0.5rem/8px).

### Cards & Content Lists

- **The Divider Ban:** Never use a horizontal line to separate list items. Use `spacing-6` (1.5rem) of vertical white space or alternating subtle shifts between `surface` and `surface-container-low`.
- **The "Research Card":** A card should have a `surface-container-lowest` background and an `8px` radius. Content inside should be padded with `spacing-8` (2rem) to ensure an "expensive" feel.

### Specialized Component: The Curator's Tray

A docked, bottom-screen glassmorphic container (backdrop-blur 16px) used for staging "resources" or "lesson elements." It uses `surface-variant` at 40% opacity to feel like a frosted glass shelf.

---

## 6. Do’s and Don'ts

### Do

- **Do** use asymmetrical margins (e.g., a wider left margin than right) to create an editorial layout.
- **Do** use `primary-dim` for hover states on purple elements to maintain tonal richness.
- **Do** lean into white space. If you think there is enough space, add 25% more.

### Don’t

- **Don’t** use pure black (#000000) for text. Always use `on-surface` (#34313a) to maintain the soft, academic tone.
- **Don’t** use 1px borders to separate sidebars or headers. Use a background color step-down.
- **Don’t** use standard "Material Design" blue for links. Use the `primary` purple.
- **Don’t** use sharp 0px corners. This system is "Refined," and 8px roundness is our signature of approachability.
