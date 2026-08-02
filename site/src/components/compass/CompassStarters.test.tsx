import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { stations, stationOrder } from "@/content/stations";
import { CONVERSION_CTA_LABEL } from "@/components/waitlist/WaitlistCta";

/**
 * שאלות פתיחה (PHASE 15) + פעולת ההמרה האחידה (PHASE 16): שלוש שאלות ההתלבטות
 * האמיתיות מפעילות את אותה זרימת שאילתה, ופעולת ההמרה „קבלו טעימה ועדכון…”
 * מופיעה רק אחרי תשובה מוצלחת אמיתית — לא לפני, ולא בשגיאה. הרשת מדומה במלואה.
 */

// WaitlistCta משתמש ב-useRouter של next/navigation — ממקים אותו בסביבת הבדיקה.
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

type FetchImpl = (url: string, init?: RequestInit) => unknown;

function mockFetch(impl: FetchImpl) {
  const fn = vi.fn((url: string, init?: RequestInit) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(impl(url, init)),
    });
  });
  // @ts-expect-error - מדמים את fetch הגלובלי בסביבת הבדיקה
  global.fetch = fn;
  return fn;
}

const STARTERS = stationOrder.map((id) => stations[id].question);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  pushMock.mockReset();
});

beforeEach(() => {
  // ברירת מחדל: GET „זמין” עם 3 שאלות; POST מחזיר תשובה מוצלחת.
  mockFetch((_url, init) => {
    if (!init || init.method === "GET") {
      return { available: true, remaining: 3 };
    }
    return { available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 };
  });
});

async function renderReadyConsole() {
  render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
  await screen.findByLabelText("השאלה שלכם");
}

/** פעולת ההמרה (הכפתור שנפתח לטופס). לפני פתיחתו אין שדה אימייל. */
function conversionCta() {
  return screen.queryByRole("button", { name: CONVERSION_CTA_LABEL });
}

describe("CompassConsole — starters + unified conversion CTA", () => {
  it("renders the three real station questions as starters before any answer", async () => {
    await renderReadyConsole();
    for (const q of STARTERS) {
      expect(screen.getByRole("button", { name: q })).toBeInTheDocument();
    }
  });

  it("does not show the conversion CTA before an answer exists", async () => {
    await renderReadyConsole();
    expect(conversionCta()).toBeNull();
  });

  it("runs the full query flow on a starter click and reveals the conversion CTA only after success", async () => {
    const fn = await (async () => {
      const f = mockFetch((_url, init) => {
        if (!init || init.method === "GET") {
          return { available: true, remaining: 3 };
        }
        return { available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 };
      });
      render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
      await screen.findByLabelText("השאלה שלכם");
      return f;
    })();

    fireEvent.click(screen.getByRole("button", { name: STARTERS[0] }));

    // התשובה מופיעה...
    await screen.findByText("בנו על יסודות.");
    // ...וה-POST נשלח עם שאלת התחנה בדיוק.
    const postCalls = fn.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toHaveLength(1);
    const body = JSON.parse(String(postCalls[0][1]?.body ?? "{}"));
    expect(body.question).toBe(STARTERS[0]);

    // פעולת ההמרה מופיעה רק עכשיו (אחרי תשובה מוצלחת).
    expect(conversionCta()).toBeInTheDocument();
  });

  it("hides the starters once an answer is shown", async () => {
    await renderReadyConsole();
    fireEvent.click(screen.getByRole("button", { name: STARTERS[0] }));
    await screen.findByText("בנו על יסודות.");
    for (const q of STARTERS) {
      expect(screen.queryByRole("button", { name: q })).toBeNull();
    }
  });

  it("shows no conversion CTA when the starter-triggered request fails", async () => {
    const fn = vi.fn((url: string, init?: RequestInit) => {
      if (!init || init.method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ available: true, remaining: 3 }) });
      }
      return Promise.reject(new Error("network"));
    });
    // @ts-expect-error - מדמים fetch
    global.fetch = fn;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
    await screen.findByLabelText("השאלה שלכם");
    fireEvent.click(screen.getByRole("button", { name: STARTERS[0] }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("אירעה תקלה זמנית. נסו שוב בעוד רגע.");
    expect(conversionCta()).toBeNull();
  });
});
