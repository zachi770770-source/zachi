import { test, expect } from "./fixtures";

/**
 * הגנת אינדוקס מפני „הדף מפנה לכתובת אתר אחרת” (Page with redirect) ב-Search
 * Console. שלוש עובדות נעולות כאן:
 *
 *   1. כל כתובת ב-sitemap מחזירה 200 *ישירות* — אפס קפיצות הפניה. כתובת שנכנסת
 *      ל-sitemap ומפנה הלאה היא בדיוק מה שגוגל מדווח עליו כ„דף עם הפניה”.
 *   2. כל כתובת ב-sitemap היא self-canonical אל דומיין הפרודקשן (www).
 *   3. ההפניות המכוונות (כתובות ישנות ב-src/proxy.ts) נשארות 301 ליעד *חי*,
 *      והיעד עצמו מחזיר 200 — כלומר אין שרשרת ואין לולאה.
 *
 * נרמול לוכסן-סיום של Next (‎/book/ → 308 → /book) הוא התנהגות תקנית ורצויה,
 * ולכן נבדק כאן במפורש כקפיצה *אחת* אל הנתיב הקנוני — לא כתקלה.
 */

const PROD_ORIGIN = "https://www.zachi.co.il";

async function sitemapPaths(request: import("@playwright/test").APIRequestContext) {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  expect(paths.length).toBeGreaterThan(20); // שמירה מפני sitemap ריק/שבור
  return paths;
}

test("every sitemap URL returns 200 with zero redirect hops", async ({ request }) => {
  const paths = await sitemapPaths(request);
  const offenders: string[] = [];
  for (const path of paths) {
    const res = await request.get(path, { maxRedirects: 0 });
    if (res.status() !== 200) {
      offenders.push(`${path} -> ${res.status()} ${res.headers()["location"] ?? ""}`.trim());
    }
  }
  expect(offenders, "sitemap URLs must resolve directly, never via a redirect").toEqual([]);
});

test("every sitemap URL is self-canonical to the production host", async ({ request }) => {
  const paths = await sitemapPaths(request);
  const offenders: string[] = [];
  for (const path of paths) {
    const res = await request.get(path, { maxRedirects: 0 });
    const html = await res.text();
    const canonical = html.match(/<link[^>]+rel="canonical"[^>]+href="([^"]+)"/i)?.[1];
    const expected = path === "/" ? PROD_ORIGIN : `${PROD_ORIGIN}${path}`;
    if (canonical !== expected) offenders.push(`${path} -> canonical ${canonical ?? "MISSING"}`);
  }
  expect(offenders, "each sitemap URL must declare itself canonical on the www host").toEqual([]);
});

test("sitemap advertises the production host only", async ({ request }) => {
  const res = await request.get("/sitemap.xml");
  const xml = await res.text();
  const hosts = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).origin))];
  expect(hosts).toEqual([PROD_ORIGIN]);
  expect(xml).not.toContain("vercel.app");
  // אין לוכסן-סיום בכתובות ה-sitemap (הוא היה גורר 308 לפני ההגעה ליעד).
  const withSlash = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => new URL(m[1]).pathname)
    .filter((p) => p !== "/" && p.endsWith("/"));
  expect(withSlash).toEqual([]);
});

/** הכתובות הישנות שנשמרות ככוונה (src/proxy.ts) — 301 קבוע ליעד חי. */
const INTENTIONAL_REDIRECTS: Array<[string, string]> = [
  ["/about", "/author"],
  ["/articles", "/book"],
  ["/articles/stop-auditioning-dates", "/guide/finding-a-relationship"],
  ["/articles/why-attracted-unavailable", "/guide/attracted-to-unavailable"],
];

for (const [from, to] of INTENTIONAL_REDIRECTS) {
  test(`legacy ${from} keeps a single 301 to a live ${to}`, async ({ request }) => {
    const res = await request.get(from, { maxRedirects: 0 });
    expect(res.status(), `${from} must stay a permanent redirect`).toBe(301);
    expect(new URL(res.headers()["location"], "http://localhost").pathname).toBe(to);
    // היעד עצמו חייב להחזיר 200 — אחרת זו שרשרת או לולאה.
    const dest = await request.get(to, { maxRedirects: 0 });
    expect(dest.status(), `${to} must be a direct 200 (no chain)`).toBe(200);
  });
}

test("an unmapped legacy article URL stays 410 Gone, never a redirect", async ({ request }) => {
  const res = await request.get("/articles/no-such-old-post", { maxRedirects: 0 });
  expect(res.status()).toBe(410);
});

test("trailing-slash normalization is exactly one hop to the canonical path", async ({
  request,
}) => {
  for (const path of ["/book", "/faq", "/guide/finding-a-relationship"]) {
    const res = await request.get(`${path}/`, { maxRedirects: 0 });
    expect(res.status(), `${path}/ should normalize`).toBe(308);
    expect(new URL(res.headers()["location"], "http://localhost").pathname).toBe(path);
    const dest = await request.get(path, { maxRedirects: 0 });
    expect(dest.status(), `${path} must be the final 200`).toBe(200);
  }
});
