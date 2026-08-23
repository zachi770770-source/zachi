import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, within } from "@testing-library/react";

vi.mock("server-only", () => ({}));

let mockPathname = "/";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));

import { Header } from "@/components/layout/Header";
import { siteConfig } from "@/config/site";
import { isEnglishPath } from "@/lib/language";

/**
 * ההדר משרת שני אתרים מתוך root layout אחד. הכשל שהבדיקות כאן קיימות בשבילו
 * הוא זה שדווח מהשטח: „/en” הציג תוכן אנגלי מתחת להדר עברי — שם ספר בעברית
 * וכפתור „לרכישה” — כך שהעמוד הרגיש כמו עמוד אנגלי בתוך אתר עברי.
 *
 * שלושה דברים נעולים כאן: כל צד מדבר בשפה שלו, פקד-השפה גלוי *בשורת ההדר*
 * ולא רק בתוך המגירה, ויעד הרכישה של „/en” הוא אמזון ולא מסלול הרכישה העברי.
 */

const HEBREW = /[֐-׿]/;
const edition = siteConfig.englishEdition;

function renderHeaderAt(pathname: string) {
  mockPathname = pathname;
  return render(<Header />);
}

/** רק מה שהמבקר באמת רואה: המקבילה של MainNav במובייל מוסתרת ב-CSS בלבד. */
function visibleHeaderLinks(container: HTMLElement) {
  const desktopNav = container.querySelector(".lg\\:flex");
  return [...container.querySelectorAll("a")].filter((a) => !desktopNav?.contains(a));
}

describe("isEnglishPath", () => {
  it("matches the English edition routes and nothing else", () => {
    expect(isEnglishPath("/en")).toBe(true);
    expect(isEnglishPath("/en/anything")).toBe(true);
    expect(isEnglishPath("/")).toBe(false);
    expect(isEnglishPath("/book")).toBe(false);
    // „/english” ו„/enough” אינם המהדורה האנגלית — התאמת-תחילית תמימה הייתה
    // תופסת אותם ומחליפה שפה בעמוד עברי לגיטימי.
    expect(isEnglishPath("/english")).toBe(false);
    expect(isEnglishPath("/enough")).toBe(false);
    expect(isEnglishPath(null)).toBe(false);
  });
});

describe("header on the Hebrew site", () => {
  afterEach(() => cleanup());

  it("keeps its Hebrew brand name and purchase label", () => {
    const { container } = renderHeaderAt("/");
    const links = visibleHeaderLinks(container);
    expect(links.some((a) => a.textContent?.includes(siteConfig.bookTitle))).toBe(true);
    expect(links.some((a) => a.textContent?.trim() === "לרכישה")).toBe(true);
    expect(links.some((a) => a.getAttribute("href") === "/book#purchase")).toBe(true);
  });

  it("shows the English switch in the header row itself, not only in the drawer", () => {
    const { container } = renderHeaderAt("/");
    const inRow = visibleHeaderLinks(container).find((a) => a.textContent?.trim() === "English");
    expect(inRow, "an English control must be reachable without opening the menu").toBeTruthy();
    expect(inRow).toHaveAttribute("href", "/en");
    expect(inRow).toHaveAttribute("hrefLang", "en");
  });

  it("still offers the hamburger menu, which carries the Hebrew sections", () => {
    const { container } = renderHeaderAt("/");
    expect(container.querySelector("button[aria-label]")).toBeTruthy();
  });

  it("never points the Hebrew header at the English edition's Amazon page", () => {
    const { container } = renderHeaderAt("/");
    expect(container.innerHTML).not.toContain(edition.url);
  });
});

describe("header on /en", () => {
  afterEach(() => cleanup());

  it("uses the English edition title as the brand name", () => {
    const { container } = renderHeaderAt("/en");
    const brand = visibleHeaderLinks(container)[0];
    expect(brand.textContent).toContain(edition.title);
    expect(brand.textContent).not.toContain(siteConfig.bookTitle);
    expect(brand).toHaveAttribute("href", "/en");
  });

  it("labels the purchase action in English and sends it to Amazon", () => {
    const { container } = renderHeaderAt("/en");
    const cta = visibleHeaderLinks(container).find((a) => a.textContent?.trim() === edition.buyLabel);
    expect(cta, `the header CTA must read "${edition.buyLabel}"`).toBeTruthy();
    expect(cta).toHaveAttribute("href", edition.url);
    expect(cta).toHaveAttribute("rel", "noopener noreferrer");
    // מסלול הרכישה העברי אינו רלוונטי למהדורה האנגלית.
    expect(container.innerHTML).not.toContain("/book#purchase");
  });

  it("shows the Hebrew switch in the header row itself", () => {
    const { container } = renderHeaderAt("/en");
    const inRow = visibleHeaderLinks(container).find((a) => a.textContent?.trim() === "עברית");
    expect(inRow, "a עברית control must be reachable without opening the menu").toBeTruthy();
    expect(inRow).toHaveAttribute("href", "/");
    expect(inRow).toHaveAttribute("hrefLang", "he");
  });

  it("leaves no Hebrew in the header except the language control itself", () => {
    const { container } = renderHeaderAt("/en");
    const hebrewNodes = visibleHeaderLinks(container)
      .flatMap((a) => [...a.querySelectorAll("*"), a])
      .filter((el) => el.children.length === 0 && HEBREW.test(el.textContent ?? ""))
      .map((el) => el.textContent?.trim());
    expect([...new Set(hebrewNodes)]).toEqual(["עברית"]);
  });

  it("drops the hamburger, whose menu holds Hebrew-only destinations", () => {
    const { container } = renderHeaderAt("/en");
    expect(container.querySelector("button[aria-label]")).toBeNull();
  });

  it("marks the header as English for assistive tech and bidi", () => {
    const { container } = renderHeaderAt("/en");
    const row = container.querySelector("header > div");
    expect(row).toHaveAttribute("lang", "en");
    expect(row).toHaveAttribute("dir", "ltr");
  });
});

describe("the two headers never blur into each other", () => {
  beforeEach(() => cleanup());

  it("swaps every localized surface together when the route changes", () => {
    const he = renderHeaderAt("/").container.innerHTML;
    cleanup();
    const en = renderHeaderAt("/en").container.innerHTML;

    expect(he).toContain(siteConfig.bookTitle);
    expect(he).not.toContain(edition.title);
    expect(en).toContain(edition.title);
    expect(en).not.toContain(siteConfig.bookTitle);
    // פקד-שפה קיים בשני הצדדים, ותמיד מצביע אל *הצד השני*.
    expect(he).toContain(">English<");
    expect(en).toContain(">עברית<");
  });
});

describe("the language control keeps working as a real link", () => {
  afterEach(() => cleanup());

  it("is a keyboard-reachable, crawlable anchor with an accessible name", () => {
    const { container } = renderHeaderAt("/en");
    const link = visibleHeaderLinks(container).find((a) => a.textContent?.trim() === "עברית")!;
    expect(link.tagName).toBe("A");
    expect(link).toHaveAccessibleName();
    // התווית עצמה מסומנת בשפתה, כדי שקורא-מסך יהגה אותה נכון בתוך עמוד אנגלי.
    expect(within(link).getByText("עברית")).toHaveAttribute("lang", "he");
  });
});
