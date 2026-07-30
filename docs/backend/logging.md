# Backend Logging

The API emits one structured Pino event for each HTTP response except the exact
`/v1/health` health check, which is intentionally excluded to avoid routine
platform-probe noise.

`bun run dev` pretty-prints API logs with color and local timestamps for local
development. Use `bun run dev:json` when raw JSON output is needed. Docker and
deployed API logs remain structured JSON.

Every event includes `event`, `method`, `pathname`, `status`, and
`durationMs`. Query strings are excluded from `pathname` so request values are
not logged. Responses below HTTP 400 use `http.request.completed` at `info`
level and do not include a response body. Responses from 400 through 499 use
`http.request.failed` at `warn`; 500 and above use the same event at `error`.

Failure events capture JSON response bodies up to 8 KiB as structured data so
Pino redaction removes sensitive fields. Text and invalid JSON responses are
captured as text within the same 8 KiB limit. Larger responses log their
content type and `truncated: true`. When `Content-Length` is valid, `size` is
the exact byte size. Otherwise, `observedBytes` and `size` are a lower bound
and `sizeIsLowerBound: true` makes that distinction explicit; the cloned stream
is cancelled as soon as the cap is exceeded. If response extraction fails, the
failure event contains `response: { unavailable: true }`. Unexpected 5xx
failures also include their underlying error; expected `AppError` responses
never log a stack.

Pino removes authorization, cookie, password, secret, token, and LINE
credential fields. Do not place credentials in free-form error text or stack
messages: field redaction cannot reliably remove embedded text.
