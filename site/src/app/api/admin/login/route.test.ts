import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { POST } from "@/app/api/admin/login/route";
import { verifySessionToken } from "@/lib/admin/auth";

const ORIGINAL = { ...process.env };
const SECRET = "s3cret-admin-token";

let ip = 0;
function req(body: unknown, headers: Record<string, string> = {}) {
  ip += 1;
  return new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost",
      origin: "http://localhost",
      "x-forwarded-for": `10.60.0.${ip}`,
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
}

beforeEach(() => {
  process.env.READER_ADMIN_TOKEN = SECRET;
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("POST /api/admin/login", () => {
  it("503 when admin is not configured", async () => {
    delete process.env.READER_ADMIN_TOKEN;
    expect((await POST(req({ password: "x" }))).status).toBe(503);
  });

  it("sets a valid HttpOnly session cookie on the correct password", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await POST(req({ password: SECRET }));
    expect(res.status).toBe(200);
    const cookie = res.cookies.get("admin_session");
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(verifySessionToken(cookie?.value)).toBe(true);
  });

  it("401 on wrong password, no cookie", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await POST(req({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect(res.cookies.get("admin_session")).toBeFalsy();
  });

  it("415 on non-JSON, 403 on cross-site origin", async () => {
    expect((await POST(req("x", { "content-type": "text/plain" }))).status).toBe(415);
    expect((await POST(req({ password: SECRET }, { origin: "http://evil.example" }))).status).toBe(403);
  });

  it("rate-limits password guessing from one IP", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) {
      last = (await POST(req({ password: "nope" }, { "x-forwarded-for": "10.60.55.55" }))).status;
    }
    expect(last).toBe(429);
  });
});
