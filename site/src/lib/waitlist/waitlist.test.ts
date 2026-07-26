import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { waitlistSchema } from "@/lib/validation/waitlist";
import { InMemoryWaitlistRepository } from "@/lib/waitlist/memoryRepository";
import {
  classifyWaitlistDbError,
  formatWaitlistDbErrorLog,
} from "@/lib/waitlist/diagnostics";
import { POST } from "@/app/api/waitlist/route";

const g = globalThis as unknown as Record<string, unknown>;

function resetWaitlistGlobals() {
  delete g.waitlistMemoryRepo;
  delete g.waitlistRepo;
  delete g.waitlistPool;
  delete process.env.DATABASE_URL;
  delete process.env.WAITLIST_ALLOW_MEMORY;
}

let ipCounter = 0;
function makeRequest(body: unknown, extraHeaders: Record<string, string> = {}) {
  ipCounter += 1;
  return new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.0.0.${ipCounter}`, // IP ייחודי כדי לא להיתקל ב-rate limit
      ...extraHeaders,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("waitlistSchema", () => {
  it("rejects an invalid email", () => {
    expect(
      waitlistSchema.safeParse({ email: "not-an-email", consent: true }).success
    ).toBe(false);
  });

  it("rejects when consent is not given", () => {
    expect(
      waitlistSchema.safeParse({ email: "a@b.com", consent: false }).success
    ).toBe(false);
  });

  it("normalizes email to trimmed lowercase", () => {
    const parsed = waitlistSchema.parse({ email: "  A@B.COM ", consent: true });
    expect(parsed.email).toBe("a@b.com");
  });
});

describe("InMemoryWaitlistRepository", () => {
  it("deduplicates repeated emails and supports unsubscribe", async () => {
    const repo = new InMemoryWaitlistRepository();
    const input = {
      emailNormalized: "x@y.com",
      emailOriginal: "x@y.com",
      source: "hero" as const,
      consentVersion: "v1",
    };
    await repo.add(input);
    await repo.add(input);
    expect(repo.records.size).toBe(1);

    await repo.unsubscribe("x@y.com");
    expect(repo.records.get("x@y.com")?.status).toBe("unsubscribed");
  });
});

describe("POST /api/waitlist", () => {
  beforeEach(resetWaitlistGlobals);
  afterEach(resetWaitlistGlobals);

  it("returns 503 when no persistent store is configured (no fake success)", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", consent: true }));
    expect(res.status).toBe(503);
  });

  it("rejects missing consent with 400", async () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    const res = await POST(makeRequest({ email: "a@b.com", consent: false }));
    expect(res.status).toBe(400);
  });

  it("rejects an invalid email with 400", async () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    const res = await POST(makeRequest({ email: "nope", consent: true }));
    expect(res.status).toBe(400);
  });

  it("accepts a valid signup and stores it once (idempotent)", async () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    const r1 = await POST(makeRequest({ email: "dup@x.com", consent: true, source: "sample" }));
    const r2 = await POST(makeRequest({ email: "dup@x.com", consent: true, source: "sample" }));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const repo = g.waitlistMemoryRepo as InMemoryWaitlistRepository;
    expect(repo.records.size).toBe(1);
  });

  it("treats a filled honeypot as success but stores nothing", async () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    const res = await POST(
      makeRequest({ email: "bot@x.com", consent: true, company: "ACME Bot" })
    );
    expect(res.status).toBe(200);
    const repo = g.waitlistMemoryRepo as InMemoryWaitlistRepository | undefined;
    expect(repo?.records.size ?? 0).toBe(0);
  });

  it("rejects a wrong content-type with 415", async () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    const res = await POST(
      makeRequest({ email: "a@b.com", consent: true }, { "content-type": "text/plain" })
    );
    expect(res.status).toBe(415);
  });
});

describe("classifyWaitlistDbError", () => {
  it("classifies a Postgres auth failure (28P01) as a connection error", () => {
    const d = classifyWaitlistDbError({ name: "error", code: "28P01" });
    expect(d).toMatchObject({
      name: "error",
      code: "28P01",
      stage: "connection",
      classification: "authentication_failed",
    });
  });

  it("classifies a missing relation (42P01) as an upsert error", () => {
    const d = classifyWaitlistDbError({ name: "error", code: "42P01" });
    expect(d).toMatchObject({ stage: "upsert", classification: "relation_missing" });
  });

  it("classifies permission_denied (42501) as an upsert error", () => {
    const d = classifyWaitlistDbError({ name: "error", code: "42501" });
    expect(d).toMatchObject({ stage: "upsert", classification: "permission_denied" });
  });

  it("reads a network code from error.cause.code (host_not_found)", () => {
    const d = classifyWaitlistDbError({ name: "AggregateError", cause: { code: "ENOTFOUND" } });
    expect(d).toMatchObject({
      code: "none",
      causeCode: "ENOTFOUND",
      stage: "connection",
      classification: "host_not_found",
    });
  });

  it("classifies any certificate error as ssl_error", () => {
    const d = classifyWaitlistDbError({ name: "Error", code: "SELF_SIGNED_CERT_IN_CHAIN" });
    expect(d).toMatchObject({ stage: "connection", classification: "ssl_error" });
  });

  it("falls back to unknown when there is no code", () => {
    const d = classifyWaitlistDbError(new Error("boom"));
    expect(d).toMatchObject({ code: "none", causeCode: "none", classification: "unknown" });
  });

  it("never leaks message or stack in the formatted log line", () => {
    const err = new Error("secret connection string postgres://user:pass@host/db");
    const line = formatWaitlistDbErrorLog(classifyWaitlistDbError(err));
    expect(line).not.toContain("secret");
    expect(line).not.toContain("postgres://");
    expect(line).not.toContain("pass");
    expect(line.startsWith("[waitlist] persistence error")).toBe(true);
  });
});
