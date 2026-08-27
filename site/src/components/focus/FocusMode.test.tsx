import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { FocusMode } from "@/components/focus/FocusMode";
import { focusUi, getFocusSituation } from "@/content/focusMode";

/**
 * Focus Mode — הזרימה המדורגת: פיצול „עובדה מול סיפור” → Aha (הפרדה) → חשיפת
 * ה-CTA. הבדיקה מאמתת שהעובדה והסיפור מוצגים *שניהם* בהתחלה, שה-CTA וגשר-ההבנה
 * נחשפים רק *אחרי* ההפרדה, ושה-callbacks נקראים. הבדיקה רצה ללא `.motion-js`
 * (כמו reduced-motion), ולכן מעברי-המצב מיידיים ולא תלויי View Transitions.
 */
describe("FocusMode — staged fact/story → Aha → reveal", () => {
  const s = getFocusSituation("existing");

  it("shows both fact and story first; reveals separation line + CTA only after separating", () => {
    const onContinue = vi.fn();
    const onBack = vi.fn();
    render(
      <FocusMode situationId="existing" onContinue={onContinue} onBack={onBack} />,
    );

    // שלב הפיצול: העובדה והסיפור *שניהם* גלויים, עם התוויות הוויזואליות.
    expect(screen.getByText(s.fact)).toBeTruthy();
    expect(screen.getByText(s.story)).toBeTruthy();
    expect(screen.getByText(focusUi.factTag)).toBeTruthy();
    expect(screen.getByText(focusUi.storyTag)).toBeTruthy();

    // לפני ההפרדה: אין משפט-Aha ואין CTA-המשך.
    expect(screen.queryByText(focusUi.separationLine)).toBeNull();
    expect(screen.queryByText(focusUi.continueLabel)).toBeNull();

    // הפרדה יזומה → ה-Aha נחשף.
    fireEvent.click(screen.getByText(focusUi.separateLabel));
    expect(screen.getByText(focusUi.separationLine)).toBeTruthy();
    expect(screen.getByText(s.bridge)).toBeTruthy();

    // ה-CTA נחשף רק עכשיו, וממשיך אל השיחה.
    const cta = screen.getByText(focusUi.continueLabel);
    expect(cta).toBeTruthy();
    fireEvent.click(cta);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("back calls onBack", () => {
    const onBack = vi.fn();
    render(<FocusMode situationId="dating" onContinue={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText(focusUi.backLabel));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
