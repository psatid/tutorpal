# Tutor-facing Google and LINE Login (September 9, 2026)

TutorPal now supports Google sign-in and LINE sign-in for existing tutors in
the user portal. During beta, access remains provisioned through the admin
portal. The November 14 beta launch switch also enables public social signup
when beta mode is turned off.

## Access boundary

- With `BETA_ENABLED=true`, regular tutors are provisioned by the admin portal
  and Google, LINE, and email public signup are disabled. With it set to
  `false`, all configured signup methods open.
- A social account must resolve to an existing, active TutorPal user with
  exact role `user` and a `Tutor` record.
- Outside beta, new social sessions also require verified email. Google can
  supply a verified-email claim. LINE must return an email address and may
  require email verification before the first successful sign-in. Existing
  sessions remain valid, while older unverified users may need verification
  at a future sign-in.
- Google account linking follows Better Auth's same-email account-linking
  policy. Different email addresses are not accepted, and no trusted-provider
  bypass is configured.
- Existing tutors can also use **Connect Google** at `/settings/account`
  without logging out. Google must return a verified email matching the
  TutorPal email. Connecting preserves the current account, session, data,
  and password sign-in.
- LINE can be connected after password or Google sign-in from
  `/settings/account`. LINE messaging credentials are managed separately at
  `/integrations/line`; `/settings/line` redirects there for compatibility.

## Provider configuration

Configure each provider as a complete server-side pair. An absent pair keeps
that provider disabled; an incomplete pair fails startup rather than silently
enabling a partial flow.

- Google: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- LINE Login: `LINE_LOGIN_CHANNEL_ID` and `LINE_LOGIN_CHANNEL_SECRET`

The user frontend receives only boolean availability from `/v1/config`. Do not
put provider secrets in `VITE_*` variables or in the frontend bundle.

## Callback URLs

Register the following backend URLs in the provider consoles, replacing
`API_ORIGIN` with the exact value of `BETTER_AUTH_URL`:

- Google sign-in: `API_ORIGIN/api/auth/callback/google`
- Google enrollment from Account settings:
  `API_ORIGIN/v1/auth/social-accounts/google/callback`
- LINE sign-in for an already-linked account: `API_ORIGIN/api/auth/callback/line`
- LINE enrollment from Account settings:
  `API_ORIGIN/v1/auth/social-accounts/line/callback`

The existing student LINE-link flow is separate and continues to use
`API_ORIGIN/v1/line/callback` through `LINE_LINK_REDIRECT_URL`.

## Account settings enrollment safeguards

Connect Google starts at authenticated
`POST /v1/auth/social-accounts/google/authorization`, which returns an
`authorizationUrl`. The public Google callback uses a one-time, ten-minute
state tied to the initiating tutor, PKCE, and an OIDC nonce. Better Auth's
Google provider verifies the ID token before the server accepts its identity
and verified-email claim. The callback rechecks tutor eligibility and requires
an exact normalized email match. Impersonated sessions cannot start enrollment.

Google identities are matched by both provider and provider account ID.
Connecting an identity already linked to the same tutor is harmless; an
identity owned by another user cannot be reassigned. No replacement user or
session is created, and OAuth tokens are not stored. Account settings refetches
linked methods before showing success and clears callback results from the URL.
Account settings bundles decorative Google and LINE provider logos locally from
[theSVG](https://thesvg.org/), reusing the LINE asset from Integrations.

The Account settings Connect LINE action uses an authenticated server-side
flow with a one-time, ten-minute state value, PKCE, and an OIDC nonce. The
server exchanges the code, validates the LINE ID token, requires the approved
LINE email scope, and requires an exact normalized email match with the
current TutorPal account.

The callback always redirects to the fixed Account settings result page with a
generic success or error state. OAuth access, refresh, and ID tokens are not
persisted. Better Auth's alternate `/api/auth/link-social` endpoint is
disabled so it cannot bypass this enrollment flow.

Register the additional Google enrollment callback alongside the existing
Google sign-in callback before rolling out Connect Google. The Google
enrollment addition requires no new environment variables, dependencies, or
database migration; the existing provider identity constraint must already
be applied.

## Database rollout

The migration adds a unique provider identity constraint to Better Auth's
`Account` table on `(providerId, accountId)`. It locks the table during the
change and checks for duplicate identities first; duplicate data stops the
migration with an actionable failure instead of being silently merged.

Run the migration before enabling provider credentials in production:

```sh
make -C apps/backend db-migrate-deploy-production
```

Resolve any reported duplicate provider identities manually, then rerun the
migration. Take the normal database backup and deployment checkpoints used for
schema changes.

## Release checklist

1. Set both credentials for each provider in the selected Worker environment.
2. Register the exact callback URLs above in Google Cloud and LINE Developers.
3. Run the production migration and the API/Pages dry-run checks.
4. Confirm `/v1/config` reports only the deliberately enabled provider flags.
5. Test an existing tutor's email/password sign-in, Google sign-in, LINE
   sign-in, and Account settings Google and LINE enrollment. Confirm that
   Connect Google rejects a different or unverified email and preserves
   password sign-in and the original tutor account.
6. In beta, confirm an unlinked social identity cannot create an account.
   Outside beta, check email, Google, and LINE registration, including LINE
   email verification and resend recovery. Ineligible accounts retain generic
   callback failures; verification recovery URLs contain no email address.
   Account settings enrollment keeps its existing generic result handling.
