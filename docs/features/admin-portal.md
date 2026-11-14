# Admin Portal and User Management

Implemented August 13, 2026; tutor impersonation added August 16, 2026.

## What changed

- Added a sibling `admin-frontend` Vite/TanStack Router project based on the
  existing frontend foundation.
- Reduced the admin route surface to `/login` and one protected `/` User
  management workspace with a single navigation item.
- Added a responsive regular-user workspace with search, status filtering,
  pagination, create, profile editing, password reset, deactivation,
  reactivation, and verification-email resend actions.
- Added protected `/v1/admin/users` endpoints backed by a service that limits
  every operation to users whose Better Auth role is exactly `user`.
- Narrowed Better Auth's admin plugin permissions and disabled direct
  destructive, role-management, and browser-facing user-management paths. The
  native impersonation start/stop routes are the only retained Better Auth
  admin routes; the custom API remains the portal's write surface for user
  management.
- Replaced the unsafe direct-write `create-user` script with the
  `bootstrap-admin` command, which uses Better Auth, refuses duplicate emails,
  and sends the first administrator a verification email.

## User-management boundary

The portal manages regular users only. Admin accounts and any user with a role
other than exactly `user` are not listed and return `404` when targeted through
the custom management API or Better Auth target guard. Roles and timestamps are
read-only in the UI; role editing and permanent deletion are intentionally
unavailable.

Deactivation is reversible: it bans the regular user without an expiry and
revokes all active sessions. Reactivation clears the ban and allows a later
sign-in. Setting a password also revokes existing sessions.

Creating a user always assigns role `user`. Names and emails can be edited.
Emails are normalized to lowercase, duplicate addresses return a typed `409`
conflict, and changing an email marks it unverified, revokes sessions, and
sends a new verification email. Verification delivery failures are reported to
the portal without rolling back the user change. Unverified users have an
explicit resend-verification action; verified users do not.

## Tutor impersonation

An administrator can open TutorPal as an active regular user from that user's
overflow menu. The UI offers this action only for active rows. The backend is
the authority: the current session must be an exact `admin` role from the
configured admin origin, and the target must have exact role `user`, no active
ban, and an existing `Tutor` row. Missing, privileged, deactivated, or
Tutor-less targets receive the same hidden `404 USER_NOT_FOUND` response.

The flow uses Better Auth's native impersonation endpoints. Starting creates a
one-hour target session with `Session.impersonatedBy` set to the administrator
and preserves the original administrator session for restoration. The admin
portal then navigates in the same tab to the user portal. Impersonation has
the user's normal read/write access, so the confirmation warning calls out
full access and the same-tab/browser-profile risk.

The user portal shows a persistent tutor-view banner before routed content. It
replaces ordinary sign-out with the native stop-impersonation action; stopping
restores the original administrator session and returns to the admin portal.
If that original session is unavailable, the user portal offers a recovery
link to the admin sign-in page. The session is limited to one hour, and
deactivation still revokes all sessions for the target.

## Signup control

`BETA_ENABLED` is the backend-owned launch switch. It defaults to `true` and
is enabled in both Worker environments. In beta, email, Google, and LINE public
registration are closed; staff create accounts through the admin portal.
Turning the switch off opens all configured registration methods and removes
the beta presentation. `/v1/config.publicSignupEnabled` is derived as its
inverse, preserving the existing app configuration contract.

The user portal reads that response and fails closed: it hides the signup call
to action and redirects direct `/signup` visits to `/login` unless the server
explicitly returns `publicSignupEnabled: true`. The server remains the final
enforcement point, so hiding the UI is not the access control boundary.

## Demo-led beta access (November 14, 2026)

The English and Thai marketing pages show a beta badge, a beta hero action,
and an access-request form after the FAQ. The login page links to the localized
form; the auth header and expanded app sidebar show the same beta status.
The collapsed sidebar retains an accessible beta label. One server setting
controls all these surfaces.

The form requires name and email. Teaching subject, student-count range, and
LINE Official Account usage are optional. The team contacts the requester to
arrange a demo, then creates their account through the existing admin portal.
There is no automatic approval, account creation, or newsletter subscription.

`GET /v1/beta/config` reports the current mode, request availability, and public
Turnstile site key. `POST /v1/beta/requests` validates the request and a
single-use Turnstile token before sending a Discord webhook message. Success
is returned only after Discord confirms delivery. Requests are not saved in
the database; failures retain form values for retry, and retries can
occasionally produce duplicate notifications.

The request payload uses `name` (1–120 characters), `email` (up to 254),
optional `subject` (1–120), optional `studentCountRange` (`1-5`, `6-15`,
`16-30`, or `30+`), optional `hasLineOfficialAccount` (boolean), and
`turnstileToken` (1–2048). Unset optional fields are omitted. Names/subjects
are trimmed and email is normalized. Unknown fields are rejected.
Only HTTP 200 `{ "status": "accepted" }` is success. Disabled beta requests
return 404, unavailable delivery returns 503, failed verification returns
400, and failed Discord delivery returns 502. The form never uses native GET
submission, which would put its fields in the URL.

Discord and Turnstile setup is intentionally deferred. Missing integration
settings keep requests unavailable instead of accepting data silently. See
[runtime configuration](../infrastructure.md#runtime-configuration-contract)
for the variables, secrets, and launch procedure.

At full launch, new social sessions require verified email. Existing sessions
remain valid; an older unverified social account may need verification at its
next sign-in. Verification recovery allows email entry and resend without
putting an email address in the callback URL.

No database migration is required for user management or impersonation. The
flow uses the existing Better Auth `Session.impersonatedBy` field and the
existing `ADMIN_FRONTEND_URL` and `EMAIL_VERIFICATION_CALLBACK_URL` backend
configuration. The admin build uses `VITE_USER_APP_URL` for the same-tab
handoff; the user build uses `VITE_ADMIN_APP_URL` for stop and recovery
navigation.

## Local origins

- User frontend: `http://localhost:5173`
- Backend: `http://localhost:5174`
- Admin frontend: `http://localhost:5175`

Set `ADMIN_FRONTEND_URL` on the backend for the deployed admin origin. The
custom user-management API uses `EMAIL_VERIFICATION_CALLBACK_URL` for
verification links sent when an admin creates a user, changes an email, or
resends verification. `VITE_USER_APP_URL` remains the build-time user-portal
URL used by the admin portal for verification callbacks and impersonation
handoff. Set `VITE_ADMIN_APP_URL` on the user portal to the deployed admin
origin so stop and recovery navigation return to the correct portal.
