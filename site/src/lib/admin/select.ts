import { ok, empty, unsupported, type MetricValue } from "@/lib/admin/types";
import type { Ga4Block, Ga4Events } from "@/lib/admin/dashboard";

/** ערך-KPI מתוך מפת-אירועים של GA4 — או מצב לא-מחובר/שגיאה/ריק. */
export function ga4EventValue(
  block: Ga4Block<Ga4Events>,
  name: string,
  field: "count" | "users" = "count",
): MetricValue {
  if (block.status === "unconfigured") return unsupported("GA4 לא מחובר");
  if (block.status === "error") return unsupported("שגיאת GA4");
  const e = block.data[name];
  if (!e) return empty;
  return ok(e[field]);
}

/** שיעור (percent) בין שני אירועי-GA4 — completion rate וכו'. */
export function ga4RateValue(
  block: Ga4Block<Ga4Events>,
  numerator: string,
  denominator: string,
): MetricValue {
  if (block.status === "unconfigured") return unsupported("GA4 לא מחובר");
  if (block.status === "error") return unsupported("שגיאת GA4");
  const d = block.data[denominator]?.count ?? 0;
  const n = block.data[numerator]?.count ?? 0;
  if (d <= 0) return empty;
  return ok((n / d) * 100);
}
