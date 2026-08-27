import { describe, it, expect, beforeEach, vi } from "vitest";

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
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);

let ip = 0;
/**
 * בונה בקשה-מדומה: הראוטר קורא רק ל-`headers` ול-`formData()`. בנייה דרך
 * `new Request({ body: FormData })` + `request.formData()` אינה יציבה בסביבת
 * jsdom (רשומת-הקובץ אובדת), ולכן מספקים FormData אמיתי ישירות.
 */
function build(
  fields: { email?: string; consent?: string; company?: string },
  proof: { bytes: Buffer; type?: string; name?: string } | null,
  extraHeaders: Record<string, string> = {},
) {
  ip += 1;
  const fd = new FormData();
  if (fields.email !== undefined) fd.set("email", fields.email);
  if (fields.consent !== undefined) fd.set("consent", fields.consent);
  if (fields.company !== undefined) fd.set("company", fields.company);
  if (proof) {
    fd.set("proof", new File([new Uint8Array(proof.bytes)], proof.name ?? "proof.png", { type: proof.type ?? "image/png" }));
  }
  const headers = new Headers({
    "content-type": "multipart/form-data; boundary=----test",
    host: "localhost",
    origin: "http://localhost",
    "x-forwarded-for": `10.40.0.${ip}`,
    ...extraHeaders,
  });
  return { headers, formData: async () => fd } as unknown as Request;
}

const VALID = { email: "dana@example.com", consent: "true" };

beforeEach(() => {
  createPending.mockReset().mockResolvedValue(undefined);
  getReaderClaimRepository.mockReset().mockReturnValue({ createPending });
  mockEmail.mockReset().mockResolvedValue({ ok: true });
});

describe("POST /api/reader/claim (proof upload)", () => {
  it("stores a pending claim with the validated proof and returns status:pending", async () => {
    const res = await POST(build(VALID, { bytes: PNG }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, status: "pending" });
    expect(createPending).toHaveBeenCalledTimes(1);
    const arg = createPending.mock.calls[0][0];
    expect(arg.emailNormalized).toBe("dana@example.com");
    expect(arg.proof.mime).toBe("image/png");
    expect(Buffer.isBuffer(arg.proof.bytes)).toBe(true);
  });

  it("rejects a spoofed file whose bytes are not an allowed image/pdf (real type check)", async () => {
    const res = await POST(build(VALID, { bytes: Buffer.from("this is not an image"), type: "image/png" }));
    expect(res.status).toBe(400);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("requires a proof file", async () => {
    const res = await POST(build(VALID, null));
    expect(res.status).toBe(400);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("rejects an oversized proof (413)", async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024 + 1)]);
    const res = await POST(build(VALID, { bytes: big }));
    expect(res.status).toBe(413);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("returns 503 (never a fake success) when no persistent store is connected", async () => {
    getReaderClaimRepository.mockReturnValue(null);
    const res = await POST(build(VALID, { bytes: PNG }));
    expect(res.status).toBe(503);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("honeypot (non-empty company) responds success WITHOUT writing or emailing", async () => {
    const res = await POST(build({ ...VALID, company: "bot" }, { bytes: PNG }));
    expect(res.status).toBe(200);
    expect(createPending).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("rejects missing consent with 400", async () => {
    const res = await POST(build({ email: "dana@example.com", consent: "false" }, { bytes: PNG }));
    expect(res.status).toBe(400);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("rejects a non-multipart content type with 415", async () => {
    const bad = new Request("http://localhost/api/reader/claim", {
      method: "POST",
      headers: { host: "localhost", origin: "http://localhost", "x-forwarded-for": "10.40.9.9", "content-type": "application/json" },
      body: JSON.stringify(VALID),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;
    expect((await POST(bad)).status).toBe(415);
  });

  it("rejects a cross-site origin with 403 (CSRF guard)", async () => {
    const res = await POST(build(VALID, { bytes: PNG }, { origin: "http://evil.example" }));
    expect(res.status).toBe(403);
    expect(createPending).not.toHaveBeenCalled();
  });

  it("still succeeds when the confirmation email fails (best-effort)", async () => {
    mockEmail.mockRejectedValue(new Error("smtp down"));
    const res = await POST(build(VALID, { bytes: PNG }));
    expect(res.status).toBe(200);
    expect(createPending).toHaveBeenCalledTimes(1);
  });

  it("rate-limits repeated submissions from the same IP", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) {
      last = (await POST(build(VALID, { bytes: PNG }, { "x-forwarded-for": "10.40.55.55" }))).status;
    }
    expect(last).toBe(429);
  });
});
