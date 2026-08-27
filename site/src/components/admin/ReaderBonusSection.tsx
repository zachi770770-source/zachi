import { KpiCard } from "@/components/admin/primitives";
import { ga4EventValue } from "@/lib/admin/select";
import { ok, empty, unsupported, type Kpi, type MetricValue } from "@/lib/admin/types";
import type { Ga4Block, Ga4Events, FirstPartyBlock } from "@/lib/admin/dashboard";
import type { ReaderClaimStats } from "@/lib/reader/types";

function fp(reader: FirstPartyBlock<ReaderClaimStats>, pick: (s: ReaderClaimStats) => number): MetricValue {
  if (reader.status === "unavailable") return unsupported("מסד הנתונים אינו מחובר");
  return ok(pick(reader.current), pick(reader.previous));
}

function approvalRate(reader: FirstPartyBlock<ReaderClaimStats>): MetricValue {
  if (reader.status === "unavailable") return unsupported("מסד הנתונים אינו מחובר");
  const decided = reader.current.approved + reader.current.rejected;
  if (decided <= 0) return empty;
  return ok((reader.current.approved / decided) * 100);
}

/**
 * Reader Bonus — מקור-האמת לסטטוסים (claims/pending/approved/rejected) הוא ה-DB
 * (first-party). צפיות/התחלות-טופס וכניסות-לערכה נאספות ב-GA4 (client). כל KPI
 * מסומן במקורו. מציג ספירות בלבד — ללא אימיילים/הוכחות (drill-down תפעולי נעשה
 * בנתיב הבדיקה המוגן /api/reader/review, לא כאן).
 */
export function ReaderBonusSection({
  reader,
  events,
}: {
  reader: FirstPartyBlock<ReaderClaimStats>;
  events: Ga4Block<Ga4Events>;
}) {
  const kpis: Kpi[] = [
    { id: "rb-view", label: "צפיות בעמוד הבונוס", definition: "reader_bonus_view — כמה נכנסו לעמוד /reader (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(events, "reader_bonus_view") },
    { id: "rb-start", label: "התחלות טופס", definition: "reader_bonus_claim_started — כמה התחילו למלא את טופס ההפעלה (אירועים).", unit: "events", source: "ga4", value: ga4EventValue(events, "reader_bonus_claim_started") },
    { id: "rb-submitted", label: "הפעלות שהוגשו", definition: "claims שנוצרו בטווח (לפי created_at) — מקור: DB.", unit: "count", source: "first_party", value: fp(reader, (s) => s.total) },
    { id: "rb-pending", label: "ממתינות לבדיקה", definition: "claims במצב pending — מקור: DB.", unit: "count", source: "first_party", value: fp(reader, (s) => s.pending) },
    { id: "rb-approved", label: "אושרו", definition: "claims במצב approved — מקור: DB.", unit: "count", source: "first_party", value: fp(reader, (s) => s.approved) },
    { id: "rb-rejected", label: "נדחו", definition: "claims במצב rejected — מקור: DB.", unit: "count", source: "first_party", value: fp(reader, (s) => s.rejected) },
    { id: "rb-approval-rate", label: "שיעור אישור", definition: "approved ÷ (approved + rejected) × 100 — מתוך ההכרעות בטווח. מקור: DB.", unit: "percent", source: "first_party", value: approvalRate(reader) },
    { id: "rb-eligible", label: "זכאים לערכה (אסימון חי)", definition: "מאושרים עם אסימון-גישה שלא פג — מקור: DB.", unit: "count", source: "first_party", value: fp(reader, (s) => s.approvedWithAccess) },
    { id: "rb-kit-access", label: "כניסות ל-Reader Kit", definition: "reader_kit_accessed — כניסות בפועל לערכה (אירועים). מקור: GA4.", unit: "events", source: "ga4", value: ga4EventValue(events, "reader_kit_accessed") },
    { id: "rb-resource", label: "פתיחות משאב בערכה", definition: "reader_resource_opened — פתיחת כלי מתוך הערכה (אירועים). מקור: GA4.", unit: "events", source: "ga4", value: ga4EventValue(events, "reader_resource_opened") },
  ];

  const trend =
    reader.status === "ok" && reader.current.byDay.length > 0 ? reader.current.byDay : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>
      {trend ? <ReaderTrend byDay={trend} /> : null}
    </div>
  );
}

function ReaderTrend({ byDay }: { byDay: { day: string; submitted: number }[] }) {
  const max = Math.max(1, ...byDay.map((d) => d.submitted));
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="mb-3 text-[12px] font-semibold text-foreground">הפעלות שהוגשו לפי יום (DB)</p>
      <div className="flex items-end gap-1.5" style={{ height: 80 }}>
        {byDay.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${d.submitted}`}>
            <div className="w-full rounded-t bg-secondary/60" style={{ height: `${(d.submitted / max) * 64 + 2}px` }} />
            <span className="text-[9px] text-foreground-muted">{d.day.slice(5)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
