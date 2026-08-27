import { getReaderClaimRepository } from "@/lib/reader";
import { getWaitlistRepository } from "@/lib/waitlist";
import type { ReaderClaimStats } from "@/lib/reader/types";
import type { WaitlistStats } from "@/lib/waitlist/types";
import type { ResolvedRange } from "@/lib/admin/range";
import {
  isGa4Configured,
  runReport,
  eqFilter,
  type Ga4ReportResult,
} from "@/lib/admin/ga4";

/**
 * טוען את כל נתוני ה-Dashboard לטווח נתון. עיקרון-על: *נתונים אמיתיים בלבד*.
 *  - מקורות first-party (Postgres): Reader Bonus + הרשמות ניוזלטר → נתון אמיתי,
 *    או מצב „לא מחובר” כשאין DATABASE_URL.
 *  - GA4 (תעבורה/מעורבות/קליקי-אמזון/עמודים/מקורות/מכשיר): נתון אמיתי כשה-GA4
 *    Data API מוגדר, אחרת כל סעיף מציג „GA4 לא מחובר”. לעולם לא מספר מומצא.
 */

const g4date = (d: Date) => d.toISOString().slice(0, 10);

export type FirstPartyBlock<T> =
  | { status: "ok"; current: T; previous: T }
  | { status: "unavailable" }; // אין אחסון מתמשך (DATABASE_URL) מחובר

export type Ga4Block<T> =
  | { status: "ok"; data: T }
  | { status: "unconfigured" } // GA4 Data API לא הוגדר
  | { status: "error" }; // הוגדר אך הקריאה נכשלה

export type Ga4Overview = {
  sessions: number;
  users: number;
  engagedSessions: number;
  prevSessions: number;
  prevUsers: number;
  prevEngagedSessions: number;
};

/** מפת אירוע→{count,users} מתוך report של eventName. */
export type Ga4Events = Record<string, { count: number; users: number }>;

export type Ga4SegmentRow = { key: string; sessions: number; amazonClicks: number };
export type Ga4PageRow = { path: string; views: number; users: number; amazonClicks: number };

export type DashboardData = {
  reader: FirstPartyBlock<ReaderClaimStats>;
  newsletter: FirstPartyBlock<WaitlistStats>;
  ga4Configured: boolean;
  overview: Ga4Block<Ga4Overview>;
  events: Ga4Block<Ga4Events>;
  acquisition: Ga4Block<Ga4SegmentRow[]>;
  pages: Ga4Block<Ga4PageRow[]>;
  device: Ga4Block<Ga4SegmentRow[]>;
};

const AMAZON_EVENT = "amazon_purchase_clicked";

async function loadReader(range: ResolvedRange): Promise<FirstPartyBlock<ReaderClaimStats>> {
  const repo = getReaderClaimRepository();
  if (!repo) return { status: "unavailable" };
  const [current, previous] = await Promise.all([
    repo.stats(range.current),
    repo.stats(range.previous),
  ]);
  return { status: "ok", current, previous };
}

async function loadNewsletter(range: ResolvedRange): Promise<FirstPartyBlock<WaitlistStats>> {
  const repo = getWaitlistRepository();
  if (!repo) return { status: "unavailable" };
  const [current, previous] = await Promise.all([
    repo.signupStats(range.current),
    repo.signupStats(range.previous),
  ]);
  return { status: "ok", current, previous };
}

/** עוטף קריאת GA4 יחידה למצב טיפוסי (unconfigured/error/ok). */
async function ga4<T>(load: () => Promise<T>): Promise<Ga4Block<T>> {
  if (!isGa4Configured()) return { status: "unconfigured" };
  try {
    return { status: "ok", data: await load() };
  } catch {
    return { status: "error" };
  }
}

/** אינדקס עמודה לפי כותרת-מטריקה (חוסן מול סדר). */
function metricIdx(res: Ga4ReportResult, name: string): number {
  return res.metricHeaders.indexOf(name);
}

export async function loadDashboard(range: ResolvedRange): Promise<DashboardData> {
  const cur = { startDate: g4date(range.current.from), endDate: g4date(range.current.to) };
  const prev = { startDate: g4date(range.previous.from), endDate: g4date(range.previous.to) };

  const overview = ga4<Ga4Overview>(async () => {
    const res = await runReport({
      dateRanges: [cur, prev],
      metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "engagedSessions" }],
      dimensions: [{ name: "dateRange" }],
    });
    const pick = (rangeName: string, metric: string) => {
      const mi = metricIdx(res, metric);
      const row = res.rows.find((r) => r.dimensions[0] === rangeName);
      return row && mi >= 0 ? row.metrics[mi] : 0;
    };
    return {
      sessions: pick("date_range_0", "sessions"),
      users: pick("date_range_0", "totalUsers"),
      engagedSessions: pick("date_range_0", "engagedSessions"),
      prevSessions: pick("date_range_1", "sessions"),
      prevUsers: pick("date_range_1", "totalUsers"),
      prevEngagedSessions: pick("date_range_1", "engagedSessions"),
    };
  });

  const events = ga4<Ga4Events>(async () => {
    const res = await runReport({
      dateRanges: [cur],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      limit: 250,
    });
    const ci = metricIdx(res, "eventCount");
    const ui = metricIdx(res, "totalUsers");
    const out: Ga4Events = {};
    for (const row of res.rows) {
      out[row.dimensions[0]] = {
        count: ci >= 0 ? row.metrics[ci] : 0,
        users: ui >= 0 ? row.metrics[ui] : 0,
      };
    }
    return out;
  });

  const segment = (dimension: string) =>
    ga4<Ga4SegmentRow[]>(async () => {
      const [sess, clicks] = await Promise.all([
        runReport({
          dateRanges: [cur],
          dimensions: [{ name: dimension }],
          metrics: [{ name: "sessions" }],
          limit: 25,
          orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        }),
        runReport({
          dateRanges: [cur],
          dimensions: [{ name: dimension }],
          metrics: [{ name: "eventCount" }],
          dimensionFilter: eqFilter("eventName", AMAZON_EVENT),
          limit: 50,
        }),
      ]);
      const si = metricIdx(sess, "sessions");
      const ci = metricIdx(clicks, "eventCount");
      const clickMap = new Map<string, number>();
      for (const r of clicks.rows) clickMap.set(r.dimensions[0], ci >= 0 ? r.metrics[ci] : 0);
      return sess.rows.map((r) => ({
        key: r.dimensions[0] || "(not set)",
        sessions: si >= 0 ? r.metrics[si] : 0,
        amazonClicks: clickMap.get(r.dimensions[0]) ?? 0,
      }));
    });

  const pages = ga4<Ga4PageRow[]>(async () => {
    const [views, clicks] = await Promise.all([
      runReport({
        dateRanges: [cur],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }],
        limit: 25,
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      }),
      runReport({
        dateRanges: [cur],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "eventCount" }],
        dimensionFilter: eqFilter("eventName", AMAZON_EVENT),
        limit: 100,
      }),
    ]);
    const vi = metricIdx(views, "screenPageViews");
    const ui = metricIdx(views, "totalUsers");
    const ci = metricIdx(clicks, "eventCount");
    const clickMap = new Map<string, number>();
    for (const r of clicks.rows) clickMap.set(r.dimensions[0], ci >= 0 ? r.metrics[ci] : 0);
    return views.rows.map((r) => ({
      path: r.dimensions[0] || "(not set)",
      views: vi >= 0 ? r.metrics[vi] : 0,
      users: ui >= 0 ? r.metrics[ui] : 0,
      amazonClicks: clickMap.get(r.dimensions[0]) ?? 0,
    }));
  });

  const [readerB, newsletterB, overviewB, eventsB, acquisitionB, pagesB, deviceB] =
    await Promise.all([
      loadReader(range),
      loadNewsletter(range),
      overview,
      events,
      segment("sessionDefaultChannelGroup"),
      pages,
      segment("deviceCategory"),
    ]);

  return {
    reader: readerB,
    newsletter: newsletterB,
    ga4Configured: isGa4Configured(),
    overview: overviewB,
    events: eventsB,
    acquisition: acquisitionB,
    pages: pagesB,
    device: deviceB,
  };
}
