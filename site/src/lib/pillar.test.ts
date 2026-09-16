import { describe, expect, it } from "vitest";

import { pillarForStage } from "@/lib/pillar";
import { guides } from "@/content/guides";
import { stations } from "@/content/stations";

/**
 * הכלל הזה הוא אינווריאנטה של מבנה-האתר, לא העדפה עיצובית: לפני התיקון כל
 * מדריך, כל תחנה וכל עמוד-מסע הפנו אל /love, ובגרף-הקישורים /love קיבל 39
 * קישורים נכנסים מול 5 של /dating. קל מאוד להחזיר את זה בטעות בכך שמישהו
 * יכתוב שוב href="/love" קבוע במקום להשתמש ב-`pillarForStage`, ולכן הבדיקות
 * כאן שומרות גם על הכלל וגם על האיזון שנוצר ממנו.
 */
describe("pillarForStage", () => {
  it("sends the search stages to /dating", () => {
    expect(pillarForStage("before-relationship").href).toBe("/dating");
    expect(pillarForStage("starting-again").href).toBe("/dating");
  });

  it("sends the building stages to /love", () => {
    expect(pillarForStage("building-relationship").href).toBe("/love");
    expect(pillarForStage("inside-relationship").href).toBe("/love");
    expect(pillarForStage("after-breakup").href).toBe("/love");
  });

  it("gives a page sitting on one pillar the other one, never a self-link", () => {
    expect(pillarForStage("dating").href).toBe("/love");
    expect(pillarForStage("love").href).toBe("/dating");
  });

  it("accepts a hub path as well as a bare slug", () => {
    expect(pillarForStage("/before-relationship").href).toBe(
      pillarForStage("before-relationship").href,
    );
  });

  it("labels every target with a real description of that page", () => {
    expect(pillarForStage("before-relationship").label).toContain("דייטים");
    expect(pillarForStage("inside-relationship").label).toContain("אהבה");
  });

  it("keeps both pillars genuinely linked from the guide cluster", () => {
    const targets = Object.values(guides).map((g) => pillarForStage(g.hub.href).href);
    const dating = targets.filter((t) => t === "/dating").length;
    const love = targets.filter((t) => t === "/love").length;
    // לא דורשים איזון מדויק — דורשים ששני העמודים יקבלו נתח ממשי, כדי ששום
    // שינוי עתידי לא יחזיר בשקט את המצב שבו אחד מהם כמעט יתום.
    expect(dating).toBeGreaterThanOrEqual(5);
    expect(love).toBeGreaterThanOrEqual(5);
  });

  it("resolves for every station id in the content", () => {
    for (const id of Object.keys(stations)) {
      expect(["/dating", "/love"]).toContain(pillarForStage(id).href);
    }
  });
});
