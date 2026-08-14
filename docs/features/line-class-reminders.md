# LINE Class Reminders — July 28, 2026

## Overview

TutorPal sends every eligible enrolled student a LINE reminder one hour before
an upcoming class. Schedule storage and APIs continue to use the existing
`date` plus minutes-after-midnight `time` fields. Reminder delivery currently
interprets those values in `Asia/Bangkok`.

## Delivery behavior

- The Cloudflare reminder Worker (`tutorpal-reminders-dev`) polls every fifteen
  minutes and looks for `SCHEDULED` classes starting within the next hour.
- Every currently enrolled student whose LINE account belongs to the tutor's
  current LINE connection receives an individual message.
- Classes missed during worker downtime catch up only while their start time
  remains in the future.
- Rescheduling creates a delivery for the new derived start and cancels a
  claimed stale delivery. Cancelled, completed, and no-show classes are not
  discovered.

The message includes the student name, class display name, Bangkok date,
start/end time, and `Asia/Bangkok` timezone. Schedule notes are never included.

## Reliability

`ClassReminderDelivery` stores the schedule/student/start snapshot, recipient,
rendered message, retry key, lease, attempts, provider request ID, and final
state. Database uniqueness and `FOR UPDATE SKIP LOCKED` protect concurrent
claims, while LINE's `X-Line-Retry-Key` protects retries after ambiguous
provider responses.

Timeout, network, and server failures retry after 1, 2, 4, and 8 minutes.
Ordinary client errors are terminal, and the worker revalidates the current
schedule, enrollment, LINE link, connection, and derived start before sending.
No request is initiated once the class has started.

## Migration and deployment

Migration `20260722000000_add_class_reminders` is additive. It creates the
reminder status enum/table, delivery indexes and foreign keys, plus a composite
`Schedule(status, date)` index used to bound discovery. It does not change
schedule or recurring-schedule date/time columns.

Before enabling the Cloudflare reminder Worker:

1. Apply the migration and verify it against the target PostgreSQL database.
2. Bind the environment's cache-disabled Hyperdrive configuration to both API
   and reminder Workers. For development these are `tutorpal-api-dev` and
   `tutorpal-reminders-dev`; production config uses `tutorpal-api-prod` and
   `tutorpal-reminders-prod` after its placeholders are replaced.
3. Bind the same valid `LINE_CREDENTIALS_ENCRYPTION_KEY` to both Workers. The
   key must be base64-encoded 32-byte material; the repository does not contain
   this secret.
4. Deploy the reminder Worker first, then the API Worker with its explicit
   empty cron list. From the repository root, the development deployment is:

   ```sh
   make deploy APP=backend ENV=dev
   ```

   For production, replace every
   `REPLACE_WITH_PRODUCTION_HYPERDRIVE_ID` and `.invalid` value in
   `backend/wrangler/prod/wrangler.api.prod.jsonc` and
   `backend/wrangler/prod/wrangler.reminders.prod.jsonc`, provision production
   secrets, then run `make deploy APP=backend ENV=prod`. The Makefile blocks
   that deployment until the placeholders are removed.

5. Verify the reminder Worker logs and delivery state after trigger
   propagation. The database claim, lease, and LINE retry-key protections make
   a short overlap safe during the cutover.

The existing Bun (`src/worker.ts`) and DigitalOcean worker remain available as
rollback paths. The legacy deployment builds matching API and worker images
from the same Git SHA with component-prefixed tags:
`api-git-<sha>`/`worker-git-<sha>`, `api-latest`/`worker-latest`, and
`api-<environment>`/`worker-<environment>`. The `class-reminder-worker`
component uses the worker tag and does not override its image command. The
legacy path uses its own `DATABASE_URL`; it is separate from the Cloudflare
Hyperdrive configuration.

The raw PostgreSQL migration and `SKIP LOCKED` claim path should receive a
target-environment smoke test before production delivery is enabled.
