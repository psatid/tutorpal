# Marketing asset provenance

## Current Relay-inspired homepage

The homepage uses original semantic HTML/CSS product scenes and procedural
WebGL light. It contains no generated teaching photograph, downloaded 3D model,
or raster product screenshot. The scenes illustrate recognizable Today, Week,
confirmation and class-record structures without claiming pixel-exact app UI.
Illustrative controls are non-interactive spans.

### SAT scene data

`marketing-frontend/src/components/product-scenes.tsx` owns the fictional
sixteen-session week of October 5–11, 2026, Asia/Bangkok. All sessions last one
hour. Weekdays have after-school lessons; weekends have morning/afternoon lessons.
The desktop view explicitly labels its shown teaching-hour windows; tablet and
phone detail views include separate agendas for days outside the focused grid.

June teaches SAT Math and SAT Reading & Writing to Narin, Mina, Ari, Eli, Ben,
Cam and Dara, plus a weekend group. Narin's Wednesday 18:30 SAT Math lesson moves
to Thursday 18:30–19:30. Monday's 17:00 lesson is completed with 7/10 hours
remaining. October 3's completed hour and two already-reserved hours account for
the three used/committed hours; moving and completing a lesson do not deduct again.
No private customer data, test scores, diagnostics or outcome claims are used.

### Procedural light and fallback

`light-poster.webp` (1400×800) is an optimized capture of the actual production
Three.js shader at progress zero and time zero, on the production `#f7f9fe`
background. It remains visible during loading, reduced motion, unavailable
WebGL, and context failure. It is decorative and carries no product claims.
The live effect uses a single shader quad with curved violet/cyan filaments.
See the [design direction](../../marketing-frontend/DESIGN.md) for motion and
rendering constraints. The social preview is `public/social-preview.svg`.

### LINE reminder

The current homepage renders a semantic HTML account header and message using
the exact template in `backend/src/repositories/class-reminder.repository.ts`:

```text
Class reminder

Hi Narin, your SAT Math class starts in 1 hour.

Date: Oct 8, 2026
Time: 6:30 PM–7:30 PM
Time zone: Asia/Bangkok
```

The message is English in both marketing locales because the backend template
is English. Thai localizes the surrounding explanation. June appears only in
the illustrative account header, not inside the reminder body. There is no
invented delivery/read receipt. Never send a real LINE message solely to create
an asset without explicit authorization.

## Historical reference assets

`marketing-frontend/public/marketing/product-*.webp` are unused captures from the
previous screenshot presentation. They were made with production portal React
components and CSS in a temporary Vite fixture using synthetic API data. English
and Thai captures used actual application translations; crops were encoded as
WebP without painting over UI. The previous Physics studio/Narin scenario moved
October 7 at 10:00 to October 8 at 11:00 and is superseded by the SAT scene above.
No current homepage import references those files.


The [local LINE composition](line-reminder-demo.html) and
`marketing-frontend/src/assets/marketing/line-reminder-demo.webp` (800×1000)
are a composed historical example for Maya Chen / English foundations on
August 16, 2026. They are not imported by the current homepage and are not a
capture of a received message.

`marketing-frontend/src/assets/marketing/tutor-objects.webp` (1536×1024) is
historical generated artwork, also unused. The original prompt and exploration
are retained in the [prototype archive](../prototypes/README.md).
The earlier sanitized `public/product-previews/` captures remain references.
The rejected lesson-block sculpture and teaching photograph are not rendered
by the current homepage.
