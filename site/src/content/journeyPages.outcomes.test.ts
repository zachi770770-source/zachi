import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { journeyPages, type JourneyId } from "@/content/journeyPages";
import { methods } from "@/content/methods";

/**
 * „מה הכי קרוב אליי כרגע?” — כל בחירה משנה בפועל את מה שמתקבל: לכל אחת מ-15
 * הבחירות (5 תחנות × 3) outcome משלה, עם שיקוף, שאלה וצעד ראשי, בלי כלי שביעי
 * ובלי href פנימי שמצביע לעמוד שאינו קיים.
 */

const STATIONS = Object.keys(journeyPages) as JourneyId[];

/** ששת הכלים הקנוניים — אין אחר. */
const CANONICAL = ["quiet-check", "fact-story", "core-values", "pace-check", "eye-level-talk", "clean-exit"];

/** ממפה href פנימי לקובץ-עמוד קיים ב-App Router (מתעלם מ-query). */
function pageExists(href: string): boolean {
  const path = href.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  const segments = path ? path.split("/") : [];
  const file = resolve(process.cwd(), "src/app", ...segments, "page.tsx");
  return existsSync(file);
}

describe("journey mirror outcomes — data integrity", () => {
  it("has exactly five stations, each with three depth points (15 outcomes)", () => {
    expect(STATIONS).toHaveLength(5);
    let total = 0;
    for (const id of STATIONS) {
      expect(journeyPages[id].depthPoints).toHaveLength(3);
      total += journeyPages[id].depthPoints.length;
    }
    expect(total).toBe(15);
  });

  it("every one of the 15 choices carries a well-formed outcome", () => {
    for (const id of STATIONS) {
      for (const point of journeyPages[id].depthPoints) {
        const o = point.outcome;
        expect(o, `${id}/${point.title}`).toBeDefined();
        expect(o.reflection.trim().length).toBeGreaterThan(0);
        expect(o.question.trim().length).toBeGreaterThan(0);
        expect(o.question.trim().endsWith("?")).toBe(true);
        expect(o.primaryAction.label.trim().length).toBeGreaterThan(0);
        expect(o.primaryAction.href.startsWith("/")).toBe(true);
      }
    }
  });

  it("uses only the six canonical tools — never a seventh", () => {
    for (const id of STATIONS) {
      for (const point of journeyPages[id].depthPoints) {
        const slug = point.outcome.methodSlug;
        if (slug) {
          expect(CANONICAL, `${id}/${point.title}`).toContain(slug);
          expect(methods[slug]).toBeDefined();
        }
      }
    }
  });

  it("has no internal href pointing to a page that does not exist", () => {
    for (const id of STATIONS) {
      for (const point of journeyPages[id].depthPoints) {
        const o = point.outcome;
        expect(pageExists(o.primaryAction.href), `primary ${id} -> ${o.primaryAction.href}`).toBe(true);
        if (o.methodSlug) {
          expect(pageExists(methods[o.methodSlug].path), `method ${o.methodSlug}`).toBe(true);
        }
      }
    }
  });

  it("within a station the three choices are genuinely different (reflection, question, primary destination)", () => {
    for (const id of STATIONS) {
      const pts = journeyPages[id].depthPoints;
      const reflections = pts.map((p) => p.outcome.reflection);
      const questions = pts.map((p) => p.outcome.question);
      const hrefs = pts.map((p) => p.outcome.primaryAction.href);
      expect(new Set(reflections).size, `${id} reflections`).toBe(3);
      expect(new Set(questions).size, `${id} questions`).toBe(3);
      expect(new Set(hrefs).size, `${id} primary destinations`).toBe(3);
    }
  });

  it("after-breakup never pushes into starting-again from a choice", () => {
    for (const point of journeyPages["after-breakup"].depthPoints) {
      expect(point.outcome.primaryAction.href).not.toContain("/starting-again");
    }
  });
});
