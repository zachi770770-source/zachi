import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/email/contactEmail", () => ({
  sendContactEmail: vi.fn(),
}));

import { POST } from "@/app/api/contact/route";
import { sendContactEmail } from "@/lib/email/contactEmail";

const mockSend = vi.mocked(sendContactEmail);

let ip = 0;
function req(body: Record<string, unknown>) {
  ip += 1;
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.9.0.${ip}`,
    },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const VALID = {
  name: "דנה",
  contact: "dana@example.com",
  subject: "שאלה",
  message: "הודעה ארוכה מספיק לבדיקה.",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("POST /api/contact", () => {
  it("returns success only when the provider confirms delivery", async () => {
    mockSend.mockResolvedValue({ ok: true });
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it("returns 503 with a clear Hebrew message when email is not configured", async () => {
    mockSend.mockResolvedValue({ ok: false, reason: "not_configured" });
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toContain("אינו זמין");
  });

  it("returns 502 with a Hebrew failure message on provider delivery failure", async () => {
    mockSend.mockResolvedValue({ ok: false, reason: "delivery_failed" });
    const res = await POST(req(VALID));
    expect(res.status).toBe(502);
    expect((await res.json()).error).toContain("תקלה בשליחת");
  });

  it("bot honeypot (non-empty website) is rejected and NEVER calls the email provider", async () => {
    // ה-honeypot נאכף כבר בסכימה (website חייב להיות ריק) → 400, בלי שליחה.
    const res = await POST(req({ ...VALID, website: "bot-filled" }));
    expect(res.status).toBe(400);
    expect(mockSend).not.toHaveBeenCalled();
  });
});
