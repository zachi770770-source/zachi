import { describe, it, expect, beforeEach, vi } from "vitest";

// מאגר מדומה + מייל מדומה — כדי לבדוק את שכבת ה-HTTP בבידוד.
const createPending = vi.fn();
const getReaderClaimRepository = vi.fn();

vi.mock("@/lib/reader", () => ({
  getReaderClaimRepository: () => getReaderClaimRepository(),
}));

vi.mock("@/lib/email/readerEmail", () => ({
  sendReaderClaimReceivedEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "@/app/api/reader/claim/route";
import { sendReaderClaimReceivedEmail } from "@/lib/email/readerEmail";

const mockEmail = vi.mocked(sendReaderClaimReceivedEmail);

let ip = 0;
function req(body: Record<string, unknown>, headers: Record<string, string> = {}) {
  ip += 1;
  return new Request("http://localhost/api/reader/claim", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.20.0.${ip}`,
      ...headers,
    },
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

const VALID = {
  name: "דנה",
  email: "dana@example.com",
  orderRef: "701-1234567-1234567",
  consent: true,
  source: "reader",
};

beforeEach(() => {
  createPending.mockReset().mockResolvedValue(undefined);
  getReaderClaimRepository.mockReset().mockReturnValue({ createPending });
  mockEmail.mockReset().mockResolvedValue({ ok: true });
});

describe("POST /api/reader/claim", () => {
  it("stores a pending claim and always responds status:pending (never verified)", async () => {
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "pending" });
    expect(createPending).toHaveBeenCalledTimes(1);
  });

  it("returns 503 (never a fake success) when no persistent store is connected", async () => {
    getReaderClaimRepository.mockReturnValue(null);
    const res = await POST(req(VALID));
    expect(res.status).toBe(503);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("honeypot (non-empty company) responds success WITHOUT writing or emailing", async () => {
    const res = await POST(req({ ...VALID, company: "bot" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "pending" });
    expect(createPending).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("rejects invalid input with 400 and does not write", async () => {
    const res = await POST(req({ ...VALID, consent: false }));
    expect(res.status).toBe(400);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type with 415", async () => {
    const bad = new Request("http://localhost/api/reader/claim", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "x-forwarded-for": "10.20.9.9", "content-type": "text/plain" },
      body: "x",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    const res = await POST(bad);
    expect(res.status).toBe(415);
  });

  it("rejects a cross-site origin with 403 (CSRF guard)", async () => {
    const res = await POST(req(VALID, { origin: "http://evil.example" }));
    expect(res.status).toBe(403);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("still succeeds when the confirmation email fails (best-effort, claim already saved)", async () => {
    mockEmail.mockRejectedValue(new Error("smtp down"));
    const res = await POST(req(VALID));
    expect(res.status).toBe(200);
    expect(createPending).toHaveBeenCalledTimes(1);
  });

  it("rate-limits repeated submissions from the same IP", async () => {
    const headers = { "x-forwarded-for": "10.20.55.55" };
    let last = 0;
    for (let i = 0; i < 7; i++) {
      const r = new Request("http://localhost/api/reader/claim", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost", ...headers },
        body: JSON.stringify(VALID),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any;
      last = (await POST(r)).status;
    }
    expect(last).toBe(429);
  });
});
