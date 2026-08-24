import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * חוזה מצב-השיחה ב-route: `mode:"conversation"` מעביר את ההקשר ל-askCompass,
 * מחזיר שאלת-המשך כשקיימת, מסמן `done` בתור האחרון, ומאמת את גבולות ההקשר.
 * ה-DB/הספק/askCompass מדומים — אין צורך בסודות אמיתיים.
 */

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

let ipCounter = 0;
function post(body: unknown): Request {
  ipCounter += 1;
  return new Request("http://localhost/api/compass", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${ipCounter}` },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  m.isCompassFeatureEnabled.mockReturnValue(true);
  m.getActiveVersion.mockResolvedValue("medaytim-laahava-888-final");
  m.consumeQuota.mockResolvedValue({ allowed: true, remaining: 8 });
  m.refundQuota.mockResolvedValue({ remaining: 9 });
});

describe("POST /api/compass — מצב שיחה", () => {
  it("מעביר conversation ל-askCompass ומחזיר את שאלת-ההמשך", async () => {
    m.askCompass.mockResolvedValue({
      answer: {
        status: "answered",
        text: "ארבע שעות לבד לא אומרות את זה.",
        citation: "מבוסס על פרק 4: בחירה מפוכחת",
        followup: "יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?",
      },
    });

    const res = await POST(
      post({ mode: "conversation", station: "dating", question: "היא לא ענתה ארבע שעות", context: [] }),
    );
    const body = await res.json();

    expect(body.status).toBe("answered");
    expect(body.followup).toBe("יש עוד משהו שגרם לכם להרגיש שהיא התרחקה?");
    expect(body.done).toBe(false);

    // askCompass נקרא עם אופציות-שיחה (ארגומנט רביעי).
    const call = m.askCompass.mock.calls[0];
    expect(call[3]).toMatchObject({ conversation: { isFinalTurn: false } });
  });

  it("מסמן done ומדלג על שאלת-המשך בתור האחרון (2 תורות-משתמש קודמים)", async () => {
    m.askCompass.mockResolvedValue({
      answer: { status: "answered", text: "סגירה קצרה מהספר.", citation: "מבוסס על פרק 4" },
    });

    const res = await POST(
      post({
        mode: "conversation",
        station: "dating",
        question: "אז מה עכשיו",
        context: [
          { role: "user", text: "היא לא ענתה ארבע שעות" },
          { role: "assistant", text: "ארבע שעות לא אומרות ריחוק." },
          { role: "user", text: "כן, גם ביטלה פעמיים" },
          { role: "assistant", text: "דפוס אומר יותר מרגע בודד." },
        ],
      }),
    );
    const body = await res.json();

    expect(body.status).toBe("answered");
    expect(body.done).toBe(true);
    expect(body.followup).toBeUndefined();
    expect(m.askCompass.mock.calls[0][3]).toMatchObject({ conversation: { isFinalTurn: true } });
  });

  it("דוחה הקשר ארוך מדי (מעבר לגבול תורות השיחה)", async () => {
    const tooLong = Array.from({ length: 6 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      text: `הודעה ${i}`,
    }));
    const res = await POST(post({ mode: "conversation", question: "עוד", context: tooLong }));
    expect(res.status).toBe(400);
    expect(m.askCompass).not.toHaveBeenCalled();
  });

  it("דוחה תפקיד לא חוקי בהקשר", async () => {
    const res = await POST(
      post({ mode: "conversation", question: "עוד", context: [{ role: "system", text: "x" }] }),
    );
    expect(res.status).toBe(400);
    expect(m.askCompass).not.toHaveBeenCalled();
  });

  it("שאלה בודדת (ללא mode) אינה מעבירה אופציות-שיחה", async () => {
    m.askCompass.mockResolvedValue({
      answer: { status: "answered", text: "כיוון קצר.", citation: "מבוסס על פרק 4" },
    });
    await POST(post({ question: "איך יודעים אם זו התאמה" }));
    expect(m.askCompass.mock.calls[0][3]).toEqual({});
  });
});
