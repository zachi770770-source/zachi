import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Container } from "@/components/shared/Container";
import {
  ADMIN_COOKIE,
  isAdminConfigured,
  verifySessionToken,
} from "@/lib/admin/auth";
import { resolveRange } from "@/lib/admin/range";
import { loadDashboard } from "@/lib/admin/dashboard";
import { ok, unsupported, type Kpi, type MetricValue } from "@/lib/admin/types";
import { ctr, AMAZON_CTR_FORMULA, AMAZON_CLICKS_NOTE } from "@/lib/admin/metrics";
import { ga4EventValue, ga4RateValue } from "@/lib/admin/select";
import { AdminLogin, AdminLogout, RangePicker } from "@/components/admin/AdminControls";
import { Section, KpiCard, Ga4Notice } from "@/components/admin/primitives";
import { FunnelView, type Stage } from "@/components/admin/FunnelView";
import { SegmentTable, PagesTable } from "@/components/admin/SegmentTable";
import { ReaderBonusSection } from "@/components/admin/ReaderBonusSection";

// עמוד ניהולי מוגן — תמיד דינמי, לעולם לא נאינדקס.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "לוח בקרה | מדייטים לאהבה",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  // ── שער אימות ─────────────────────────────────────────────────────
  if (!isAdminConfigured()) {
    return (
      <Container className="py-20">
        <div className="mx-auto max-w-md rounded-3xl border border-border bg-surface p-8 text-center">
          <h1 className="font-serif text-[1.4rem] font-bold text-foreground">לוח הבקרה אינו זמין</h1>
          <p className="mt-2 text-[14px] text-foreground-muted [text-wrap:pretty]">
            יש להגדיר <code>READER_ADMIN_TOKEN</code> בסביבת השרת כדי להפעיל את
            הכניסה הניהולית.
          </p>
        </div>
      </Container>
    );
  }

  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return (
      <Container className="py-20">
        <AdminLogin />
      </Container>
    );
  }

  // ── טווח + טעינת נתונים ────────────────────────────────────────────
  const sp = await searchParams;
  const range = resolveRange(sp.range, { from: sp.from, to: sp.to });
  const data = await loadDashboard(range);

  // עוזרי-מיפוי GA4 overview → MetricValue
  const ov = data.overview;

  const overviewMetric = (
    pick: (d: {
      sessions: number; users: number; engagedSessions: number;
      prevSessions: number; prevUsers: number; prevEngagedSessions: number;
    }) => [number, number],
  ): MetricValue => {
    if (ov.status === "unconfigured") return unsupported("GA4 לא מחובר");
    if (ov.status === "error") return unsupported("שגיאת GA4");
    const [cur, prev] = pick(ov.data);
    return ok(cur, prev);
  };

  const amazonCtr = (): MetricValue => {
    if (ov.status !== "ok") return unsupported("GA4 לא מחובר");
    if (data.events.status !== "ok") return unsupported("GA4 לא מחובר");
    const clicks = data.events.data["amazon_purchase_clicked"]?.count ?? 0;
    return ctr(clicks, ov.data.sessions);
  };

  const readerVal = (pick: (s: { total: number; approved: number }) => number, prevPick?: (s: { total: number; approved: number }) => number): MetricValue => {
    if (data.reader.status === "unavailable") return unsupported("מסד הנתונים אינו מחובר");
    return ok(pick(data.reader.current), prevPick ? prevPick(data.reader.previous) : null);
  };

  // ── Top KPIs ───────────────────────────────────────────────────────
  const topKpis: Kpi[] = [
    { id: "visitors", label: "מבקרים (Users)", definition: "totalUsers — משתמשים ייחודיים. לא sessions ולא events.", unit: "users", source: "ga4", value: overviewMetric((d) => [d.users, d.prevUsers]) },
    { id: "engaged", label: "מבקרים מעורבים", definition: "engagedSessions — sessions עם מעורבות (10ש+ / אירוע-המרה / 2 עמודים+).", unit: "sessions", source: "ga4", value: overviewMetric((d) => [d.engagedSessions, d.prevEngagedSessions]) },
    { id: "compass-comp", label: "השלמות מצפן", definition: "ask_result — הגעה לתוצאה במצפן המודרך (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "ask_result") },
    { id: "preview-eng", label: "מעורבות בטעימה", definition: "preview_reached_end — קוראים שסיימו את הטעימה (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "preview_reached_end") },
    { id: "amazon-clicks", label: "קליקי Amazon", definition: "amazon_purchase_clicked — קליקי-כוונה יוצאים. לא מכירות.", unit: "events", source: "ga4", value: ga4EventValue(data.events, "amazon_purchase_clicked") },
    { id: "amazon-ctr", label: "Amazon CTR", definition: AMAZON_CTR_FORMULA, unit: "percent", source: "ga4", value: amazonCtr() },
    { id: "rb-claims", label: "הפעלות Reader Bonus", definition: "claims שהוגשו בטווח — מקור: DB.", unit: "count", source: "first_party", value: readerVal((s) => s.total, (s) => s.total) },
    { id: "rb-approved", label: "רוכשים מאושרים", definition: "claims שאושרו בטווח — מקור: DB.", unit: "count", source: "first_party", value: readerVal((s) => s.approved, (s) => s.approved) },
    { id: "rb-kit", label: "שימוש ב-Reader Kit", definition: "reader_kit_accessed — כניסות לערכה (אירועים). מקור: GA4.", unit: "events", source: "ga4", value: ga4EventValue(data.events, "reader_kit_accessed") },
  ];

  // ── Funnel stages ──────────────────────────────────────────────────
  const stages: Stage[] = [
    { label: "Traffic", unit: "sessions", source: "ga4", hint: "sessions בטווח", value: overviewMetric((d) => [d.sessions, d.prevSessions]) },
    { label: "Engagement", unit: "sessions", source: "ga4", hint: "engaged sessions", value: overviewMetric((d) => [d.engagedSessions, d.prevEngagedSessions]) },
    { label: "Intent", unit: "events", source: "ga4", hint: "preview_opened — פתחו טעימה", value: ga4EventValue(data.events, "preview_opened") },
    { label: "Amazon", unit: "events", source: "ga4", hint: "amazon_purchase_clicked", value: ga4EventValue(data.events, "amazon_purchase_clicked") },
    { label: "Reader activation", unit: "count", source: "first_party", hint: "claims שהוגשו (DB)", value: readerVal((s) => s.total, (s) => s.total) },
  ];

  // ── Compass / Preview KPIs ─────────────────────────────────────────
  const compassKpis: Kpi[] = [
    { id: "cmp-start", label: "התחלות", definition: "ask_open — פתיחת המצפן המודרך (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "ask_open") },
    { id: "cmp-comp", label: "השלמות", definition: "ask_result — הגעה לתוצאה (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "ask_result") },
    { id: "cmp-rate", label: "שיעור השלמה", definition: "ask_result ÷ ask_open × 100.", unit: "percent", source: "ga4", value: ga4RateValue(data.events, "ask_result", "ask_open") },
  ];
  const previewKpis: Kpi[] = [
    { id: "pv-open", label: "פתיחות טעימה", definition: "preview_opened — פתחו את הטעימה (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "preview_opened") },
    { id: "pv-end", label: "קוראים מעורבים", definition: "preview_reached_end — סיימו את הטעימה (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(data.events, "preview_reached_end") },
    { id: "pv-rate", label: "שיעור מעורבות", definition: "preview_reached_end ÷ preview_opened × 100.", unit: "percent", source: "ga4", value: ga4RateValue(data.events, "preview_reached_end", "preview_opened") },
  ];
  const amazonKpis: Kpi[] = [
    { id: "az-total", label: "סה\"כ קליקי Amazon", definition: "amazon_purchase_clicked (אירועים). קליקי-כוונה — לא מכירות.", unit: "events", source: "ga4", value: ga4EventValue(data.events, "amazon_purchase_clicked") },
    { id: "az-users", label: "משתמשים ייחודיים שלחצו", definition: "משתמשים ייחודיים עם אירוע amazon_purchase_clicked.", unit: "users", source: "ga4", value: ga4EventValue(data.events, "amazon_purchase_clicked", "users") },
    { id: "az-ctr", label: "Amazon CTR", definition: AMAZON_CTR_FORMULA, unit: "percent", source: "ga4", value: amazonCtr() },
  ];

  return (
    <Container className="py-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="kicker">לוח בקרה</span>
          <h1 className="mt-1 font-serif text-[1.7rem] font-bold text-foreground">מה קורה באתר</h1>
          <p className="text-[13px] text-foreground-muted">טווח: {range.label} · הספר נמכר ב-Amazon — אין באתר נתוני רכישה/הכנסה.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AdminLogout />
          <RangePicker current={range.key} />
        </div>
      </header>

      <div className="flex flex-col gap-10">
        <Section title="מדדים מרכזיים" id="kpis">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            {topKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}
          </div>
          <p className="mt-2 text-[11.5px] text-foreground-muted [text-wrap:pretty]">{AMAZON_CLICKS_NOTE} {AMAZON_CTR_FORMULA}.</p>
        </Section>

        <Section title="המסע הכולל" question="Traffic → Engagement → Intent → Amazon → Reader activation" id="funnel">
          <FunnelView stages={stages} />
        </Section>

        <Section title="מקורות תנועה (Acquisition)" question="איזה מקור מביא מבקרים איכותיים — לא רק הרבה מבקרים?" id="acquisition">
          <SegmentTable block={data.acquisition} keyHeader="ערוץ" />
        </Section>

        <Section title="עמודים" question="אילו עמודים מתחילים מסע ומובילים לאמזון?" id="pages">
          <PagesTable block={data.pages} />
        </Section>

        <Section title="מצפן (Compass)" question="האם המצפן באמת מקרב אנשים לספר?" id="compass">
          {data.events.status === "ok" ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{compassKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}</div>
              <p className="mt-2 text-[11.5px] text-foreground-muted [text-wrap:pretty]">מעבר-לאמזון וטעימה *לאחר* המצפן, ו-drop-off ברמת-המשתמש, נמדדים ב-GA4 Exploration (רצף-אירועים) ולא כמספר בודד כאן.</p>
            </>
          ) : (
            <Ga4Notice kind={data.events.status === "error" ? "error" : "unconfigured"} />
          )}
        </Section>

        <Section title="טעימה (Preview)" question="האם מי שקורא מהספר נוטה יותר לעבור ל-Amazon?" id="preview">
          {data.events.status === "ok" ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{previewKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}</div>
              <p className="mt-2 text-[11.5px] text-foreground-muted [text-wrap:pretty]">קליקי-אמזון מתוך הטעימה — ראו את שורת <code>/preview</code> בטבלת „עמודים”.</p>
            </>
          ) : (
            <Ga4Notice kind={data.events.status === "error" ? "error" : "unconfigured"} />
          )}
        </Section>

        <Section title="Amazon" question="שיעור המעבר לערוץ הרכישה — קליקי-כוונה, לא מכירות." id="amazon">
          {data.events.status === "ok" ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{amazonKpis.map((k) => <KpiCard key={k.id} kpi={k} />)}</div>
          ) : (
            <Ga4Notice kind={data.events.status === "error" ? "error" : "unconfigured"} />
          )}
          <div className="mt-3"><p className="mb-2 text-[12px] font-semibold text-foreground">לפי מכשיר</p><SegmentTable block={data.device} keyHeader="מכשיר" /></div>
          <p className="mt-2 text-[11.5px] text-foreground-muted [text-wrap:pretty]">פילוח לפי page / source / device מבוסס ממדים סטנדרטיים של GA4. פילוח לפי cta_location / book_format / campaign דורש רישום custom dimensions ב-GA4.</p>
        </Section>

        <Section title="Reader Bonus" question="כמה רוכשים חזרו, אושרו, ומשתמשים בערכה?" id="reader-bonus">
          <ReaderBonusSection reader={data.reader} events={data.events} />
        </Section>
      </div>
    </Container>
  );
}
