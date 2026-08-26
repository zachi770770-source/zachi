import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const approve = vi.fn();
const reject = vi.fn();
const getReaderClaimRepository = vi.fn();

vi.mock("@/lib/reader", () => ({
  getReaderClaimRepository: () => getReaderClaimRepository(),
}));

vi.mock("@/lib/email/readerEmail", () => ({
  sendReaderKitAccessEmail: vi.fn().mockResolvedValue({ ok: true }),
}));

import { POST } from "@/app/api/reader/approve/route";
import { sendReaderKitAccessEmail } from "@/lib/email/readerEmail";

const mockEmail = vi.mocked(sendReaderKitAccessEmail);
const ORIGINAL = { ...process.env };

function req(body: Record<string, unknown>, bearer?: string) {
  const headers: Record<string, string> = { "content-type": "application/json", host: "localhost" };
  if (bearer !== undefined) headers.authorization = `Bearer ${bearer}`;
  return new Request("http://localhost/api/reader/approve", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

beforeEach(() => {
  approve.mockReset();
  reject.mockReset().mockResolvedValue(undefined);
  getReaderClaimRepository.mockReset().mockReturnValue({ approve, reject });
  mockEmail.mockReset().mockResolvedValue({ ok: true });
  process.env.READER_ADMIN_TOKEN = "s3cret-admin-token";
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("POST /api/reader/approve (admin, server-secret gated)", () => {
  it("returns 503 when the admin token is not configured", async () => {
    delete process.env.READER_ADMIN_TOKEN;
    const res = await POST(req({ email: "dana@example.com" }, "anything"));
    expect(res.status).toBe(503);
    expect(getReaderClaimRepository).not.toHaveBeenCalled();
  });

  it("rejects a missing bearer token with 401", async () => {
    const res = await POST(req({ email: "dana@example.com" }));
    expect(res.status).toBe(401);
    expect(approve).not.toHaveBeenCalled();
  });

  it("rejects a wrong bearer token with 401", async () => {
    const res = await POST(req({ email: "dana@example.com" }, "wrong-token"));
    expect(res.status).toBe(401);
    expect(approve).not.toHaveBeenCalled();
  });

  it("approves a real claim, mints a token, and returns the kit URL", async () => {
    approve.mockImplementation(async (_email: string, token: string) => ({
      emailNormalized: "dana@example.com",
      status: "approved",
      accessToken: token,
    }));
    const res = await POST(req({ email: "dana@example.com" }, "s3cret-admin-token"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.status).toBe("approved");
    expect(body.kitUrl).toMatch(/\/reader\/kit\?token=[0-9a-f]{32}$/);
    expect(mockEmail).toHaveBeenCalledTimes(1);
  });

  it("returns 404 when approving a non-existent claim (no phantom approval)", async () => {
    approve.mockResolvedValue(null);
    const res = await POST(req({ email: "ghost@example.com" }, "s3cret-admin-token"));
    expect(res.status).toBe(404);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  it("supports rejection without minting a token or emailing", async () => {
    const res = await POST(
      req({ email: "dana@example.com", action: "reject" }, "s3cret-admin-token"),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: "rejected" });
    expect(reject).toHaveBeenCalledTimes(1);
    expect(approve).not.toHaveBeenCalled();
    expect(mockEmail).not.toHaveBeenCalled();
  });
});
