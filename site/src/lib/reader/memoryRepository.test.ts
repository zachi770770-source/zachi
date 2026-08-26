import { describe, it, expect, beforeEach } from "vitest";

import { InMemoryReaderClaimRepository } from "@/lib/reader/memoryRepository";
import { generateAccessToken } from "@/lib/reader/token";
import type { ReaderClaimAddInput } from "@/lib/reader/types";

const INPUT: ReaderClaimAddInput = {
  name: "דנה",
  emailNormalized: "dana@example.com",
  emailOriginal: "dana@example.com",
  orderRef: "701-1234567-1234567",
  source: "reader",
  consentVersion: "2026-08-v1",
};

let repo: InMemoryReaderClaimRepository;

beforeEach(() => {
  repo = new InMemoryReaderClaimRepository();
});

describe("InMemoryReaderClaimRepository", () => {
  it("creates a claim in the pending state with no access token", async () => {
    await repo.createPending(INPUT);
    const row = repo.rows.get(INPUT.emailNormalized);
    expect(row?.status).toBe("pending");
    expect(row?.accessToken).toBeNull();
  });

  it("approve() moves to approved and assigns the given token", async () => {
    await repo.createPending(INPUT);
    const token = generateAccessToken();
    const claim = await repo.approve(INPUT.emailNormalized, token);
    expect(claim).not.toBeNull();
    expect(claim?.status).toBe("approved");
    expect(claim?.accessToken).toBe(token);
  });

  it("approve() is a no-op returning null when no claim exists (anti-enumeration)", async () => {
    const claim = await repo.approve("nobody@example.com", generateAccessToken());
    expect(claim).toBeNull();
  });

  it("findByAccessToken() returns only approved claims matching the token", async () => {
    await repo.createPending(INPUT);
    const token = generateAccessToken();
    // pending → no access yet even if a token were guessed
    expect(await repo.findByAccessToken(token)).toBeNull();
    await repo.approve(INPUT.emailNormalized, token);
    const found = await repo.findByAccessToken(token);
    expect(found?.emailNormalized).toBe(INPUT.emailNormalized);
    expect(found?.status).toBe("approved");
    // a wrong token never resolves
    expect(await repo.findByAccessToken(generateAccessToken())).toBeNull();
  });

  it("reject() clears any access token and blocks access", async () => {
    await repo.createPending(INPUT);
    const token = generateAccessToken();
    await repo.approve(INPUT.emailNormalized, token);
    await repo.reject(INPUT.emailNormalized);
    expect(repo.rows.get(INPUT.emailNormalized)?.status).toBe("rejected");
    expect(await repo.findByAccessToken(token)).toBeNull();
  });

  it("re-submitting resets an approved claim back to pending (idempotent by email)", async () => {
    await repo.createPending(INPUT);
    const token = generateAccessToken();
    await repo.approve(INPUT.emailNormalized, token);
    await repo.createPending(INPUT); // same email submits again
    expect(repo.rows.get(INPUT.emailNormalized)?.status).toBe("pending");
    expect(await repo.findByAccessToken(token)).toBeNull();
    // still a single row — no duplicates
    expect(repo.rows.size).toBe(1);
  });
});
