import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  isReaderEmailConfigured,
  sendReaderClaimReceivedEmail,
  sendReaderKitAccessEmail,
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
    const received = await sendReaderClaimReceivedEmail({ to: "a@b.com", name: "דנה" });
    const access = await sendReaderKitAccessEmail({
      to: "a@b.com",
      name: "דנה",
      kitUrl: "https://x/reader/kit?token=abc",
    });
    expect(received).toEqual({ ok: false, reason: "not_configured" });
    expect(access).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("reports success only when the provider responds 2xx", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "noreply@example.com";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 200 }),
    );
    const res = await sendReaderKitAccessEmail({
      to: "a@b.com",
      name: "דנה",
      kitUrl: "https://x/reader/kit?token=abc",
    });
    expect(res).toEqual({ ok: true });
  });

  it("reports delivery_failed on a non-2xx provider response", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.CONTACT_FROM_EMAIL = "noreply@example.com";
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 422 }),
    );
    const res = await sendReaderClaimReceivedEmail({ to: "a@b.com", name: "דנה" });
    expect(res).toEqual({ ok: false, reason: "delivery_failed" });
  });
});
