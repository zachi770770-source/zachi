/**
 * טווחי-זמן ל-Dashboard. כל טווח מחזיר [from, to) נוכחי + טווח-השוואה קודם באותו
 * אורך, כדי לאפשר „מול התקופה הקודמת”. הכל ב-UTC כדי להיות עקבי עם timestamptz.
 */

export type RangeKey = "today" | "7d" | "30d" | "custom";

export type DateRange = { from: Date; to: Date };
export type ResolvedRange = {
  key: RangeKey;
  current: DateRange;
  previous: DateRange;
  label: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function resolveRange(
  key: string | undefined,
  opts: { from?: string; to?: string; now?: Date } = {},
): ResolvedRange {
  const now = opts.now ?? new Date();
  const to = now;

  if (key === "custom" && opts.from && opts.to) {
    const from = new Date(opts.from);
    const cto = new Date(opts.to);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(cto.getTime()) && from < cto) {
      const span = cto.getTime() - from.getTime();
      return {
        key: "custom",
        current: { from, to: cto },
        previous: { from: new Date(from.getTime() - span), to: from },
        label: "טווח מותאם",
      };
    }
  }

  if (key === "today") {
    const from = startOfUtcDay(now);
    return {
      key: "today",
      current: { from, to },
      previous: { from: new Date(from.getTime() - DAY_MS), to: from },
      label: "היום",
    };
  }

  const days = key === "30d" ? 30 : 7;
  const from = new Date(to.getTime() - days * DAY_MS);
  return {
    key: days === 30 ? "30d" : "7d",
    current: { from, to },
    previous: { from: new Date(from.getTime() - days * DAY_MS), to: from },
    label: days === 30 ? "30 ימים" : "7 ימים",
  };
}

/** רשימת ימי-UTC בטווח (לגרף-מגמה), כולל קצוות. */
export function daysInRange(range: DateRange): string[] {
  const out: string[] = [];
  let d = startOfUtcDay(range.from);
  const end = startOfUtcDay(new Date(range.to.getTime()));
  while (d <= end) {
    out.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + DAY_MS);
  }
  return out;
}
