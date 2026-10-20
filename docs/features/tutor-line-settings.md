# Tutor-Owned LINE Messaging and Settings — July 18, 2026

## Overview

Tutors configure their own LINE Official Account instead of sharing one
application-wide Messaging API token. Messaging integrations are grouped under
Integrations, separate from Account settings and social sign-in.

## Settings experience

- `/settings` and `/settings/` redirect to `/settings/account`.
- The side rail links directly to `/integrations`; Account remains available in
  the user menu.
- `/integrations` groups LINE under Messaging and lists Zoom and Google Meet as
  coming soon under Online classes.
- `/integrations/line` lets a tutor save and verify their Messaging API token and
  LINE Login credentials, connect their own LINE account for test messages,
  and send a private test message.
- `/settings/line` is a compatibility redirect to `/integrations/line` and
  preserves only recognized `testRecipient=connected` or `testRecipient=error`
  callback values.
- The LINE connection screen keeps the global authenticated layout and uses a
  connection summary, a divider-led test/credentials surface, and a focused
  setup or edit form.
- Language selection remains in the authenticated top bar and log out remains
  in the account menu.
- Credentials are never returned to the browser after saving.

## LINE provider requirement

Each tutor's Messaging API and LINE Login channels must be created under the
same LINE provider. This ensures student LINE user IDs returned by the login
flow can receive messages from that tutor's Official Account. The login flow
also asks the recipient to add that Official Account, so messages have a valid
recipient relationship.

## Data and security

- `TutorLineConnection` is a one-to-one tutor record containing encrypted
  Messaging API and LINE Login secrets, safe account metadata, verification
  time, and the tutor's optional test-recipient LINE user ID.
- AES-256-GCM encryption uses `LINE_CREDENTIALS_ENCRYPTION_KEY`, a base64
  encoded 32-byte environment value. The application refuses credential saves
  when it is missing or invalid.
- Student LINE links are scoped to a tutor connection. Existing links are kept
  as a re-link-required state and are never used with a tutor-owned account.

## API changes

- `GET /v1/line/connection` returns safe connection status.
- `PUT /v1/line/connection` stores and verifies tutor credentials.
- `POST /v1/line/connection/test-recipient/authorize` starts the tutor's LINE
  Login flow for their test account.
- `POST /v1/line/connection/test-message` sends a test message to that account.
- Student linking and student test messages now resolve the owning tutor's
  connection instead of an application environment token.

## Deployment notes

1. Set `LINE_CREDENTIALS_ENCRYPTION_KEY` to a secure base64-encoded 32-byte
   key before deploying the migration.
2. Keep `LINE_LINK_REDIRECT_URL` registered as the callback URL in each tutor's
   LINE Login channel.
3. Tutors must reconnect existing students after configuring their account.
