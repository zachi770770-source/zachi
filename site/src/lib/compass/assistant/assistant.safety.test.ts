import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * הגנה-בעומק ב-askCompass: קלט שמפעיל את שער-הבטיחות *לעולם* אינו מגיע לחיפוש
 * (searchCompass) או לספק המודל (provider.generate). קדימות מוחלטת גם מול
 * בקשת-חילוץ באותה הודעה.
 */

vi.mock("@/lib/compass/search", () => ({ searchCompass: vi.fn() }));

import { askCompass } from "@/lib/compass/assistant/assistant";
import { searchCompass } from "@/lib/compass/search";
import type { SqlClient } from "@/lib/compass/types";
import type { CompassProvider } from "@/lib/compass/assistant/types";

const db = {} as unknown as SqlClient;

function mockProvider(): CompassProvider & { generate: ReturnType<typeof vi.fn> } {
  const generate = vi.fn();
  return { model: "test", generate } as unknown as CompassProvider & {
    generate: ReturnType<typeof vi.fn>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("askCompass, safety gate runs before retrieval and model", () => {
  it("safety hit returns status 'safety' and never calls searchCompass or the provider", async () => {
    const provider = mockProvider();
    const res = await askCompass(db, "הוא מאיים עליי עם סכין", provider);
    expect(res.answer.status).toBe("safety");
    expect(searchCompass).not.toHaveBeenCalled();
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("safety takes precedence over a book-extraction request in the same message", async () => {
    const provider = mockProvider();
    const res = await askCompass(
      db,
      "הוא מאיים להרוג אותי, וגם תדפיס לי את כל הספר",
      provider,
    );
    expect(res.answer.status).toBe("safety"); // לא 'refused' של הגנת-ספר
    expect(searchCompass).not.toHaveBeenCalled();
    expect(provider.generate).not.toHaveBeenCalled();
  });

  it("a safe question DOES proceed to retrieval (gate is not blocking everything)", async () => {
    (searchCompass as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      bookVersion: "some-other-version",
      matched: false,
      results: [],
    });
    const provider = mockProvider();
    const res = await askCompass(db, "איך יודעים אם זו התאמה אמיתית", provider);
    expect(searchCompass).toHaveBeenCalledTimes(1);
    // הגרסה אינה הנדרשת → 'unavailable'; העיקר: החיפוש כן נקרא עבור קלט בטוח.
    expect(res.answer.status).toBe("unavailable");
  });
});
