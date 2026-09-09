import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { FocusMode } from "@/components/focus/FocusMode";
import { focusUi, getFocusSituation } from "@/content/focusMode";

/**
 * „עובדה מול סיפור” — שני שלבים: הפיצול, וההבנה.
 *
 * שתי טענות כאן חדשות, ושתיהן נועדו למנוע חזרה של הליקוי החמור באתר:
 *
 *   1. **ה-CTA הסוגר הוא קישור אמיתי אל /book.** קודם הוא היה `<button>`
 *      שקרא ל-`onContinue`, והבדיקה אישרה בסך-הכול שה-callback נקרא — כלומר
 *      היא הייתה עוברת גם כשה-callback פתח שאלון נוסף, וזה בדיוק מה שקרה
 *      בפרודקשן. עכשיו הבדיקה אוכפת `href="/book"` על היעד עצמו, ולכן שום
 *      מימוש שאינו מנווט אל הספר אינו יכול לעבור אותה.
 *   2. **הדוגמה מוצהרת כדוגמה מהספר** — התרגיל אינו מבקש מהמבקר להתבונן
 *      פנימה ואז מציג לו רגע של מישהו אחר.
 *
 * רצה ללא `.motion-js` (כמו reduced-motion): מעברי-המצב מיידיים.
 */
describe("FocusMode — פיצול → הבנה, ויציאה אחת אל הספר", () => {
  const s = getFocusSituation("existing");

  it("שני שלבים בלבד, והיציאה היא קישור אמיתי אל /book", () => {
    render(<FocusMode situationId="existing" onClose={vi.fn()} />);

    // שלב 1 — הפיצול: עובדה וסיפור שניהם גלויים, עם התוויות.
    expect(screen.getByText(s.fact)).toBeTruthy();
    expect(screen.getByText(s.story)).toBeTruthy();
    expect(screen.getByText(focusUi.factTag)).toBeTruthy();
    expect(screen.getByText(focusUi.storyTag)).toBeTruthy();
    // מסגור-אמת: זו דוגמה מהספר, ולא „הרגע שלכם”.
    expect(screen.getByText(focusUi.exampleNote)).toBeTruthy();
    // אין עדיין יציאה.
    expect(screen.queryByText(focusUi.continueLabel)).toBeNull();

    // שלב 2 — ההבנה: הכותרת הקצרה + ההסבר; הסיפור נסוג לגמרי.
    fireEvent.click(screen.getByText(focusUi.separateLabel));
    expect(screen.getByText(focusUi.ahaHeadline)).toBeTruthy();
    expect(screen.getByText(focusUi.separationLine)).toBeTruthy();
    expect(screen.getByText(s.bridge)).toBeTruthy();
    expect(screen.queryByText(s.story)).toBeNull();

    // היציאה: קישור, לא כפתור, ואל הספר.
    const cta = screen.getByRole("link", { name: new RegExp(focusUi.continueLabel) });
    expect(cta.getAttribute("href")).toBe("/book");
  });

  it("אין chrome של אפליקציה: לא לשוניות-מצבים ולא מחוון-שלבים", () => {
    const { container } = render(<FocusMode situationId="existing" onClose={vi.fn()} />);
    expect(container.querySelector(".fm-switch")).toBeNull();
    expect(container.querySelector(".fm-steps")).toBeNull();
  });

  it("הסגירה מחזירה את השליטה לעמוד", () => {
    const onClose = vi.fn();
    render(<FocusMode situationId="dating" onClose={onClose} />);
    fireEvent.click(screen.getByText(focusUi.backLabel));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("אין בתרגיל שום מסלול שמוביל לשאלון", () => {
    const { container } = render(<FocusMode situationId="existing" onClose={vi.fn()} />);
    fireEvent.click(screen.getByText(focusUi.separateLabel));
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href"));
    expect(hrefs).not.toContain("/compass");
    // וכל קישור שיוצא מכאן — יוצא אל הספר.
    expect(hrefs.filter(Boolean)).toEqual(["/book"]);
  });
});
