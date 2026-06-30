/**
 * LocalMemoryService — מימוש localStorage של memoryService.
 * משמש למשתמשי Guest.
 *
 * הוא לא משכפל את useAppStore — אלא משתמש בו ישירות,
 * כי הסטור כבר מנהל את ה-persistence.
 *
 * הקבצים שלוקחים מהסטור מועברים כפרמטר ל-buildCardFor כדי לא לסבול
 * תלות מעגלית בתוך services.
 */

import type { IMemoryService, UserMemory } from "./memoryService";
import type { CatchEntry, DiagnosisResult, ToolUsageEntry } from "@/types";
import type { MemoryCard } from "@/types/ai";

export class LocalMemoryService implements IMemoryService {
  constructor(private snapshot: () => UserMemory) {}

  async load(): Promise<UserMemory> {
    return this.snapshot();
  }

  async saveDiagnosis(_userId: string | null, _d: DiagnosisResult): Promise<void> {
    // no-op — useAppStore כבר שומר ב-localStorage
  }

  async saveToolUsage(_userId: string | null, _u: ToolUsageEntry): Promise<void> {
    // no-op — useAppStore כבר שומר ב-localStorage
  }

  async saveCatch(_userId: string | null, _c: CatchEntry): Promise<void> {
    // no-op — useAppStore כבר שומר ב-localStorage
  }

  async buildCardFor(): Promise<MemoryCard> {
    const m = this.snapshot();
    const latest = m.diagnoses[0];
    return {
      segment: m.segment,
      daysSinceDiagnosis: latest
        ? Math.floor(
            (Date.now() - new Date(latest.takenAt).getTime()) / (1000 * 60 * 60 * 24),
          )
        : undefined,
      dominantVoice: latest?.dominantVoice,
      recentPatterns: Array.from(
        new Set(m.catches.slice(0, 10).map((c) => c.voice)),
      ).slice(0, 3),
      practicedToolSlugs: Array.from(
        new Set(m.toolUsage.slice(0, 20).map((u) => u.toolSlug)),
      ).slice(0, 5),
      recentSummaries: [],
    };
  }

  async reset(): Promise<void> {
    // לא מבוצע כאן — קומפוננטת ה-UI קוראת ל-useAppStore.reset() ישירות.
  }
}
