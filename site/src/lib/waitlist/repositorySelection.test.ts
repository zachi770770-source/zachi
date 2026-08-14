import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { getWaitlistRepository } from "@/lib/waitlist";
import { PostgresWaitlistRepository } from "@/lib/waitlist/postgresRepository";
import { InMemoryWaitlistRepository } from "@/lib/waitlist/memoryRepository";

const g = globalThis as unknown as Record<string, unknown>;
const DUMMY_DB = "postgres://user:pass@localhost:5999/db";

function reset() {
  delete g.waitlistRepo;
  delete g.waitlistMemoryRepo;
  delete g.waitlistPool;
  delete process.env.DATABASE_URL;
  delete process.env.WAITLIST_ALLOW_MEMORY;
  delete process.env.VERCEL_ENV;
}

beforeEach(reset);
afterEach(reset);

describe("getWaitlistRepository, real persistence selection", () => {
  it("uses Postgres when DATABASE_URL is set", () => {
    process.env.DATABASE_URL = DUMMY_DB;
    expect(getWaitlistRepository()).toBeInstanceOf(PostgresWaitlistRepository);
  });

  it("uses in-memory in local dev/test (flag set, not on Vercel)", () => {
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    expect(getWaitlistRepository()).toBeInstanceOf(InMemoryWaitlistRepository);
  });

  it("returns null when nothing is configured", () => {
    expect(getWaitlistRepository()).toBeNull();
  });
});

describe("getWaitlistRepository, no silent memory fallback on Vercel", () => {
  it("NEVER uses memory on Vercel Production even if WAITLIST_ALLOW_MEMORY=true", () => {
    process.env.VERCEL_ENV = "production";
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    expect(getWaitlistRepository()).toBeNull();
  });

  it("NEVER uses memory on Vercel Preview even if WAITLIST_ALLOW_MEMORY=true", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.WAITLIST_ALLOW_MEMORY = "true";
    expect(getWaitlistRepository()).toBeNull();
  });

  it("still uses the real DB on Vercel Production when DATABASE_URL is present", () => {
    process.env.VERCEL_ENV = "production";
    process.env.DATABASE_URL = DUMMY_DB;
    expect(getWaitlistRepository()).toBeInstanceOf(PostgresWaitlistRepository);
  });
});
