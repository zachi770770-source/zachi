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
const TERRA = "#a4552f"; // Terracotta — דגש מבוקר בלבד

export const PAGE_ASPECT = 0.7; // רוחב:גובה של עמוד יחיד
const TEX_H = 1400;
const TEX_W = Math.round(TEX_H * PAGE_ASPECT);

export type PageSide = "left" | "right";

export type PageSpec =
  | {
      kind: "statement";
      big: string[]; // שורות ההצהרה הגדולה
      sub?: string;
      pageNo?: string;
    }
  | {
      kind: "reading";
      kicker?: string;
      heading?: string;
      paras: string[];
      header?: string; // running header
      pageNo?: string;
    }
  | {
      kind: "thesis";
      big: string[];
      sub?: string;
      mark?: boolean; // דגש-מותג קטן
      pageNo?: string;
    }
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
function margins(side: PageSide): Margins {
  const outer = TEX_W * 0.10;
  const gutter = TEX_W * 0.175; // שוליים-פנימיים נדיבים (צד-השדרה)
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

/** מודד כמה שורות ייווצרו מעטיפת-טקסט (בלי לצייר) — לצורך מירכוז אנכי. */
function countWrapped(ctx: CanvasRenderingContext2D, text: string, maxW: number): number {
  const words = text.split(" ");
  let line = "";
  let n = 0;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      n++;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) n++;
  return Math.max(n, 1);
}

/** ציור שורות טקסט עטופות (RTL) מ-y נתון; מחזיר את ה-y הבא. */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lineH;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}

function furniture(ctx: CanvasRenderingContext2D, m: Margins, header?: string, pageNo?: string) {
  ctx.textAlign = "right";
  if (header) {
    ctx.font = `500 ${Math.round(TEX_W * 0.03)}px ${fontFamily()}`;
    ctx.fillStyle = INK_SOFT;
    ctx.globalAlpha = 0.65;
    ctx.fillText(header, m.textRight, TEX_H * 0.075);
    ctx.globalAlpha = 1;
  }
  if (pageNo) {
    ctx.font = `500 ${Math.round(TEX_W * 0.032)}px ${fontFamily()}`;
    ctx.fillStyle = INK_SOFT;
    ctx.globalAlpha = 0.55;
    ctx.textAlign = "center";
    ctx.fillText(pageNo, TEX_W / 2, TEX_H - TEX_H * 0.06);
    ctx.globalAlpha = 1;
  }
}

function render(ctx: CanvasRenderingContext2D, spec: PageSpec, side: PageSide) {
  if (spec.kind === "blank") return;
  const m = margins(side);
  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  if (spec.kind === "statement") {
    // הצהרה גדולה, ניגודיות-קנה-מידה, ממורכזת אנכית, עם קו-דק דק מתחת.
    const bigSize = Math.round(TEX_W * 0.188);
    const bigLH = bigSize * 1.12;
    const subSize = Math.round(TEX_W * 0.068);
    const blockH = spec.big.length * bigLH + (spec.sub ? subSize * 3.4 : 0);
    let y = TEX_H / 2 - blockH / 2 + bigSize;
    ctx.font = `800 ${bigSize}px ${fontFamily()}`;
    ctx.fillStyle = INK;
    for (const line of spec.big) {
      ctx.fillText(line, m.textRight, y);
      y += bigLH;
    }
    // קו-דגש דק (Sage) מתחת להצהרה.
    y += bigLH * 0.12;
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = Math.max(3, TEX_W * 0.006);
    ctx.beginPath();
    ctx.moveTo(m.textRight, y);
    ctx.lineTo(m.textRight - TEX_W * 0.26, y);
    ctx.stroke();
    if (spec.sub) {
      y += subSize * 2.1;
      ctx.font = `500 ${subSize}px ${fontFamily()}`;
      ctx.fillStyle = INK_SOFT;
      drawWrapped(ctx, spec.sub, m.textRight, y, m.usableW, subSize * 1.5);
    }
    furniture(ctx, m, undefined, spec.pageNo);
    return;
  }

  if (spec.kind === "reading") {
    // עמוד-קריאה עריכתי: kicker → heading → פסקאות.
    // מדידה מראש: עמוד „קצר” (פסקה תומכת) ממורכז אנכית במקום להיצמד לראש —
    // כך שהחלל סביבו נקרא כשוליים מכוונים ולא כעמוד ריק-למחצה.
    const ps0 = Math.round(TEX_W * 0.069);
    const hs0 = Math.round(TEX_W * 0.107);
    let contentH = 0;
    if (spec.kicker) contentH += TEX_W * 0.11;
    if (spec.heading) {
      ctx.font = `800 ${hs0}px ${fontFamily()}`;
      contentH += countWrapped(ctx, spec.heading, m.usableW) * hs0 * 1.18 + TEX_W * 0.05;
    }
    ctx.font = `400 ${ps0}px ${fontFamily()}`;
    for (const para of spec.paras) {
      contentH += countWrapped(ctx, para, m.usableW) * ps0 * 1.62 + ps0 * 0.7;
    }
    const short = contentH < TEX_H * 0.42;
    let y = short ? TEX_H / 2 - contentH / 2 + ps0 : m.top + TEX_W * 0.05;
    if (spec.kicker) {
      ctx.font = `700 ${Math.round(TEX_W * 0.056)}px ${fontFamily()}`;
      ctx.fillStyle = TERRA;
      ctx.fillText(spec.kicker, m.textRight, y);
      y += TEX_W * 0.11;
    }
    if (spec.heading) {
      const hs = Math.round(TEX_W * 0.107);
      ctx.font = `800 ${hs}px ${fontFamily()}`;
      ctx.fillStyle = INK;
      y = drawWrapped(ctx, spec.heading, m.textRight, y, m.usableW, hs * 1.18);
      y += TEX_W * 0.05;
    }
    const ps = Math.round(TEX_W * 0.069);
    ctx.font = `400 ${ps}px ${fontFamily()}`;
    ctx.fillStyle = INK;
    for (const para of spec.paras) {
      y = drawWrapped(ctx, para, m.textRight, y, m.usableW, ps * 1.62);
      y += ps * 0.7;
    }
    furniture(ctx, m, spec.header, spec.pageNo);
    return;
  }

  if (spec.kind === "thesis") {
    // נחיתה סופית — הצהרה שקטה ובטוחה, ממורכזת, עם דגש-מותג קטן.
    const bigSize = Math.round(TEX_W * 0.205);
    const bigLH = bigSize * 1.1;
    const subSize = Math.round(TEX_W * 0.066);
    const blockH = spec.big.length * bigLH + (spec.sub ? subSize * 3 : 0);
    let y = TEX_H / 2 - blockH / 2 + bigSize;
    if (spec.mark) {
      // דגש-מותג: נקודת-טרקוטה קטנה מעל ההצהרה.
      ctx.fillStyle = TERRA;
      ctx.beginPath();
      ctx.arc(m.textRight - TEX_W * 0.02, y - bigSize * 1.15, TEX_W * 0.018, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = `800 ${bigSize}px ${fontFamily()}`;
    ctx.fillStyle = INK;
    for (const line of spec.big) {
      ctx.fillText(line, m.textRight, y);
      y += bigLH;
    }
    if (spec.sub) {
      y += subSize * 1.6;
      ctx.font = `500 ${subSize}px ${fontFamily()}`;
      ctx.fillStyle = INK_SOFT;
      drawWrapped(ctx, spec.sub, m.textRight, y, m.usableW, subSize * 1.5);
    }
    furniture(ctx, m, undefined, spec.pageNo);
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
