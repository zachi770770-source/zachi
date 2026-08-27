import { describe, it, expect, beforeEach, vi } from "vitest";

const findApprovedByAccessTokenHash = vi.fn();
const getReaderClaimRepository = vi.fn();

vi.mock("@/lib/reader", () => ({
  getReaderClaimRepository: () => getReaderClaimRepository(),
}));

import { GET } from "@/app/api/reader/enter/route";
import { generateAccessToken } from "@/lib/reader/token";

let ip = 0;
function get(token: string | null) {
  ip += 1;
  const url = token === null
    ? "http://localhost/api/reader/enter"
    : `http://localhost/api/reader/enter?token=${token}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Request(url, { headers: { host: "localhost", "x-forwarded-for": `10.50.0.${ip}` } }) as any;
}

beforeEach(() => {
  findApprovedByAccessTokenHash.mockReset();
  getReaderClaimRepository.mockReset().mockReturnValue({ findApprovedByAccessTokenHash });
});

describe("GET /api/reader/enter (token → HttpOnly cookie exchange)", () => {
  it("valid approved token → sets an HttpOnly cookie and redirects to a clean /reader/kit", async () => {
    findApprovedByAccessTokenHash.mockResolvedValue({ emailNormalized: "dana@example.com" });
    const token = generateAccessToken();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await GET(get(token));
    expect([302, 307, 308]).toContain(res.status);
    expect(res.headers.get("location")).toMatch(/\/reader\/kit$/);
    const cookie = res.cookies.get("reader_session");
    expect(cookie?.value).toBe(token);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
  });

  it("malformed token → redirect to /reader#activate, no cookie (anti-enumeration)", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await GET(get("garbage"));
    expect(res.headers.get("location")).toMatch(/\/reader#activate$/);
    expect(res.cookies.get("reader_session")).toBeFalsy();
    expect(findApprovedByAccessTokenHash).not.toHaveBeenCalled();
  });

  it("well-formed but unknown/expired token → same redirect, no cookie", async () => {
    findApprovedByAccessTokenHash.mockResolvedValue(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await GET(get(generateAccessToken()));
    expect(res.headers.get("location")).toMatch(/\/reader#activate$/);
    expect(res.cookies.get("reader_session")).toBeFalsy();
  });
});
