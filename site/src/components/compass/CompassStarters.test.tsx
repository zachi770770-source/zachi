import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { stations, stationOrder } from "@/content/stations";

/**
 * בדיקות לשאלות הפתיחה (PHASE 15): שלוש שאלות ההתלבטות האמיתיות של התחנות
 * מציעות התחלה למי שלא בטוח מה לשאול, מפעילות בדיוק את אותה זרימת שאילתה,
 * וה-CTA לטעימה מופיע רק אחרי תשובה מוצלחת — לא לפני. הרשת מדומה במלואה.
 */

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
const SAMPLE_LABEL = "לקריאת טעימה מהספר";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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

describe("CompassConsole — starter questions", () => {
  it("renders the three real station questions as starters before any answer", async () => {
    await renderReadyConsole();
    for (const q of STARTERS) {
      expect(screen.getByRole("button", { name: q })).toBeInTheDocument();
    }
  });

  it("does not show the sample CTA before an answer exists", async () => {
    await renderReadyConsole();
    expect(screen.queryByRole("link", { name: SAMPLE_LABEL })).toBeNull();
  });

  it("runs the full query flow when a starter is clicked and reveals the sample CTA only after success", async () => {
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

    // ה-CTA לטעימה מופיע רק עכשיו (אחרי תשובה מוצלחת).
    expect(screen.getByRole("link", { name: SAMPLE_LABEL })).toBeInTheDocument();
  });

  it("hides the starters once an answer is shown", async () => {
    await renderReadyConsole();
    fireEvent.click(screen.getByRole("button", { name: STARTERS[0] }));
    await screen.findByText("בנו על יסודות.");
    for (const q of STARTERS) {
      expect(screen.queryByRole("button", { name: q })).toBeNull();
    }
  });

  it("shows no sample CTA when the starter-triggered request fails", async () => {
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
    expect(screen.queryByRole("link", { name: SAMPLE_LABEL })).toBeNull();
  });
});
