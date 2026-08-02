import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import {
  render,
  cleanup,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";

import { CompassConsole } from "@/components/compass/CompassConsole";

/**
 * בדיקות ממוקדות למצבי „המצפן” ולתנועה שנוספה: אינדיקציית טעינה יחידה,
 * רצף התשצה המבוקר (result-seq), מצב שגיאה, ומניעת שליחה כפולה — כל אלה
 * חלק ממעבר המיקרו-אנימציה. הרשת מדומה כדי לשלוט בכל מצב.
 */

// מצב התשובה המוצלחת מרנדר את WaitlistCta (useRouter) — ממקים את next/navigation.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  // ברירת מחדל: GET מחזיר „זמין” עם 3 שאלות, כדי שהטופס יוצג.
  mockFetch((_url, init) => {
    if (!init || init.method === "GET") {
      return { available: true, remaining: 3 };
    }
    return { available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 };
  });
});

async function renderReadyConsole() {
  render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
  // ממתינים שהטופס ייטען (GET הזמינות הסתיים).
  await screen.findByLabelText("השאלה שלכם");
}

describe("CompassConsole — motion states", () => {
  it("renders the ask form once availability resolves to ready", async () => {
    await renderReadyConsole();
    expect(screen.getByRole("button", { name: /קבלו כיוון מהספר/ })).toBeInTheDocument();
  });

  it("shows a single restrained loading indicator while submitting", async () => {
    // POST תלוי — נשאיר את התשובה פתוחה כדי לתפוס את מצב הטעינה.
    let resolvePost: (v: unknown) => void = () => {};
    const fn = vi.fn((url: string, init?: RequestInit) => {
      if (!init || init.method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ available: true, remaining: 3 }) });
      }
      return new Promise((resolve) => {
        resolvePost = (v) => resolve({ ok: true, json: () => Promise.resolve(v) });
      });
    });
    // @ts-expect-error - מדמים fetch
    global.fetch = fn;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
    const textarea = await screen.findByLabelText("השאלה שלכם");
    fireEvent.change(textarea, { target: { value: "איך יודעים שזו התאמה?" } });
    fireEvent.click(screen.getByRole("button", { name: /קבלו כיוון מהספר/ }));

    // מצב טעינה: role=status מופיע, ואייקון המצפן נושא את מחלקת התנועה.
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("מחפשים בין דפי הספר…");
    expect(status.querySelector(".compass-loading")).not.toBeNull();

    // סיום.
    resolvePost({ available: true, status: "answered", answer: "בנו על יסודות.", remaining: 2 });
    await screen.findByText("בנו על יסודות.");
  });

  it("renders the answer inside the controlled result sequence (result-seq)", async () => {
    await renderReadyConsole();
    const textarea = screen.getByLabelText("השאלה שלכם");
    fireEvent.change(textarea, { target: { value: "איך בונים אמון?" } });
    fireEvent.click(screen.getByRole("button", { name: /קבלו כיוון מהספר/ }));

    const answer = await screen.findByText("בנו על יסודות.");
    const article = answer.closest("article");
    expect(article).not.toBeNull();
    expect(article?.className).toContain("result-seq");
  });

  it("prevents a duplicate submission while a request is in flight", async () => {
    const fn = vi.fn((url: string, init?: RequestInit) => {
      if (!init || init.method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ available: true, remaining: 3 }) });
      }
      // POST תלוי — לא נפתר, כדי שהמצב יישאר „שולח”.
      return new Promise(() => {});
    });
    // @ts-expect-error - מדמים fetch
    global.fetch = fn;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
    const textarea = await screen.findByLabelText("השאלה שלכם");
    fireEvent.change(textarea, { target: { value: "שאלה אמיתית?" } });
    const button = screen.getByRole("button", { name: /קבלו כיוון מהספר/ });
    fireEvent.click(button);

    // אחרי הלחיצה: הכפתור מושבת והטקסטאריה מושבתת — אין שליחה כפולה.
    await waitFor(() => expect(screen.getByRole("button")).toBeDisabled());
    expect(textarea).toBeDisabled();

    // קליק נוסף לא מפעיל POST נוסף (רק GET הראשוני + POST אחד).
    fireEvent.click(screen.getByRole("button"));
    const postCalls = fn.mock.calls.filter(([, init]) => init?.method === "POST");
    expect(postCalls).toHaveLength(1);
  });

  it("shows an accessible error card when the request fails", async () => {
    const fn = vi.fn((url: string, init?: RequestInit) => {
      if (!init || init.method === "GET") {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ available: true, remaining: 3 }) });
      }
      return Promise.reject(new Error("network"));
    });
    // @ts-expect-error - מדמים fetch
    global.fetch = fn;

    render(<CompassConsole salesOpen={false} maxQuestionChars={300} />);
    const textarea = await screen.findByLabelText("השאלה שלכם");
    fireEvent.change(textarea, { target: { value: "שאלה שתיכשל" } });
    fireEvent.click(screen.getByRole("button", { name: /קבלו כיוון מהספר/ }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("אירעה תקלה זמנית. נסו שוב בעוד רגע.");
  });
});
