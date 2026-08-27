import { describe, it, expect } from "vitest";

import { InMemoryWaitlistRepository } from "@/lib/waitlist/memoryRepository";
import type { WaitlistAddInput } from "@/lib/waitlist/types";

function sub(email: string): WaitlistAddInput {
  return { emailNormalized: email, emailOriginal: email, source: "hero", consentVersion: "v1" };
}

describe("waitlist signupStats", () => {
  it("counts active signups in the range and never exposes addresses", async () => {
    const repo = new InMemoryWaitlistRepository();
    await repo.add(sub("a@example.com"));
    await repo.add(sub("b@example.com"));
    await repo.unsubscribe("b@example.com"); // no longer active

    const wide = { from: new Date(Date.now() - 60_000), to: new Date(Date.now() + 60_000) };
    const s = await repo.signupStats(wide);
    expect(s.total).toBe(1); // only the active one
    expect(s.byDay.reduce((n, d) => n + d.count, 0)).toBe(1);
    expect(JSON.stringify(s)).not.toContain("@example.com");
  });

  it("excludes signups outside the range", async () => {
    const repo = new InMemoryWaitlistRepository();
    await repo.add(sub("a@example.com"));
    const past = { from: new Date("2000-01-01"), to: new Date("2000-02-01") };
    expect((await repo.signupStats(past)).total).toBe(0);
  });
});
