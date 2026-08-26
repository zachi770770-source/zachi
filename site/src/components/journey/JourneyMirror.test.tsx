import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, screen, within } from "@testing-library/react";

import { JourneyMirror } from "@/components/journey/JourneyMirror";
import { journeyPages } from "@/content/journeyPages";
import { methods } from "@/content/methods";

/**
 * חוזה המבנה/הנגישות של „מה הכי קרוב אליי כרגע?”: שלוש בחירות כרדיו נייטיב
 * בקבוצה אחת, ולכל בחירה outcome משלה עם צעד ראשי שתואם לבחירה. (הצגה/הסתרה
 * והחלפה הן CSS טהור — נבדקות ב-E2E בדפדפן אמיתי.)
 */

afterEach(cleanup);

const before = journeyPages["before-relationship"];

describe("JourneyMirror", () => {
  it("renders three native radios in one radiogroup (keyboard-navigable)", () => {
    render(<JourneyMirror id={before.id} points={before.depthPoints} />);
    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    const names = new Set(radios.map((r) => r.getAttribute("name")));
    expect(names.size).toBe(1); // אותה קבוצת-רדיו → ניווט חיצים נייטיב
    for (const r of radios) expect((r as HTMLInputElement).type).toBe("radio");
  });

  it("gives each choice its own outcome with a matching primary CTA", () => {
    render(<JourneyMirror id={before.id} points={before.depthPoints} />);
    // צעד ראשי אחד לכל אחת משלוש הבחירות — לא continuation יחיד משותף.
    expect(screen.getAllByText("מכאן אפשר להמשיך")).toHaveLength(3);

    for (const point of before.depthPoints) {
      const cta = screen.getByRole("link", { name: point.outcome.primaryAction.label });
      expect(cta).toHaveAttribute("href", point.outcome.primaryAction.href);
      // השאלה והשיקוף של הבחירה קיימים ומשויכים אליה.
      expect(screen.getByText(point.outcome.question)).toBeInTheDocument();
      expect(screen.getByText(point.outcome.reflection)).toBeInTheDocument();
    }
  });

  it("shows the accompanying canonical concept link only when methodSlug is set", () => {
    render(<JourneyMirror id={before.id} points={before.depthPoints} />);
    const withMethod = before.depthPoints.filter((p) => p.outcome.methodSlug);
    const concepts = screen.getAllByRole("link", { name: /המושג מהספר/ });
    expect(concepts).toHaveLength(withMethod.length);
    for (const point of withMethod) {
      const slug = point.outcome.methodSlug!;
      const link = screen.getByRole("link", {
        name: `המושג מהספר: „${methods[slug].term}”`,
      });
      expect(link).toHaveAttribute("href", methods[slug].path);
    }
  });

  it("each option row contains exactly one primary CTA (no shared/stacked continuation)", () => {
    const { container } = render(
      <JourneyMirror id="inside-relationship" points={journeyPages["inside-relationship"].depthPoints} />,
    );
    const rows = container.querySelectorAll("fieldset > div > div");
    // כל שורת-אפשרות עוטפת בדיוק „מכאן אפשר להמשיך” אחד.
    const perRow = journeyPages["inside-relationship"].depthPoints.map((point) => {
      const cta = screen.getByRole("link", { name: point.outcome.primaryAction.label });
      const row = cta.closest("fieldset > div > div") ?? cta.parentElement;
      return within(row as HTMLElement).getAllByText("מכאן אפשר להמשיך").length;
    });
    expect(perRow).toEqual([1, 1, 1]);
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});
