import { describe, it, expect, beforeEach } from "vitest";

import { InMemoryReaderClaimRepository } from "@/lib/reader/memoryRepository";
import { generateAccessToken, hashAccessToken } from "@/lib/reader/token";
import type { ReaderClaimCreateInput } from "@/lib/reader/types";

const EMAIL = "dana@example.com";

function pending(email = EMAIL): ReaderClaimCreateInput {
  return {
    emailNormalized: email,
    consentVersion: "2026-08-v1",
    proof: { mime: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) },
  };
}

let repo: InMemoryReaderClaimRepository;
beforeEach(() => {
  repo = new InMemoryReaderClaimRepository();
});

describe("InMemoryReaderClaimRepository", () => {
  it("creates a pending claim holding the proof, listable for review", async () => {
    await repo.createPending(pending());
    const list = await repo.listPending(10);
    expect(list).toHaveLength(1);
    expect(list[0].emailNormalized).toBe(EMAIL);
    expect(list[0].status).toBe("pending");
    expect(list[0].proofMime).toBe("image/png");
    const proof = await repo.getProof(EMAIL);
    expect(proof?.mime).toBe("image/png");
    expect(proof?.bytes.length).toBeGreaterThan(0);
  });

  it("grants no access while pending (only approved opens the kit)", async () => {
    await repo.createPending(pending());
    const token = generateAccessToken();
    expect(await repo.findApprovedByAccessTokenHash(hashAccessToken(token))).toBeNull();
  });

  it("approve() sets approved, stores the token hash, and deletes the proof (minimum PII)", async () => {
    await repo.createPending(pending());
    const token = generateAccessToken();
    const expiresAt = new Date(Date.now() + 60_000);
    const claim = await repo.approve(EMAIL, hashAccessToken(token), expiresAt);
    expect(claim?.emailNormalized).toBe(EMAIL);
    // proof purged after decision
    expect(await repo.getProof(EMAIL)).toBeNull();
    // approved claim resolvable by the token hash
    expect((await repo.findApprovedByAccessTokenHash(hashAccessToken(token)))?.emailNormalized).toBe(EMAIL);
    // no longer pending
    expect(await repo.listPending(10)).toHaveLength(0);
  });

  it("approve() returns null for an unknown email (no phantom approval)", async () => {
    expect(await repo.approve("ghost@example.com", hashAccessToken(generateAccessToken()), new Date(Date.now() + 1000))).toBeNull();
  });

  it("does not honor an expired access token", async () => {
    await repo.createPending(pending());
    const token = generateAccessToken();
    await repo.approve(EMAIL, hashAccessToken(token), new Date(Date.now() - 1000));
    expect(await repo.findApprovedByAccessTokenHash(hashAccessToken(token))).toBeNull();
  });

  it("reject() blocks access and purges the proof", async () => {
    await repo.createPending(pending());
    const token = generateAccessToken();
    await repo.approve(EMAIL, hashAccessToken(token), new Date(Date.now() + 60_000));
    await repo.reject(EMAIL);
    expect(await repo.findApprovedByAccessTokenHash(hashAccessToken(token))).toBeNull();
    expect(await repo.getProof(EMAIL)).toBeNull();
  });

  it("re-submission returns an approved claim to pending with a fresh proof (idempotent by email)", async () => {
    await repo.createPending(pending());
    const token = generateAccessToken();
    await repo.approve(EMAIL, hashAccessToken(token), new Date(Date.now() + 60_000));
    await repo.createPending(pending());
    expect(await repo.findApprovedByAccessTokenHash(hashAccessToken(token))).toBeNull();
    expect(await repo.listPending(10)).toHaveLength(1);
    expect(repo.rows.size).toBe(1);
  });

  it("stats() aggregates by status within the range (counts only, no PII)", async () => {
    await repo.createPending(pending("a@example.com"));
    await repo.createPending(pending("b@example.com"));
    await repo.createPending(pending("c@example.com"));
    const token = generateAccessToken();
    await repo.approve("a@example.com", hashAccessToken(token), new Date(Date.now() + 60_000));
    await repo.reject("b@example.com");
    // c stays pending

    const wide = { from: new Date(Date.now() - 60_000), to: new Date(Date.now() + 60_000) };
    const s = await repo.stats(wide);
    expect(s.total).toBe(3);
    expect(s.approved).toBe(1);
    expect(s.rejected).toBe(1);
    expect(s.pending).toBe(1);
    expect(s.approvedWithAccess).toBe(1);
    expect(s.byDay.reduce((n, d) => n + d.submitted, 0)).toBe(3);
    // stats carry no email/PII
    expect(JSON.stringify(s)).not.toContain("@example.com");
  });

  it("stats() excludes rows outside the range", async () => {
    await repo.createPending(pending());
    const past = { from: new Date("2000-01-01"), to: new Date("2000-02-01") };
    const s = await repo.stats(past);
    expect(s.total).toBe(0);
    expect(s.byDay).toEqual([]);
  });
});
