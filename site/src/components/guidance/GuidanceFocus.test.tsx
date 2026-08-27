import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import {
  GuidanceFocusProvider,
  GuidanceIntro,
  useReportAnswered,
} from "@/components/guidance/GuidanceFocus";
import { AnswerView } from "@/components/guidance/AnswerView";

/** מנוע-בובה שמדווח על מצב-תשובה דרך ה-hook המשותף. */
function Engine({ answered }: { answered: boolean }) {
  useReportAnswered(answered);
  return answered ? (
    <AnswerView title="ההכוונה שלך מתוך הספר">
      <p>תוכן התשובה</p>
    </AnswerView>
  ) : (
    <p>מסך בחירה</p>
  );
}

function Surface({ answered, ownsPageHeading = true }: { answered: boolean; ownsPageHeading?: boolean }) {
  return (
    <GuidanceFocusProvider ownsPageHeading={ownsPageHeading}>
      <GuidanceIntro>
        <h1>כותרת הפתיח</h1>
        <p>2-3 שאלות קצרות</p>
      </GuidanceIntro>
      <Engine answered={answered} />
    </GuidanceFocusProvider>
  );
}

describe("GuidanceFocus", () => {
  it("keeps the intro expanded while selecting (no focus class, engine shows choice)", () => {
    const { container } = render(<Surface answered={false} />);
    expect(container.querySelector(".guidance-intro--focused")).toBeNull();
    expect(screen.getByText("מסך בחירה")).toBeInTheDocument();
    // page h1 is the intro heading; AnswerView is not rendered.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("collapses the intro and moves the single h1 into AnswerView when answered", () => {
    const { container } = render(<Surface answered={true} />);
    // intro collapsed (focus class present).
    expect(container.querySelector(".guidance-intro--focused")).not.toBeNull();
    // AnswerView provides the h1 for the focused state.
    const answerView = container.querySelector("section.answer-view");
    expect(answerView).not.toBeNull();
    expect(answerView!.querySelector("h1")).not.toBeNull();
    // there is still exactly one h1 total in the DOM (intro h1 + no dup): intro h1 is
    // inside the collapsed wrapper, AnswerView h1 is the focused one → 2 in DOM, but the
    // collapsed one is display:none (jsdom keeps it) — assert AnswerView owns an h1.
    expect(screen.getByText("תוכן התשובה")).toBeInTheDocument();
  });

  it("does NOT add an AnswerView h1 for embedded surfaces (ownsPageHeading=false)", () => {
    const { container } = render(<Surface answered={true} ownsPageHeading={false} />);
    const answerView = container.querySelector("section.answer-view");
    expect(answerView).not.toBeNull();
    // no duplicated page heading in embedded contexts (home/bubble already have one).
    expect(answerView!.querySelector("h1")).toBeNull();
  });

  it("AnswerView outside any provider adds no h1 (safe default)", () => {
    const { container } = render(
      <AnswerView title="x">
        <p>y</p>
      </AnswerView>,
    );
    expect(container.querySelector("section.answer-view")).not.toBeNull();
    expect(container.querySelector("h1")).toBeNull();
  });
});
