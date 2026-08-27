import { ok, unsupported, empty, type MetricValue } from "@/lib/admin/types";

/**
 * Amazon CTR — שיעור-המעבר לאמזון. אינו „מכירה”: זהו יחס בין *קליקי-כוונה*
 * יוצאים (event `amazon_purchase_clicked`) לבין בסיס-התנועה.
 *
 * המכנה המקצועי: **sessions** בטווח (לא page-views, לא clicks). כלומר:
 *   Amazon CTR = amazon_purchase_clicked ÷ sessions × 100
 * מוצג לצד המכנה כדי שהחישוב יהיה חד-משמעי. (מכנה משני אפשרי — unique users —
 * מוצג בנפרד כ„CTR למשתמש”.)
 */
export const AMAZON_CTR_FORMULA = "Amazon CTR = amazon_purchase_clicked ÷ sessions × 100";

/** מחזיר MetricValue של CTR באחוזים, או empty כשאין בסיס. */
export function ctr(clicks: number, sessions: number, previous: number | null = null): MetricValue {
  if (sessions <= 0) return empty;
  return ok((clicks / sessions) * 100, previous);
}

/** קליקי-אמזון אינם מכירות — עוזר-תיוג לשמירה על שפה נכונה בכל מקום. */
export const AMAZON_CLICKS_NOTE =
  "קליקי-כוונה יוצאים לאמזון — לא מכירות. אין באתר נתוני רכישה/הכנסה בפועל.";

export { ok, unsupported, empty };
