# TutorPal Logo

The TutorPal logo is a friendly helper: a round robot head with an antenna and
a smiling face screen, a pencil and two sparkles, in white on a purple rounded
tile. It is a vector refresh of the original raster app icon. The helper concept
is unchanged; the speech-bubble head became a round head, geometry and line
weights are cleaned up, and every element is white. The pencil clears the head
by one keyline, so the tile-free glyphs need no knockouts.

Masters live in [`design/logo/final/`](../../design/logo/final/). Edit the SVG
masters, never the exported PNGs.

## Files

| File | Use |
|---|---|
| `tutorpal-icon.svg` | Primary mark: app icon, headers, sidebar, social cards |
| `tutorpal-icon-small.svg` | Small-size cut (helper only, no pencil or sparkles): favicons and anything under 32 px |
| `tutorpal-lockup.svg` | Icon + "TutorPal" wordmark on light backgrounds |
| `tutorpal-lockup-reversed.svg` | White tile, purple helper, white wordmark for dark backgrounds |
| `tutorpal-lockup-mono.svg` | One colour (navy) without the tile, for single-ink print |
| `tutorpal-glyph-{white,purple,black}.svg` | Helper artwork without the tile |
| `tutorpal-wordmark.svg` | Wordmark only |
| `png/app-icon-512.png`, `png/app-icon-96.png` | Raster exports shipped as `app-icon.png` / `app-icon-small.png` |
| `web/` | favicon.ico, favicon PNGs, apple-touch icon, 192/512 and maskable icons, webmanifest |

## Colour

| Role | HEX | RGB |
|---|---|---|
| Tile / brand purple (`--primary`) | `#533AFD` | 83, 58, 253 |
| Helper artwork | `#FFFFFF` | 255, 255, 255 |
| Wordmark (`--foreground`) | `#0D253D` | 13, 37, 61 |

White on `#533AFD` has a contrast ratio of about 6.2:1.

## Wordmark

"TutorPal" is set in Inter SemiBold (600) with -3/118 tracking and converted
to outlines, so it needs no font at runtime. Inter is licensed under the
SIL Open Font License, which allows use in a logo.

## Rules

- **Clear space:** at least the antenna ball's diameter (about 10% of the tile)
  on every side.
- **Minimum size:** 32 px for the primary icon. Below that, use
  `tutorpal-icon-small.svg`.
- **Lockup:** keep the tile-to-wordmark proportions and gap as drawn in the
  lockup files.
- **Don't:** recolour individual parts, bring back the yellow accents, add
  shadows or gradients, stretch the tile, or redraw the wordmark in a live font.

## Regenerating app assets

Use these copies of the exports:

- `png/app-icon-512.png`: `apps/frontend/public/app-icon.png`,
  `apps/admin-frontend/public/app-icon.png` and
  `apps/marketing-frontend/public/app-icon.png`
- `png/app-icon-96.png`: `apps/marketing-frontend/public/app-icon-small.png`.
  It is also embedded as base64 in `apps/marketing-frontend/public/social.svg`.
- `tutorpal-icon-small.svg`: `apps/marketing-frontend/public/favicon.svg`

After copying, rasterise `social.png` with the command in the
[marketing README](../../apps/marketing-frontend/README.md#asset-provenance).
Then update the icon hashes in `apps/marketing-frontend/tests/static-smoke.test.js`.

Trademark clearance has not been checked.
