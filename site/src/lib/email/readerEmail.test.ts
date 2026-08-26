import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  isReaderEmailConfigured,
  sendReaderKitWelcomeEmail,
} from "@/lib/email/readerEmail";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
  delete process.env.CONTACT_FROM_EMAIL;
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

const INPUT = {
  to: "a@b.com",
  kitUrl: "https://x/reader/kit",
  activateUrl: "https://x/reader#activate",
};

describe("readerEmail configuration gate", () => {
  it("is not configured without both key and sender", () => {
    expect(isReaderEmailConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_test";
    expect(isReaderEmailConfigured()).toBe(false);
    process.env.CONTACT_FROM_EMAIL = "noreply@example.com";
    expect(isReaderEmailConfigured()).toBe(true);
  });

  it("returns not_configured (never a fake success) when unconfigured — and never calls fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await sendReaderKitWelcomeEmail(INPUT);
    expect(res).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("never puts a session token in the email — links carry no token", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "noreply@example.com";
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));
    const res = await sendReaderKitWelcomeEmail(INPUT);
    expect(res).toEqual({ ok: true });
    const body = JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string);
    expect(body.text).not.toMatch(/token=/);
  });

  it("reports delivery_failed on a non-2xx provider response", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "noreply@example.com";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 422 }));
    const res = await sendReaderKitWelcomeEmail(INPUT);
    expect(res).toEqual({ ok: false, reason: "delivery_failed" });
  });
});
