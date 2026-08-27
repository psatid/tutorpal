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

`PUBLIC_SIGNUP_ENABLED` is a backend-owned environment variable. It defaults to
`false`, is set to `false` in the Cloudflare Worker variables, and controls both
Better Auth's `disableSignUp` option and the public `/v1/config` response.

The user portal reads that response and fails closed: it hides the signup call
to action and redirects direct `/signup` visits to `/login` unless the server
explicitly returns `publicSignupEnabled: true`. The server remains the final
enforcement point, so hiding the UI is not the access control boundary.

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
