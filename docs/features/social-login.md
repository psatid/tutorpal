# Tutor-facing Google and LINE Login (September 9, 2026)

TutorPal now supports Google sign-in and LINE sign-in for existing tutors in
the user portal. This feature does not add public social signup and does not
change the admin portal.

## Access boundary

- Regular tutors are provisioned by the admin portal. Google and LINE social
  signup are disabled even when `PUBLIC_SIGNUP_ENABLED=true`.
- A social account must resolve to an existing, active TutorPal user with
  exact role `user` and a `Tutor` record.
- Google account linking follows Better Auth's same-email account-linking
  policy. Different email addresses are not accepted, and no trusted-provider
  bypass is configured.
- LINE can be connected after password or Google sign-in from
  `/settings/account`. The existing LINE messaging credentials page remains
  `/settings/line`.

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
- LINE sign-in for an already-linked account: `API_ORIGIN/api/auth/callback/line`
- LINE enrollment from Account settings:
  `API_ORIGIN/v1/auth/social-accounts/line/callback`

The existing student LINE-link flow is separate and continues to use
`API_ORIGIN/v1/line/callback` through `LINE_LINK_REDIRECT_URL`.

## LINE enrollment safeguards

The Account settings Connect LINE action uses an authenticated server-side
flow with a one-time, ten-minute state value, PKCE, and an OIDC nonce. The
server exchanges the code, validates the LINE ID token, requires the approved
LINE email scope, and requires an exact normalized email match with the
current TutorPal account.

The callback always redirects to the fixed Account settings result page with a
generic success or error state. OAuth access, refresh, and ID tokens are not
persisted. Better Auth's alternate `/api/auth/link-social` endpoint is
disabled so it cannot bypass this enrollment flow.

## Database rollout

The migration adds a unique provider identity constraint to Better Auth's
`Account` table on `(providerId, accountId)`. It locks the table during the
change and checks for duplicate identities first; duplicate data stops the
migration with an actionable failure instead of being silently merged.

Run the migration before enabling provider credentials in production:

```sh
cd backend
make db-migrate-deploy-production
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
   sign-in, and Account settings LINE enrollment.
6. Confirm an unlinked LINE account cannot create a new TutorPal account and
   that callback failures return only the generic Account settings error.
