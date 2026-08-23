import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

vi.mock("server-only", () => ({}));

import { metadata as enMetadata } from "@/app/en/page";
import { metadata as heMetadata } from "@/app/page";
import sitemap from "@/app/sitemap";
import { siteConfig } from "@/config/site";
import { LanguageSwitch } from "@/components/layout/LanguageSwitch";
import { getStoredLanguage, storeLanguage, prefersEnglishOverHebrew } from "@/lib/language";

/**
 * המהדורה האנגלית ב-/en. הבדיקות כאן שומרות על שלושה דברים שקל לשבור בשקט:
 * היעד באמזון (ASIN אחר לגמרי מהמהדורה העברית), יחסי-השפה ההדדיים, והעובדה
 * ששתי הכתובות נשארות עצמאיות — בלי הפניה ובלי canonical צולב.
 */

const EN_ASIN = "B0DYP4DL1V";
const HE_ASIN = "B0GJ3SL9H2";

describe("English edition config", () => {
  it("uses the owner-confirmed ASIN and canonical Amazon destination", () => {
    expect(siteConfig.englishEdition.asin).toBe(EN_ASIN);
    expect(siteConfig.englishEdition.url).toBe(`https://www.amazon.com/dp/${EN_ASIN}`);
  });

  it("is a different product from the Hebrew edition", () => {
    // הגנה מרכזית: קורא אנגלי לעולם לא אמור לנחות על ספר בעברית.
    expect(siteConfig.englishEdition.asin).not.toBe(siteConfig.amazon.asin);
    expect(siteConfig.amazon.asin).toBe(HE_ASIN);
  });

  it("declares no fabricated ISBN", () => {
    // ה-ISBN שנמצא בחיפוש שייך לספר אחר של אותו מחבר; אין להצמיד אותו כאן.
    expect(siteConfig.englishEdition).not.toHaveProperty("isbn");
  });
});

describe("/en metadata", () => {
  it("is self-canonical to /en and never to the Hebrew home", () => {
    expect(enMetadata.alternates?.canonical).toBe("/en");
    expect(enMetadata.alternates?.canonical).not.toBe("/");
  });

  it("declares reciprocal hreflang with the Hebrew home", () => {
    const en = enMetadata.alternates?.languages ?? {};
    const he = heMetadata.alternates?.languages ?? {};
    expect(en).toMatchObject({ he: "/", en: "/en" });
    expect(he).toMatchObject({ he: "/", en: "/en" });
    // הדדיות אמיתית: שני העמודים מצהירים על אותה מפה.
    expect(en).toEqual(he);
  });

  it("points x-default at Hebrew, the site's real default", () => {
    expect(enMetadata.alternates?.languages?.["x-default"]).toBe("/");
  });

  it("carries an English title, description and og:locale", () => {
    expect(String(enMetadata.description)).toMatch(/[A-Za-z]/);
    expect(enMetadata.description).not.toMatch(/[֐-׿]/); // בלי עברית
    expect(enMetadata.openGraph?.locale).toBe("en_US");
  });

  it("leaves the Hebrew home self-canonical and unchanged", () => {
    expect(heMetadata.alternates?.canonical).toBe("/");
    expect(heMetadata.openGraph?.locale).toBe("he_IL");
  });
});

describe("/en discovery", () => {
  it("is in the sitemap, once, with no fabricated lastmod", () => {
    const rows = sitemap().filter((e) => new URL(e.url).pathname === "/en");
    expect(rows).toHaveLength(1);
    expect(rows[0].lastModified).toBeUndefined();
  });

  it("does not disturb the existing Hebrew sitemap entries", () => {
    const paths = sitemap().map((e) => new URL(e.url).pathname);
    for (const p of ["/", "/book", "/love", "/author", "/preview", "/faq", "/compass"]) {
      expect(paths, `${p} must remain in the sitemap`).toContain(p);
    }
  });

  it("is listed in llms.txt (required for a priority >= 0.8 page)", async () => {
    const { readFileSync } = await import("node:fs");
    const { resolve } = await import("node:path");
    const llms = readFileSync(resolve(process.cwd(), "public/llms.txt"), "utf8");
    expect(llms).toContain("https://www.zachi.co.il/en");
  });
});

describe("language preference", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => cleanup());

  it("has no preference until the visitor chooses", () => {
    expect(getStoredLanguage()).toBeNull();
  });

  it("stores and reads an explicit choice", () => {
    storeLanguage("en");
    expect(getStoredLanguage()).toBe("en");
    storeLanguage("he");
    expect(getStoredLanguage()).toBe("he");
  });

  it("ignores a corrupt stored value rather than trusting it", () => {
    window.localStorage.setItem("zachi_lang", "klingon");
    expect(getStoredLanguage()).toBeNull();
  });
});

describe("browser-language hint logic", () => {
  const setLanguages = (langs: string[]) =>
    Object.defineProperty(window.navigator, "languages", {
      value: langs,
      configurable: true,
    });

  it("prefers English when English comes first", () => {
    setLanguages(["en-US", "he"]);
    expect(prefersEnglishOverHebrew()).toBe(true);
  });

  it("prefers Hebrew when Hebrew comes first", () => {
    setLanguages(["he-IL", "en"]);
    expect(prefersEnglishOverHebrew()).toBe(false);
  });

  it("does not treat every non-Hebrew language as English", () => {
    // צרפתית ואז עברית ⇒ עברית מנצחת. „לא עברית” אינו „אנגלית”.
    setLanguages(["fr-FR", "he"]);
    expect(prefersEnglishOverHebrew()).toBe(false);
    // ורק צרפתית ⇒ ברירת המחדל המתועדת: עברית.
    setLanguages(["fr-FR"]);
    expect(prefersEnglishOverHebrew()).toBe(false);
  });

  it("recognises the legacy Hebrew tag `iw`", () => {
    setLanguages(["iw", "en"]);
    expect(prefersEnglishOverHebrew()).toBe(false);
  });
});

describe("LanguageSwitch", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it("links Hebrew → /en and stores an explicit `en` preference on click", () => {
    render(<LanguageSwitch to="en" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/en");
    expect(link).toHaveAttribute("hrefLang", "en");
    fireEvent.click(link);
    expect(getStoredLanguage()).toBe("en");
  });

  it("links English → / and stores an explicit `he` preference on click", () => {
    render(<LanguageSwitch to="he" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/");
    expect(link).toHaveAttribute("hrefLang", "he");
    fireEvent.click(link);
    expect(getStoredLanguage()).toBe("he");
  });

  it("an explicit choice survives an opposing browser preference", () => {
    // דפדפן אנגלי, אך המשתמש בחר עברית במפורש ⇒ אין להציע שוב.
    Object.defineProperty(window.navigator, "languages", {
      value: ["en-US"],
      configurable: true,
    });
    render(<LanguageSwitch to="he" />);
    fireEvent.click(screen.getByRole("link"));
    expect(getStoredLanguage()).toBe("he");
    expect(prefersEnglishOverHebrew()).toBe(true); // הדפדפן לא השתנה…
    // …אך ההעדפה המפורשת קיימת, ולכן הרמיזה לא תוצג (התנאי דורש null).
    expect(getStoredLanguage()).not.toBeNull();
  });

  it("is a real link, so it is keyboard reachable and crawlable", () => {
    render(<LanguageSwitch to="en" />);
    const link = screen.getByRole("link");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAccessibleName();
  });
});
