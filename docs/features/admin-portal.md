# Admin Portal and User Management

Implemented August 13, 2026.

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
  destructive, role-management, and browser-facing user-admin paths. The
  custom API remains the portal's write surface.
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

## Signup control

`PUBLIC_SIGNUP_ENABLED` is a backend-owned environment variable. It defaults to
`false`, is set to `false` in the Cloudflare Worker variables, and controls both
Better Auth's `disableSignUp` option and the public `/v1/config` response.

The user portal reads that response and fails closed: it hides the signup call
to action and redirects direct `/signup` visits to `/login` unless the server
explicitly returns `publicSignupEnabled: true`. The server remains the final
enforcement point, so hiding the UI is not the access control boundary.

No new environment variable or database migration is required for the user
management workspace. It uses the existing Better Auth user fields,
`ADMIN_FRONTEND_URL`, and `EMAIL_VERIFICATION_CALLBACK_URL` configuration.

## Local origins

- User frontend: `http://localhost:5173`
- Backend: `http://localhost:5174`
- Admin frontend: `http://localhost:5175`

Set `ADMIN_FRONTEND_URL` on the backend for the deployed admin origin. The
custom user-management API uses `EMAIL_VERIFICATION_CALLBACK_URL` for
verification links sent when an admin creates a user, changes an email, or
resends verification. `VITE_USER_APP_URL` remains the build-time user-portal
URL used by the admin sign-in verification callback.
