# Marketing image provenance

## LINE reminder demo

The reminder visual is a faithful, clearly labelled demo capture, consistent
with the approved use of product illustrations. It is not a screenshot of a
real received message. The production asset is
`marketing-frontend/src/assets/marketing/line-reminder-demo.webp` (800 × 1000).
It was captured from the [local HTML composition](line-reminder-demo.html) using
the browser and encoded as lossless WebP. The image itself identifies it as a
demo. It has no delivery/read receipt, real contact identity, or private data.

The message uses the exact template in
`backend/src/repositories/class-reminder.repository.ts`, with the fictional
student Maya Chen and class English foundations. The sample starts August 16,
2026 at 09:00 in Asia/Bangkok and lasts one hour. The current backend message is
English; the Thai marketing page localizes the surrounding description and
caption without inventing a Thai reminder format.

To refresh, verify the backend message template, serve the source HTML locally,
capture its 800 × 1000 viewport, inspect the result, and encode the screenshot
as lossless WebP. Update the visible demo label and accessible transcript together
if the actual message changes. Do not send a real LINE message to create an asset
without the user's explicit authorization.

## Decorative teaching objects

`marketing-frontend/src/assets/marketing/tutor-objects.webp` (1536 × 1024) is an
optimized derivative of artwork generated during the approved exploration:
a white calendar, clock, and indigo notebook. It is decorative, not evidence
of a product feature. The original generated asset and prompt are preserved in
the [prototype archive](../prototypes/README.md).

## Existing portal captures

The sanitized captures in `marketing-frontend/public/product-previews/` remain
reference material and include the social preview image. The selected homepage
uses faithful localized product illustrations and the labelled LINE demo.
No signed-in account identity or private workspace records belong in marketing
assets.
