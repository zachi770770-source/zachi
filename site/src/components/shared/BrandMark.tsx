import { cn } from "@/lib/utils";

/**
 * סמל המותג: טבעת משני חצאים — חצי החיפוש (פתוח, ניטרלי) וחצי הבנייה
 * (טרקוטה). משמש בהדר, בפוטר ובמפרידים העריכתיים בין הסקשנים.
 */
export function BrandMark({
  className,
  withRing = false,
}: {
  className?: string;
  withRing?: boolean;
}) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={cn(className)}>
      {withRing ? (
        <circle cx="20" cy="20" r="18" fill="var(--color-brand-muted)" />
      ) : null}
      <g fill="none" strokeWidth="3.4" strokeLinecap="round">
        <path d="M22 9 A 11 11 0 0 0 22 31" stroke="currentColor" />
        <path d="M18 9 A 11 11 0 0 1 18 31" stroke="var(--color-brand)" />
      </g>
      <circle cx="22" cy="9" r="1.7" fill="currentColor" />
      <circle cx="18" cy="31" r="1.7" fill="var(--color-brand)" />
    </svg>
  );
}
