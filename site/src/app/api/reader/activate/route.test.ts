import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// מאגר מדומה + מייל מדומה — כדי לבדוק את שכבת ה-HTTP בבידוד.
const activate = vi.fn();
const getReaderAccessRepository = vi.fn();

vi.mock("@/lib/reader", () => ({
  getReaderAccessRepository: () => getReaderAccessRepository(),
}));

vi.mock("@/lib/email/readerEmail", () => ({
  sendReaderKitWelcomeEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "@/app/api/reader/activate/route";
import { sendReaderKitWelcomeEmail } from "@/lib/email/readerEmail";

const mockEmail = vi.mocked(sendReaderKitWelcomeEmail);
const ORIGINAL = { ...process.env };

let ip = 0;
function req(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  ip += 1;
  return new Request("http://localhost/api/reader/activate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.30.0.${ip}`,
      ...headers,
    },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const VALID = { email: "dana@example.com", code: "MEETINGS-2026", consent: true };

beforeEach(() => {
  activate.mockReset().mockResolvedValue(undefined);
  getReaderAccessRepository.mockReset().mockReturnValue({ activate });
  mockEmail.mockReset().mockResolvedValue({ ok: true });
  process.env.READER_ACCESS_CODES = "MEETINGS-2026";
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("POST /api/reader/activate", () => {
  it("activates on a valid code and sets an HttpOnly session cookie (no token in body)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(activate).toHaveBeenCalledTimes(1);

    const cookie = res.cookies.get("reader_session");
    expect(cookie?.value).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");

    // מה שנשמר במסד הוא ה-hash, לא האסימון הגולמי שבעוגייה.
    const stored = activate.mock.calls[0][0];
    expect(stored.sessionTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(stored.sessionTokenHash).not.toBe(cookie?.value);
    // מינימום PII — אין שם/מזהה-הזמנה בכתיבה.
    expect(stored).not.toHaveProperty("name");
    expect(stored).not.toHaveProperty("orderRef");
  });

  it("rejects an invalid code with 401 and never activates or sets a cookie", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await POST(req({ ...VALID, code: "WRONG-CODE" }));
    expect(res.status).toBe(401);
    expect(activate).not.toHaveBeenCalled();
    expect(res.cookies.get("reader_session")).toBeFalsy();
  });

  it("returns 503 when no activation code is configured (feature unavailable)", async () => {
    delete process.env.READER_ACCESS_CODES;
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect(activate).not.toHaveBeenCalled();
  });

  it("returns 503 (never fake success) when no persistent store is connected", async () => {
    getReaderAccessRepository.mockReturnValue(null);
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect(activate).not.toHaveBeenCalled();
  });

  it("honeypot (non-empty company) responds ok WITHOUT activating, cookie, or email", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await POST(req({ ...VALID, company: "bot" }));
    expect(res.status).toBe(200);
    expect(activate).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
    expect(res.cookies.get("reader_session")).toBeFalsy();
  });

  it("rejects invalid input with 400 (missing consent) and does not activate", async () => {
    const res = await POST(req({ ...VALID, consent: false }));
    expect(res.status).toBe(400);
    expect(activate).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type with 415", async () => {
    const bad = new Request("http://localhost/api/reader/activate", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "x-forwarded-for": "10.30.9.9", "content-type": "text/plain" },
      body: "x",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    expect((await POST(bad)).status).toBe(415);
  });

  it("rejects a cross-site origin with 403 (CSRF guard)", async () => {
    const res = await POST(req(VALID, { origin: "http://evil.example" }));
    expect(res.status).toBe(403);
    expect(activate).not.toHaveBeenCalled();
  });

  it("still succeeds when the confirmation email fails (best-effort, already activated)", async () => {
    mockEmail.mockRejectedValue(new Error("smtp down"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(activate).toHaveBeenCalledTimes(1);
  });

  it("rate-limits repeated attempts from the same IP (guards code guessing)", async () => {
    const headers = { "x-forwarded-for": "10.30.55.55" };
    let last = 0;
    for (let i = 0; i < 7; i++) {
      const r = new Request("http://localhost/api/reader/activate", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost", ...headers },
        body: JSON.stringify({ ...VALID, code: "WRONG" }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      last = (await POST(r)).status;
    }
    expect(last).toBe(429);
  });
});
