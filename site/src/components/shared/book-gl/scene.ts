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
  const leafB = makeLeaf(texR3, texL2); // front=R3, back=L2
  const leafA = makeLeaf(texR2, texL1); // front=R2, back=L1

  // ── גוש-הדפים (עובי) — קרם עם קווי-דפים בקצה החופשי ──
  function pageBlockTexture(): THREE.CanvasTexture {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 32;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 32);
    g.addColorStop(0, "#efe7d6");
    g.addColorStop(0.5, "#e2d8c2");
    g.addColorStop(1, "#d3c8ae");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 32);
    ctx.globalAlpha = 0.35;
    for (let x = 0; x < 256; x += 2) {
      ctx.fillStyle = x % 4 === 0 ? "#c9bda2" : "#f4eee0";
      ctx.fillRect(x, 0, 1, 32);
    }
    ctx.globalAlpha = 1;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const blockTex = pageBlockTexture();
  const BLOCK_T = 0.08; // עובי גוש-הדפים לכל צד
  const blockMatR = new THREE.MeshBasicMaterial({ map: blockTex, transparent: true, opacity: 1 });
  const blockMatL = new THREE.MeshBasicMaterial({ map: blockTex, transparent: true, opacity: 0 });
  function makeBlock(sign: 1 | -1) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(W * 0.99, H * 0.985, BLOCK_T),
      sign === 1 ? blockMatR : blockMatL,
    );
    m.position.set(sign * W * 0.5, 0, -BLOCK_T / 2 - 0.004);
    book.add(m);
    return m;
  }
  const blockR = makeBlock(1);
  const blockL = makeBlock(-1);

  // ── לוחות-כריכה (hardcover) — חום כהה חמים, לא שחור, עם overhang ──
  const boardMatR = new THREE.MeshBasicMaterial({ color: 0x3a2f26, transparent: true, opacity: 1 });
  const boardMatL = new THREE.MeshBasicMaterial({ color: 0x3a2f26, transparent: true, opacity: 0 });
  const BOARD_T = 0.048;
  function makeBoard(sign: 1 | -1) {
    const m = new THREE.Mesh(
      new THREE.BoxGeometry(W * 1.045, H * 1.035, BOARD_T),
      sign === 1 ? boardMatR : boardMatL,
    );
    m.position.set(sign * W * 0.5, 0, -BLOCK_T - BOARD_T / 2 - 0.006);
    book.add(m);
    return m;
  }
  const boardR = makeBoard(1);
  const boardL = makeBoard(-1);

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
    },
    vertexShader: leafVertex,
    fragmentShader: leafFragment,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  cover.scale.set(1.045, 1.035, 1);
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
    turn1From: opts.mobile ? 2000 : 2260,
    turn1To: opts.mobile ? 2680 : 3060,
    // הפער לפני הדפדוף השני גדול מהראשון (80ms) כדי שהשניים לא יישמעו
    // כמטרונום. אותו הבדל קטן הוא ההבדל בין „שני דפדופים” ל„לולאה”.
    turn2From: opts.mobile ? 2770 : 3140,
    turn2To: opts.mobile ? 3450 : 3940,
    total: opts.mobile ? 3900 : 4420,
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
    rotXNow: -0.34,
    rotYNow: -0.11,
  };

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
    const openA = weightedFall(win(t, T.openFrom + 60, T.openTo + 60));
    const openB = weightedFall(win(t, T.openFrom + 80, T.openTo + 80));
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
    blockMatL.opacity = leftStruct;
    boardMatL.opacity = leftStruct * 0.95;
    spineMat.opacity = leftStruct;
    blockL.visible = leftStruct > 0.02;
    boardL.visible = leftStruct > 0.02;
    blockR.visible = true;
    boardR.visible = true;

    // הצל הוא מה שהופך „ריחוף” ל„נחיתה”: בהגעה הוא צר וכהה (הספר גבוה
    // ורחוק), ובנחיתה הוא נפתח ומתרכך. אחר-כך הוא מתרחב מעט עם הפתיחה.
    const land = arrive;
    shadow.scale.setScalar(lerp(0.72, 1, land));
    shadowMat.opacity = lerp(0.16, 0.34, land) + openL * 0.4;

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

    // ══ 4 · דפדופים ═══════════════════════════════════════════════════════
    // `pageTurn` היא א-סימטרית להפך מ-`weightedFall`: הדף *נתפס* מהר ומונח
    // לאט. אחרי הנחיתה נשאר ripple ב-uTwist שדועך — נייר מתיישב, לא נעצר.
    const ta = pageTurn(win(t, T.turn1From, T.turn1To));
    const settleA = Math.exp(-7 * Math.max(0, (t - T.turn1To) / 1000)) * Math.sin((t - T.turn1To) / 42);
    const thA = Math.PI * openA * (1 - ta);
    leafA.mat.uniforms.uTheta.value = thA;
    leafA.mat.uniforms.uCurl.value =
      restCurlAt(ta) * openA +
      Math.sin(ta * Math.PI) * CURL_TURN +
      Math.sin(openA * Math.PI) * 0.5 * (1 - ta) +
      (t > T.turn1To ? settleA * 0.1 : 0);
    leafA.mat.uniforms.uTwist.value =
      0.2 + Math.sin(ta * Math.PI) * 0.55 + (t > T.turn1To ? settleA * 0.22 : 0);
    leafA.mesh.position.z =
      lerp(0.011, 0.006, ta) + Math.sin(ta * Math.PI) * Z_LIFT + Math.sin(openA * Math.PI) * 0.04;

    const tb = pageTurn(win(t, T.turn2From, T.turn2To));
    const settleB = Math.exp(-7 * Math.max(0, (t - T.turn2To) / 1000)) * Math.sin((t - T.turn2To) / 45);
    const thB = Math.PI * openB * (1 - tb);
    leafB.mat.uniforms.uTheta.value = thB;
    leafB.mat.uniforms.uCurl.value =
      restCurlAt(tb) * openB +
      Math.sin(tb * Math.PI) * CURL_TURN +
      Math.sin(openB * Math.PI) * 0.5 * (1 - tb) +
      (t > T.turn2To ? settleB * 0.1 : 0);
    leafB.mat.uniforms.uTwist.value =
      0.2 + Math.sin(tb * Math.PI) * 0.55 + (t > T.turn2To ? settleB * 0.22 : 0);
    leafB.mesh.position.z =
      lerp(0.006, 0.011, tb) + Math.sin(tb * Math.PI) * Z_LIFT + Math.sin(openB * Math.PI) * 0.035;

    // צל-נע: הגיליון שמתהפך מחשיך רכות את הדף שמתחתיו (חזק יותר ליד השדרה).
    const shA = Math.sin(ta * Math.PI);
    const shB = Math.sin(tb * Math.PI);
    const under = Math.max(shA, shB);
    baseRight.mat.uniforms.uTurnShadow.value = under;
    baseLeft.mat.uniforms.uTurnShadow.value = under;
    leafB.mat.uniforms.uTurnShadow.value = shA;
    leafA.mat.uniforms.uTurnShadow.value = shB;

    // ══ 5 · מצלמה ═════════════════════════════════════════════════════════
    // ההגעה היא תנועת-המצלמה האמיתית (7.4→5.35), ואחריה התיישבות אחרונה אל
    // הקאדר הסופי. קודם היה כאן push-in של 10% על פני 5.2 שניות — כלומר
    // פריים כמעט קפוא.
    const finalEase = settleCritical(win(t, T.turn2To, T.total), 6);
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
    book.rotation.x = lerp(lerp(-0.34, PITCH - 0.05, tip), pose.rotX, finalEase);
    // סיבוב-ההגעה מרוסן בכוונה. ‎-0.30rad‎ (17°) נבדק ונפסל: בזווית כזו הספר
    // הסגור מראה פרוסה רחבה של גוש-הדפים, ואמנות-הכריכה נקראת כחתוכה בחצי.
    // ‎-0.11‎ נותן עומק ופאת-שדרה דקה — ועדיין זו כריכה, לא חתך.
    book.rotation.y = lerp(lerp(-0.11, 0.1, arrive), pose.rotY, finalEase) + wob;
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
   * שכבת-החיים שאחרי הרצף. *מוסיפה* על התנוחה הסופית ואינה משכתבת אותה.
   * משרעות מכוונות להיות על סף המודעות: 0.35° סחיפה, 1.7° פרלקסה. אובייקט
   * תלת-ממד קפוא לחלוטין ליד רכיבי-CSS חיים נקרא כתמונה — אבל כל דבר גדול
   * מזה הופך ל„ריחוף”, וזה בדיוק מה שלא רוצים.
   */
  function setAmbient(idleSec: number, scrollP: number) {
    const drift = Math.sin((idleSec * Math.PI * 2) / 14) * 0.006;
    const driftSlow = Math.cos((idleSec * Math.PI * 2) / 19) * 0.004;
    const sp = clamp01(scrollP);
    book.rotation.y = pose.rotYNow + drift;
    book.rotation.x = pose.rotXNow + driftSlow - sp * 0.03;
    frame(pose.distNow, pose.liftNow + sp * 0.06);
    // האור סוחף עם הגוף, אחרת הסחיפה נקראת כהחלקת-טקסטורה.
    setKeyYaw(0.13 + drift * 1.6, 0);
  }
  function render() {
    renderer.render(scene, camera);
  }
  function setProgress(p: number) {
    apply(clamp01(p));
  }
  function resize(w: number, h: number) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    render();
  }
  function dispose() {
    [
      blankR, blankL, endpaper, coverLiner, coverTex, texR1, texL1, texR2, texL2, texR3, texL3, blockTex,
    ].forEach((t) => t.dispose());
    leafGeo.dispose();
    coverGeo.dispose();
    [baseRight, baseLeft, leafA, leafB].forEach((l) => l.mat.dispose());
    coverMat.dispose();
    [blockR, blockL, boardR, boardL, spine, shadow].forEach((m) => {
      m.geometry.dispose();
    });
    blockMatR.dispose();
    blockMatL.dispose();
    boardMatR.dispose();
    boardMatL.dispose();
    spineMat.dispose();
    shadowMat.dispose();
    renderer.dispose();
  }

  apply(0);
  return { setProgress, setAmbient, render, resize, dispose, duration: DURATION };
}
