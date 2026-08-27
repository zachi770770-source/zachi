import { MetricValueView, SourceBadge } from "@/components/admin/primitives";
import type { MetricValue, MetricSource, MetricUnit } from "@/lib/admin/types";

export type Stage = {
  label: string;
  value: MetricValue;
  unit: MetricUnit;
  source: MetricSource;
  hint: string;
};

const PATHS = [
  "מבקר → הספר → Amazon",
  "מבקר → טעימה → Amazon",
  "מבקר → מצפן → טעימה/ספר → Amazon",
  "מבקר → ניוזלטר → חזרה מאוחרת",
  "רוכש Amazon → הפעלת Reader → אישור → Reader Kit",
];

/**
 * המסע הכולל: Traffic → Engagement → Intent → Amazon → Reader activation.
 * אלה *אגרגטים לפי שלב*, לא משפך-כפייה שכל משתמש עובר בו בסדר. מתחת — המסלולים
 * המזוהים; ספירת-מסלול מדויקת ברמת-המשתמש דורשת ניתוח-נתיבים ב-GA4 (Exploration),
 * ולכן אינה מוצגת כמספר כאן.
 */
export function FunnelView({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stages.map((s, i) => (
          <div key={s.label} className="relative flex flex-col gap-1.5 rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-brand-hover">
                {i + 1}. {s.label}
              </span>
              <SourceBadge source={s.source} />
            </div>
            <MetricValueView value={s.value} unit={s.unit} />
            <p className="text-[11px] leading-snug text-foreground-muted [text-wrap:pretty]">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <p className="text-[12px] font-semibold text-foreground">מסלולים מזוהים בתוך המסע</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {PATHS.map((p) => (
            <li key={p} className="flex items-center gap-2 text-[13px] text-foreground/90">
              <span aria-hidden className="text-brand">↳</span>
              <span dir="rtl">{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[11px] leading-snug text-foreground-muted [text-wrap:pretty]">
          שלבי-המסע הם אגרגטים — לא כל מבקר עובר את כל השלבים באותו סדר. ספירה
          מדויקת של כל מסלול ברמת-המשתמש נעשית ב-GA4 Exploration (Path/Funnel),
          ולא מוצגת כאן כמספר כדי לא להטעות.
        </p>
      </div>
    </div>
  );
}
