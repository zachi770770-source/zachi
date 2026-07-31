import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  sendContactEmail,
  isContactEmailConfigured,
} from "@/lib/email/contactEmail";

const KEYS = ["RESEND_API_KEY", "CONTACT_FROM_EMAIL", "CONTACT_TO_EMAIL"];
function clearEnv() {
  for (const k of KEYS) delete process.env[k];
}
function setEnv() {
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.CONTACT_FROM_EMAIL = "מדייטים לאהבה <noreply@zachi.co.il>";
  process.env.CONTACT_TO_EMAIL = "owner@zachi.co.il";
}

const INPUT = {
  name: "דנה",
  contact: "dana@example.com",
  subject: "שאלה על הספר",
  message: "הודעת בדיקה ארוכה מספיק כדי לעבור ולידציה.",
};

beforeEach(() => {
  clearEnv();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterEach(() => {
  clearEnv();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("sendContactEmail", () => {
  it("returns not_configured and never calls the provider when env is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const r = await sendContactEmail(INPUT);
    expect(r).toEqual({ ok: false, reason: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(isContactEmailConfigured()).toBe(false);
  });

  it("sends to CONTACT_TO_EMAIL with Reply-To and returns ok on a 2xx", async () => {
    setEnv();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: "e1" }) });
    vi.stubGlobal("fetch", fetchMock);

    const r = await sendContactEmail(INPUT);
    expect(r).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("api.resend.com");
    expect(opts.headers.Authorization).toBe("Bearer re_test_key");
    const sent = JSON.parse(opts.body);
    expect(sent.to).toEqual(["owner@zachi.co.il"]);
    expect(sent.reply_to).toBe("dana@example.com");
    expect(sent.from).toBe("מדייטים לאהבה <noreply@zachi.co.il>");
  });

  it("does NOT report success when the provider returns an error (5xx)", async () => {
    setEnv();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const r = await sendContactEmail(INPUT);
    expect(r).toEqual({ ok: false, reason: "delivery_failed" });
  });

  it("returns delivery_failed when the request throws (network)", async () => {
    setEnv();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const r = await sendContactEmail(INPUT);
    expect(r).toEqual({ ok: false, reason: "delivery_failed" });
  });

  it("omits Reply-To when the contact detail is a phone number, not an email", async () => {
    setEnv();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    await sendContactEmail({ ...INPUT, contact: "050-1234567" });
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(sent.reply_to).toBeUndefined();
  });

  it("never logs PII (name, message, email) on failure — only a status code", async () => {
    setEnv();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 502 }));
    await sendContactEmail(INPUT);
    const logged = errSpy.mock.calls.flat().join(" ");
    expect(logged).not.toContain("dana@example.com");
    expect(logged).not.toContain("דנה");
    expect(logged).not.toContain(INPUT.message);
    expect(logged).toContain("502");
  });
});
