import { describe, it, expect } from "vitest";

import {
  parseInline,
  parseAnswerMarkdown,
  formatCitation,
} from "@/lib/compass/answerFormat";

describe("parseInline (emphasis)", () => {
  it("parses **bold** and *italic* into strong/em spans", () => {
    expect(parseInline("לפני **חיפוש** אחרי")).toEqual([
      { type: "text", value: "לפני " },
      { type: "strong", value: "חיפוש" },
      { type: "text", value: " אחרי" },
    ]);
    expect(parseInline("*נטוי*")).toEqual([{ type: "em", value: "נטוי" }]);
    expect(parseInline("__גם מודגש__")).toEqual([{ type: "strong", value: "גם מודגש" }]);
  });

  it("leaves plain text without markers as a single text span", () => {
    expect(parseInline("טקסט רגיל בלי סימונים")).toEqual([
      { type: "text", value: "טקסט רגיל בלי סימונים" },
    ]);
  });

  it("never emits html — angle brackets stay literal text", () => {
    const spans = parseInline("<b>לא</b> מודגש");
    expect(spans.every((s) => s.type === "text")).toBe(true);
    expect(spans.map((s) => s.value).join("")).toBe("<b>לא</b> מודגש");
  });
});

describe("parseAnswerMarkdown (blocks)", () => {
  it("splits paragraphs on blank lines", () => {
    const blocks = parseAnswerMarkdown("פסקה ראשונה.\n\nפסקה שנייה.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toMatchObject({ type: "paragraph" });
    expect(blocks[1]).toMatchObject({ type: "paragraph" });
  });

  it("parses unordered and ordered lists", () => {
    const ul = parseAnswerMarkdown("- ראשון\n- שני");
    expect(ul[0]).toMatchObject({ type: "list", ordered: false });
    expect((ul[0] as { items: unknown[] }).items).toHaveLength(2);

    const ol = parseAnswerMarkdown("1. אחד\n2. שתיים");
    expect(ol[0]).toMatchObject({ type: "list", ordered: true });
  });

  it("keeps emphasis inside list items", () => {
    const blocks = parseAnswerMarkdown("- יש **הדגשה** כאן");
    const first = blocks[0] as { items: Array<Array<{ type: string }>> };
    expect(first.items[0].some((s) => s.type === "strong")).toBe(true);
  });

  it("does not parse links, images or code (kept as literal text)", () => {
    const blocks = parseAnswerMarkdown("ראו [כאן](https://example.com) וגם `code` ו-![x](y)");
    const p = blocks[0] as { spans: Array<{ type: string; value: string }> };
    const joined = p.spans.map((s) => s.value).join("");
    expect(joined).toContain("[כאן](https://example.com)");
    expect(joined).toContain("`code`");
    expect(joined).toContain("![x](y)");
    // אין אלמנטים מיוחדים — רק טקסט (ואולי הדגשה, אך לא כאן).
    expect(p.spans.every((s) => s.type === "text")).toBe(true);
  });
});

describe("formatCitation (dedupe)", () => {
  it("collapses 'פרק N: פרק N' to 'פרק N'", () => {
    expect(formatCitation("מבוסס על פרק 7: פרק 7")).toBe("מבוסס על פרק 7");
    expect(formatCitation("מבוסס על פרק 7: פרק 7 ופרק 3: פרק 3")).toBe(
      "מבוסס על פרק 7 ופרק 3"
    );
  });

  it("keeps a real chapter title untouched", () => {
    expect(formatCitation("מבוסס על פרק 2: עוברים את השער")).toBe(
      "מבוסס על פרק 2: עוברים את השער"
    );
  });
});
