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
  render: () => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
const seg = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

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

  // ── timeline ──
  const CURL_TURN = 2.0;
  const REST_CURL = 0.4; // עיקול-מנוחה — הדפים אינם מישורים שטוחים
  const Z_LIFT = 0.1;

  // עיקול-מנוחה תלוי-צד: ימין +, שמאל − (כדי ששני העמודים יתרוממו כלפי חוץ).
  const restCurlAt = (t: number) => lerp(-REST_CURL, REST_CURL, t);

  function apply(p: number) {
    // ── פתיחה פיזית: בסגור *כל* הגיליונות מונחים מימין מתחת לכריכה (θ=0).
    // הכריכה נפתחת שמאלה והגיליונות הראשונים נסחפים איתה בהשהיה קטנה — כך
    // נוצר ה-spread בלי שקיפויות (אין רוחות-טקסט) ובלי משטח כהה גדול. ──
    const openCover = seg(p, 0.08, 0.3);
    const openA = seg(p, 0.1, 0.32);
    const openB = seg(p, 0.115, 0.335);
    const openL = seg(p, 0.13, 0.35);

    // כריכה (לוח קשיח — עיקול מזערי, „משקל” של hardcover)
    coverMat.uniforms.uTheta.value = lerp(0, Math.PI, openCover);
    coverMat.uniforms.uCurl.value = Math.sin(openCover * Math.PI) * 0.18;
    cover.position.z = openCover < 0.5 ? 0.03 : lerp(0.03, -0.014, (openCover - 0.5) / 0.5);

    // מבנה הספר הפתוח נחשף עם הגעת עמוד-השמאל (מוסתר מאחורי הדפים ממילא).
    // מבנה צד-שמאל נחשף רק אחרי שעמוד-השמאל כבר מכסה אותו — אחרת נראה „לוח” חשוף.
    const leftStruct = smooth((openL - 0.72) / 0.28);
    blockMatL.opacity = leftStruct;
    boardMatL.opacity = leftStruct * 0.95;
    spineMat.opacity = leftStruct;
    shadowMat.opacity = 0.34 + openL * 0.4;
    blockL.visible = leftStruct > 0.02;
    boardL.visible = leftStruct > 0.02;
    blockR.visible = true;
    boardR.visible = true;

    // עמוד-ימין הקבוע (R1) — עיקול-מנוחה, עמק-כריכה טבעי.
    baseRight.mat.uniforms.uTheta.value = 0;
    baseRight.mat.uniforms.uCurl.value = REST_CURL;
    baseRight.mesh.position.z = 0.002;

    // עמוד-שמאל הבסיסי (L3) — נסחף עם הפתיחה ואז נשאר.
    baseLeft.mat.uniforms.uTheta.value = Math.PI * openL;
    baseLeft.mat.uniforms.uCurl.value =
      lerp(REST_CURL, -REST_CURL * 1.09, openL) + Math.sin(openL * Math.PI) * 0.5;
    baseLeft.mesh.position.z = 0.002 + Math.sin(openL * Math.PI) * 0.03;

    // leaf A: נפתח (0→π) ואז מתהפך חזרה (π→0) בדפדוף 1.
    const ta = seg(p, 0.4, 0.58);
    const thA = Math.PI * openA * (1 - ta);
    leafA.mat.uniforms.uTheta.value = thA;
    leafA.mat.uniforms.uCurl.value =
      restCurlAt(ta) * openA +
      Math.sin(ta * Math.PI) * CURL_TURN +
      Math.sin(openA * Math.PI) * 0.5 * (1 - ta);
    leafA.mat.uniforms.uTwist.value = 0.2 + Math.sin(ta * Math.PI) * 0.55;
    leafA.mesh.position.z =
      lerp(0.011, 0.006, ta) + Math.sin(ta * Math.PI) * Z_LIFT + Math.sin(openA * Math.PI) * 0.04;

    // leaf B: נפתח ואז מתהפך בדפדוף 2.
    const tb = seg(p, 0.66, 0.84);
    const thB = Math.PI * openB * (1 - tb);
    leafB.mat.uniforms.uTheta.value = thB;
    leafB.mat.uniforms.uCurl.value =
      restCurlAt(tb) * openB +
      Math.sin(tb * Math.PI) * CURL_TURN +
      Math.sin(openB * Math.PI) * 0.5 * (1 - tb);
    leafB.mat.uniforms.uTwist.value = 0.2 + Math.sin(tb * Math.PI) * 0.55;
    leafB.mesh.position.z =
      lerp(0.006, 0.011, tb) + Math.sin(tb * Math.PI) * Z_LIFT + Math.sin(openB * Math.PI) * 0.035;

    // צל-נע: הגיליון שמתהפך מחשיך רכות את הדף שמתחתיו (חזק יותר ליד השדרה).
    const shA = Math.sin(ta * Math.PI);
    const shB = Math.sin(tb * Math.PI);
    const under = Math.max(shA, shB);
    baseRight.mat.uniforms.uTurnShadow.value = under;
    baseLeft.mat.uniforms.uTurnShadow.value = under;
    leafB.mat.uniforms.uTurnShadow.value = shA; // A מתהפך מעל B
    leafA.mat.uniforms.uTurnShadow.value = shB; // B מתהפך כש-A כבר מימין

    // מצלמה: push-in עדין; הספר מתמרכז עם הפתיחה (סגור = הכריכה במרכז).
    const pin = smooth(p);
    frame(lerp(5.4, 4.85, pin), lerp(1.22, 1.04, pin));
    book.rotation.x = lerp(PITCH - 0.05, PITCH, pin);
    book.rotation.y = lerp(0.1, 0.015, pin);
    book.position.x = lerp(-0.5, 0, seg(p, 0.0, 0.3));
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
  return { setProgress, render, resize, dispose };
}
