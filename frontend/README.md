# TutorPal frontend

## Make targets

From this directory, use `make help` to list available commands. Common
targets are:

```sh
make dev
make build
make pages-build
make deploy PAGES_PROJECT=<project-name>
```

The deployment target requires the real Cloudflare Pages project name and does
not provide a guessed default.

## Cloudflare Pages

Deploy this application as a static Cloudflare Pages site. It does not use
Pages Functions, a Worker runtime, `_worker.js`, or Workers Static Assets.

For a Git-integrated Pages project, configure:

- Root directory: `frontend`
- Build command: `bun run generate:api && bun run build --mode dev`
- Build output directory: `dist`
- Build environment variable: `VITE_API_URL=<BACKEND_API_ORIGIN>`

`VITE_API_URL` is compiled into the browser bundle, so it must be a public API
origin and must never contain a secret. The `.env.example` file provides the
local placeholder with the same build-time contract.

Cloudflare Pages supplies SPA fallback behavior when the output has no
top-level `404.html`, which is the intended Vite output for this application.
It serves `index.html` for unmatched deep links such as `/students/123`; do not
add a catch-all `_redirects` rule, because Pages applies those rules before
static asset responses.

No Pages Wrangler configuration is committed. A Pages Wrangler file requires a
real project name and becomes the source of truth for that Cloudflare project;
the infrastructure owner should create it from the configured project if direct
upload or Pages-local configuration is needed. This keeps the repository free
of guessed project names and avoids Worker-specific configuration.

The existing DigitalOcean static-site deployment remains unchanged.

## Roll back to DigitalOcean

Keep Cloudflare Pages isolated on its `pages.dev` deployment URL while a custom
domain is migrated. If the production or custom domain needs to be rolled back:

1. Confirm that the existing DigitalOcean static site described in
   [`../.do/frontend-dev.app.yaml`](../.do/frontend-dev.app.yaml) is healthy.
   Its `react` static site already builds from `frontend` with the documented
   build command and serves `index.html` as its catch-all document.
2. At the DNS provider, point the affected production or custom-domain records
   back to that existing DigitalOcean static site. Use its already-configured
   DNS target; this repository does not define a replacement target.
3. Verify the restored domain serves the DigitalOcean site at `/` and a client
   route before considering the rollback complete.
4. Leave the Pages deployment in place, without attaching the restored domain,
   so it remains isolated at
   `https://<CLOUDFLARE_PAGES_PROJECT>.pages.dev` for later inspection or a
   subsequent migration attempt.
