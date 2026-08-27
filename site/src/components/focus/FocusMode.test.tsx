import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { FocusMode } from "@/components/focus/FocusMode";
import { focusUi, getFocusSituation } from "@/content/focusMode";

/**
 * Focus Mode — רצף ארבע הפעימות: enter → split (עובדה מול סיפור) → aha → action.
 * הבדיקה מאמתת שלכל פעימה יש תוכן משלה, שהסיפור נסוג ב-Aha, ושהפעולה (וה-CTA
 * לשיחה) מופיעה רק בשלב-הפעולה הנקי — לא כחלק מאותו מסך. רצה ללא `.motion-js`
 * (כמו reduced-motion), ולכן מעברי-המצב מיידיים ולא תלויי View Transitions.
 */
describe("FocusMode — enter → split → aha → action sequence", () => {
  const s = getFocusSituation("existing");

  it("walks the four beats; the action + conversation CTA appear only at the clean action stage", () => {
    const onContinue = vi.fn();
    const onBack = vi.fn();
    render(
      <FocusMode situationId="existing" onContinue={onContinue} onBack={onBack} />,
    );

    // פעימה 1 — enter: המצב דומיננטי; עדיין אין עובדה/סיפור ואין CTA-המשך.
    expect(screen.getByText(s.title)).toBeTruthy();
    expect(screen.queryByText(s.fact)).toBeNull();
    expect(screen.queryByText(focusUi.separationLine)).toBeNull();
    expect(screen.queryByText(focusUi.continueLabel)).toBeNull();

    // enter → split: עובדה וסיפור *שניהם* גלויים, עם התוויות הוויזואליות.
    fireEvent.click(screen.getByText(focusUi.enterCta));
    expect(screen.getByText(s.fact)).toBeTruthy();
    expect(screen.getByText(s.story)).toBeTruthy();
    expect(screen.getByText(focusUi.factTag)).toBeTruthy();
    expect(screen.getByText(focusUi.storyTag)).toBeTruthy();

    // split → aha: כותרת-ה-Aha הקצרה + ההסבר הקנוני מתחתיה; הסיפור נסוג (יצא
    // מה-DOM), ואין עדיין CTA.
    fireEvent.click(screen.getByText(focusUi.separateLabel));
    expect(screen.getByText(focusUi.ahaHeadline)).toBeTruthy();
    expect(screen.getByText(focusUi.separationLine)).toBeTruthy();
    expect(screen.queryByText(s.story)).toBeNull();
    expect(screen.queryByText(focusUi.continueLabel)).toBeNull();

    // aha → action: שלב נקי — מסגור-הפעולה, הגשר, וה-CTA לשיחה.
    fireEvent.click(screen.getByText(focusUi.ahaCta));
    expect(screen.getByText(focusUi.actionEyebrow)).toBeTruthy();
    expect(screen.getByText(s.bridge)).toBeTruthy();
    const cta = screen.getByText(focusUi.continueLabel);
    fireEvent.click(cta);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("back calls onBack from the first beat", () => {
    const onBack = vi.fn();
    render(<FocusMode situationId="dating" onContinue={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText(focusUi.backLabel));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
