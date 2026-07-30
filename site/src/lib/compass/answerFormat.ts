/**
 * עיצוב תשובת „המצפן” — Markdown מוגבל ובטוח בלבד.
 *
 * מודל התשובה עשוי להחזיר סימוני Markdown (למשל **הדגשה** או רשימות). כאן
 * אנו מפרסרים תת-קבוצה מצומצמת ל-AST טהור, שאותו הרכיב מרנדר כאלמנטים של
 * React (טקסט תמיד עובר escaping אוטומטי של React). נתמכים:
 *   • פסקאות (מופרדות בשורה ריקה)
 *   • הדגשה: **מודגש** / __מודגש__ ו-*נטוי* / _נטוי_
 *   • רשימות בלבד: „- ” / „* ” (לא ממוספרת), „1. ” (ממוספרת)
 *
 * מה שאינו נתמך נשאר טקסט רגיל: HTML גולמי, תמונות, קוד וקישורים חיצוניים
 * אינם מפורשים ואינם מרונדרים — הם מוצגים כתווים, ולכן אין הזרקת HTML.
 *
 * מודול טהור (ללא server-only) — נטען גם בצד הלקוח, וניתן לבדיקת יחידה.
 */

export type Inline =
  | { type: "text"; value: string }
  | { type: "strong"; value: string }
  | { type: "em"; value: string };

export type Block =
  | { type: "paragraph"; spans: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] };

/**
 * מפרסר שורה בודדת ל-spans: הדגשה (bold) בכוכבית/קו-תחתון כפול, ונטוי
 * (italic) בכוכבית/קו-תחתון בודד. כל השאר טקסט. הדגשה נבדקת לפני נטוי,
 * ואין קינון.
 */
export function parseInline(text: string): Inline[] {
  const spans: Inline[] = [];
  const re = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) spans.push({ type: "text", value: text.slice(last, m.index) });
    if (m[2] !== undefined) spans.push({ type: "strong", value: m[2] });
    else spans.push({ type: "em", value: m[4] });
    last = re.lastIndex;
  }
  if (last < text.length) spans.push({ type: "text", value: text.slice(last) });
  return spans.length ? spans : [{ type: "text", value: text }];
}

const UL_RE = /^\s*[-*]\s+(.*)$/;
const OL_RE = /^\s*\d+\.\s+(.*)$/;

/**
 * מפרסר טקסט תשובה ל-Block[]: פסקאות ורשימות. שורה ריקה מסיימת בלוק;
 * שורות „- ”/„* ” → רשימה לא ממוספרת; „1. ” → רשימה ממוספרת; כל השאר —
 * פסקה (שורות רצופות מאוחדות ברווח).
 */
export function parseAnswerMarkdown(input: string): Block[] {
  const lines = (input ?? "").replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "paragraph", spans: parseInline(para.join(" ").trim()) });
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      blocks.push({ type: "list", ordered: list.ordered, items: list.items.map(parseInline) });
      list = null;
    }
  };

  for (const raw of lines) {
    if (!raw.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const ul = raw.match(UL_RE);
    const ol = raw.match(OL_RE);
    if (ul) {
      flushPara();
      if (list && !list.ordered) list.items.push(ul[1].trim());
      else {
        flushList();
        list = { ordered: false, items: [ul[1].trim()] };
      }
    } else if (ol) {
      flushPara();
      if (list && list.ordered) list.items.push(ol[1].trim());
      else {
        flushList();
        list = { ordered: true, items: [ol[1].trim()] };
      }
    } else {
      flushList();
      para.push(raw.trim());
    }
  }
  flushPara();
  flushList();
  return blocks;
}

/**
 * מסיר כפל „פרק N: פרק N” בשורת הייחוס: כאשר שם המקור זהה ל„פרק N”, מציגים
 * „פרק N” בלבד במקום „פרק N: פרק N”. תצוגה בלבד — אינו נוגע בבניית הייחוס.
 */
export function formatCitation(citation: string): string {
  return (citation ?? "").replace(/פרק\s+(\d+)\s*:\s*פרק\s+\1(?!\d)/g, "פרק $1");
}
