import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const approve = vi.fn();
const reject = vi.fn();
const listPending = vi.fn();
const getProof = vi.fn();
const getReaderClaimRepository = vi.fn();

vi.mock("@/lib/reader", () => ({
  getReaderClaimRepository: () => getReaderClaimRepository(),
}));
vi.mock("@/lib/email/readerEmail", () => ({
  sendReaderKitAccessEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { GET, POST } from "@/app/api/reader/review/route";
import { sendReaderKitAccessEmail } from "@/lib/email/readerEmail";

const mockEmail = vi.mocked(sendReaderKitAccessEmail);
const ORIGINAL = { ...process.env };
const TOKEN = "e2e-reader-admin-token";

function post(body: Record<string, unknown>, bearer?: string) {
  const headers: Record<string, string> = { "content-type": "application/json", host: "localhost" };
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  return new Request("http://localhost/api/reader/review", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}
function get(query = "", bearer?: string) {
  const headers: Record<string, string> = { host: "localhost" };
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Request(`http://localhost/api/reader/review${query}`, { headers }) as any;
}

beforeEach(() => {
  approve.mockReset();
  reject.mockReset().mockResolvedValue(undefined);
  listPending.mockReset().mockResolvedValue([]);
  getProof.mockReset();
  getReaderClaimRepository.mockReset().mockReturnValue({ approve, reject, listPending, getProof });
  mockEmail.mockReset().mockResolvedValue({ ok: true });
  process.env.READER_ADMIN_TOKEN = TOKEN;
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("POST /api/reader/review (admin, server-secret gated)", () => {
  it("503 when the admin token is not configured", async () => {
    delete process.env.READER_ADMIN_TOKEN;
    expect((await POST(post({ email: "d@e.com" }, "x"))).status).toBe(503);
  });

  it("401 on missing/wrong bearer", async () => {
    expect((await POST(post({ email: "d@e.com" }))).status).toBe(401);
    expect((await POST(post({ email: "d@e.com" }, "wrong"))).status).toBe(401);
    expect(approve).not.toHaveBeenCalled();
  });

  it("approves, mints a token, and returns the enter link (with the token in it)", async () => {
    approve.mockResolvedValue({ emailNormalized: "dana@example.com" });
    const res = await POST(post({ email: "dana@example.com" }, TOKEN));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("approved");
    expect(body.enterUrl).toMatch(/\/api\/reader\/enter\?token=[0-9a-f]{64}$/);
    // the stored value is the HASH, not the raw token in the URL.
    const [, rawToken] = body.enterUrl.match(/token=([0-9a-f]{64})/)!;
    const storedHash = approve.mock.calls[0][1];
    expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
    expect(storedHash).not.toBe(rawToken);
    expect(mockEmail).toHaveBeenCalledTimes(1);
  });

  it("404 when approving a non-existent claim (no phantom approval)", async () => {
    approve.mockResolvedValue(null);
    const res = await POST(post({ email: "ghost@example.com" }, TOKEN));
    expect(res.status).toBe(404);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("rejects without minting a token or emailing", async () => {
    const res = await POST(post({ email: "dana@example.com", action: "reject" }, TOKEN));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: "rejected" });
    expect(reject).toHaveBeenCalledTimes(1);
    expect(approve).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });
});

describe("GET /api/reader/review (admin)", () => {
  it("401 without a valid bearer (proof is never public)", async () => {
    expect((await GET(get("?email=dana@example.com&proof=1"))).status).toBe(401);
    expect(getProof).not.toHaveBeenCalled();
  });

  it("lists pending claims", async () => {
    listPending.mockResolvedValue([{ emailNormalized: "d@e.com", status: "pending", proofMime: "image/png", proofSize: 10, createdAt: new Date() }]);
    const res = await GET(get("", TOKEN));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pending).toHaveLength(1);
  });

  it("returns the proof bytes inline for an authorized reviewer", async () => {
    getProof.mockResolvedValue({ mime: "image/png", bytes: Buffer.from([0x89, 0x50, 0x4e, 0x47]) });
    const res = await GET(get("?email=dana@example.com&proof=1", TOKEN));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("404 when the proof was already purged / not found", async () => {
    getProof.mockResolvedValue(null);
    expect((await GET(get("?email=dana@example.com&proof=1", TOKEN))).status).toBe(404);
  });
});
