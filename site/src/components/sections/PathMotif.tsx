import { cn } from "@/lib/utils";

/**
 * מוטיב חזותי דקורטיבי (PHASE 14): „מנקודות למבנה” — חיפוש → בנייה.
 *
 * צד ה„חיפוש”: נקודות מפוזרות וקווים מקווקווים מתפצלים, שנמוגים.
 * צד ה„בנייה”: קו רציף ויציב שנמשך דרך חמש תחנות (nodes) — מבנה משותף.
 *
 * הכל CSS-first (ראו globals.css): ברירת המחדל היא המבנה הבנוי והגלוי, כדי
 * שלא ייעלם דבר ללא JS/הידרציה או תחת prefers-reduced-motion. הרכיב הוא שרת
 * טהור, ללא JS צד־לקוח, ומסומן aria-hidden כי הוא דקורטיבי בלבד.
 *
 * tone="ink" (ברירת מחדל) — על רקע בהיר. tone="light" — על באנד כהה (מרווה),
 * קו ונקודות פיזור בהירים, צמתים בטרקוטה שבולטים על הירוק.
 */
export function PathMotif({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  const light = tone === "light";
  const scatterColor = light
    ? "var(--color-secondary-foreground)"
    : "var(--color-border-strong)";
  const lineColor = light
    ? "var(--color-secondary-foreground)"
    : "var(--color-foreground-muted)";
  const nodeColor = light ? "var(--color-brand-muted)" : "var(--color-brand)";
  const nodeCore = "var(--color-brand)";

  return (
    <svg
      viewBox="0 0 320 118"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("art-motif w-full", className)}
    >
      {/* חיפוש: נקודות מפוזרות וקווים מתפצלים — נמוגים בכניסה לתצוגה */}
      <g
        className="motif-scatter"
        stroke={scatterColor}
        strokeWidth="1.25"
        strokeLinecap="round"
        style={{ opacity: light ? 0.55 : 1 }}
      >
        <path d="M40 34 L78 24" strokeDasharray="3 6" />
        <path d="M40 34 L72 52" strokeDasharray="3 6" />
        <path d="M214 86 L252 76" strokeDasharray="3 6" />
        <path d="M214 86 L248 100" strokeDasharray="3 6" />
        <g fill={scatterColor} stroke="none">
          <circle cx="40" cy="34" r="2.6" />
          <circle cx="88" cy="16" r="2.6" />
          <circle cx="138" cy="36" r="2.6" />
          <circle cx="100" cy="90" r="2.6" />
          <circle cx="168" cy="100" r="2.6" />
          <circle cx="214" cy="86" r="2.6" />
          <circle cx="272" cy="26" r="2.6" />
        </g>
      </g>

      {/* בנייה: קו רציף דרך חמש תחנות — מבנה יציב ומשותף */}
      <g className="motif-structure">
        <path
          className="motif-line"
          d="M300 74 L240 54 L182 66 L124 44 L66 58 L20 42"
          pathLength={1}
          fill="none"
          stroke={lineColor}
          strokeOpacity={light ? 0.9 : 1}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g>
          {[
            [300, 74],
            [240, 54],
            [182, 66],
            [124, 44],
            [66, 58],
            [20, 42],
          ].map(([cx, cy], i) => (
            <g key={i}>
              {/* טבעת רכה סביב הצומת — נפח ומיקוד */}
              <circle cx={cx} cy={cy} r="7.5" fill={nodeColor} opacity={light ? 0.28 : 0.16} />
              <circle cx={cx} cy={cy} r="4.2" fill={nodeCore} />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
