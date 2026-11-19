# Booking and enquiry email notifications

New `travel_requests` rows are queued transactionally and dispatched immediately after commit.
The worker sends the complete request to `info@prestigetours.co.bw`, with the guest's email
as Reply-To. Existing requests are not automatically emailed retroactively.

The private queue retries transient failures every minute with backoff, up to eight attempts.
Concurrent workers claim separate rows using locks and leases. A provider acceptance followed
by a database/network failure can still cause a duplicate on retry (SMTP is at-least-once).
Stable message IDs help identify duplicates; Brevo also receives an idempotency key.

## Sender setup in Supabase Edge Function secrets

Common:
- `REQUEST_NOTIFICATION_TOKEN`: random server-only shared token, also stored in Vault as
  `prestige_request_notification_token`. Never put it in a frontend/VITE variable.
- `REQUEST_MAIL_FROM`: authenticated sender email, normally `info@prestigetours.co.bw`.

Purelymail:
- `REQUEST_MAIL_PROVIDER=smtp`
- `SMTP_HOST=smtp.purelymail.com`
- `SMTP_USER`: authorized mailbox login
- `SMTP_PASS`: mailbox/app password
- TLS port 465 is required; Supabase blocks outbound ports 25 and 587.

Or Brevo:
- `REQUEST_MAIL_PROVIDER=brevo`
- `BREVO_API_KEY`: transactional API key; sender must be verified and sending enabled.

Deploy `request-notifications` with JWT checking disabled; it checks its own private token.
Apply the SQL migration, then store the same token in Vault. Without sender configuration,
the worker returns 503 without claiming jobs, so requests remain safely queued.

## Verification

Submit one enquiry and one booking marked as tests. Confirm each saved row has one private
queue row, then confirm provider acceptance and delivery to the client's inbox. Check Reply-To
and all original trip details. Verify anonymous callers cannot claim or complete queue jobs.
Do not claim delivery is working until actual sender credentials and inbox delivery are verified.

Only administrators/service-role access can inspect the queue. Failed jobs retain a short error
code without credentials. Investigate rows with `attempts >= 8 AND sent_at IS NULL` before
manually resetting their attempts. DNS records configure domain mail routing/authentication;
they do not create the mailbox or supply its SMTP login.
