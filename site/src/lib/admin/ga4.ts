import { createSign } from "node:crypto";

/**
 * מתאם GA4 Data API — מקור-האמת ל-KPIs של תעבורה/מעורבות/קליקים-לאמזון, שאינם
 * נשמרים במסד של האתר (trackEvent שולח ל-GA4/GTM בלבד). המתאם *אמיתי*: אימות
 * service-account (JWT RS256 → OAuth token) וקריאת `runReport`. הוא פעיל רק כאשר
 * הוגדרו הסודות המתאימים; אחרת המתאם אינו זמין וה-Dashboard מציג מצב „GA4 לא
 * מחובר” במקום להמציא מספר.
 *
 * הגדרה (שרת-בלבד): GA4_PROPERTY_ID, GA4_CLIENT_EMAIL, GA4_PRIVATE_KEY.
 * הערה תפעולית: הנתיב החי מאומת רק בסביבה עם הרשאות GA4 ורשת ל-Google; הלוגיקה
 * הטהורה (gate + מיפוי-תשובה) מכוסה בבדיקות.
 */

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export type Ga4Config = {
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

export function readGa4Config(): Ga4Config | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  const clientEmail = process.env.GA4_CLIENT_EMAIL;
  const rawKey = process.env.GA4_PRIVATE_KEY;
  if (!propertyId || !clientEmail || !rawKey) return null;
  // מפתחות ב-env נשמרים לרוב עם \n ממולט — מנרמלים לשורות אמיתיות.
  const privateKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey;
  return { propertyId, clientEmail, privateKey };
}

export function isGa4Configured(): boolean {
  return readGa4Config() !== null;
}

function base64url(input: Buffer | string): string {
  return (Buffer.isBuffer(input) ? input : Buffer.from(input)).toString("base64url");
}

/** בונה את ה-claims של ה-JWT ל-service-account (טהור — נבדק ביחידה). */
export function buildJwtClaims(
  cfg: Pick<Ga4Config, "clientEmail">,
  now = Math.floor(Date.now() / 1000),
): Record<string, string | number> {
  return {
    iss: cfg.clientEmail,
    scope: SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };
}

function signJwt(cfg: Ga4Config): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify(buildJwtClaims(cfg)));
  const signingInput = `${header}.${payload}`;
  const signature = createSign("RSA-SHA256").update(signingInput).end().sign(cfg.privateKey);
  return `${signingInput}.${base64url(signature)}`;
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(cfg: Ga4Config): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp > now + 60) return cachedToken.token;
  const assertion = signJwt(cfg);
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) throw new Error(`ga4 token ${res.status}`);
  const json = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) throw new Error("ga4 token missing");
  cachedToken = { token: json.access_token, exp: now + (json.expires_in ?? 3600) };
  return json.access_token;
}

export type Ga4ReportRequest = {
  dateRanges: { startDate: string; endDate: string }[];
  metrics: { name: string }[];
  dimensions?: { name: string }[];
  /** מסנן-ממד סטנדרטי של GA4 (למשל eventName = amazon_purchase_clicked). */
  dimensionFilter?: unknown;
  limit?: number;
  orderBys?: unknown[];
};

/** מסנן שוויון פשוט על ממד — לנוחות בונים את reports. */
export function eqFilter(dimension: string, value: string): unknown {
  return { filter: { fieldName: dimension, stringFilter: { matchType: "EXACT", value } } };
}

export type Ga4Row = { dimensions: string[]; metrics: number[] };
export type Ga4ReportResult = {
  rows: Ga4Row[];
  metricHeaders: string[];
  dimensionHeaders: string[];
};

/** ממפה תשובת runReport גולמית למבנה טיפוסי (טהור — נבדק ביחידה). */
export function mapRunReport(json: unknown): Ga4ReportResult {
  const j = (json ?? {}) as Record<string, unknown>;
  const dimensionHeaders = (Array.isArray(j.dimensionHeaders) ? j.dimensionHeaders : []).map(
    (h) => String((h as Record<string, unknown>).name ?? ""),
  );
  const metricHeaders = (Array.isArray(j.metricHeaders) ? j.metricHeaders : []).map(
    (h) => String((h as Record<string, unknown>).name ?? ""),
  );
  const rows = (Array.isArray(j.rows) ? j.rows : []).map((r) => {
    const rr = r as Record<string, unknown>;
    const dims = (Array.isArray(rr.dimensionValues) ? rr.dimensionValues : []).map((d) =>
      String((d as Record<string, unknown>).value ?? ""),
    );
    const mets = (Array.isArray(rr.metricValues) ? rr.metricValues : []).map((m) => {
      const v = Number((m as Record<string, unknown>).value);
      return Number.isFinite(v) ? v : 0;
    });
    return { dimensions: dims, metrics: mets };
  });
  return { rows, metricHeaders, dimensionHeaders };
}

/** מריץ runReport מול הנכס המוגדר. זורק בכשל — הקורא ממפה ל-error state. */
export async function runReport(req: Ga4ReportRequest): Promise<Ga4ReportResult> {
  const cfg = readGa4Config();
  if (!cfg) throw new Error("ga4 not configured");
  const token = await getAccessToken(cfg);
  const res = await fetch(`${DATA_API}/properties/${cfg.propertyId}:runReport`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`ga4 runReport ${res.status}`);
  return mapRunReport(await res.json());
}

/** לאיפוס מטמון-הטוקן בבדיקות. */
export function __resetGa4TokenCache(): void {
  cachedToken = null;
}
