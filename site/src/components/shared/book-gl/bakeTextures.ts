import * as THREE from "three";

/**
 * צריבת פני-דף לטקסטורה (Canvas2D → CanvasTexture). הטקסט העברי נצרב *כתמונה*
 * ולא כגאומטריה מסובבת — כך אין שיקוף-UV ואין טקסט-מראה. RTL אמיתי דרך
 * `ctx.direction='rtl'` + יישור-ימין. כל spread מעוצב אחרת (statement / reading /
 * thesis) — עימוד ספר אמיתי, לא „עמודת-טקסט זעירה במרכז”.
 */

// ── פלטת-נייר חמה (Ivory) + דיו ──
const PAPER_HI = "#f6f1e6";
const PAPER_MID = "#efe8da";
const PAPER_LO = "#e7dfcd";
const INK = "#221c16";
const INK_SOFT = "#5b5142";
const ACCENT = "#3f5c4e"; // Sage

export const PAGE_ASPECT = 0.7; // רוחב:גובה של עמוד יחיד
const TEX_H = 1400;
const TEX_W = Math.round(TEX_H * PAGE_ASPECT);

export type PageSide = "left" | "right";

/**
 * שני סוגי-דף בלבד, וזו הנקודה.
 *
 * הספר על עמוד-הבית הוא טריילר, ולכן לכל כפולה יש **מחשבה דומיננטית אחת**:
 * `quote` נושא אותה, ו-`verso` הוא הדף הפונה — שקט, עם שוליים ונשימה. אין
 * „דף-קריאה” עם פסקאות תומכות: מילוי כזה הוא בדיוק מה שגורם לספר להיקרא
 * כתפאורה ולא כציטוט שכדאי לעצור בשבילו.
 *
 * אין שדה `pageNo` באף אחד מהם. עימוד דקורטיבי ליד ציטוט אמיתי נקרא כשיוך
 * („הציטוט הזה נמצא בעמוד 25”), ואת העימוד של המהדורה הסופית אי-אפשר לאמת
 * מכאן. הדרך היחידה לא להמציא שיוך היא לא לצייר מספר.
 */
export type PageSpec =
  /** הדף הנושא — ציטוט מאושר, בניסוח ובשבירות-השורה שנמסרו. */
  | { kind: "quote"; lines: readonly string[] }
  /** הדף הפונה — קו-דגש דק וכותרת רצה שקטה. בעיקר אוויר. */
  | { kind: "verso"; header?: string }
  | { kind: "blank" };

function fontFamily() {
  return '"Frank Ruhl Libre", "Noto Serif Hebrew", Georgia, "Times New Roman", serif';
}

/** רקע-נייר חם עם וריאציית-טון עדינה + שן-נייר כמעט בלתי-נראית (נחוש, לא נראה). */
function paperBackground(ctx: CanvasRenderingContext2D, side: PageSide) {
  // שיפוע-טון עדין: הצד הפונה לשדרה מעט כהה יותר (עמק-הכריכה).
  const spineLeft = side === "left"; // עמוד-שמאל: השדרה בימין
  const g = ctx.createLinearGradient(0, 0, TEX_W, 0);
  if (spineLeft) {
    g.addColorStop(0, PAPER_HI);
    g.addColorStop(0.82, PAPER_MID);
    g.addColorStop(1, PAPER_LO);
  } else {
    g.addColorStop(0, PAPER_LO);
    g.addColorStop(0.18, PAPER_MID);
    g.addColorStop(1, PAPER_HI);
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  // שן-נייר עדינה מאוד — מורגשת, לא רועשת.
  ctx.globalAlpha = 0.018;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(Math.random() * TEX_W, Math.random() * TEX_H, 1, 1);
  }
  ctx.globalAlpha = 1;
}

interface Margins {
  outer: number;
  gutter: number;
  top: number;
  bottom: number;
  textRight: number; // קו-הימין של הטקסט (RTL)
  usableW: number;
}
/**
 * שולי הציטוט אינם סימטריים, וזה לא קישוט.
 *
 * ה-shader מעקם את הגיליון עם עקמומיות *עולה* לכיוון הקצה החופשי
 * (`k = curl * (0.42 + 0.92 * uu)`), ולכן הרצועה שליד הקצה החופשי מתקצרת
 * בפרספקטיבה כמעט עד היעלמות. טקסט שנכנס לרצועה הזו פשוט אינו נראה —
 * נמדד: ציטוט שיושב עד ‎0.088‎ מהקצה נקרא קטוע בצד ימין בזמן הצפייה, בעוד
 * שהטקסטורה עצמה שלמה לחלוטין.
 *
 * לכן שוליים רחבים בקצה החופשי וצרים יותר בשדרה — וזו גם בדיוק המוסכמה
 * הטיפוגרפית של ספר מודפס אמיתי.
 */
function margins(side: PageSide, variant: "text" | "quote" = "text"): Margins {
  const outer = TEX_W * (variant === "quote" ? 0.135 : 0.10);
  const gutter = TEX_W * (variant === "quote" ? 0.115 : 0.175); // צד-השדרה
  const rightPad = side === "left" ? gutter : outer;
  const leftPad = side === "left" ? outer : gutter;
  return {
    outer,
    gutter,
    top: TEX_H * 0.13,
    bottom: TEX_H * 0.12,
    textRight: TEX_W - rightPad,
    usableW: TEX_W - leftPad - rightPad,
  };
}

/** כותרת רצה שקטה. אין כאן מספר-עמוד, ובכוונה — ראו ההערה ב-`PageSpec`. */
function runningHead(ctx: CanvasRenderingContext2D, m: Margins, header?: string) {
  if (!header) return;
  ctx.textAlign = "right";
  ctx.font = `500 ${Math.round(TEX_W * 0.030)}px ${fontFamily()}`;
  ctx.fillStyle = INK_SOFT;
  ctx.globalAlpha = 0.5;
  ctx.fillText(header, m.textRight, TEX_H * 0.085);
  ctx.globalAlpha = 1;
}

/** קו-הדגש הדק (Sage) — אותו סימן-מותג שכבר קיים בזהות. */
function accentRule(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = Math.max(3, TEX_W * 0.006);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - w, y);
  ctx.stroke();
}

/**
 * סימני-פיסוק אינם מילים.
 *
 * ציטוט 10 נגמר בשורה „…כמו מכונות מזל —”, והפריסה הרגילה שלחה את הקו המפריד
 * לשורה משל עצמו. שורה שכל תוכנה סימן-פיסוק אינה שורה טיפוגרפית אלא תקלה.
 * לכן אסימון שכולו פיסוק מודבק אל האסימון שלפניו *לפני* הפריסה, והשניים
 * נשברים יחד או לא נשברים בכלל.
 *
 * הטקסט השמור אינו משתנה: זו שאלה של איפה נשברת השורה, לא של מה כתוב בה.
 */
const PUNCT_ONLY = /^[—–\-.,;:!?…"'”“„»«)(\]\[]+$/u;
function glueOrphanPunctuation(words: string[]): string[] {
  const out: string[] = [];
  for (const w of words) {
    if (out.length && PUNCT_ONLY.test(w)) out[out.length - 1] += " " + w;
    else out.push(w);
  }
  return out;
}

/** פריסת שורה אחת שנמסרה — לשורות-משנה שנכנסות ברוחב הנתון. */
function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = glueOrphanPunctuation(text.split(" "));
  const out: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      out.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [text];
}

/** גובה השורות: בתוך שורה שנמסרה, ובין שורות שנמסרו. */
const LINE_H = 1.28;
const AUTHORED_GAP = 0.34; // רווח נוסף *בין* שורות שנמסרו — שבירה חזקה יותר

interface QuoteFit {
  size: number;
  /** הקבוצות: לכל שורה שנמסרה, שורות-המשנה שלה בפועל. */
  groups: string[][];
  height: number;
}

/**
 * התאמת-גודל לציטוט.
 *
 * שני מצבים, ובהבדל ביניהם נמצא כל ההבדל בין „ציטוט שנוחת” ל„פסקה קטנה”:
 *
 *   1. **בלי פריסה.** מחפשים את הגודל הגדול ביותר שבו *כל* שורה שנמסרה
 *      נכנסת ברוחב. זה המצב הרצוי: שבירות-השורה של הציטוט נשמרות בדיוק,
 *      והציטוטים הקצרים („החלפתם פרצוף. / לא החלפתם דפוס.”) מקבלים את
 *      הסקאלה הגדולה ואת האוויר שמגיע להם.
 *   2. **עם פריסה.** ציטוט ארוך אינו יכול להיכנס בשורה אחת בגודל שנקרא
 *      בגודל-צפייה רגיל. במקרה כזה שורה שנמסרה נפרסת לשורות-משנה — סדר
 *      המילים והניסוח אינם משתנים, רק השבירה הוויזואלית — והשבירות שנמסרו
 *      נשארות חזקות יותר דרך `AUTHORED_GAP`.
 *
 * הרצפה `NOWRAP_FLOOR` היא שמכריעה בין השניים: מתחתיה, „לשמור על השבירה”
 * היה אומר טיפוגרפיה שלא נקראת — וזו לא שמירה על הציטוט אלא ויתור עליו.
 */
function fitQuote(
  ctx: CanvasRenderingContext2D,
  lines: readonly string[],
  usableW: number,
  availH: number,
): QuoteFit {
  const MAX = TEX_W * 0.150;
  const NOWRAP_FLOOR = TEX_W * 0.072;
  const WRAP_MAX = TEX_W * 0.092;
  const ABS_FLOOR = TEX_W * 0.056;

  const measure = (size: number, wrap: boolean): QuoteFit => {
    ctx.font = `800 ${Math.round(size)}px ${fontFamily()}`;
    const groups = lines.map((l) => (wrap ? wrapLine(ctx, l, usableW) : [l]));
    const rows = groups.reduce((n, g) => n + g.length, 0);
    const height = rows * size * LINE_H + (groups.length - 1) * size * AUTHORED_GAP;
    return { size: Math.round(size), groups, height };
  };

  // 1 — בלי פריסה, מהגדול לקטן.
  for (let size = MAX; size >= NOWRAP_FLOOR; size -= 1) {
    const fit = measure(size, false);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (widest <= usableW && fit.height <= availH) return fit;
  }
  // 2 — עם פריסה, מהגדול לקטן.
  for (let size = WRAP_MAX; size >= ABS_FLOOR; size -= 1) {
    const fit = measure(size, true);
    if (fit.height <= availH) return fit;
  }
  return measure(ABS_FLOOR, true);
}

function render(ctx: CanvasRenderingContext2D, spec: PageSpec, side: PageSide) {
  if (spec.kind === "blank") return;
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  if (spec.kind === "quote") {
    const m = margins(side, "quote");
    const availH = TEX_H - m.top - m.bottom;
    const fit = fitQuote(ctx, spec.lines, m.usableW, availH);
    const ruleGap = fit.size * 0.95;
    const ruleH = ruleGap + Math.max(3, TEX_W * 0.006);
    // מירכוז אנכי של הבלוק כולו (ציטוט + קו-הדגש) — הציטוט יושב באמצע הדף,
    // והשוליים סביבו נקראים ככוונה ולא כעמוד ריק-למחצה.
    let y = TEX_H / 2 - (fit.height + ruleH) / 2 + fit.size;

    ctx.font = `800 ${fit.size}px ${fontFamily()}`;
    ctx.fillStyle = INK;
    fit.groups.forEach((group, gi) => {
      for (const row of group) {
        ctx.fillText(row, m.textRight, y);
        y += fit.size * LINE_H;
      }
      if (gi < fit.groups.length - 1) y += fit.size * AUTHORED_GAP;
    });

    y += ruleGap - fit.size * LINE_H + fit.size * 0.3;
    accentRule(ctx, m.textRight, y, TEX_W * 0.24);
    return;
  }

  if (spec.kind === "verso") {
    // הדף הפונה. קו-דגש דק וכותרת רצה שקטה — ותו לא.
    //
    // כאן *לא* מופיע שם-פרק. שמות-הפרקים של הספר אינם ידועים לי, והמצאת
    // שם כזה היא בדיוק סוג-השיוך שאסור להמציא. פסקת-מילוי הייתה גרועה עוד
    // יותר: היא מתחרה בציטוט שממול, וזו הסיבה שהכפולה נקראה קודם כ„מאמר”.
    // ספרים אמיתיים מלאים בחלל לבן — וזה מה שיש כאן.
    const m = margins(side, "text");
    runningHead(ctx, m, spec.header);
    accentRule(ctx, m.textRight, TEX_H * 0.5, TEX_W * 0.16);
    return;
  }
}

export function bakePage(spec: PageSpec, side: PageSide): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  paperBackground(ctx, side);
  render(ctx, spec, side);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

export function bakeBlank(side: PageSide = "right"): THREE.CanvasTexture {
  return bakePage({ kind: "blank" }, side);
}

export function coverTextureFromImage(img: HTMLImageElement): THREE.Texture {
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

/** liner פנימי של הכריכה (endpaper אמיתי) — קרם חמים, לא כהה: זה המשטח
 *  שנחשף כשהכריכה נפתחת, והוא חייב להיראות כנייר-כריכה ולא כלוח שחור. */
export function bakeCoverLiner(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 360;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 360);
  g.addColorStop(0, "#e8dfc9");
  g.addColorStop(1, "#dbd0b6");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 360);
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 1400; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(Math.random() * 256, Math.random() * 360, 1, 1);
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** צל-השדרה (עמק-הכריכה) — כהה-חמים, נראה רק בתחתית העמק. */
export function bakeEndpaper(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 180;
  const ctx = c.getContext("2d")!;
  // כהה-חמים: נראה בעמק-הכריכה ומקנה עומק — לא פס בהיר ולא שחור.
  const g = ctx.createLinearGradient(0, 0, 128, 180);
  g.addColorStop(0, "#6d5c46");
  g.addColorStop(1, "#544736");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 180);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
