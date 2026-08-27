import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  readGa4Config,
  isGa4Configured,
  buildJwtClaims,
  mapRunReport,
} from "@/lib/admin/ga4";

const ORIGINAL = { ...process.env };
beforeEach(() => {
  delete process.env.GA4_PROPERTY_ID;
  delete process.env.GA4_CLIENT_EMAIL;
  delete process.env.GA4_PRIVATE_KEY;
});
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("GA4 config gate", () => {
  it("is unconfigured unless all three secrets are present", () => {
    expect(isGa4Configured()).toBe(false);
    process.env.GA4_PROPERTY_ID = "123";
    process.env.GA4_CLIENT_EMAIL = "sa@example.iam.gserviceaccount.com";
    expect(isGa4Configured()).toBe(false);
    process.env.GA4_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n";
    expect(isGa4Configured()).toBe(true);
  });

  it("normalizes escaped newlines in the private key", () => {
    process.env.GA4_PROPERTY_ID = "123";
    process.env.GA4_CLIENT_EMAIL = "sa@example.iam.gserviceaccount.com";
    process.env.GA4_PRIVATE_KEY = "line1\\nline2";
    expect(readGa4Config()?.privateKey).toBe("line1\nline2");
  });
});

describe("buildJwtClaims", () => {
  it("builds the service-account assertion claims (readonly scope, 1h expiry)", () => {
    const claims = buildJwtClaims({ clientEmail: "sa@x.iam.gserviceaccount.com" }, 1000);
    expect(claims.iss).toBe("sa@x.iam.gserviceaccount.com");
    expect(claims.aud).toBe("https://oauth2.googleapis.com/token");
    expect(claims.scope).toContain("analytics.readonly");
    expect(claims.iat).toBe(1000);
    expect(claims.exp).toBe(1000 + 3600);
  });
});

describe("mapRunReport", () => {
  it("shapes a runReport response into typed rows", () => {
    const json = {
      dimensionHeaders: [{ name: "eventName" }],
      metricHeaders: [{ name: "eventCount" }, { name: "totalUsers" }],
      rows: [
        { dimensionValues: [{ value: "amazon_purchase_clicked" }], metricValues: [{ value: "42" }, { value: "30" }] },
        { dimensionValues: [{ value: "preview_opened" }], metricValues: [{ value: "100" }, { value: "80" }] },
      ],
    };
    const res = mapRunReport(json);
    expect(res.dimensionHeaders).toEqual(["eventName"]);
    expect(res.metricHeaders).toEqual(["eventCount", "totalUsers"]);
    expect(res.rows[0]).toEqual({ dimensions: ["amazon_purchase_clicked"], metrics: [42, 30] });
    expect(res.rows[1].metrics).toEqual([100, 80]);
  });

  it("is robust to empty/missing fields (no throw, no NaN)", () => {
    expect(mapRunReport({})).toEqual({ rows: [], metricHeaders: [], dimensionHeaders: [] });
    const res = mapRunReport({ rows: [{ metricValues: [{ value: "x" }] }] });
    expect(res.rows[0].metrics).toEqual([0]); // non-numeric → 0
  });
});
