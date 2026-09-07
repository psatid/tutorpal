# Marketing design direction

## Approved direction

The production homepage uses the selected B + A hybrid: B's centered,
Week-led product composition and A's transition and four alternating story
chapters. The user approved this implementation on September 8, 2026.
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
4. `#workflow` four alternating chapters: class context; Day/Week planning;
   pending Today confirmation; completed-session history.
5. `#benefits` feature list and LINE integration proof, including a reminder image,
   truthful description, and accessible transcript.
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

The LINE image is a composed capture with fictional details. Per the selected
copy treatment, product panels and the LINE image omit visible illustrative,
demo, and sample labels. Provenance is documented here rather than displayed
on the homepage. Its message comes from the actual backend template. It is not
a real received message, proof of delivery, or a customer testimonial. The current backend message is English; localize
surrounding marketing copy without inventing a Thai message format.
The feature promise is connecting a tutor-owned LINE Official Account and
sending class reminders to linked students.

The decorative calendar/clock/notebook image and floating Class–Schedule–Today
connector labels are omitted from the hero. The Week panel carries the visual
focus. Production images reserve intrinsic dimensions and use optimized WebP. See [image provenance](../docs/marketing-assets/README.md) for capture
sources and refresh instructions. Existing sanitized portal captures remain
reference material; never use private workspace records or account identity.

## Motion

Use GSAP, ScrollTrigger, and `@gsap/react` within the homepage's scoped React
lifecycle. The choreography runs from 1120px up; compact layouts stay static.
Content is visible in the server-rendered page; scrolling stays native.

- Hero planes settle in a controlled sequence without losing their base layout.
- Transition phrases reveal progressively with scroll, with equivalent readable
  text available to assistive technology.
- Product panels move into place as their teaching-day chapters enter view.
- The planning chapter briefly pins its copy alongside the schedule panels only
  at widths of at least 1120px; smaller viewports retain normal document flow.
- Balance and confirmation emphasis preserve the depicted product state.
- Native FAQ disclosure remains immediate.

Media-query contexts must revert animations, pins, and inline styles on resize,
language changes, reduced-motion changes, and route unmount. Refresh measurements
after fonts and image dimensions settle. Do not kill other routes' triggers.
Reduced motion shows the complete static composition, without pinning, scrubbed
opacity, translations, or smooth anchor scrolling. No looping floats, scroll
hijacking, or hidden-content dependency.

Implementation references: [GSAP React lifecycle](https://github.com/greensock/react),
[responsive motion contexts](https://gsap.com/docs/v3/GSAP/gsap.matchMedia()/),
and [ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/).

## Responsive and accessible behavior

Verify 320, 390, 768, 1024, and wide desktop layouts in English and Thai.
Desktop preserves controlled hero overlap and alternating story columns;
compact layouts put product panels and story content in readable linear order.
The LINE figure follows its explanatory copy on phones. Its exact reminder
transcript stays in a clipped, visually hidden element and never occupies
visible space beneath the image. Check the computed hiding styles in the browser.
Hero headings should fit in two to three lines, including narrow phones.

Maintain semantic landmarks, h1-to-h2 hierarchy, descriptive image alternatives,
44px controls, visible focus, and text contrast of at least 4.5:1. Thai headings
need comfortable leading and wrapping. Product panels are illustrative, not
interactive controls. Keep beta labels, errors, Turnstile states, native
success/error handling, and the privacy link intact.

English is the server-rendered default. The language switch updates document
language and copy without changing route paths, anchors, form field names,
validation, or the beta API contract.
