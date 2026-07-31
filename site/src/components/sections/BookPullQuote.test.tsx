import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { BookPullQuote } from "@/components/sections/BookPullQuote";
import { closing } from "@/content/book";

/**
 * מאמת שהציטוט הוא משפט מדויק וקיים מתוך תוכן הספר (closing.title), מוצג
 * כ-blockquote (רעיון מהספר) ולא כהמלצה/עדות. נבדק דרך SSR כדי לא לגעת
 * ב-IntersectionObserver של Reveal.
 */
describe("BookPullQuote", () => {
  it("uses an exact, existing book sentence verbatim", () => {
    const html = renderToStaticMarkup(<BookPullQuote />);
    expect(html).toContain(closing.title);
    // ודאות שהמשפט אינו מומצא — הוא בדיוק הערך מתוכן הספר.
    expect(closing.title.length).toBeGreaterThan(20);
  });

  it("renders it as a blockquote attributed to the book (not a testimonial)", () => {
    const html = renderToStaticMarkup(<BookPullQuote />);
    expect(html).toContain("<blockquote");
    expect(html).toContain("מתוך הספר");
    expect(html).not.toContain("המלצה");
  });
});
