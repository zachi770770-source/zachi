# Book Storage & Digital Delivery (Supabase Storage)

Server-only foundation for delivering the digital book from a **private**
Supabase Storage bucket via short-lived signed URLs. Nothing here opens sales
or creates a public download route.

> Variable **names only** appear in this document — never values. Real values
> live in Vercel (Production/Preview) and are never committed to Git.

## Module layout (`src/lib/storage/`)

| File | Responsibility |
| --- | --- |
| `config.ts` | Reads & validates the five storage env vars; resolves/validates TTL. `import "server-only"`. |
| `client.ts` | Creates a server-only Supabase client (`persistSession=false`, `autoRefreshToken=false`). |
| `bookDelivery.ts` | `issueBookDownloadUrl(order)` (paid-only), `verifyBookStorage()`, `isPaidOrder()`. |
| `errors.ts` | `StorageError` — typed, fail-closed, generic safe message only. |
| `diagnostics.ts` | Classifies storage errors into safe metadata for logs (no secrets). |
| `index.ts` | Server-only public entry point. |

## Environment variables (names only)

| Name | Scope | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | server | Never `NEXT_PUBLIC_`. |
| `SUPABASE_SECRET_KEY` | server | Service-role secret. **Never** `NEXT_PUBLIC_`, never in a client component. |
| `BOOK_STORAGE_BUCKET` | server | The **private** bucket name. The bucket must remain private. |
| `BOOK_PDF_PATH` | server | Object path inside the bucket. Never exposed to the browser. |
| `BOOK_DOWNLOAD_TTL_SECONDS` | server | Signed-URL TTL. Allowed 60–900; missing → 900. |
| `SALES_ENABLED` | server | Must remain `false`. Gates checkout/payment/download UI. |

## Security invariants (enforced in code & tests)

1. **Private bucket only** — uses `createSignedUrl`; `getPublicUrl` is never called.
2. **Secret stays server-side** — `SUPABASE_SECRET_KEY` is never `NEXT_PUBLIC_` and
   is never imported into a client component (verified by a static test).
3. **Paid-only delivery** — a signed URL is issued only for an explicitly supplied
   order with verified `paymentStatus === "paid"`. `pending` / `failed` /
   `cancelled` / missing / unknown are rejected. An email address alone is not
   authorization.
4. **TTL bounds** — numeric 60–900 s; missing defaults to 900; anything else fails
   closed. A signed URL can never exceed 900 seconds.
5. **Fresh, never persisted** — a fresh signed URL is generated per authorized
   delivery; it is never cached or stored in the database. The permanent object
   path is never sent to the browser.
6. **No secret leakage** — Supabase/config errors are reduced to safe metadata
   (`name`, `status`, `stage`, `classification`); URLs, keys, hosts, bucket names,
   object paths, provider messages and stack traces never reach logs or clients.
7. **PDF never in the repo** — the book file is never placed in `/public`, Git, the
   frontend bundle or the build output.

## Verification helper

`verifyBookStorage()` is a **server-only, internal** readiness check (no public
diagnostic endpoint). It confirms configuration exists and that the private object
can receive a signed URL, and returns only `{ configured, objectAccessible, ok }`.
It never returns, logs or reports the generated signed URL.

## What is intentionally NOT here yet

Because `SALES_ENABLED=false`, there is **no download button and no usable
download endpoint** on the public website. A public download route must be added
only once a cryptographically secure, single-use delivery-token mechanism tied to
a **persisted paid order** exists.

**Storage readiness ≠ sales/fulfillment readiness.** Remaining blockers before real
sales:

- Persistent paid-order verification (durable order store, not in-memory).
- A real payment provider with a **signed** webhook.
- Idempotent fulfillment (exactly-once access grant).
- Delivery email carrying the download link.
- Retry handling for transient failures.
- Invoice / receipt integration.
