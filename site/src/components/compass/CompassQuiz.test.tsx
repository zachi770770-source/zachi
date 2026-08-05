import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor, within } from "@testing-library/react";

import { CompassQuiz } from "@/components/compass/CompassQuiz";

const KEY = "mlc.compass.v1";

afterEach(() => {
  cleanup();
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
});

/** לוחץ על האפשרות ה-i בשאלה הנוכחית (0 = לפני קשר בכל שלוש השאלות). */
function pick(i: number) {
  const radios = screen.getAllByRole("radio");
  fireEvent.click(radios[i]);
}

describe("CompassQuiz — deterministic 3-question compass", () => {
  it("starts at question 1 of 3 with three closed radio options", () => {
    render(<CompassQuiz />);
    expect(screen.getByText("שאלה 1 מתוך 3")).toBeTruthy();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    // אין שדה טקסט חופשי
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("advances through the three questions and can go back keeping the answer", () => {
    render(<CompassQuiz />);
    pick(0); // Q1 → before-relationship
    expect(screen.getByText("שאלה 2 מתוך 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "לשאלה הקודמת" }));
    expect(screen.getByText("שאלה 1 מתוך 3")).toBeTruthy();
    // התשובה הקודמת נשמרה (הרדיו הראשון מסומן)
    expect(screen.getAllByRole("radio")[0]).toHaveAttribute("aria-checked", "true");
  });

  it("completing all three (before-relationship unanimous) shows the matching station, two factors, and the CTAs", () => {
    render(<CompassQuiz />);
    pick(0);
    pick(0);
    pick(0);

    const result = screen.getByRole("article");
    expect(within(result).getByRole("heading").textContent).toMatch(/לפני קשר/);
    // אזור התוצאה מכריז ב-aria-live
    expect(result.getAttribute("aria-live")).toBe("polite");
    // שני גורמים בדיוק
    expect(within(result).getByText("מה שהוביל לכאן")).toBeTruthy();
    expect(within(result).getAllByRole("listitem")).toHaveLength(2);
    // קישורים: תחנה, טעימה, רשימת המתנה
    expect(result.querySelector('a[href="/before-relationship"]')).not.toBeNull();
    expect(result.querySelector('a[href="/preview"]')).not.toBeNull();
    expect(result.querySelector('a[href="/waitlist"]')).not.toBeNull();
    // אין אחוזי-ביטחון / אבחון
    expect(within(result).queryByText(/%/)).toBeNull();
    expect(within(result).getByText(/לא אבחון או ייעוץ/)).toBeTruthy();

    // נשמר מקומית רק מזהה התחנה + השלמה
    const saved = JSON.parse(window.localStorage.getItem(KEY) as string);
    expect(saved).toEqual({ stationId: "before-relationship", completed: true });
  });

  it("restart from the result clears storage and returns to question 1", () => {
    render(<CompassQuiz />);
    pick(0);
    pick(0);
    pick(0);
    expect(window.localStorage.getItem(KEY)).not.toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /להתחיל מחדש/ }));
    expect(screen.getByText("שאלה 1 מתוך 3")).toBeTruthy();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it("a 1-1-1 tie resolves deterministically (before-relationship first in order)", () => {
    render(<CompassQuiz />);
    // Q1 inside(2), Q2 starting(1), Q3 before(0) → 1-1-1 tie → before-relationship
    pick(2);
    pick(1);
    pick(0);
    const result = screen.getByRole("article");
    expect(within(result).getByRole("heading").textContent).toMatch(/לפני קשר/);
  });

  it("on return visit shows 'continue where you left off' from saved storage", async () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ stationId: "inside-relationship", completed: true }),
    );
    render(<CompassQuiz />);
    await waitFor(() => expect(screen.getByText(/להמשיך מהמקום שבו עצרתם/)).toBeTruthy());
    const resumed = screen.getByRole("article");
    expect(within(resumed).getByRole("heading").textContent).toMatch(/בתוך קשר/);
    // מאפשר לענות מחדש
    expect(screen.getByRole("button", { name: /לענות על המצפן מחדש/ })).toBeTruthy();
  });

  it("works with corrupt localStorage (falls back to the quiz, no crash)", async () => {
    window.localStorage.setItem(KEY, "{corrupt");
    render(<CompassQuiz />);
    // לא נתקע במצב „המשך”; מציג את השאלון
    await waitFor(() => expect(screen.getByText("שאלה 1 מתוך 3")).toBeTruthy());
    expect(screen.queryByText(/להמשיך מהמקום שבו עצרתם/)).toBeNull();
  });
});
