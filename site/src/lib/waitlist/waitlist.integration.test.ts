import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { Pool } from "pg";

import { POST } from "@/app/api/waitlist/route";

/**
 * בדיקת אינטגרציה מול Postgres אמיתי. מדלגת אלא אם הוגדר WAITLIST_PG_URL,
 * כדי שלא תיכשל בהרצת unit רגילה / CI ללא בסיס נתונים.
 *
 * הרצה:
 *   WAITLIST_PG_URL=postgres://postgres@127.0.0.1:5433/waitlist \
 *     npx vitest run src/lib/waitlist/waitlist.integration.test.ts
 */
const PG_URL = process.env.WAITLIST_PG_URL;

const g = globalThis as unknown as Record<string, unknown>;
function resetWaitlistGlobals() {
  delete g.waitlistMemoryRepo;
  delete g.waitlistRepo;
  delete g.waitlistPool;
  delete process.env.DATABASE_URL;
  delete process.env.WAITLIST_ALLOW_MEMORY;
}

let ip = 0;
function makeRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  ip += 1;
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.9.0.${ip}`,
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe.skipIf(!PG_URL)("waitlist ⇄ real Postgres (integration)", () => {
  let verify: Pool;

  beforeAll(async () => {
    verify = new Pool({ connectionString: PG_URL, max: 1 });
    // slate נקי — הטבלה תיווצר מחדש אוטומטית ע"י הריפוזיטורי (auto-provision).
    await verify.query("drop table if exists waitlist_subscribers");
  });

  afterAll(async () => {
    await verify.end().catch(() => {});
    const pool = g.waitlistPool as Pool | undefined;
    if (pool) await pool.end().catch(() => {});
  });

  beforeEach(resetWaitlistGlobals);

  async function count(email: string) {
    const r = await verify.query(
      "select count(*)::int as n from waitlist_subscribers where email_normalized=$1",
      [email]
    );
    return (r.rows[0] as { n: number }).n;
  }

  it("saves a valid signup and reads it back from the DB (200 only after real write)", async () => {
    process.env.DATABASE_URL = PG_URL;
    const res = await POST(
      makeRequest({ email: "Proof-User@Example.com", consent: true, source: "homepage" })
    );
    expect(res.status).toBe(200);
    const row = await verify.query(
      "select email_normalized, email_original, source, consent_version, status from waitlist_subscribers where email_normalized=$1",
      ["proof-user@example.com"]
    );
    expect(row.rows).toHaveLength(1);
    expect(row.rows[0]).toMatchObject({
      email_normalized: "proof-user@example.com",
      source: "homepage",
      status: "active",
    });
  });

  it("deduplicates a repeated email (idempotent upsert → still one row)", async () => {
    process.env.DATABASE_URL = PG_URL;
    await POST(makeRequest({ email: "dup@example.com", consent: true, source: "homepage" }));
    await POST(makeRequest({ email: "dup@example.com", consent: true, source: "sample" }));
    expect(await count("dup@example.com")).toBe(1);
  });

  it("rejects an invalid email with 400 (nothing written)", async () => {
    process.env.DATABASE_URL = PG_URL;
    const res = await POST(makeRequest({ email: "not-an-email", consent: true }));
    expect(res.status).toBe(400);
    expect(await count("not-an-email")).toBe(0);
  });

  it("treats a filled honeypot as success but stores nothing", async () => {
    process.env.DATABASE_URL = PG_URL;
    const res = await POST(
      makeRequest({ email: "bot@example.com", consent: true, company: "ACME Bot" })
    );
    expect(res.status).toBe(200);
    expect(await count("bot@example.com")).toBe(0);
  });

  it("returns 500 (not fake success) on DB failure, leaking no email/DSN to logs", async () => {
    process.env.DATABASE_URL = "postgres://postgres@127.0.0.1:5999/nope"; // nothing listening
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(makeRequest({ email: "down@example.com", consent: true }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBeUndefined();
    const logged = errorSpy.mock.calls.map((c) => c.join(" ")).join("\n");
    expect(logged).not.toContain("down@example.com");
    expect(logged).not.toContain("5999");
    expect(logged).not.toContain("postgres://");
    errorSpy.mockRestore();
    const pool = g.waitlistPool as Pool | undefined;
    if (pool) await pool.end().catch(() => {});
  });

  it("fails safe with 503 when DATABASE_URL is missing (no fake success)", async () => {
    // no DATABASE_URL, no WAITLIST_ALLOW_MEMORY
    const res = await POST(makeRequest({ email: "nostore@example.com", consent: true }));
    expect(res.status).toBe(503);
  });
});
