# Marketing design direction

## Approved direction

The production homepage uses the selected B + A hybrid: B's centered,
Week-led product composition and A's factual teaching-day story, refined into
compact scenes and a paired confirmation/completion chapter. The user approved this implementation on September 8, 2026.
The emotional promise is “my teaching day is under control”; launch awareness
leads, with **Explore TutorPal** as the primary action and beta interest at the
close.

Preserve TutorPal's indigo `#533AFD`, navy `#0D253D`, cool-white surfaces,
compact product panels, and accessible focus treatment. Editorial headings use
Outfit with Noto Sans Thai; product panels retain their established typography.
The homepage uses one continuous white canvas, with centered content measures
and no contrasting side gutters or constrained section backgrounds.

## Page structure

1. Header with Product, Workflow, Beta, language selection, and the configured
   portal link when available.
2. `#product` centered hero with the faithful Week crop as the main plane,
   Class balance and Today confirmation supporting it, and
   **Explore TutorPal** leading to `#workflow`.
3. Quiet transition into the teaching-day story.
4. `#workflow` compact class context, a contained Day/Week planning composition,
   then pending Today confirmation and completed-session history side by side
   on desktop. On smaller screens, the state comparison stacks in story order.
5. `#benefits` feature list and LINE integration proof with a semantic message
   stage, truthful description, and a scroll-triggered incoming message.
6. Native FAQ disclosures.
7. Real beta form, privacy notice, and footer.

The original comparison switcher, variant routing, and local non-submitting
form do not belong in the production experience. Alternatives are preserved in
the [exploration archive](../docs/prototypes/README.md).

## Product fidelity and imagery

The user explicitly approved faithful UI illustrations in place of mandatory
product screenshots. They must preserve real TutorPal concepts and states:
class membership, remaining/total hours, recorded revenue, Day/Week schedule
controls, Today agenda, confirmation, and completed sessions. The same fictional
English foundations class and Maya Chen learner connect the story.

The Week illustration is explicitly a Fri–Sun detail crop. Scheduling has
already reserved the session's hours; changing its status to Completed must
not deduct the same hours a second time. Keep the depicted balance at 7.0/10.0.

The LINE visual is semantic HTML, with a fictional account, date, and message
bubble. The visible message itself uses the exact backend English template,
including line breaks, on both language versions. Do not duplicate the message
as a hidden transcript, invent a Thai backend message, or add delivery/read
receipts. Product panels and the LINE stage omit visible illustrative/demo
labels; asset provenance remains documented separately. This is a product
illustration, not a received message or customer testimonial.
The feature promise is connecting a tutor-owned LINE Official Account and
sending class reminders to linked students.

The decorative calendar/clock/notebook image and floating Class–Schedule–Today
connector labels are omitted from the hero. The Week panel carries the visual
focus. Production images reserve intrinsic dimensions and use optimized WebP. See [image provenance](../docs/marketing-assets/README.md) for capture
sources and refresh instructions. Existing sanitized portal captures remain
reference material; never use private workspace records or account identity.

## Motion

The motion presentations for [CoreShift](https://dribbble.com/shots/25869450-Sleek-Landing-Page-for-CoreShift)
and the [analytics platform concept](https://dribbble.com/shots/26455331-Landing-Page-for-a-Data-Driven-Analytics-Platform)
inform the modular compositions and progressive section reveals. Adapt them
to TutorPal’s white canvas and factual product panels.

Use GSAP, ScrollTrigger, and `@gsap/react` within the homepage's scoped React
lifecycle. Content is visible in the server-rendered page; scrolling stays native.

- Hero planes settle without losing their base layout.
- Transition copy forms a compact editorial bridge into the product scenes.
- Each scene owns its copy/media reveal; meaningful UI remains legible while
  moving into place. Reveals complete within the scene's own scroll range.
- Planning uses a Week-led composition with the Day panel contained inside its
  media area. No text or media is pinned or allowed to spill into another scene.
- Pending and completed states share one two-column desktop scene, with a short
  stagger and preserved confirmation/status emphasis.
- LINE's account header and date remain recognizable from the first visible
  frame. The message bubble arrives once as the stage enters view, with enough
  initial opacity to avoid an empty-card state; no looping notification or
  real message is sent. Reduced motion renders the finished message immediately.
- Smaller non-reduced-motion layouts use short entrance sequences rather than
  desktop scrubbed movement. Native FAQ disclosure remains immediate.

Media-query contexts revert animations and inline styles on resize, language
changes, reduced-motion changes, and route unmount. Refresh measurements after
fonts settle. Do not kill other routes' triggers. Reduced motion and disabled
JavaScript show all content in its final readable state. No pinning, scroll
hijacking, or hidden-content dependency.

Implementation references: [GSAP React lifecycle](https://github.com/greensock/react),
[responsive motion contexts](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/),
and [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

## Responsive and accessible behavior

Verify 320, 390, 768, 1024, 1200, and 1470px layouts in English and Thai.
At 1200 × 783, sample the full planning-to-confirmation scroll interval: each
copy/media box must stay in its own scene and never intersect the next scene.
Desktop preserves controlled hero overlap and varied story compositions;
compact layouts put product panels and story content in readable linear order.
The LINE stage follows its explanatory copy on phones; the message is selectable
text and occurs once in the accessibility tree.
Hero headings should fit in two to three lines, including narrow phones.

Maintain semantic landmarks, h1-to-h2 hierarchy, descriptive image alternatives,
44px controls, visible focus, and text contrast of at least 4.5:1. Thai headings
need comfortable leading and wrapping. Product panels are illustrative, not
interactive controls. Keep beta labels, errors, Turnstile states, native
success/error handling, and the privacy link intact.

English is the server-rendered default. The language switch updates document
language and copy without changing route paths, anchors, form field names,
validation, or the beta API contract.
