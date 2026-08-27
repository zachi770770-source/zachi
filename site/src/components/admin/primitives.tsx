import * as React from "react";

import {
  SOURCE_LABEL,
  deltaPct,
  type Kpi,
  type MetricSource,
  type MetricUnit,
  type MetricValue,
} from "@/lib/admin/types";

const nf = new Intl.NumberFormat("he-IL");

export function fmtNumber(n: number): string {
  return nf.format(Math.round(n));
}
export function fmtPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

const UNIT_SUFFIX: Record<MetricUnit, string> = {
  users: "משתמשים",
  sessions: "sessions",
  events: "אירועים",
  count: "",
  percent: "",
};

/** תג-מקור: שקיפות מלאה מאיפה הגיע כל מספר. */
export function SourceBadge({ source }: { source: MetricSource }) {
  const isFirst = source === "first_party";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
        isFirst ? "bg-secondary/15 text-brand-hover" : "bg-foreground/8 text-foreground-muted"
      }`}
      title={SOURCE_LABEL[source]}
    >
      {isFirst ? "נתוני האתר" : "GA4"}
    </span>
  );
}

export function Section({
  title,
  question,
  children,
  id,
}: {
  title: string;
  question?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-20">
      <div className="mb-3 flex flex-col gap-0.5">
        <h2 id={id ? `${id}-h` : undefined} className="font-serif text-[1.35rem] font-bold text-foreground">
          {title}
        </h2>
        {question ? (
          <p className="text-[13px] text-foreground-muted [text-wrap:pretty]">{question}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

/** מציג ערך-מדד לפי הסטטוס: ok / empty / unsupported. אף פעם לא מספר מומצא. */
export function MetricValueView({ value, unit }: { value: MetricValue; unit: MetricUnit }) {
  if (value.status === "unsupported") {
    return (
      <span className="text-foreground-muted" title={value.reason}>
        <span className="text-[1.6rem] font-bold leading-none">—</span>
        <span className="mt-1 block text-[12px] leading-snug">{value.reason}</span>
      </span>
    );
  }
  if (value.status === "empty") {
    return (
      <span className="text-foreground-muted">
        <span className="text-[1.6rem] font-bold leading-none">—</span>
        <span className="mt-1 block text-[12px]">אין נתונים בטווח</span>
      </span>
    );
  }
  const d = deltaPct(value.value, value.previous);
  const shown = unit === "percent" ? fmtPercent(value.value) : fmtNumber(value.value);
  return (
    <span>
      <span className="text-[1.9rem] font-bold leading-none text-foreground">{shown}</span>
      {UNIT_SUFFIX[unit] ? (
        <span className="ms-1.5 text-[12px] font-medium text-foreground-muted">{UNIT_SUFFIX[unit]}</span>
      ) : null}
      {d != null ? (
        <span
          className={`mt-1 block text-[12px] font-semibold ${
            d >= 0 ? "text-brand-hover" : "text-[var(--color-brand)]"
          }`}
        >
          {d >= 0 ? "▲" : "▼"} {Math.abs(d).toFixed(1)}% מול התקופה הקודמת
        </span>
      ) : (
        <span className="mt-1 block text-[12px] text-foreground-muted">אין בסיס להשוואה</span>
      )}
    </span>
  );
}

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[13px] font-semibold text-foreground">{kpi.label}</span>
        <SourceBadge source={kpi.source} />
      </div>
      <MetricValueView value={kpi.value} unit={kpi.unit} />
      <p className="text-[11.5px] leading-snug text-foreground-muted [text-wrap:pretty]">
        {kpi.definition}
      </p>
    </div>
  );
}

/** מצב GA4 לא-מחובר / שגיאה — הסבר ברור במקום מספר. */
export function Ga4Notice({ kind }: { kind: "unconfigured" | "error" }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface-muted/40 p-5 text-[13px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
      {kind === "unconfigured" ? (
        <>
          <p className="font-semibold text-foreground">מקור הנתונים (GA4) אינו מחובר.</p>
          <p className="mt-1">
            מדדי התנועה, המעורבות, קליקי-האמזון, העמודים והמקורות נאספים ב-Google
            Analytics 4 (client-side). כדי להציגם כאן, יש לחבר את GA4 Data API:
            הגדירו <code className="text-foreground">GA4_PROPERTY_ID</code>,{" "}
            <code className="text-foreground">GA4_CLIENT_EMAIL</code> ו-
            <code className="text-foreground">GA4_PRIVATE_KEY</code> (service account עם
            הרשאת Viewer לנכס). עד אז — לא מוצג מספר מומצא.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold text-foreground">שגיאה בקריאת GA4.</p>
          <p className="mt-1">
            ה-GA4 Data API מוגדר אך הקריאה נכשלה (הרשאות/נכס/רשת). בדקו את הגדרת
            ה-service account. לא מוצג מספר מומצא.
          </p>
        </>
      )}
    </div>
  );
}
