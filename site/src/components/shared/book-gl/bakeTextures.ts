import * as THREE from "three";

/**
 * צריבת פני-דף לטקסטורה (Canvas2D → CanvasTexture). הטקסט העברי נצרב *כתמונה*
 * ולא כגאומטריה מסובבת — כך אין שיקוף-UV ואין טקסט-מראה: כל פָּן נושא את
 * הטקסטורה הנכונה שלו. RTL אמיתי דרך `ctx.direction='rtl'` + יישור-ימין.
 */

export interface PageContent {
  /** כותרת גדולה (serif, כהה). */
  heading?: string;
  /** שורות-גוף (עד ~4). */
  lines: string[];
  /** תווית-מדור קטנה (עובדה/סיפור וכו׳), אופציונלי. */
  kicker?: string;
}

const PAPER_HI = "#faf8f2";
const PAPER_LO = "#f1ede3";
const INK = "#241f1a";
const INK_SOFT = "#4a4239";
const ACCENT = "#3f5c4e"; // sage-ink for heading

// יחס-צדדים של פני-דף (רוחב:גובה) — דף ספר יחיד.
export const PAGE_ASPECT = 0.72;
const TEX_H = 1024;
const TEX_W = Math.round(TEX_H * PAGE_ASPECT);

function paperBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, PAPER_HI);
  g.addColorStop(0.5, "#f6f3ea");
  g.addColorStop(1, PAPER_LO);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // שן-נייר עדינה (רעש דק) — נייר מט לא-מושלם, לא משטח דיגיטלי-שטוח.
  ctx.globalAlpha = 0.025;
  for (let i = 0; i < 1800; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#000" : "#fff";
    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
  }
  ctx.globalAlpha = 1;
}

/**
 * צורב פני-דף. `side`: "right"|"left" קובע את שולי-הכריכה (gutter) — הצד הפונה
 * לשדרה מקבל שוליים פנימיים גדולים יותר, כמו עימוד ספר אמיתי.
 */
export function bakePage(content: PageContent, side: "left" | "right"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  paperBackground(ctx, TEX_W, TEX_H);

  // שוליים: חיצוני קטן, פנימי (gutter) גדול. RTL: הטקסט מיושר לימין.
  const outer = TEX_W * 0.11;
  const gutter = TEX_W * 0.17;
  const marginRight = side === "right" ? gutter : outer; // צד-שדרה של עמוד-ימין הוא שמאלו... (ראו הערה)
  // בעמוד-ימין השדרה בשמאל; בעמוד-שמאל השדרה בימין. הטקסט RTL מיושר-ימין,
  // ולכן ה„ריפוד” שמזיז את קו-הימין פנימה הוא השוליים-החיצוניים מימין.
  const rightPad = side === "left" ? gutter : outer;
  void marginRight;
  const textRight = TEX_W - rightPad;
  const usableW = TEX_W - outer - gutter;

  ctx.direction = "rtl";
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";

  // בלוק-הטקסט ממורכז אנכית.
  const serif = '"Frank Ruhl Libre", Georgia, "Times New Roman", serif';
  const heads = content.heading ? 1 : 0;
  const kick = content.kicker ? 1 : 0;
  const headSize = Math.round(TEX_W * 0.115);
  const bodySize = Math.round(TEX_W * 0.072);
  const kickSize = Math.round(TEX_W * 0.06);
  const lineGap = bodySize * 1.62;
  const blockH =
    kick * kickSize * 1.8 +
    heads * headSize * 1.35 +
    content.lines.length * lineGap;
  let y = TEX_H / 2 - blockH / 2 + (content.heading ? headSize : bodySize);

  if (content.kicker) {
    ctx.font = `700 ${kickSize}px ${serif}`;
    ctx.fillStyle = ACCENT;
    ctx.fillText(content.kicker, textRight, y, usableW);
    y += kickSize * 1.8;
  }
  if (content.heading) {
    ctx.font = `800 ${headSize}px ${serif}`;
    ctx.fillStyle = ACCENT;
    ctx.fillText(content.heading, textRight, y, usableW);
    y += headSize * 1.35;
  }
  ctx.font = `500 ${bodySize}px ${serif}`;
  ctx.fillStyle = INK;
  for (const line of content.lines) {
    ctx.fillText(line, textRight, y, usableW);
    y += lineGap;
  }
  void INK_SOFT;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/** נייר ריק (גב-דף / דף-בסיס) — אותו נייר מט, בלי טקסט. */
export function bakeBlank(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  paperBackground(ctx, TEX_W, TEX_H);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** צורב את תמונת-הכריכה (מהאלמנט <img> שכבר נטען) לטקסטורה. */
export function coverTextureFromImage(img: HTMLImageElement): THREE.Texture {
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}
