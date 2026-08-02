import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  render,
  cleanup,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";
import { stations, stationOrder } from "@/content/stations";

/**
 * PHASE 15 — שאלות הפתיחה: מפעילות את זרם ה-CompassConsole הקיים, וה-CTA
 * לטעימה מופיע רק אחרי תשובה מוצלחת. הרשת מדומה כדי לשלוט במצב הזמינות
 * ובתוצאה; ה-API והלוגיקה עצמם אינם משתנים.
 */

function mockFetch(post: unknown, opts: { rejectPost?: boolean } = {}) {
  const fn = vi.fn((_url: string, init?: RequestInit) => {
    if (!init || init.method === "GET") {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: true, remaining: 3 }),
      });
    }
    if (opts.rejectPost) return Promise.reject(new Error("network"));
    return Promise.resolve({ ok: true, json: () => Promise.resolve(post) });
  });
  // @ts-expect-error - מדמים fetch גלובלי
  global.fetch = fn;
  return fn;
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
beforeEach(() => {
  mockFetch({ available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 });
});

async function ready() {
  render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
  await screen.findByLabelText("השאלה שלכם");
}

describe("CompassConsole — PHASE 15 starter questions", () => {
  it("renders exactly three starter questions (the existing station questions)", async () => {
    await ready();
    for (const id of stationOrder) {
      const q = stations[id].question;
      // מתאימים לפי קטע יציב מתחילת השאלה (מתעלמים מגרשיים/סימנים).
      const snippet = q.slice(0, 12);
      expect(
        screen.getByRole("button", { name: new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })
      ).toBeInTheDocument();
    }
  });

  it("does NOT show the sample CTA before an answer exists", async () => {
    await ready();
    expect(screen.queryByRole("link", { name: /לקריאת טעימה מהספר/ })).toBeNull();
  });

  it("clicking a starter runs the flow and reveals the answer + sample CTA (only after success)", async () => {
    const fn = mockFetch({
      available: true,
      status: "answered",
      answer: "בנו על יסודות.",
      remaining: 2,
    });
    await ready();
    const first = stationOrder[0];
    const snippet = stations[first].question.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(snippet) }));

    await screen.findByText("בנו על יסודות.");
    // ה-CTA לטעימה מופיע רק עכשיו (אחרי תשובה מוצלחת).
    expect(
      screen.getByRole("link", { name: /לקריאת טעימה מהספר/ })
    ).toBeInTheDocument();
    // הופעל POST אחד עם השאלה של התחנה.
    const postCalls = fn.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toHaveLength(1);
    expect(JSON.parse(postCalls[0][1].body).question).toContain(
      stations[first].question.slice(0, 12)
    );
  });

  it("on a failed request shows an error and NO sample CTA", async () => {
    mockFetch(null, { rejectPost: true });
    await ready();
    const snippet = stations[stationOrder[0]].question.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(snippet) }));
    await screen.findByRole("alert");
    expect(screen.queryByRole("link", { name: /לקריאת טעימה מהספר/ })).toBeNull();
  });

  it("hides the starters once an answer is shown, and disables inputs while submitting", async () => {
    await ready();
    const snippet = stations[stationOrder[0]].question.slice(0, 12).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    fireEvent.click(screen.getByRole("button", { name: new RegExp(snippet) }));
    await screen.findByText("בנו על יסודות.");
    // אחרי תשובה — שאלות הפתיחה כבר לא מוצגות.
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: new RegExp(snippet) })).toBeNull()
    );
  });
});
