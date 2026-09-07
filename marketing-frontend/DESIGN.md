# Marketing design direction

## Approved direction

The production homepage uses the selected B + A hybrid: B's centered,
Week-led product composition and A's transition and four alternating story
chapters. The user approved this implementation on September 8, 2026.
The emotional promise is “my teaching day is under control”; launch awareness
leads, with **Explore TutorPal** as the primary action and beta interest at the
close.

Preserve TutorPal's indigo `#533AFD`, navy `#0D253D`, cool-white surfaces,
Inter/Noto Sans Thai typography, compact product panels, and accessible focus
treatment. Reuse the established marketing tokens. The visual warmth comes
from composition and teaching materials, rather than changing the palette.

## Page structure

1. Header with Product, Workflow, Beta, language selection, and the configured
   portal link when available.
2. `#product` centered hero with the faithful Week crop as the main plane,
   Class balance and Today confirmation supporting it, and
   **Explore TutorPal** leading to `#workflow`.
3. Quiet transition into the teaching-day story.
4. `#workflow` four alternating chapters: class context; Day/Week planning;
   pending Today confirmation; completed-session history.
5. `#benefits` feature list and LINE integration proof, including a labelled demo reminder
   image, truthful description, and accessible transcript.
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

The LINE image is a demo capture, clearly labelled in the image
and caption. Its message comes from the actual backend template and uses
sample details. It is not a real received message, proof of delivery, or a
customer testimonial. The current backend message is English; localize
surrounding marketing copy without inventing a Thai message format.
The feature promise is connecting a tutor-owned LINE Official Account and
sending class reminders to linked students.

Decorative calendar/clock/notebook art is separate from product proof and has
empty alt text. Production images reserve intrinsic dimensions and use optimized
WebP. See [image provenance](../docs/marketing-assets/README.md) for capture
sources and refresh instructions. Existing sanitized portal captures remain
reference material; never use private workspace records or account identity.

## Motion

Use CSS and one-time IntersectionObserver reveals with cleanup. Content must
be visible before JavaScript and page scrolling must remain native.

- The hero planes settle in a short, controlled sequence.
- Class balance fill receives emphasis without changing its numeric value.
- The Day and Week illustrations settle in sequence.
- Today confirmation receives a visible indigo outline.
- The completed-session chapter receives a restrained final emphasis.
- Native FAQ disclosure remains immediate.

Reduced-motion preferences remove animations, translations, fill effects,
outline animation, and smooth anchor scrolling while retaining all information
and actions. No looping floats, scroll hijacking, or hidden-content dependency.

## Responsive and accessible behavior

Verify 320, 390, 768, 1024, and wide desktop layouts in English and Thai.
Desktop preserves controlled hero overlap and alternating story columns;
compact layouts put product panels and story content in readable linear order.
The LINE figure follows its explanatory copy on phones.

Maintain semantic landmarks, h1-to-h2 hierarchy, visible figure captions,
44px controls, visible focus, and text contrast of at least 4.5:1. Thai headings
need comfortable leading and wrapping. Product panels are illustrative, not
interactive controls. Keep beta labels, errors, Turnstile states, native
success/error handling, and the privacy link intact.

English is the server-rendered default. The language switch updates document
language and copy without changing route paths, anchors, form field names,
validation, or the beta API contract.
