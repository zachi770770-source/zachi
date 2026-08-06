import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PostgresWaitlistRepository, type SqlClient } from "@/lib/waitlist/postgresRepository";

type Call = { text: string; params?: unknown[] };

class MockSql implements SqlClient {
  calls: Call[] = [];
  failCreateTable = false;
  failHardening = false;
  failInsert = false;

  async query(text: string, params?: unknown[]): Promise<{ rows: unknown[] }> {
    this.calls.push({ text, params });
    if (this.failCreateTable && /create table/i.test(text)) {
      throw Object.assign(new Error("boom"), { code: "42501" });
    }
    if (
      this.failHardening &&
      /(enable row level security|revoke|create index)/i.test(text)
    ) {
      throw Object.assign(new Error("boom"), { code: "42501" });
    }
    if (this.failInsert && /insert into/i.test(text)) {
      throw Object.assign(new Error("boom"), { code: "42P01" });
    }
    return { rows: [] };
  }
}

const input = {
  emailNormalized: "a@b.com",
  emailOriginal: "a@b.com",
  source: "hero" as const,
  consentVersion: "v1",
};

const createTableCalls = (db: MockSql) =>
  db.calls.filter((c) => /create table if not exists waitlist_subscribers/i.test(c.text));
const insertCalls = (db: MockSql) =>
  db.calls.filter((c) => /insert into waitlist_subscribers/i.test(c.text));

describe("PostgresWaitlistRepository self-provisioning", () => {
  beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("creates the schema before inserting, and inserts with the right params", async () => {
    const db = new MockSql();
    const repo = new PostgresWaitlistRepository(db);
    await repo.add(input);

    // create table happens before the insert
    const createIdx = db.calls.findIndex((c) => /create table/i.test(c.text));
    const insertIdx = db.calls.findIndex((c) => /insert into/i.test(c.text));
    expect(createIdx).toBeGreaterThanOrEqual(0);
    expect(insertIdx).toBeGreaterThan(createIdx);

    // persona/persona_source ריקים כשלא סופקו → NULL, NULL בסוף.
    expect(insertCalls(db)[0].params).toEqual([
      "a@b.com",
      "a@b.com",
      "hero",
      "v1",
      null,
      null,
    ]);
  });

  it("passes persona and persona_source through to the insert when provided", async () => {
    const db = new MockSql();
    const repo = new PostgresWaitlistRepository(db);
    await repo.add({ ...input, persona: "married", personaSource: "hero" });

    expect(insertCalls(db)[0].params).toEqual([
      "a@b.com",
      "a@b.com",
      "hero",
      "v1",
      "married",
      "hero",
    ]);
  });

  it("runs the schema DDL only once across multiple writes", async () => {
    const db = new MockSql();
    const repo = new PostgresWaitlistRepository(db);
    await repo.add(input);
    await repo.add({ ...input, emailNormalized: "c@d.com", emailOriginal: "c@d.com" });
    await repo.unsubscribe("a@b.com");

    expect(createTableCalls(db)).toHaveLength(1); // memoized after first success
    expect(insertCalls(db)).toHaveLength(2);
  });

  it("still inserts when the RLS/index hardening statements fail (best-effort)", async () => {
    const db = new MockSql();
    db.failHardening = true;
    const repo = new PostgresWaitlistRepository(db);
    await expect(repo.add(input)).resolves.toBeUndefined(); // no throw
    expect(insertCalls(db)).toHaveLength(1);
  });

  it("still attempts the insert even if create-table fails (table may pre-exist)", async () => {
    const db = new MockSql();
    db.failCreateTable = true;
    const repo = new PostgresWaitlistRepository(db);
    await repo.add(input);
    expect(insertCalls(db)).toHaveLength(1); // fell through to the write attempt
  });

  it("propagates a real insert failure so the route can return a safe error", async () => {
    const db = new MockSql();
    db.failInsert = true;
    const repo = new PostgresWaitlistRepository(db);
    await expect(repo.add(input)).rejects.toMatchObject({ code: "42P01" });
  });

  it("never puts the email in the schema DDL statements", async () => {
    const db = new MockSql();
    const repo = new PostgresWaitlistRepository(db);
    await repo.add(input);
    for (const c of db.calls.filter((x) => !/insert into/i.test(x.text))) {
      expect(c.text).not.toContain("a@b.com");
      expect(c.params ?? []).not.toContain("a@b.com");
    }
  });
});
