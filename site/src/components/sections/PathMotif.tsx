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
 */
export function PathMotif({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 104"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={cn("art-motif w-full", className)}
    >
      {/* חיפוש: נקודות מפוזרות וקווים מתפצלים — נמוגים בכניסה לתצוגה */}
      <g
        className="motif-scatter"
        stroke="var(--color-border-strong)"
        strokeWidth="1.25"
        strokeLinecap="round"
      >
        <path d="M40 30 L74 22" strokeDasharray="3 5" />
        <path d="M40 30 L70 46" strokeDasharray="3 5" />
        <path d="M212 78 L246 70" strokeDasharray="3 5" />
        <path d="M212 78 L244 90" strokeDasharray="3 5" />
        <g fill="var(--color-border-strong)" stroke="none">
          <circle cx="40" cy="30" r="2.4" />
          <circle cx="86" cy="16" r="2.4" />
          <circle cx="132" cy="34" r="2.4" />
          <circle cx="98" cy="82" r="2.4" />
          <circle cx="162" cy="90" r="2.4" />
          <circle cx="212" cy="78" r="2.4" />
          <circle cx="266" cy="26" r="2.4" />
        </g>
      </g>

      {/* בנייה: קו רציף דרך חמש תחנות — מבנה יציב ומשותף */}
      <g className="motif-structure">
        <path
          className="motif-line"
          d="M300 66 L242 50 L184 60 L126 42 L68 54 L20 40"
          pathLength={1}
          fill="none"
          stroke="var(--color-foreground-muted)"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <g fill="var(--color-brand)">
          <circle cx="300" cy="66" r="3.4" />
          <circle cx="242" cy="50" r="3.4" />
          <circle cx="184" cy="60" r="3.4" />
          <circle cx="126" cy="42" r="3.4" />
          <circle cx="68" cy="54" r="3.4" />
          <circle cx="20" cy="40" r="3.4" />
        </g>
      </g>
    </svg>
  );
}
