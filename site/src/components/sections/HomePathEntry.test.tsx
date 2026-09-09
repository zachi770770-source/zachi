import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";

import { HomePathEntry } from "@/components/sections/HomePathEntry";
import { homePaths } from "@/content/homePaths";

/**
 * המקטע הזה הוא **ניווט**, ולכן הבדיקות שומרות עכשיו על תכונה חזקה יותר ממה
 * ששמרו קודם.
 *
 * קודם הן קיבעו את האפורדנס של „תיבת-הכניסה” — סמן מהבהב, אייקון עֵט או מצפן,
 * ורמז מתאים לכל מצב. כלומר הן שמרו בקפידה על *מראה* של שדה-כתיבה שהיה בפועל
 * `<a href="/compass">`: אפורדנס שהזמין להקליד וניווט לשאלון. הבדיקות עברו,
 * והאפורדנס עדיין היה שקרי — הן הגנו בדיוק על הדבר הלא-נכון.
 *
 * הטענות החדשות אינן „פחות” — הן קשות יותר לעבור:
 *   • חמש נקודות-הפתיחה קיימות, כולן קישורים אמיתיים (עובד ללא JS).
 *   • כל כרטיס מוביל לעמוד-המסע *שלו* — לא ליעד משותף.
 *   • המודל 3 תחנות + 2 שערים מוצג בפועל, ולא רק קיים בנתונים.
 *   • **אין במקטע שום דבר שמתחזה לשדה-קלט**, ואין בו קישור אל /compass.
 *     שתי הטענות האחרונות הן בדיוק מה שהבדיקות הקודמות פספסו.
 */
describe("HomePathEntry — חמש נקודות-פתיחה, ניווט בלבד", () => {
  it("מרנדר חמישה קישורים אמיתיים, כל אחד אל עמוד-המסע שלו", () => {
    const { container } = render(<HomePathEntry />);
    const links = [...container.querySelectorAll("a.situation-card")];
    expect(links).toHaveLength(homePaths.length);
    expect(links).toHaveLength(5);

    for (const path of homePaths) {
      const link = links.find((a) => a.textContent?.includes(path.buttonTitle));
      expect(link, `כרטיס עבור ${path.id}`).toBeDefined();
      expect(link!.getAttribute("href")).toBe(path.stationHref);
    }
    // חמישה יעדים *שונים* — לא חמישה כרטיסים שמובילים לאותו מקום.
    const hrefs = new Set(links.map((a) => a.getAttribute("href")));
    expect(hrefs.size).toBe(5);
  });

  it("שומר על מבנה 3+2 בלי להסביר את הטקסונומיה למבקר", () => {
    const { container } = render(<HomePathEntry />);

    // המודל נשאר בנתונים ובמבנה — אבל השמות הפנימיים שלנו אינם על המסך.
    // (רגרסיה: הכותרות „המסלול” / „שערי מעבר” היו כאן, וירדו בכוונה.)
    for (const jargon of [
      "המסלול",
      "שערי מעבר",
      "שלוש תחנות, לפי הסדר",
      "לא חלק מהמסלול",
    ]) {
      expect(container.textContent).not.toContain(jargon);
    }
    expect(container.querySelectorAll("h3")).toHaveLength(0);

    const stations = container.querySelectorAll(
      '[data-kind="station"] a.situation-card',
    );
    const gates = container.querySelectorAll('[data-kind="gate"] a.situation-card');
    expect(stations).toHaveLength(3);
    expect(gates).toHaveLength(2);

    // הקיבוץ נגזר מהנתונים, ולא מסדר קשיח בתבנית.
    expect([...stations].map((a) => a.getAttribute("href"))).toEqual(
      homePaths.filter((p) => p.kind === "station").map((p) => p.stationHref),
    );
    expect([...gates].map((a) => a.getAttribute("href"))).toEqual(
      homePaths.filter((p) => p.kind === "gate").map((p) => p.stationHref),
    );
  });

  it("אין שום אפורדנס שמתחזה לשדה-קלט, ואין כניסה לשאלון", () => {
    const { container } = render(<HomePathEntry />);
    // לא שדה אמיתי, ולא חיקוי שלו (התיבה הישנה + סמן-הכתיבה שלה).
    expect(container.querySelector("input, textarea")).toBeNull();
    expect(container.querySelector(".home-composer")).toBeNull();
    expect(container.querySelector(".home-composer__caret")).toBeNull();
    // ואין קישור אל הכלי מתוך הזרימה הראשית — הוא נכנס רק מדלת מסומנת.
    const hrefs = [...container.querySelectorAll("a")].map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).not.toContain("/compass");
  });
});
