import { describe, it, expect } from "vitest";

import { siteConfig } from "./site";

/**
 * שער השקה (launch gate) לכתובת „צור קשר”.
 *
 * `siteConfig.contact.email` מוצג באתר ומשמש כברירת מחדל ליעד הפניות. כל עוד הוא
 * ערך זמני (PLACEHOLDER / example.com) — טופס „צור קשר” אינו יכול למסור פניות
 * אמיתיות. הבדיקה הזו **נכשלת בכוונה** כל עוד לא הוכנסה כתובת אמיתית, כדי שלא
 * נעלה לאוויר עם placeholder. היא תעבור ברגע שצחי יחליף את הערך בכתובת אמיתית
 * (למשל hello@zachi.co.il) בקובץ src/config/site.ts.
 */
describe("siteConfig.contact.email, launch gate", () => {
  const email = siteConfig.contact.email;
  const lower = email.toLowerCase();

  it("is not a placeholder value", () => {
    expect(lower).not.toContain("placeholder");
  });

  it("is not an example.com address", () => {
    expect(lower).not.toContain("example.com");
  });

  it("is a syntactically valid email address", () => {
    expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  });
});
