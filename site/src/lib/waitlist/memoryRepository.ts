import type {
  WaitlistAddInput,
  WaitlistRepository,
  WaitlistStats,
  WaitlistStatsRange,
} from "@/lib/waitlist/types";

/**
 * מימוש בזיכרון — לבדיקות בלבד. מופעל אך ורק כאשר
 * `WAITLIST_ALLOW_MEMORY=true` (נעשה בסביבת הבדיקות), ולעולם לא בפרודקשן.
 */
export class InMemoryWaitlistRepository implements WaitlistRepository {
  readonly records = new Map<string, WaitlistAddInput & { status: string; createdAt: Date }>();

  async add(input: WaitlistAddInput): Promise<void> {
    const existing = this.records.get(input.emailNormalized);
    this.records.set(input.emailNormalized, {
      ...input,
      status: "active",
      createdAt: existing?.createdAt ?? new Date(),
    });
  }

  async unsubscribe(emailNormalized: string): Promise<void> {
    const rec = this.records.get(emailNormalized);
    if (rec) rec.status = "unsubscribed";
  }

  async signupStats(range: WaitlistStatsRange): Promise<WaitlistStats> {
    const inRange = [...this.records.values()].filter(
      (r) => r.status === "active" && r.createdAt >= range.from && r.createdAt < range.to,
    );
    const byDayMap = new Map<string, number>();
    for (const r of inRange) {
      const day = r.createdAt.toISOString().slice(0, 10);
      byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
    }
    return {
      total: inRange.length,
      byDay: [...byDayMap.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day, count })),
    };
  }
}
