import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * סדר-הפעולות ב-route *הוא* חלק מעיצוב הבטיחות, ולכן הוא מקובע כאן בבדיקה ולא
 * רק במיקום הקוד. בקשה שמפעילה את שער-הבטיחות חייבת לחזור לפני שנגעה בשום
 * תשתית: לא זמינות, לא סכימת-מכסה, לא מכסה, לא אחזור ולא ספק מודל.
 *
 * `resolveAvailability` היא פונקציה פנימית ואינה מיוצאת, ולכן היא נבדקת דרך
 * שלוש התלויות היחידות שלה — `isCompassFeatureEnabled`, `getCompassDb`,
 * `getCompassProvider`. אם אף אחת מהן לא נקראה, היא לא רצה.
 *
 * `checkRateLimit` *כן* רץ לפני השער, וזה מכוון: הוא מגן על השרת, פועל על
 * כתובת IP בלבד ואינו נוגע בתוכן השאלה.
 */

// `vi.mock` מורם לראש הקובץ, ולכן הכפילים חייבים להיווצר ב-`vi.hoisted`.
const m = vi.hoisted(() => ({
  isCompassFeatureEnabled: vi.fn(() => true),
  getCompassDb: vi.fn(() => ({})),
  getCompassProvider: vi.fn(() => ({ model: "test", generate: vi.fn() })),
  searchCompass: vi.fn(),
  getActiveVersion: vi.fn(),
  askCompass: vi.fn(),
  ensureQuotaSchema: vi.fn(),
  consumeQuota: vi.fn(),
  refundQuota: vi.fn(),
  peekQuota: vi.fn(),
}));
const {
  isCompassFeatureEnabled, getCompassDb, getCompassProvider, searchCompass,
  getActiveVersion, askCompass, ensureQuotaSchema, consumeQuota, refundQuota, peekQuota,
} = m;

vi.mock("@/lib/compass/assistant/db", () => ({ getCompassDb: m.getCompassDb }));
vi.mock("@/lib/compass/assistant/provider", () => ({ getCompassProvider: m.getCompassProvider }));
vi.mock("@/lib/compass/search", () => ({ searchCompass: m.searchCompass, getActiveVersion: m.getActiveVersion }));
vi.mock("@/lib/compass/assistant/assistant", () => ({ askCompass: m.askCompass }));
vi.mock("@/lib/compass/assistant/quota", () => ({
  ensureQuotaSchema: m.ensureQuotaSchema,
  consumeQuota: m.consumeQuota,
  refundQuota: m.refundQuota,
  peekQuota: m.peekQuota,
}));
vi.mock("@/lib/compass/assistant/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/compass/assistant/config")>()),
  isCompassFeatureEnabled: m.isCompassFeatureEnabled,
}));

import { POST } from "@/app/api/compass/route";

const DANGER = "הוא מאיים עליי עם סכין";
const BENIGN = "איך יודעים אם זו התאמה אמיתית";

function post(question: string, ip = "203.0.113.7"): Request {
  return new Request("http://localhost/api/compass", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      // ה-rate limit נשמר לפי IP; IP ייחודי לכל בדיקה כדי שלא ידלוף ביניהן.
      "x-forwarded-for": ip,
    },
    body: JSON.stringify({ question }),
  });
}

/** כל התשתית שאסור שתיגע בבקשת-בטיחות. */
const INFRASTRUCTURE: Array<[string, ReturnType<typeof vi.fn>]> = [
  ["isCompassFeatureEnabled (resolveAvailability)", isCompassFeatureEnabled],
  ["getCompassDb (resolveAvailability)", getCompassDb],
  ["getCompassProvider (resolveAvailability)", getCompassProvider],
  ["ensureQuotaSchema", ensureQuotaSchema],
  ["consumeQuota", consumeQuota],
  ["refundQuota", refundQuota],
  ["peekQuota", peekQuota],
  ["getActiveVersion", getActiveVersion],
  ["searchCompass", searchCompass],
  ["askCompass (provider/model generation)", askCompass],
];

beforeEach(() => {
  vi.clearAllMocks();
  isCompassFeatureEnabled.mockReturnValue(true);
});

describe("POST /api/compass, safety gate ordering", () => {
  it("returns safety without touching availability, quota, retrieval or the model", async () => {
    const res = await POST(post(DANGER, "203.0.113.10"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("safety");

    for (const [label, spy] of INFRASTRUCTURE) {
      expect(spy, `${label} must not run for a safety request`).not.toHaveBeenCalled();
    }
  });

  it("wins over 'unavailable' even when Compass is switched off", async () => {
    // העוזר כבוי לגמרי — נתיב רגיל היה מחזיר {available:false,status:"unavailable"}.
    isCompassFeatureEnabled.mockReturnValue(false);

    const res = await POST(post(DANGER, "203.0.113.11"));
    const body = await res.json();

    expect(body.status).toBe("safety");
    expect(body.status).not.toBe("unavailable");
    expect(body.available).toBe(true);
    for (const [label, spy] of INFRASTRUCTURE) {
      expect(spy, `${label} must not run when the feature is off either`).not.toHaveBeenCalled();
    }
  });

  it("emits no citation, no focus, no quota and no subject cookie", async () => {
    const res = await POST(post(DANGER, "203.0.113.12"));
    const body = await res.json();

    expect(body.citation).toBeUndefined();
    expect(body.focus).toBeUndefined();
    expect(body.remaining).toBeUndefined();
    // בקשת-בטיחות חוזרת לפני `readSubject`, ולכן אינה יוצרת ואינה משדרת מזהה.
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("a benign question DOES reach the infrastructure (the gate is not a wall)", async () => {
    askCompass.mockResolvedValue({ answer: { status: "unavailable", reason: "no-provider" } });
    getActiveVersion.mockResolvedValue("medaytim-laahava-888-final");
    consumeQuota.mockResolvedValue({ allowed: true, remaining: 2 });
    refundQuota.mockResolvedValue({ remaining: 3 });

    await POST(post(BENIGN, "203.0.113.13"));

    expect(isCompassFeatureEnabled).toHaveBeenCalled();
    expect(getCompassDb).toHaveBeenCalled();
    expect(ensureQuotaSchema).toHaveBeenCalled();
  });
});
