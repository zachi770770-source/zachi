import * as THREE from "three";

import {
  bakePage,
  bakeBlank,
  bakeEndpaper,
  bakeCoverLiner,
  coverTextureFromImage,
  PAGE_ASPECT,
  type PageSpec,
} from "./bakeTextures";

/**
 * סצנת-הספר ב-WebGL (Three.js) — art-direction: „צילום-מוצר עריכתי” של ספר
 * קשיח פתוח, לא הדגמת-WebGL. ספר עברי פיזי: כריכה נפתחת → שלושה spreads
 * מעוצבים שונה → שני דפדופים עם עיקול-נייר מורכב → נחיתה סופית שעומדת כתמונה.
 *
 * RTL: שדרה מימין, הגיליון מתרומם משמאל ומתהפך ימינה, טקסט צרוב כטקסטורה.
 * הלולאה נעצרת בהתיישבות (idle). אין משטח שחור — כל פאה מקבלת חומר אמיתי.
 */

const W = 1; // רוחב עמוד
const H = W / PAGE_ASPECT; // גובה עמוד
const SEG_X = 96; // חלוקה לאורך הרוחב — עיקול חלק, בלי faceting
const SEG_Y = 14; // חלוקה אנכית — מאפשרת עיקול מורכב (compound curve)

// ── מיפוי שלושת ה-spreads (ניסוחי-התֵּמה המאושרים בלבד) ──
// spread 1: הצהרה + פסקה תומכת | spread 2: spread קריאה עריכתי | spread 3: נחיתת-תזה
const R1: PageSpec = {
  kind: "statement",
  big: ["דייטינג", "הוא חיפוש."],
  sub: "למצוא זה רק ההתחלה.",
  pageNo: "9",
};
const L1: PageSpec = {
  kind: "reading",
  paras: ["אהבה היא בנייה.", "לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת."],
  pageNo: "8",
};
const R2: PageSpec = {
  kind: "reading",
  kicker: "עובדה",
  heading: "עובדה היא מה שקרה.",
  paras: ["למצוא זה רק ההתחלה."],
  header: "מדייטים לאהבה",
  pageNo: "25",
};
const L2: PageSpec = {
  kind: "reading",
  kicker: "סיפור",
  heading: "סיפור הוא מה שאנחנו מספרים לעצמנו.",
  paras: ["לבחור אחרת מתחיל בלראות אחרת."],
  pageNo: "24",
};
const R3: PageSpec = {
  kind: "thesis",
  big: ["אהבה", "היא בנייה."],
  mark: true,
  pageNo: "41",
};
const L3: PageSpec = {
  kind: "reading",
  paras: ["לבחור אחרת מתחיל בלראות אחרת."],
  pageNo: "40",
};

// ── shader: עיקול-קשת (inextensible) + עיקול מורכב לאורך הגובה ──
const leafVertex = /* glsl */ `
  uniform float uTheta;   // זווית-בסיס (rad): PI=שמאל שטוח, 0=ימין שטוח
  uniform float uCurl;    // עקמומיות בסיסית (1/רדיוס)
  uniform float uTwist;   // שינוי-עקמומיות לאורך הגובה (compound curve)
  uniform float uW;
  uniform float uH;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vU;
  void main() {
    vUv = uv;
    float u = clamp(position.x / uW, 0.0, 1.0);
    vU = u;
    float v = position.y / uH;                 // -0.5..0.5
    float curl = uCurl * (1.0 + uTwist * v);   // העקמומיות משתנה לאורך הגובה
    float s = u * uW;

    // עיקול בעל *עקמומיות משתנה* (לא קשת מעגלית אחת): הגיליון קשיח ליד השדרה
    // ורך יותר לקראת הקצה החופשי — „מתח-קיפול” אמיתי. אינטגרציה נומרית של
    // זווית-המשיק לאורך הגיליון שומרת על אורך (נייר אינו נמתח).
    const int STEPS = 16;
    float ds = s / float(STEPS);
    float beta = uTheta;
    vec2 acc = vec2(0.0);
    for (int i = 0; i < STEPS; i++) {
      float su = (float(i) + 0.5) * ds;
      float uu = su / uW;
      float k = curl * (0.42 + 0.92 * uu); // קשיח בשדרה → חופשי בקצה
      acc += vec2(cos(beta), sin(beta)) * ds;
      beta += k * ds;
    }
    vec3 pos = vec3(acc.x, position.y, acc.y);
    vec3 nrm = normalize(vec3(-sin(beta), 0.0, cos(beta)));
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorld = wp.xyz;
    vNormalW = normalize(mat3(modelMatrix) * nrm);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

// תאורת-סטודיו מרוסנת: key רך (half-lambert), fill קר-עדין, rim דק, ambient חמים.
const leafFragment = /* glsl */ `
  uniform sampler2D uFront;
  uniform sampler2D uBack;
  uniform vec3 uKeyDir;
  uniform vec3 uFillDir;
  uniform vec3 uCam;
  uniform float uOpacity;
  uniform float uTurnShadow; // עוצמת הצל שמטיל גיליון מתהפך על הדף שמתחת
  uniform float uSheen;  // מרכז פס-האור הרך, בציר-x העולמי
  uniform float uSheenK; // עוצמתו (0 בזמן הרצף, נכנסת רק במצב-המנוחה)
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  varying float vU;

  void main() {
    bool front = gl_FrontFacing;
    vec2 uv = front ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = front ? texture2D(uFront, uv) : texture2D(uBack, uv);
    vec3 n = normalize(vNormalW) * (front ? 1.0 : -1.0);

    // חשיפה מכוילת: הסכום המרבי ~1.08 — נייר מט, בלי הלבנה (blow-out).
    // KEY — מקור רך גדול: half-lambert (wrap) לנפילה עדינה על העיקול.
    float ndl = dot(n, normalize(uKeyDir));
    float key = pow(clamp(ndl * 0.5 + 0.5, 0.0, 1.0), 1.5) * 0.40;
    // FILL — רך מאוד, מונע שחורים מעוכים.
    float fill = clamp(dot(n, normalize(uFillDir)) * 0.5 + 0.5, 0.0, 1.0) * 0.16;
    // RIM — מרוסן, מפריד קצוות בלבד.
    vec3 vdir = normalize(uCam - vWorld);
    float rim = pow(1.0 - clamp(dot(n, vdir), 0.0, 1.0), 3.5) * 0.06;
    // AMBIENT חמים.
    float amb = 0.46;
    float light = amb + key + fill + rim;

    // עמק-הכריכה: אוקלוזיה רכה ליד השדרה (u→0) — לא פס, נפילה הדרגתית.
    float gutter = smoothstep(0.0, 0.24, vU);
    light *= mix(0.74, 1.0, gutter);

    // צל-נע: הגיליון המתהפך מטיל צל רך על הדף שמתחתיו (מתחזק ליד השדרה).
    light *= mix(1.0, 0.80, uTurnShadow * (1.0 - smoothstep(0.0, 0.62, vU)));

    // פס-אור רך שנוסע על הנייר. זהו המנגנון הקריא ביותר במצב-המנוחה: סיבוב
    // ה-key לבדו כמעט אינו משנה דבר על דף שטוח (הנורמל כמעט קבוע), ואילו פס
    // רחב ורך שזוחל לרוחב הכפולה נראה מיד — וזה בדיוק מה שאור-חדר עושה.
    light *= 1.0 + uSheenK * exp(-pow((vWorld.x - uSheen) / 0.85, 2.0));

    // גב-דף מעט כהה וקריר יותר (נייר דק — פחות אור חוזר).
    vec3 col = tex.rgb * light;
    if (!front) col *= vec3(0.88, 0.87, 0.855);

    gl_FragColor = vec4(col, uOpacity);
  }
`;

interface Leaf {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
}

export interface BookControls {
  setProgress: (p: number) => void;
  /**
   * שכבת-החיים שאחרי הרצף: סחיפה זעירה ופרלקסת-גלילה, שתיהן *נוספות* על
   * התנוחה הסופית ואינן משכתבות אותה. נקראת רק אחרי שהרצף הסתיים.
   * @param idleSec זמן רציף בשניות (למחזור הסחיפה)
   * @param scrollP 0..1 — התקדמות הגלילה בתוך ה-Hero
   */
  setAmbient: (idleSec: number, scrollP: number) => void;
  render: () => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
  /** אורך הרצף במילישניות — מקור-אמת אחד, כדי שה-DOM לא ינחש. */
  duration: number;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ── עקומות פיזיקליות ──────────────────────────────────────────────────────
   כל התנועה כאן הייתה `smoothstep`: עקומה סימטרית שמהירותה אפס בשני הקצוות.
   זה בדיוק מה שגורם לאובייקט להיראות כאלמנט-ממשק ולא כגוף בעל מסה — הכול
   מאיץ ובולם באותה מידה, בלי משקל ובלי המשכיות. שלוש העקומות הבאות מחליפות
   אותה במקומות שבהם יש משמעות פיזית. */

/** תגובת-מדרגה של מערכת מרוסנת-קריטית: מגיע מהר, מתיישב בלי לחרוג. */
const settleCritical = (t: number, omega = 7.2) => {
  const x = Math.max(0, t);
  return 1 - Math.exp(-omega * x) * (1 + omega * x);
};

/**
 * זנב-התנודה של אותה הגעה. אינו „קליפ” נפרד — זו אותה מערכת, בריסון נמוך
 * יותר, ולכן ההגעה וההתיישבות הן פעולה פיזית אחת ורציפה.
 */
const wobble = (t: number, omega = 9.5, decay = 5.2) =>
  t <= 0 ? 0 : Math.exp(-decay * t) * Math.sin(omega * t);

/**
 * נפילת-לוח קשיח: התחלה איטית (חיכוך-סטטי), תאוצה, ובלימה נחרצת כשהלוח פוגש
 * את גוש-הדפים. א-סימטרית בכוונה — זה מה שנותן ל-hardcover את המשקל שלו.
 */
const weightedFall = (t: number) => {
  const x = clamp01(t);
  // המעריך ירד 1.85→1.5 והמעבר הוקדם 0.42→0.30: בכיול הקודם הלוח היה עדיין
  // כמעט סגור אחרי 440ms (‎θ≈25°‎), וההמתנה נקראה כעצירה ולא כמשקל. עכשיו
  // הציר „נשבר” בתוך ~150ms, מאיץ, ונבלם בסוף.
  const accel = Math.pow(x, 1.5);
  const arrest = 1 - Math.pow(1 - x, 2.2);
  return clamp01(lerp(accel, arrest, smooth((x - 0.3) / 0.7)));
};

/** דף שמתהפך: הרמה מהירה, הנחה איטית. הפוך מנפילת-הלוח. */
const pageTurn = (t: number) => {
  const x = clamp01(t);
  const lift = 1 - Math.pow(1 - x, 1.55);
  const lay = Math.pow(x, 1.35);
  return clamp01(lerp(lift, lay, smooth(x)));
};

export function createBookScene(
  canvas: HTMLCanvasElement,
  coverImg: HTMLImageElement,
  opts: { dpr: number; mobile: boolean },
): BookControls {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(opts.dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 100);

  // תאורה: key מלמעלה-שמאל-קדימה, fill נגדי רך.
  const keyDir = new THREE.Vector3(-0.42, 0.82, 0.72).normalize();
  const fillDir = new THREE.Vector3(0.6, 0.25, 0.5).normalize();

  const book = new THREE.Group();
  scene.add(book);

  // ── טקסטורות ──
  const blankR = bakeBlank("right");
  const blankL = bakeBlank("left");
  const endpaper = bakeEndpaper();   // כהה — עמק-השדרה
  const coverLiner = bakeCoverLiner(); // קרם — הצד הפנימי של הכריכה
  const coverTex = coverTextureFromImage(coverImg);
  const texR1 = bakePage(R1, "right");
  const texL1 = bakePage(L1, "left");
  const texR2 = bakePage(R2, "right");
  const texL2 = bakePage(L2, "left");
  const texR3 = bakePage(R3, "right");
  const texL3 = bakePage(L3, "left");

  const leafGeo = new THREE.PlaneGeometry(W, H, SEG_X, SEG_Y);
  // חפיפה קטנה מעבר לשדרה: מונעת „תפר” בהיר בעמק-הכריכה בין שני העמודים.
  leafGeo.translate(W / 2 - 0.016, 0, 0);

  function makeLeaf(front: THREE.Texture, back: THREE.Texture): Leaf {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uFront: { value: front },
        uBack: { value: back },
        uTheta: { value: Math.PI },
        uCurl: { value: 0 },
        uTwist: { value: 0.22 },
        uW: { value: W },
        uH: { value: H },
        uKeyDir: { value: keyDir },
        uFillDir: { value: fillDir },
        uCam: { value: camera.position },
        uOpacity: { value: 1 },
        uTurnShadow: { value: 0 },
        uSheen: { value: 0 },
        uSheenK: { value: 0 },
      },
      vertexShader: leafVertex,
      fragmentShader: leafFragment,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(leafGeo, mat);
    book.add(mesh);
    return { mesh, mat };
  }

  // דפי-בסיס + גיליונות מתהפכים (front נראה ב-θ=0, back ב-θ=π).
  const baseRight = makeLeaf(texR1, blankR);
  const baseLeft = makeLeaf(blankL, texL3);

  // ── בריכת-הגיליונות המתהפכים ───────────────────────────────────────────
  // הספר מדפדף בלי סוף, ולכן אין כאן „שני גיליונות שמתהפכים פעם אחת” אלא
  // בריכה ממוחזרת: כל גיליון מתהפך, נח בערימה השמאלית, וכשהוא קבור תחת
  // שלושה שנחתו אחריו הוא מוחזר אל תחתית הערימה הימנית — מתחת לגיליונות
  // הממתינים, כלומר מוסתר לחלוטין ברגע ההחזרה. זו הסיבה שאין „קפיצת-לולאה”:
  // שום דבר אינו חוזר למקומו לעיני הצופה, והזרם פשוט נמשך.
  const POOL = opts.mobile ? 4 : 5;
  const SPREADS = [
    { r: texR1, l: texL1 },
    { r: texR2, l: texL2 },
    { r: texR3, l: texL3 },
  ];
  const turners: Leaf[] = [];
  for (let i = 0; i < POOL; i += 1) {
    turners.push(makeLeaf(SPREADS[i % 3].r, SPREADS[i % 3].l));
  }

  // ── גוש-הדפים ──────────────────────────────────────────────────────────
  // גוף הערימה: תיבה בעובי אמיתי (ספר של כמה מאות עמודים בקנה-המידה הזה), עם
  // טריז — עבה ליד השדרה ודקה יותר בקצה החופשי, כמו ספר פתוח באמת. את *פני*
  // הערימה אין התיבה מציירת: בזווית-הצפייה כאן פאותיה נצפות מהקצה ונעלמות,
  // ולכן קצוות-הדפים הנראים הם רצועות-הפרישה שבהמשך. התיבה עצמה היא רק הגוף
  // האטום שמאחוריהן, ולכן חומר אחד בצבע-נייר מספיק לה.
  const BLOCK_T = 0.29; // עובי גוש-הדפים לכל צד — ספר עבה, לא חוברת
  const PAPER_FACE = 0xe9dfc8;
  // צד-ימין קיים תמיד ואטימותו לעולם אינה משתנה, ולכן ‎transparent:false‎:
  // הוא חוזר אל מסלול-הרינדור האטום — כתיבת-עומק וסדר קדמי-אחורי — ולכן פחות
  // שכבות נצבעות מיותר. אותו שיקול חל על שאר חומרי צד-ימין למטה.
  const blockFaceR = new THREE.MeshBasicMaterial({ color: PAPER_FACE });
  const blockFaceL = new THREE.MeshBasicMaterial({ color: PAPER_FACE, transparent: true, opacity: 0 });
  function makeBlock(sign: 1 | -1) {
    const geo = new THREE.BoxGeometry(W * 0.99, H * 0.985, BLOCK_T);
    // טריז: הקצה החופשי דק ב-18% מהשדרה. `sign` קובע לאיזה כיוון ה„חוץ”.
    const pos = geo.attributes.position;
    const halfW = (W * 0.99) / 2;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i);
      const outward = sign === 1 ? (x + halfW) / (2 * halfW) : 1 - (x + halfW) / (2 * halfW);
      pos.setZ(i, pos.getZ(i) * (1 - 0.18 * outward));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    // חומר *אחד* לכל התיבה. קודם היו כאן שלושה חומרים לפי פאה, ו-BoxGeometry
    // מפצל אותם לשש קבוצות — שש קריאות-ציור לכל חצי. מאז שרצועות-הערימה
    // מכסות את פאות ה-‎±x/±y‎ ממילא, הפאות האלה אינן נראות: נמדד שהסרתן משנה
    // 3 פיקסלים בפריים הפתוח ו-125 בפריים באמצע הפתיחה. כלומר עשר קריאות-ציור
    // שלא ציירו דבר.
    const m = new THREE.Mesh(geo, sign === 1 ? blockFaceR : blockFaceL);
    m.position.set(sign * W * 0.5, 0, -BLOCK_T / 2 - 0.004);
    book.add(m);
    return m;
  }
  const blockR = makeBlock(1);
  const blockL = makeBlock(-1);

  // ── פריסת-הערימה (flare) ───────────────────────────────────────────────
  // בבידוד (רינדור הגוש לבדו) נמדד שהתיבה מציגה למצלמה אך ורק את פאתה
  // הקדמית: בזווית-הצפייה של ה-Hero מישור-הספר כמעט מקביל למישור-המסך, ולכן
  // פאות-הצד של הגוש נצפות כמעט מהקצה — קצה חופשי ‎~2px‎, קצה תחתון ‎~6px‎.
  // כלומר עובי גאומטרי לבדו אינו יכול להיקרא כאן, לא משנה כמה נגדיל אותו.
  // (ניסיון קודם — משטח משופע *פנימה* מקצה הדף — נמדד בבידוד כנראה לגמרי,
  // אבל בתמונה המלאה הוא מוסתר בדיוק על-ידי הדף שמעליו, ולכן לא שינה כלום.)
  //
  // מה שכן נקרא הוא משטח הפונה אל הצופה ונמצא *מחוץ* לצללית הדף. בספר פתוח
  // אמיתי זה בדיוק מה שקורה: הגיליונות אינם נשארים ניצבים כמו בספר סגור אלא
  // נפרשים החוצה, והערימה מציגה משטח רחב של קצוות-דפים סביב הדף העליון.
  //
  // לכן הרצועה כאן *צירית*: היא מחוברת לקצה-הדף, ובספר סגור היא ניצבת (90°)
  // ואז היא בדיוק פאת-הצד של הגוש — רוחב-מסך אפס, כמו שצריך. ככל שהספר נפתח
  // היא נרגעת אל ‎~41°‎ ונפרשת החוצה. זו אותה גאומטריה לאורך כל הרצף, ולא
  // „חתיכה שמופיעה”: המסה נבנית מהתנועה הפיזית עצמה.
  const FLARE = BLOCK_T * 1.22;
  const FLARE_SHUT = Math.PI / 2; // ניצב — הגיליונות מהודקים, ספר סגור
  // הקצה התחתון נשאר כמעט ניצב בספר סגור (‎83°‎) ולא ניצב לגמרי: כך יש לו
  // שטח-מסך זעיר לאורך תחתית הספר הסגור, בלי שהערימה תבלוט מעבר ללוח-הכריכה
  // — מה שהיה קורה בזווית קטנה יותר, ונראה שם כלשונית תלושה.
  const FLARE_SHUT_BOT = 1.45;
  const FLARE_OPEN = 0.70; // ‎~40°‎ — הקצה החופשי נרגע ונפרש
  // הקצה התחתון נשאר תלול בהרבה. כשהוא נפרש באותה זווית כמו הקצה החופשי הוא
  // מקבל שטח-מסך גדול מדי ונקרא כ„מדף לבן” שהספר מונח עליו — נמדד ונפסל.
  const FLARE_OPEN_BOT = 1.12; // ‎~64°‎
  const BLOCK_HX = (W * 0.99) / 2;
  const BLOCK_HY = (H * 0.985) / 2;

  // ── קצוות-הגיליונות: צלעות, לא טקסטורה ────────────────────────────────
  // גרסה קודמת ציירה את קצה-הערימה כטקסטורת-קנבס על מרובע אחד. היא נכשלה
  // חזותית משתי סיבות שמצטרפות זו לזו: (1) ‎mipmapping‎ — טקסטורה של מאות
  // קווים שנדגמת על ‎~20px‎ של מסך ממוצעת לגוון אחיד, כלומר בדיוק „כרטיס
  // קרם”; (2) גם גרדיאנט עם תשעה תפרים אינו „הרבה דפים” — הוא משטח מגוון.
  //
  // כאן הקצה הוא *גאומטריה*: כל גיליון הוא צלע משלו, עם צבע-קודקוד שטוח
  // משלה. אין מה למרוח — כל צלע מכסה פיקסל או שניים ונשארת נפרדת, ולכן העין
  // רואה ערימה של קצוות ולא לוח. העלות: ‎~26‎ צלעות לרצועה, קריאת-ציור אחת.
  // ── קצוות-הדפים ────────────────────────────────────────────────────────
  // גלגול קודם חילק את הרצועה ל-30 צלעות גאומטריות, כל אחת בגוון שטוח משלה.
  // בתמונה הנראית זה לא נקרא כגיליונות אלא כעשר שכבות עבות: לצלע אין *חריץ*
  // — היא משטח בגוון אחיד — ושתי צלעות שכנות נבדלות רק במעט, כך שהן נמזגות
  // לאזורים רחבים. מה שהופך קצה-ספר לקצה-ספר הוא הרווח הכהה הדק בין גיליון
  // לגיליון, והוא חייב להיות חד ברמת הפיקסל.
  //
  // לכן הפעם הקצוות מחושבים *לכל פיקסל*: הרצועה היא מרובע רציף שנושא את
  // עומק-הערימה כ-varying, והשיידר מצייר שם קווים בתדר גבוה עם ריווח לא-אחיד
  // (שתי תנודות זרות זו לזו), קבוצות-כריכה עמוקות יותר כל ~7 גיליונות, ורעש
  // דק מתחתיהם. אין כאן טקסטורה ולכן אין מיפמאפ שממצע את הקווים, ואין
  // גאומטריה ולכן אין תלות במספר משולשים. `fwidth` מרכך את הקווים בדיוק כשהם
  // יורדים מתחת לפיקסל — שם נייר אמיתי גם נראה כגוון אחיד ולא כפסים.
  const PAPER = new THREE.Color().setHex(0xeee5d0, THREE.SRGBColorSpace);
  const FORE_TINT = 0.9;
  const BOT_TINT = 0.62;
  const bandVertex = /* glsl */ `
    attribute float aU; // 0 = צמוד לדף העליון, 1 = השפה החיצונית
    varying float vU;
    void main() {
      vU = aU;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const bandFragment = /* glsl */ `
    precision highp float;
    uniform vec3 uPaper;
    uniform float uTint;
    uniform float uOpacity;
    uniform float uGlint;  // מיקום הנצנוץ לאורך עומק-הערימה (0..1)
    uniform float uGlintK; // עוצמתו
    uniform float uDens;   // גיליונות לרוחב הערימה — מכויל לרזולוציית המכשיר
    varying float vU;

    void main() {
      float u = clamp(vU, 0.0, 1.0);

      // ריווח לא-אחיד: גיליונות אמיתיים אינם מסורק. שתי תנודות זרות מספיקות
      // כדי שהעין לא תזהה מחזוריות.
      // הצפיפות מכוילת אל *הפיקסל*, לא אל מספר העמודים בספר: רצועה של
      // ‎~50px‎ יכולה להחזיק בערך 30 קווים נפרדים. בצפיפות של 118 (שנוסתה
      // קודם) כל קו יורד לחצי פיקסל, ה-AA ממצע אותו, והרצועה חוזרת להיות
      // לוח חלק — מה שקרה בפועל.
      float p = u * uDens + 2.2 * sin(u * 17.0) + 0.9 * sin(u * 47.0 + 1.7);
      float w = fwidth(p);
      float f = fract(p);
      // החריץ דק: כהה על ‎~20%‎ מהמחזור, בהיר על השאר. גרסה עם חריץ רחב יצרה
      // „גרעין עץ” — רצועה כהה ומנומרת ולא נייר בהיר עם קווים.
      float crease = smoothstep(0.0, 0.17, f) * smoothstep(1.0, 0.85, f);
      float aa = 1.0 - smoothstep(0.75, 1.9, w);
      float sheets = mix(0.93, mix(0.66, 1.02, crease), aa);

      // הבדל-בהירות *לכל גיליון* (קבוע בתוך הגיליון, ולכן אינו מנומר):
      // נייר אמיתי אינו אחיד, וזה מה שמונע „מסרק” מכני.
      float idx = floor(p);
      float n = fract(sin(idx * 127.13) * 43758.545);
      sheets *= 0.95 + 0.1 * n;

      // קבוצות-כריכה: כל ~6 גיליונות מפגש קיפול עמוק מעט יותר.
      float q = p / 6.0;
      float qf = fract(q);
      float sig = smoothstep(0.0, 0.14, qf) * smoothstep(1.0, 0.9, qf);
      sheets *= mix(1.0, mix(0.82, 1.0, sig), 1.0 - smoothstep(0.5, 1.3, fwidth(q)));

      // פרופיל-הערימה: צל-מגע עמוק מתחת לדף העליון, אמצע מואר, שפה מתגלגלת
      // אל הצל. שני הגבולות האלה הם מה שמפריד את הערימה מהדף ומהרקע.
      float k = 0.56 + 0.44 * smoothstep(0.0, 0.14, u);
      k *= 1.0 - 0.3 * smoothstep(0.5, 1.0, u);

      // נצנוץ שזוחל על הערימה.
      float g = exp(-pow((u - uGlint) / 0.14, 2.0));

      vec3 col = uPaper * (k * sheets * uTint) * (1.0 + uGlintK * g);
      gl_FragColor = vec4(col, uOpacity);
    }
  `;
  const makeBandMat = (opacity: number, tint: number) =>
    new THREE.ShaderMaterial({
      uniforms: {
        uPaper: { value: PAPER },
        uTint: { value: tint },
        uOpacity: { value: opacity },
        uGlint: { value: -9 },
        uGlintK: { value: 0 },
        uDens: { value: 30 },
      },
      vertexShader: bandVertex,
      fragmentShader: bandFragment,
      side: THREE.DoubleSide, // בתחילת הפתיחה, כשהרצועה כמעט ניצבת, רואים את גבה
      transparent: true,
    });
  const bandForeR = makeBandMat(1, FORE_TINT);
  const bandForeL = makeBandMat(0, FORE_TINT);
  const bandBotR = makeBandMat(1, BOT_TINT);
  const bandBotL = makeBandMat(0, BOT_TINT);
  const bandMats = [bandForeR, bandForeL, bandBotR, bandBotL];
  const bandMatsL = [bandForeL, bandBotL];

  /**
   * מרובע-הערימה. `along` הוא ציר-הגיליונות, `depth` ציר-העובי. הגאומטריה
   * צפופה רק כדי לשאת את צורת הערימה (בליטה באמצע, צלילה אל עמק-הכריכה);
   * הקווים עצמם אינם תלויים בה כלל.
   */
  function stackBand(opts: {
    alongHalf: number;
    alongSegs: number;
    depth: number;
    depthSign: 1 | -1;
    swap: boolean;
    alongOffset: number;
    scaleAt: (along: number) => number;
  }): THREE.BufferGeometry {
    const { alongHalf, alongSegs, depth, depthSign, swap, alongOffset, scaleAt } = opts;
    const DEPTH_SEGS = 6;
    const pos: number[] = [];
    const us: number[] = [];
    const put = (a: number, u: number, sc: number) => {
      const d = depthSign * depth * u * sc;
      if (swap) pos.push(a, d, 0);
      else pos.push(d, a, 0);
      us.push(u);
    };
    for (let i = 0; i < DEPTH_SEGS; i += 1) {
      const u0 = i / DEPTH_SEGS;
      const u1 = (i + 1) / DEPTH_SEGS;
      for (let j = 0; j < alongSegs; j += 1) {
        const a0 = -alongHalf + (2 * alongHalf * j) / alongSegs + alongOffset;
        const a1 = -alongHalf + (2 * alongHalf * (j + 1)) / alongSegs + alongOffset;
        const s0 = scaleAt(a0);
        const s1 = scaleAt(a1);
        put(a0, u0, s0); put(a1, u0, s1); put(a1, u1, s1);
        put(a0, u0, s0); put(a1, u1, s1); put(a0, u1, s0);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aU", new THREE.Float32BufferAttribute(us, 1));
    return g;
  }

  function makeFlare(sign: 1 | -1, edge: "fore" | "bottom"): THREE.Mesh {
    const cx = sign * W * 0.5;
    let mesh: THREE.Mesh;
    if (edge === "fore") {
      const geo = stackBand({
        alongHalf: BLOCK_HY,
        alongSegs: 6,
        depth: FLARE,
        depthSign: sign,
        swap: false,
        alongOffset: 0,
        // גוש-דפים אמיתי מתנפח באמצע ומתכנס אל הפינות.
        scaleAt: (y) => 1 - 0.22 * (Math.abs(y) / BLOCK_HY) ** 2,
      });
      mesh = new THREE.Mesh(geo, sign === 1 ? bandForeR : bandForeL);
      mesh.position.set(cx + sign * BLOCK_HX, 0, 0.002);
    } else {
      // חריגה החוצה בחצי-עובי: חריגה מלאה יצרה „לשונית” מעבר לרצועת-הקצה.
      const over = FLARE * 0.5;
      const geo = stackBand({
        alongHalf: BLOCK_HX + over / 2,
        alongSegs: 18,
        depth: FLARE,
        depthSign: -1,
        swap: true,
        alongOffset: (sign * over) / 2,
        // הערימה צוללת אל עמק-הכריכה: ליד השדרה כמעט אין עובי נראה.
        scaleAt: (x) => 0.42 + 0.58 * clamp01(Math.abs(cx + x) / (W * 0.995)) ** 0.55,
      });
      mesh = new THREE.Mesh(geo, sign === 1 ? bandBotR : bandBotL);
      mesh.position.set(cx, -BLOCK_HY, 0.002);
    }
    book.add(mesh);
    return mesh;
  }
  const flareForeR = makeFlare(1, "fore");
  const flareBotR = makeFlare(1, "bottom");
  const flareForeL = makeFlare(-1, "fore");
  const flareBotL = makeFlare(-1, "bottom");
  const flaresL = [flareForeL, flareBotL];
  /** פרישת-הערימה: ‎k=0‎ ספר סגור (הגיליונות מהודקים), ‎k=1‎ פתוח ונרגע. */
  function setFlare(sign: 1 | -1, k: number) {
    const fore = sign === 1 ? flareForeR : flareForeL;
    const bot = sign === 1 ? flareBotR : flareBotL;
    fore.rotation.y = sign * lerp(FLARE_SHUT, FLARE_OPEN, k);
    bot.rotation.x = lerp(FLARE_SHUT_BOT, FLARE_OPEN_BOT, k);
  }

  // ── גיליונות-מילוי (fan leaves) ────────────────────────────────────────
  // שלושה גיליונות סטטיים לכל צד, מתחת לדפים המונפשים ומעל הגוש. הם אינם
  // נושאים טקסט ואינם מתהפכים — תפקידם היחיד הוא שכבתיות: כשהדף העליון
  // מתעקל, הקצוות שמתחתיו נחשפים בהדרגה, והגיליון המתהפך נראה כחלק מערימה
  // ולא כמישור בודד מעל פרוסה. גאומטריה דלילה (24×4 במקום 96×14) כי הם כמעט
  // ואינם מתעקלים — התוספת זניחה גם במובייל.
  const fanGeo = new THREE.PlaneGeometry(W * 0.988, H * 0.992, 24, 4);
  fanGeo.translate((W * 0.988) / 2 - 0.016, 0, 0);
  // מספר הגיליונות הממשיים שמתחת לדף העליון. שלושה נתנו „כמה מישורים”;
  // כאן הם גם רבים יותר וגם *מדורגים*: כל גיליון עמוק יותר קצר במעט, ולכן
  // בקצה החופשי נראית סדרת קצוות ולא קצה אחד.
  const FAN_PER_SIDE = opts.mobile ? 4 : 7;
  function makeFanLeaf(front: THREE.Texture, back: THREE.Texture): Leaf {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uFront: { value: front },
        uBack: { value: back },
        uTheta: { value: 0 },
        uCurl: { value: 0 },
        uTwist: { value: 0.18 },
        uW: { value: W },
        uH: { value: H },
        uKeyDir: { value: keyDir },
        uFillDir: { value: fillDir },
        uCam: { value: camera.position },
        uOpacity: { value: 1 },
        uTurnShadow: { value: 0 },
        uSheen: { value: 0 },
        uSheenK: { value: 0 },
      },
      vertexShader: leafVertex,
      fragmentShader: leafFragment,
      side: THREE.DoubleSide,
      transparent: true,
    });
    const mesh = new THREE.Mesh(fanGeo, mat);
    book.add(mesh);
    return { mesh, mat };
  }
  const fanR: Leaf[] = [];
  const fanL: Leaf[] = [];
  for (let i = 0; i < FAN_PER_SIDE; i += 1) {
    const r = makeFanLeaf(blankR, blankR);
    const l = makeFanLeaf(blankL, blankL);
    // הקיצור מצטבר כלפי מטה בערימה. הגאומטריה מוזזת כך שראשיתה בשדרה, ולכן
    // הקנה-מידה מקצר אך ורק את הקצה החופשי — בדיוק כמו בערימת דפים אמיתית.
    const k = 1 - (i + 1) * 0.0055;
    r.mesh.scale.set(k, 1 - (i + 1) * 0.0022, 1);
    l.mesh.scale.set(k, 1 - (i + 1) * 0.0022, 1);
    fanR.push(r);
    fanL.push(l);
  }

  // ── לוחות-כריכה (hardcover) — חום כהה חמים, לא שחור, עם overhang ──
  const boardMatR = new THREE.MeshBasicMaterial({ color: 0x3a2f26 });
  const boardMatL = new THREE.MeshBasicMaterial({ color: 0x3a2f26, transparent: true, opacity: 0 });
  const BOARD_T = 0.048;
  function makeBoard(sign: 1 | -1) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(W * 1.06, H * 1.05, BOARD_T),
      sign === 1 ? boardMatR : boardMatL,
    );
    m.position.set(sign * W * 0.5, 0, -BLOCK_T - BOARD_T / 2 - 0.006);
    book.add(m);
    return m;
  }
  const boardR = makeBoard(1);
  const boardL = makeBoard(-1);

  // ── השדרה (בספר הסגור) ────────────────────────────────────────────────
  // הכריכה הקדמית כאן היא מישור ללא עובי, ולכן לספר הסגור לא היה שום פרופיל
  // צדי — וזה מה שגרם לו להיקרא כחוברת דקה. השדרה היא לוח דק שעוביו הוא עובי
  // הספר כולו (גוש + לוח אחורי), והיא הרמז היחיד למסה שבאמת נראה כשהספר סגור.
  // עם פתיחת הכריכה היא נעשית ניצבת למבט וממילא מיותרת, ולכן היא נמוגה מוקדם.
  const SLAB = BLOCK_T + BOARD_T;
  const spineSlabMat = new THREE.MeshBasicMaterial({ color: 0x453629, transparent: true, opacity: 1 });
  const spineSlab = new THREE.Mesh(new THREE.BoxGeometry(0.052, H * 1.035, SLAB), spineSlabMat);
  spineSlab.position.set(-0.016, 0, 0.03 - SLAB / 2);
  book.add(spineSlab);

  // endpaper בעמק-הכריכה (מונע „חור” כהה בין הגושים).
  const spineMat = new THREE.MeshBasicMaterial({ map: endpaper, transparent: true, opacity: 0 });
  const spine = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.14, H * 0.99), spineMat);
  spine.position.set(0, 0, -0.035);
  book.add(spine);

  // ── הכריכה הקדמית (נפתחת) — פנים=אמנות-המותג, גב=endpaper (לא שחור) ──
  const coverGeo = new THREE.PlaneGeometry(W, H, 24, 6);
  coverGeo.translate(W / 2, 0, 0);
  const coverMat = new THREE.ShaderMaterial({
    uniforms: {
      uFront: { value: coverTex },
      uBack: { value: coverLiner },
      uTheta: { value: 0 },
      uCurl: { value: 0 },
      uTwist: { value: 0.05 },
      uW: { value: W * 1.045 },
      uH: { value: H },
      uKeyDir: { value: keyDir },
      uFillDir: { value: fillDir },
      uCam: { value: camera.position },
      uOpacity: { value: 1 },
      uTurnShadow: { value: 0 },
      uSheen: { value: 0 },
      uSheenK: { value: 0 },
    },
    vertexShader: leafVertex,
    fragmentShader: leafFragment,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  // הבלטת-הכריכה צומצמה 4.5%→1.2%: בערך-הקודם הכריכה הסתירה לגמרי את קצה
  // גוש-הדפים בכל זווית סבירה, ולכן הספר הסגור נראה חסר-עובי. בספר אמיתי
  // ההבלטה היא ~2% — והקצה נשאר גלוי.
  cover.scale.set(1.012, 1.016, 1);
  book.add(cover);

  // ── צל-הארקה רך מתחת לספר ──
  function radialShadow(): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
    g.addColorStop(0, "rgba(24,18,12,0.5)");
    g.addColorStop(0.45, "rgba(24,18,12,0.22)");
    g.addColorStop(1, "rgba(24,18,12,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(128, 128, 126, 92, 0, 0, Math.PI * 2);
    ctx.fill();
    return new THREE.CanvasTexture(c);
  }
  const shadowMat = new THREE.MeshBasicMaterial({
    map: radialShadow(),
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 3.4, H * 1.5), shadowMat);
  shadow.position.set(0, 0, -0.14);
  book.add(shadow);

  // ── מצלמה: זווית עריכתית — נמוכה יותר, קרובה, פרספקטיבה מתונה ──
  const PITCH = -0.5; // ~29° — זווית עריכתית מחמיאה: רואים עובי, וגם קוראים דף
  book.rotation.x = PITCH;
  function frame(dist: number, lift: number) {
    camera.position.set(0, lift, dist);
    camera.lookAt(0, -0.02, 0);
    camera.updateMatrixWorld();
  }
  frame(5.25, 1.16);

  // ── timeline ──────────────────────────────────────────────────────────────
  // הרצף מוגדר ב*מילישניות* ולא בשברים מופשטים: כשהשלבים נקובים בזמן אפשר
  // לכוון אותם לפי מה שרואים, והחפיפות ביניהם מפורשות. `p` (0..1) שנשמר
  // בממשק ממופה חזרה לזמן, כדי שוו-הבדיקה `__book.setProgress` ימשיך לעבוד.
  //
  // החפיפות הן העיקר: הפתיחה מתחילה בזמן שזנב-ההתיישבות עדיין דועך, ולכן
  // הגעה → התיישבות → פתיחה נקראות כפעולה פיזית אחת ולא כשלושה קליפים.
  const T = {
    arriveEnd: opts.mobile ? 560 : 620,
    wobbleFrom: opts.mobile ? 500 : 560, // מתחיל *לפני* סוף ההגעה — בלי תפר
    openFrom: opts.mobile ? 610 : 690,
    openTo: opts.mobile ? 1760 : 2000,
    breathTo: opts.mobile ? 2000 : 2260,
    // הרצף הפותח נגמר ברגע שהספר פתוח ומיושב. הדפדוף עצמו כבר אינו חלק ממנו
    // אלא זרם מתמשך שמנוהל בשכבה הרצה — ולכן אין „סוף אנימציה”.
    total: opts.mobile ? 2320 : 2620,
  };
  const DURATION = T.total;
  const ms = (p: number) => clamp01(p) * DURATION;
  const win = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

  const CURL_TURN = 2.0;
  const REST_CURL = 0.4; // עיקול-מנוחה — הדפים אינם מישורים שטוחים
  const Z_LIFT = 0.1;

  // עיקול-מנוחה תלוי-צד: ימין +, שמאל − (כדי ששני העמודים יתרוממו כלפי חוץ).
  const restCurlAt = (t: number) => lerp(-REST_CURL, REST_CURL, t);

  // כיוון-התאורה הבסיסי, ומנוע-סיבוב סביב ציר-Y. התאורה כאן היא uniform ולא
  // אור-סצנה, ולכן סיבובה זול לחלוטין — וזה מה שהופך סיבוב של גוף מואר
  // מ„טקסטורה שמחליקה” ל„אור שנוסע על פני החומר”.
  const KEY_BASE = new THREE.Vector3(-0.42, 0.82, 0.72).normalize();
  const setKeyYaw = (rad: number, pitchDelta: number) => {
    const c = Math.cos(rad);
    const sn = Math.sin(rad);
    keyDir
      .set(
        KEY_BASE.x * c - KEY_BASE.z * sn,
        KEY_BASE.y + pitchDelta,
        KEY_BASE.x * sn + KEY_BASE.z * c,
      )
      .normalize();
  };

  // התנוחה הסופית — נשמרת כדי ששכבת-החיים תוסיף עליה ולא תדרוס אותה.
  const pose = {
    dist: 4.9,
    lift: 1.02,
    rotX: PITCH,
    rotY: 0.012,
    distNow: 6.35,
    liftNow: 1.28,
    rotXNow: -0.46,
    rotYNow: -0.32,
    fanRestR: [] as number[],
    fanRestL: [] as number[],
    shadowNow: 0.74,
    flareR: 0,
    flareL: 0,
  };

  // ── לוח-הדפדוף ─────────────────────────────────────────────────────────
  // הדפדוף אינו „שני אירועים בתוך הרצף” אלא זרם אינסופי. הזמנים נבנים פעם
  // אחת מראש עם ריווח לא-אחיד, ובסוף כל מחזור של עשרה דפים יש הפוגת-קריאה
  // קצרה. ההפוגה היא מה שמונע „דפדוף קדחתני”, והמיחזור (ראו בריכת-הגיליונות)
  // הוא מה שמונע קפיצת-לולאה: הזרם פשוט נמשך, ואין לו גבול נראה.
  const TURNS_PER_CYCLE = 10;
  const MOVE_LEAD = 1.9; // שניות לפני תורו שבהן הגיליון מוחזר אל צד ימין
  const rnd = (n: number) => Math.abs((Math.sin(n * 91.7) * 4375.85) % 1);
  const turnStart: number[] = [];
  const turnDur: number[] = [];
  {
    let acc = 0.5; // ההשהיה בין סוף הרצף הפותח לדף הראשון
    for (let n = 0; n < 1400; n += 1) {
      turnStart.push(acc);
      turnDur.push(0.78 + 0.2 * rnd(n + 3));
      const cycleEnd = (n + 1) % TURNS_PER_CYCLE === 0;
      acc += 0.84 + 0.26 * rnd(n) + (cycleEnd ? 2.8 + 0.9 * rnd(n + 11) : 0);
    }
  }
  /** אינדקס הדף שתורו התחיל לאחרונה (−1 לפני הראשון). */
  function turnIndexAt(t: number): number {
    if (t < turnStart[0]) return -1;
    let lo = 0;
    let hi = turnStart.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (turnStart[mid] <= t) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }
  // עומק בערימה → z. שתי הערימות חולקות את אותו סולם כדי שסדר-השקיפות יהיה
  // חד-משמעי בשני הצדדים.
  // רק שלוש שכבות מרונדרות בכל צד. גיליון עמוק יותר מזה קבור ממילא מאחורי
  // אלה שמעליו, ורינדורו רק מסכן חיתוך-משטחים: העיקול מרים את הקצה החופשי
  // הרבה יותר מכל מרווח-z סביר, ולכן שתי שכבות סמוכות מדי *חותכות* זו את זו
  // והטקסט של התחתונה מבליח דרך העליונה. זה בדיוק הכפל שנראה על הדף השמאלי.
  const VISIBLE_LAYERS = 3;
  const Z_STEP = 0.008;
  const zRight = (depth: number) => 0.022 - Math.min(depth, VISIBLE_LAYERS) * Z_STEP;
  const zLeft = (rank: number) => 0.022 - Math.min(rank - 1, VISIBLE_LAYERS) * Z_STEP;

  function apply(p: number) {
    const t = ms(p);

    // ══ 1 · הגעה ══════════════════════════════════════════════════════════
    // הספר מגיע אל הקאדר: מרחוק, מעט מסובב, ונוחת. מרוסן-קריטית — מהיר
    // בהתחלה ומתיישב בלי לחרוג. קודם לכן שלב זה פשוט לא היה קיים: ב-p=0
    // הספר כבר עמד בגודלו ובזוויתו הסופיים, והכניסה כולה הייתה CSS על המכל.
    const arrive = settleCritical(win(t, 0, T.arriveEnd));

    // ══ 2 · זנב-ההתיישבות ═════════════════════════════════════════════════
    // אותה מערכת, ריסון נמוך יותר. משרעת 0.02rad ≈ 1.1° — משקל, לא באונס.
    const wob = wobble((t - T.wobbleFrom) / 1000, 9.5, 5.2) * 0.02;

    // ══ 3 · פתיחת הכריכה ══════════════════════════════════════════════════
    const openCover = weightedFall(win(t, T.openFrom, T.openTo));
    // הגיליונות נסחפים אחרי הכריכה בהשהיות קטנות ושונות — אוויר שנלכד בין
    // דפים, לא שלוש שכבות שזזות יחד.
    const openL = weightedFall(win(t, T.openFrom + 110, T.openTo + 110));

    coverMat.uniforms.uTheta.value = lerp(0, Math.PI, openCover);
    // בועת-העיקול בשיא באמצע התנופה: הלוח „נאנח” ומתיישר בנחיתה.
    coverMat.uniforms.uCurl.value = Math.sin(openCover * Math.PI) * 0.2;
    cover.position.z = openCover < 0.5 ? 0.03 : lerp(0.03, -0.014, (openCover - 0.5) / 0.5);

    // ══ תאורה נעה ═════════════════════════════════════════════════════════
    // ה-key מסתובבת ~12° לאורך הפתיחה, ומעט יותר גבוה בהגעה. הנצנוץ נוסע על
    // אמנות-הכריכה בזמן שהיא מסתובבת, במקום לשבת עליה קפוא.
    setKeyYaw(lerp(-0.09, 0.13, openCover), lerp(0.06, 0, arrive));

    const leftStruct = smooth((openL - 0.72) / 0.28);
    blockFaceL.opacity = leftStruct;
    bandMatsL.forEach((m) => { m.uniforms.uOpacity.value = leftStruct; });
    boardMatL.opacity = leftStruct * 0.95;
    spineMat.opacity = leftStruct;
    blockL.visible = leftStruct > 0.02;
    boardL.visible = leftStruct > 0.02;
    flaresL.forEach((m) => {
      m.visible = leftStruct > 0.02;
    });
    blockR.visible = true;
    boardR.visible = true;
    const spineFade = 1 - smooth(openCover / 0.34);
    spineSlabMat.opacity = spineFade;
    spineSlab.visible = spineFade > 0.02;

    // פריסת-הערימה נוסעת עם אותה תנועה שפותחת את הכריכה: ניצבת כל עוד הספר
    // סגור (ואז היא בדיוק פאת-הצד של הגוש), ונרגעת החוצה ככל שהוא נפתח.
    pose.flareR = openCover;
    pose.flareL = openL;
    setFlare(1, pose.flareR);
    setFlare(-1, pose.flareL);

    // הצל הוא מה שהופך „ריחוף” ל„נחיתה”: בהגעה הוא צר וכהה (הספר גבוה
    // ורחוק), ובנחיתה הוא נפתח ומתרכך. אחר-כך הוא מתרחב מעט עם הפתיחה.
    const land = arrive;
    shadow.scale.setScalar(lerp(0.72, 1, land));
    shadowMat.opacity = lerp(0.16, 0.34, land) + openL * 0.4;
    pose.shadowNow = shadowMat.opacity;

    // ── עמוד-ימין הקבוע (R1) ──
    // עיקול-המנוחה חייב להיות תלוי-פתיחה. בספר *סגור* דף מעוקל בולט מעבר
    // למישור הכריכה (‎uCurl 0.4‎ מרים את הקצה החופשי ל-z≈0.09 מול כריכה ב-0.03)
    // — ואז הדף נראה מצויר על גבי הכריכה וחותך אותה בערך בחציה. זה נתפס
    // בבדיקה החזותית של מצב-ההגעה, שבו הספר הסגור נראה לראשונה לאורך זמן.
    baseRight.mat.uniforms.uTheta.value = 0;
    baseRight.mat.uniforms.uCurl.value = REST_CURL * openCover;
    baseRight.mesh.position.z = 0.002;

    // ── עמוד-שמאל הבסיסי (L3) ──
    baseLeft.mat.uniforms.uTheta.value = Math.PI * openL;
    // אותו כלל לעמוד-שמאל: שטוח כשהספר סגור, ומקבל את עיקול-המנוחה שלו רק
    // ככל שהוא נפתח.
    baseLeft.mat.uniforms.uCurl.value =
      lerp(0, -REST_CURL * 1.09, openL) + Math.sin(openL * Math.PI) * 0.5;
    baseLeft.mesh.position.z = 0.002 + Math.sin(openL * Math.PI) * 0.03;

    // ── גיליונות-המילוי ──
    // נסחפים עם הפתיחה בדיוק כמו הדפים האמיתיים, בהשהיות זעירות, ועם עיקול
    // ההולך וקטן ככל שיורדים בערימה — כך הקצוות נפרשים כמניפה במקום להיערם
    // כמישור אחד. `--fanRest` נשמר כדי שה-idle יוכל „לנשום” סביבו.
    const fanCurlR: number[] = [];
    const fanCurlL: number[] = [];
    for (let i = 0; i < FAN_PER_SIDE; i += 1) {
      const depth = (i + 1) / (FAN_PER_SIDE + 1); // 0..1 — עמוק יותר בערימה
      const restR = REST_CURL * (1 - depth * 0.55) * openCover;
      fanCurlR.push(restR);
      fanR[i].mat.uniforms.uTheta.value = 0;
      fanR[i].mat.uniforms.uCurl.value = restR;
      fanR[i].mesh.position.z = -0.004 - (i + 1) * 0.0135;

      const openFan = weightedFall(win(t, T.openFrom + 120 + i * 18, T.openTo + 120));
      const restL = lerp(0, -REST_CURL * (1 - depth * 0.55) * 1.09, openFan);
      fanCurlL.push(restL);
      fanL[i].mat.uniforms.uTheta.value = Math.PI * openFan;
      fanL[i].mat.uniforms.uCurl.value = restL + Math.sin(openFan * Math.PI) * 0.42;
      fanL[i].mesh.position.z = -0.004 - (i + 1) * 0.0135 + Math.sin(openFan * Math.PI) * 0.026;
      fanL[i].mesh.visible = openFan > 0.02;
    }
    pose.fanRestR = fanCurlR;
    pose.fanRestL = fanCurlL;

    // ══ 4 · הגיליונות הממתינים ════════════════════════════════════════════
    // ברצף הפותח אף גיליון אינו מתהפך: כולם שוכבים על הערימה הימנית, בדיוק
    // כמו דף-הבסיס שמתחתיהם. הדפדוף מתחיל מיד אחרי הרצף, בשכבה הרצה.
    for (let i = 0; i < POOL; i += 1) {
      const lf = turners[i];
      lf.mat.uniforms.uTheta.value = 0;
      lf.mat.uniforms.uCurl.value = REST_CURL * openCover;
      lf.mat.uniforms.uTwist.value = 0.2;
      lf.mat.uniforms.uTurnShadow.value = 0;
      lf.mesh.position.z = zRight(i);
      lf.mesh.visible = i < VISIBLE_LAYERS;
    }
    baseRight.mat.uniforms.uTurnShadow.value = 0;
    baseLeft.mat.uniforms.uTurnShadow.value = 0;
    for (let i = 0; i < FAN_PER_SIDE; i += 1) {
      fanR[i].mat.uniforms.uTurnShadow.value = 0;
      fanL[i].mat.uniforms.uTurnShadow.value = 0;
    }

    // ══ 5 · מצלמה ═════════════════════════════════════════════════════════
    // ההגעה היא תנועת-המצלמה האמיתית (7.4→5.35), ואחריה התיישבות אחרונה אל
    // הקאדר הסופי. קודם היה כאן push-in של 10% על פני 5.2 שניות — כלומר
    // פריים כמעט קפוא.
    const finalEase = settleCritical(win(t, T.breathTo, T.total), 6);
    // 7.4 נבדק ונפסל: הספר הגיע קטן מדי ונקרא כאייקון. 6.35 שומר על נוכחות
    // לאורך כל ההגעה. ה-lift ההתחלתי ירד 1.46→1.28 — במיקום הגבוה יותר
    // המצלמה הביטה מלמעלה והספר נחתך בתחתית הקנבס.
    // מרחק-ההגעה קטן יותר במובייל: הקנבס שם 342×214 בלבד, ובמרחק הדסקטופי
    // הספר מגיע ברוחב ~120px ונקרא כאייקון ולא כאובייקט.
    const dist = lerp(lerp(opts.mobile ? 5.85 : 6.35, 5.35, arrive), pose.dist, finalEase);
    const lift = lerp(lerp(1.28, 1.18, arrive), pose.lift, finalEase);
    frame(dist, lift);

    // ── הטיה: מצגת → זווית עריכתית ──
    // בהגעה הספר מוצג כמעט חזיתית (‎-0.34rad ≈ 19°‎) — כך נראית *כריכה* ולא
    // גוש שטוח בפרספקטיבה. ההטיה אל הזווית העריכתית (29°) נוסעת יחד עם
    // פתיחת-הכריכה ומתחילה רגע לפניה, ולכן זו תנועה אחת מתמשכת: הספר מגיע,
    // מתיישב, ומיטב את עצמו *תוך כדי* שהוא נפתח — לא שלושה קליפים נפרדים.
    const tip = weightedFall(win(t, T.openFrom - 120, T.openTo));
    // ‎-0.46rad (26°)‎ בהגעה: מספיק „מלמעלה” כדי שהפאה העליונה של גוש-הדפים —
    // עם קווי-הגיליונות שרצים לאורך העובי — תיראה כפס רחב, וזה הרמז החזק
    // ביותר ל„ספר עבה”. ב-19° היא כמעט נעלמה והספר נקרא כחוברת.
    book.rotation.x = lerp(lerp(-0.46, PITCH - 0.05, tip), pose.rotX, finalEase);
    // סיבוב-ההגעה מרוסן בכוונה. ‎-0.30rad‎ (17°) נבדק ונפסל: בזווית כזו הספר
    // הסגור מראה פרוסה רחבה של גוש-הדפים, ואמנות-הכריכה נקראת כחתוכה בחצי.
    // ‎-0.11‎ נותן עומק ופאת-שדרה דקה — ועדיין זו כריכה, לא חתך.
    // ‎-0.26rad (15°)‎: מספיק כדי שגוש-הדפים ייראה לצד הכריכה בזמן שהספר עדיין
    // סגור. ב-‎-0.11‎ הספר הגיע כמעט חזיתית — ואז אין שום רמז לעובי, והוא נקרא
    // כחוברת. (‎-0.30‎ נבדק ונפסל בסבב קודם, אבל שם הסיבה הייתה דף מעוקל שבלט
    // מבעד לכריכה; הליקוי ההוא תוקן, ולכן אפשר להחזיר זווית שמראה מסה.)
    //
    // הספר *הסגור* מתיישב על ‎+0.20rad‎ ולא על ‎+0.10‎. נמדד ונשלל בדרך: ניסיון
    // להראות את גוש-הדפים דרך הקצה החופשי אינו יכול לעבוד — לוח-הכריכה חורג
    // מעבר לגוש בכל זווית, ולכן הערימה תמיד מוסתרת מאחוריו, בדיוק כמו בספר
    // אמיתי. מה שכן מספר את העובי בספר סגור הוא ה*שדרה*, ולכן הזווית נוטה אל
    // הצד שמראה אותה. היישור אל התנוחה הסופית רוכב על אותה `tip` שפותחת את
    // הכריכה, ולכן זו עדיין תנועה אחת ולא תיקון-זווית נפרד.
    book.rotation.y =
      lerp(lerp(-0.32, 0.2, arrive), pose.rotY, Math.max(tip, finalEase)) + wob;
    // מרכוז: ספר *סגור* תופס x∈[0,W] ולכן מרכזו ב-0.5 — צריך היסט ‎-0.5‎ כדי
    // שיישב באמצע הקאדר; ספר *פתוח* תופס x∈[-W,W] ומרכזו כבר ב-0. לכן ההיסט
    // חייב להיות קשור לפתיחת-הכריכה ולא להגעה. (באג שנתפס בבדיקה חזותית:
    // כשהוא היה קשור להגעה, הספר עמד סגור ומוסט ימינה למשך 130ms.)
    book.position.x = lerp(-0.5, 0, openCover);

    // התנוחה שהתקבלה נשמרת לשכבת-החיים.
    pose.distNow = dist;
    pose.liftNow = lift;
    pose.rotXNow = book.rotation.x;
    pose.rotYNow = book.rotation.y;
  }

  /**
   * שכבת-החיים שאחרי הרצף.
   *
   * הגרסה הראשונה כאן הייתה סחיפה של 0.35° בלבד על הגוף כולו. היא אכן רצה
   * (נמדד: הפיקסלים משתנים), אבל היא לא *נקראה* — והמצב הסופי הרגיש קפוא.
   * המסקנה: תנועת-גוף היא הכלי הלא-נכון. גוף מונח במנוחה אינו זז; מה שחי בו
   * הוא **הנייר** ו**האור**. לכן החיים כאן הם בעיקר חומריים:
   *
   *   • הדפים „נרגעים” — העיקול נושם סביב ערך-המנוחה, ימין ושמאל בפאזות
   *     הפוכות, וגיליונות-המילוי בפיגור קטן אחריהם. זה הקריא ביותר, והוא
   *     קורה בלי שהאובייקט יזוז במילימטר.
   *   • האור נודד — ה-key מסתובבת ‎±2.6°‎ במחזור ארוך, ולכן הנצנוץ זוחל על
   *     הנייר. כך „יש חדר סביב הספר”.
   *   • התיישבות מיקרו — ‎±0.2°‎ בלבד, בשני מחזורים שאינם כפולות זה של זה
   *     (17ש/23ש) כדי שלעולם לא ייקרא כלולאה.
   *   • הצל נושם יחד עם ההתיישבות.
   *
   * הכול עדכוני-uniform ב-30fps. אין ריחוף, אין באונס, אין מחזור מורגש.
   */
  function setAmbient(idleSec: number, scrollP: number) {
    const t = idleSec;
    /**
     * כל מתנד כאן מוגדר כך שערכו ב-‎t=0‎ הוא אפס בדיוק. זה לא קוסמטי: שכבת-החיים
     * מתחילה בדיוק בפריים שאחרי סוף הרצף, ולכן כל מתנד שאינו מתאפס שם דוחף את
     * הספר בקפיצה קטנה — וקפיצה כזו היא בדיוק ה„רגע שבו האנימציה נגמרה” שאסור
     * שיורגש. ההיסט הקבוע שנשאר (‎-sin(phase)‎) הוא הזזת-DC בלתי-נראית.
     */
    const osc = (period: number, phase = 0) =>
      Math.sin((t * Math.PI * 2) / period + phase) - Math.sin(phase);
    // מחזורים ארוכים וזרים זה לזה — סכומם אינו חוזר על עצמו בטווח שבו מבקר
    // מסתכל על העמוד. קוצרו מ-17/23/9.5 כדי שהתנועה תהיה קריאה כבר בחמש
    // השניות הראשונות ולא רק אחרי חצי דקה.
    const slowA = osc(13);
    const slowB = osc(19, Math.PI / 2);
    const breath = osc(7.5);
    const breathOff = osc(7.5, 1.9); // צד שמאל, בפאזה אחרת

    // התרפות חד-פעמית: מיד אחרי הדפדוף האחרון הנייר ממשיך להירגע החוצה עוד
    // ‎~1.5‎ שניות ואז נעצר. זו אינה לולאה אלא זנב של התנועה שקדמה לה — וזה מה
    // שמונע את התפר בין „הרצף נגמר” ל„משהו מתנדנד עכשיו”.
    const relax = 1 - Math.exp(-t / 0.95);

    // המשרעות כאן גדולות פי-שלושה מהגרסה הקודמת. הגרסה ההיא נמדדה כ„זזה”
    // אבל נצפתה כקפואה, ומדידת-פיקסלים אינה קריטריון הקבלה: מה שצריך להיראות
    // הוא שקצה-הדף החופשי *עולה ויורד* בכמה פיקסלים, ושהאור נוסע על הנייר.
    baseRight.mat.uniforms.uCurl.value = REST_CURL + relax * 0.028 + breath * 0.2;
    baseLeft.mat.uniforms.uCurl.value =
      -REST_CURL * 1.09 - relax * 0.03 + breathOff * 0.2;

    // פס-האור נוסע הלוך-ושוב לרוחב הכפולה במחזור של 11ש. עוצמתו נכנסת דרך
    // `relax`, ולכן ברגע שהרצף נגמר היא אפס בדיוק ואין תפר.
    const sheenX = 1.75 * Math.sin((t * Math.PI * 2) / 11);
    const sheenK = relax * 0.17;
    for (const l of [baseRight, baseLeft, ...turners, ...fanR, ...fanL]) {
      l.mat.uniforms.uSheen.value = sheenX;
      l.mat.uniforms.uSheenK.value = sheenK;
    }
    coverMat.uniforms.uSheen.value = sheenX;
    coverMat.uniforms.uSheenK.value = sheenK;
    // שדה-הקצוות עונה לאותו אור: הצלעות אינן מוארות בשיידר, ולכן הן מקבלות
    // את אותה נשימה דרך גוון-החומר.
    // הנצנוץ זוחל על שדה-הקצוות: מספר-הצלע נע הלוך-ושוב על פני כל הערימה
    // במחזור של 6ש. זה אירוע *מקומי* על קצה, ולכן הוא נקלט כתנועה ולא
    // כשינוי-הארה כללי שהעין מסננת.
    const glint = 0.5 + 0.62 * Math.sin((t * Math.PI * 2) / 6);
    for (const m of bandMats) {
      m.uniforms.uGlint.value = glint;
      m.uniforms.uGlintK.value = relax * 0.34;
    }
    // ── זרם-הדפדוף ────────────────────────────────────────────────────
    // בכל רגע נתון כל גיליון בבריכה נמצא באחד משלושה מצבים, והמצב נגזר מהזמן
    // בלבד — אין מכונת-מצבים שנשמרת בין פריימים, ולכן אפשר לקפוץ לכל רגע
    // (וו-הבדיקה עושה בדיוק את זה) והתמונה תהיה נכונה.
    const cur = Math.max(0, turnIndexAt(t));
    // הדף האחרון שכבר *נחת* — הוא שקובע מה מציגה הערימה השמאלית.
    const landed = t >= turnStart[cur] + turnDur[cur] ? cur : cur - 1;
    const topLeft = SPREADS[((landed % 3) + 3) % 3];
    const nextRight = SPREADS[(cur + 1) % 3];
    let under = 0; // הצל החזק ביותר שמטיל גיליון מתהפך על מה שמתחתיו
    for (let j = 0; j < POOL; j += 1) {
      const lf = turners[j];
      // הדף שהבריכה מקצה לגיליון j הוא היחיד בטווח [cur, cur+POOL) ששאריתו j.
      const n = cur + (((j - cur) % POOL) + POOL) % POOL;
      const tS = turnStart[n];
      const dur = turnDur[n];
      const prev = n - POOL;
      const h = rnd(n + 5);

      let theta = 0;
      let curl = REST_CURL;
      let twist = 0.2;
      let z = zRight(n - cur);
      let depth = n - cur; // עומק בערימה — קובע גם אם הגיליון מרונדר בכלל

      if (t >= tS) {
        // מתהפך, או נח על הערימה השמאלית.
        const prog = clamp01((t - tS) / dur);
        const ta = pageTurn(prog);
        const arc = Math.sin(ta * Math.PI);
        // זנב-התיישבות: הנייר ממשיך לרעוד רגע קצר אחרי שנחת.
        const after = Math.max(0, t - (tS + dur));
        const settle = Math.exp(-7 * after) * Math.sin(after * 24);
        theta = Math.PI * ta;
        // משרעת-העיקול משתנה מדף לדף (‎±15%‎) — בלעדיה עשרה דפדופים רצופים
        // נקראים כמטרונום.
        curl =
          restCurlAt(ta) * (ta < 1 ? 1 : 1.09) +
          arc * CURL_TURN * (0.86 + 0.28 * h) +
          settle * 0.1;
        twist = 0.2 + arc * (0.45 + 0.22 * h) + settle * 0.2;
        z = lerp(zRight(0), zLeft(1), ta) + arc * Z_LIFT;
        depth = 0;
        if (arc > under) under = arc;
      } else if (prev >= 0 && t < tS - MOVE_LEAD) {
        // עדיין שוכב בערימה השמאלית מהתור הקודם שלו, קבור תחת אלה שנחתו
        // אחריו. רק כשהוא קבור מספיק הוא יוחזר ימינה — ולכן ההחזרה מוסתרת.
        theta = Math.PI;
        // ככל שהגיליון עמוק יותר בערימה כך הוא שטוח יותר, ולכן הם *מקוננים*
        // זה בזה. בעיקול זהה לכולם המשטחים חותכים זה את זה והטקסט של השכבה
        // שמתחת מבליח דרך העליונה.
        // ככל שהגיליון עמוק יותר כך הוא שטוח יותר, ולכן הם *מקוננים* זה בזה.
        curl = -REST_CURL * 1.09 * (1 - 0.14 * depth);
        // ‎+1‎: הדרגה 1 שמורה לגיליון שזה עתה נחת. בלעדיה הגיליון הישן ביותר
        // והגיליון החדש ביותר נפלו על אותו ‎z‎ ומיון-השקיפות הבליח ביניהם.
        const rank = cur - prev + 1;
        depth = rank - 1;
        z = zLeft(rank);
      }

      lf.mesh.visible = depth < VISIBLE_LAYERS;
      lf.mat.uniforms.uTheta.value = theta;
      lf.mat.uniforms.uCurl.value = curl;
      lf.mat.uniforms.uTwist.value = twist;
      lf.mesh.position.z = z;
      lf.mat.uniforms.uTurnShadow.value = 0;
      // ── איזו כפולה מציג כל גיליון ──────────────────────────────────
      // רק *שלושה* משטחים באמת נצפים: הדף שמתהפך, הדף שנחשף מתחתיו מימין,
      // והדף העליון בערימה השמאלית. כל השאר קבורים — ולכן הם מקבלים בדיוק
      // את אותה כפולה כמו זה שמעליהם. זה לא קיצור-דרך: העיקול מקצר את הגיליון
      // מעט, ולכן שכבה קבורה כן מציצה בשוליים, ועם תוכן שונה ההצצה הזו נראית
      // כטקסט כפול על הדף (בדיוק מה שנמדד כאן).
      //
      // הכלל עקבי גם ברגע-המעבר: גיליון ממתין מציג את הכפולה הבאה, וכשמגיע
      // תורו `cur` כבר התקדם — כך שהטקסטורה שלו אינה משתנה בזמן שהוא נראה.
      if (t >= tS && t <= tS + dur) {
        lf.mat.uniforms.uFront.value = SPREADS[n % 3].r;
        lf.mat.uniforms.uBack.value = SPREADS[n % 3].l;
      } else if (depth === 0) {
        // נחת זה עתה — הוא הדף העליון בערימה השמאלית.
        lf.mat.uniforms.uFront.value = SPREADS[n % 3].r;
        lf.mat.uniforms.uBack.value = SPREADS[n % 3].l;
      } else if (theta === 0) {
        lf.mat.uniforms.uFront.value = nextRight.r;
        lf.mat.uniforms.uBack.value = nextRight.l;
      } else {
        lf.mat.uniforms.uFront.value = topLeft.r;
        lf.mat.uniforms.uBack.value = topLeft.l;
      }
    }
    // דפי-הבסיס מקבלים את *אותה* כפולה שמציג הגיליון שמעליהם. העיקול מקצר
    // את הגיליון מעט, ולכן הוא אינו מכסה את הבסיס עד הפיקסל האחרון; כשהתוכן
    // זהה, ההצצה הזו פשוט אינה נראית. עם תוכן שונה היא נראתה כטקסט כפול.
    baseLeft.mat.uniforms.uBack.value = topLeft.l;
    baseRight.mat.uniforms.uFront.value = nextRight.r;

    // כל מה שאינו מתהפך מקבל את צל-הדף העובר.
    baseRight.mat.uniforms.uTurnShadow.value = under;
    baseLeft.mat.uniforms.uTurnShadow.value = under;
    for (let j = 0; j < POOL; j += 1) {
      const lf = turners[j];
      if (lf.mat.uniforms.uTurnShadow.value === 0) lf.mat.uniforms.uTurnShadow.value = under * 0.8;
    }

    // גיליונות-המילוי נושמים, כל אחד במחזור משלו ולא רק בפאזה משלו: בפאזה
    // בלבד הערימה נעה כגוף אחד מוסט. את התנועה הגדולה מספק עכשיו זרם-הדפדוף,
    // ולכן כאן נשארת רק נשימת-הנייר שמתחתיו.
    for (let i = 0; i < FAN_PER_SIDE; i += 1) {
      const per = 6.2 + i * 0.85;
      const sgn = (pose.fanRestL[i] ?? 0) < 0 ? -1 : 1;
      fanR[i].mat.uniforms.uCurl.value =
        (pose.fanRestR[i] ?? 0) + relax * 0.02 + osc(per, i * 1.1) * 0.1;
      fanL[i].mat.uniforms.uCurl.value =
        (pose.fanRestL[i] ?? 0) + sgn * relax * 0.02 + osc(per, 1.9 + i * 1.1) * 0.1;
      fanR[i].mat.uniforms.uTurnShadow.value = under;
      fanL[i].mat.uniforms.uTurnShadow.value = under;
    }

    // רפיון-קצה-הדפים: הערימה נפרשת עוד קצת אחרי שהדף האחרון נח, ואז נושמת
    // סביב הזווית החדשה. הקצה מורכב מצלעות נפרדות, ולכן שינוי זווית קטן משנה
    // את כל שדה-הקצוות בבת אחת — זה הפרט הקריא ביותר במצב-המנוחה.
    setFlare(1, pose.flareR + relax * 0.05 + breath * 0.11);
    setFlare(-1, pose.flareL + relax * 0.05 + breathOff * 0.11);

    const sp = clamp01(scrollP);
    // הגוף עצמו כמעט אינו זז — ‎0.35°‎. חפץ מונח אינו מרחף, והחיים כאן הם
    // בנייר ובאור, לא בתנועת-גוף.
    book.rotation.y = pose.rotYNow + slowA * 0.006;
    book.rotation.x = pose.rotXNow + slowB * 0.004 - sp * 0.03;
    frame(pose.distNow, pose.liftNow + sp * 0.06);

    // האור נודד — והצל נושם איתו.
    // האור נודד ‎±11°‎ (היה ‎±2.6°‎). זה המנגנון הקריא ביותר: הנצנוץ *נוסע* על
    // הנייר במקום לשבת עליו, והצל עונה לו. פיזיקלית זה „יש חדר סביב הספר”,
    // ואין בו לא ריחוף ולא באונס.
    setKeyYaw(0.13 + slowA * 0.2, slowB * 0.05);
    shadowMat.opacity = pose.shadowNow + slowB * 0.05;
    shadow.scale.setScalar(1 + slowA * 0.018);
  }

  function render() {
    renderer.render(scene, camera);
  }
  function setProgress(p: number) {
    apply(clamp01(p));
  }
  /**
   * צפיפות-הגיליונות נקבעת לפי *פיקסלי-המכשיר* ולא לפי מספר העמודים בספר:
   * המטרה היא שכל קו ייפול על ‎~2px‎ פיזיים. במסך רגיל זה ‎~30‎ קווים לרוחב
   * הערימה, ובמסך צפוף פי-שניים — ‎~60‎. בצפיפות קבועה, מסך צפוף היה מקבל
   * קווים עבים ומעטים, ומסך רגיל — קווים תת-פיקסליים שנמרחים לגוון אחיד.
   */
  function syncDensity(hCss: number) {
    const d = Math.min(90, Math.max(22, Math.round((30 * hCss * opts.dpr) / 412)));
    bandMats.forEach((m) => {
      m.uniforms.uDens.value = d;
    });
  }
  function resize(w: number, h: number) {
    syncDensity(h);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }
  function dispose() {
    [
      blankR, blankL, endpaper, coverLiner, coverTex, texR1, texL1, texR2, texL2, texR3, texL3,
    ].forEach((t) => t.dispose());
    leafGeo.dispose();
    coverGeo.dispose();
    [baseRight, baseLeft, ...turners, ...fanR, ...fanL].forEach((l) => l.mat.dispose());
    fanGeo.dispose();
    coverMat.dispose();
    [blockR, blockL, boardR, boardL, spine, shadow].forEach((m) => {
      m.geometry.dispose();
    });
    blockFaceR.dispose();
    blockFaceL.dispose();
    [flareForeR, flareBotR, flareForeL, flareBotL].forEach((m) => m.geometry.dispose());
    bandMats.forEach((m) => m.dispose());
    boardMatR.dispose();
    boardMatL.dispose();
    spineMat.dispose();
    spineSlabMat.dispose();
    spineSlab.geometry.dispose();
    shadowMat.dispose();
    renderer.dispose();
  }

  apply(0);
  return { setProgress, setAmbient, render, resize, dispose, duration: DURATION };
}
