import { describe, it, expect } from "vitest";

import { siteConfig } from "@/config/site";
import { faqItems } from "@/content/faq";
import { journeyPages } from "@/content/journeyPages";
import { previewClosing } from "@/content/sample";
import { attachment } from "@/content/book";

/**
 * P0 Trust & Conversion regressions:
 * (1) purchase availability tells one story — the book is available NOW on
 *     Kindle; only the *direct site edition* is future. No copy implies the
 *     whole book is unreleased.
 * (2) high-risk psychological claims read as curiosity, not diagnosis.
 */

const BOOK_UNRELEASED_PHRASES = [
  "כשהספר ייצא",
  "ברגע שהספר ייצא",
  "ברגע שייצא",
  "הספר בדרך",
  "תושק ב",
];

describe("purchase availability is consistent (Kindle available now)", () => {
  it("the canonical availability label says the book is available now on Kindle", () => {
    expect(siteConfig.amazon.available).toBe(true);
    expect(siteConfig.amazon.availableLabel).toContain("זמין עכשיו");
    expect(siteConfig.amazon.availableLabel).toContain("Kindle");
  });

  it("the preview waitlist lead is about the DIRECT edition, not 'when the book comes out'", () => {
    expect(previewClosing.waitlistLead).toContain("המהדורה הישירה");
    for (const bad of BOOK_UNRELEASED_PHRASES) {
      expect(previewClosing.waitlistLead).not.toContain(bad);
    }
  });

  it("the preview closing frames site-vs-book (a taste vs the full sequence)", () => {
    expect(previewClosing.connect).toContain("הרצף השלם");
  });
});

describe("psychological claims are curiosity, not diagnosis", () => {
  const inside = journeyPages["inside-relationship"];
  const insideText = inside.whatsHappening.join(" ");

  it("inside-relationship drops the universal 'never really about X' / 'is the heart of it' absolutes", () => {
    expect(insideText).not.toContain("אף פעם לא היה באמת");
    expect(insideText).not.toContain("לא הריב עצמו, הוא לב העניין");
  });

  it("FAQ singles answer does not assume everyone repeatedly chooses the same type", () => {
    const singles = faqItems.find((f) => f.question.includes("נשרפתי מדייטים"));
    expect(singles).toBeTruthy();
    expect(singles!.answer).toContain("אם אתם מוצאים את עצמכם");
    expect(singles!.answer).not.toContain("למה שוב ושוב נמשכים לאותו טיפוס");
  });

  it("FAQ breakup answer does not promise 'real healing' or guaranteed non-repeat", () => {
    const breakup = faqItems.find((f) => f.question.includes("שבוע אחרי פרידה"));
    expect(breakup).toBeTruthy();
    expect(breakup!.answer).not.toContain("ההחלמה תהיה אמיתית");
  });

  it("FAQ divorced-parent answer drops the guilt clause about children's sensitivity", () => {
    const divorced = faqItems.find((f) => f.question.includes("גרוש/ה עם ילדים"));
    expect(divorced).toBeTruthy();
    expect(divorced!.answer).not.toContain("שרגישים לא פעם יותר ממה שנדמה");
  });
});

describe("/book attachment section is a lens, not destiny or a true-love absolute", () => {
  it("drops the universal 'real love feels like coming home' claim", () => {
    expect(attachment.promise).not.toContain("אהבה אמיתית לא מרגישה");
    expect(attachment.promise).not.toContain("היא מרגישה כמו לחזור הביתה");
  });

  it("reframes attachment as a lens/model, not childhood software that determines attraction", () => {
    expect(attachment.definition).not.toContain("תוכנה שנלמדת בילדות");
    expect(attachment.definition).toContain("עדשה");
  });
});

describe("/starting-again has full journey parity with its sibling stages", () => {
  const sa = journeyPages["starting-again"];

  it("uses the rich JourneyPage content model", () => {
    expect(sa).toBeTruthy();
    expect(sa.whatsHappening.length).toBeGreaterThanOrEqual(4);
    expect(sa.depthPoints.length).toBe(3);
    expect(sa.bookHelps.length).toBeGreaterThanOrEqual(3);
    expect(sa.pullQuote.length).toBeGreaterThan(0);
    expect(sa.mirrorQuestion.length).toBeGreaterThan(0);
    expect(sa.sampleLead.length).toBeGreaterThan(0);
  });

  it("wires a real preview reading (valid tool + station)", () => {
    expect(sa.sampleTool).toBe("boundary-ladder");
    expect(sa.sampleStation).toBe("starting-again");
  });
});
