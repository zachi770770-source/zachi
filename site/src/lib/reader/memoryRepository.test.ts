import { describe, it, expect, beforeEach } from "vitest";

import { InMemoryReaderAccessRepository } from "@/lib/reader/memoryRepository";
import { generateSessionToken, hashSessionToken } from "@/lib/reader/token";
import type { ReaderActivationInput } from "@/lib/reader/types";

const EMAIL = "dana@example.com";

function activation(overrides: Partial<ReaderActivationInput> = {}): ReaderActivationInput {
  const token = generateSessionToken();
  return {
    emailNormalized: EMAIL,
    consentVersion: "2026-08-v1",
    sessionTokenHash: hashSessionToken(token),
    sessionExpiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

let repo: InMemoryReaderAccessRepository;

beforeEach(() => {
  repo = new InMemoryReaderAccessRepository();
});

describe("InMemoryReaderAccessRepository", () => {
  it("activates and finds a valid session by token hash", async () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    await repo.activate(activation({ sessionTokenHash: hash }));
    const session = await repo.findValidSession(hash);
    expect(session?.emailNormalized).toBe(EMAIL);
  });

  it("returns null for an unknown token hash (no access, no enumeration)", async () => {
    await repo.activate(activation());
    expect(await repo.findValidSession(hashSessionToken(generateSessionToken()))).toBeNull();
  });

  it("does not honor an expired session", async () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    await repo.activate(activation({ sessionTokenHash: hash, sessionExpiresAt: new Date(Date.now() - 1000) }));
    expect(await repo.findValidSession(hash)).toBeNull();
  });

  it("does not honor a revoked session", async () => {
    const token = generateSessionToken();
    const hash = hashSessionToken(token);
    await repo.activate(activation({ sessionTokenHash: hash }));
    await repo.revokeSession(hash);
    expect(await repo.findValidSession(hash)).toBeNull();
  });

  it("re-activation replaces the session and keeps one row (idempotent by email)", async () => {
    const first = generateSessionToken();
    const firstHash = hashSessionToken(first);
    await repo.activate(activation({ sessionTokenHash: firstHash }));

    const second = generateSessionToken();
    const secondHash = hashSessionToken(second);
    await repo.activate(activation({ sessionTokenHash: secondHash }));

    expect(await repo.findValidSession(firstHash)).toBeNull(); // old session gone
    expect((await repo.findValidSession(secondHash))?.emailNormalized).toBe(EMAIL);
    expect(repo.rows.size).toBe(1);
  });

  it("stores only minimal fields — no name, no order reference", async () => {
    await repo.activate(activation());
    const row = repo.rows.get(EMAIL)!;
    expect(row).not.toHaveProperty("name");
    expect(row).not.toHaveProperty("orderRef");
    expect(Object.keys(row).sort()).toEqual(
      [
        "consentAt",
        "consentVersion",
        "emailNormalized",
        "sessionExpiresAt",
        "sessionRevokedAt",
        "sessionTokenHash",
      ].sort(),
    );
  });
});
