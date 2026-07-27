import type {
  WaitlistAddInput,
  WaitlistAddResult,
  WaitlistRepository,
} from "@/lib/waitlist/types";

/**
 * מימוש בזיכרון — לבדיקות בלבד. מופעל אך ורק כאשר
 * `WAITLIST_ALLOW_MEMORY=true` (נעשה בסביבת הבדיקות), ולעולם לא בפרודקשן.
 */
export class InMemoryWaitlistRepository implements WaitlistRepository {
  readonly records = new Map<string, WaitlistAddInput & { status: string }>();

  async add(input: WaitlistAddInput): Promise<WaitlistAddResult> {
    const created = !this.records.has(input.emailNormalized);
    this.records.set(input.emailNormalized, { ...input, status: "active" });
    return { created };
  }

  async unsubscribe(emailNormalized: string): Promise<void> {
    const rec = this.records.get(emailNormalized);
    if (rec) rec.status = "unsubscribed";
  }
}
