import * as THREE from "three";

import { bakePage, bakeBlank, coverTextureFromImage, PAGE_ASPECT, type PageContent } from "./bakeTextures";

/**
 * סצנת-הספר ב-WebGL (Three.js). ספר עברי פיזי: כריכה נפתחת → שלושה spreads
 * מולחנים → שני דפדופים אמיתיים עם עיקול-נייר (bending), חזית/גב לכל גיליון,
 * צל-נע וכריכה רכה (gutter valley מגאומטריה+תאורה, לא פס שחור). כל התנועה
 * מונעת-progress יחיד (0→1); הלולאה נעצרת בהתיישבות (idle, בלי לולאת-WebGL
 * תמידית). RTL: השדרה מימין, הגיליון מתרומם משמאל ומתהפך ימינה, והטקסט צרוב
 * כטקסטורה (בלי שיקוף-UV, בלי טקסט-מראה).
 */

// ── תוכן שלושת ה-spreads (ניסוחי-התֵּמה המאושרים בלבד) ──
const SPREADS: { right: PageContent; left: PageContent }[] = [
  {
    right: { heading: "דייטינג הוא חיפוש.", lines: ["למצוא זה רק ההתחלה."] },
    left: { heading: "אהבה היא בנייה.", lines: ["לזהות מה חוזר שוב ושוב בקשרים."] },
  },
  {
    right: { kicker: "עובדה", lines: ["עובדה היא מה שקרה."] },
    left: { kicker: "סיפור", lines: ["סיפור הוא מה שאנחנו", "מספרים לעצמנו."] },
  },
  {
    right: { lines: ["לבחור אחרת מתחיל", "בלראות אחרת."] },
    left: { heading: "אהבה היא בנייה.", lines: [] },
  },
];

const W = 1; // רוחב עמוד
const H = W / PAGE_ASPECT; // גובה עמוד
const SEG = 40; // חלוקת-רוחב לגיליון מתהפך (עיקול חלק)

// ── shader-material לגיליון מתהפך: עיקול קשת (inextensible) בקודקוד ──
const leafVertex = /* glsl */ `
  uniform float uTheta;   // זווית-בסיס (rad): PI=שמאל שטוח, 0=ימין שטוח
  uniform float uCurl;    // עקמומיות (1/רדיוס) — 0 בשטוח, שיא באמצע-דפדוף
  uniform float uW;       // רוחב עמוד
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying float vU;
  void main() {
    vUv = uv;
    float u = clamp(position.x / uW, 0.0, 1.0); // 0 בשדרה, 1 בקצה-החופשי
    vU = u;
    float s = u * uW;
    float beta;             // זווית-משיק לאורך הגיליון
    float x, z;
    if (abs(uCurl) < 0.0004) {
      beta = uTheta;
      x = s * cos(uTheta);
      z = s * sin(uTheta);
    } else {
      beta = uTheta + uCurl * s;
      x = (sin(beta) - sin(uTheta)) / uCurl;
      z = -(cos(beta) - cos(uTheta)) / uCurl;
    }
    vec3 pos = vec3(x, position.y, z);
    // נורמל פני-הדף מזווית-המשיק: n = (-sin b, 0, cos b)
    vec3 nrm = normalize(vec3(-sin(beta), 0.0, cos(beta)));
    vNormalW = mat3(modelMatrix) * nrm;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const leafFragment = /* glsl */ `
  uniform sampler2D uFront;
  uniform sampler2D uBack;
  uniform vec3 uLightDir;
  uniform float uAmbient;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying float vU;
  void main() {
    bool front = gl_FrontFacing;
    // חזית: uv כמו-שהוא; גב: היפוך אופקי כדי שהטקסטורה לא תופיע מהופכת.
    vec2 uv = front ? vUv : vec2(1.0 - vUv.x, vUv.y);
    vec4 tex = front ? texture2D(uFront, uv) : texture2D(uBack, uv);
    vec3 n = normalize(vNormalW) * (front ? 1.0 : -1.0);
    float diff = max(dot(n, normalize(uLightDir)), 0.0);
    float light = uAmbient + (1.0 - uAmbient) * diff;
    // occlusion רך ליד השדרה (u→0) — עמק-כריכה בלי פס שחור.
    float gutter = smoothstep(0.0, 0.12, vU);
    light *= mix(0.82, 1.0, gutter);
    vec3 col = tex.rgb * light;
    if (!front) col *= 0.9; // גב מעט כהה יותר
    if (uOpacity < 0.996) { if (uOpacity <= 0.01) discard; }
    gl_FragColor = vec4(col, uOpacity);
  }
`;

function makeLeafGeometry(): THREE.PlaneGeometry {
  const geo = new THREE.PlaneGeometry(W, H, SEG, 1);
  // הזז כך ש-x∈[0,W] (השדרה ב-x=0, הקצה החופשי ב-x=W).
  geo.translate(W / 2, 0, 0);
  return geo;
}

interface Leaf {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
}

export interface BookControls {
  setProgress: (p: number) => void;
  render: () => void;
  resize: (w: number, h: number) => void;
  dispose: () => void;
  ready: Promise<void>;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
};
// מיפוי טווח-progress → 0..1 מוחלק
const seg = (p: number, a: number, b: number) => smooth((p - a) / (b - a));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function createBookScene(
  canvas: HTMLCanvasElement,
  coverImg: HTMLImageElement,
  opts: { dpr: number; mobile: boolean },
): BookControls {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !opts.mobile,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(opts.dpr);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  const lightDir = new THREE.Vector3(-0.55, 0.75, 0.85).normalize();
  const AMBIENT = 0.62;

  // קבוצת-הספר: ממורכזת סביב השדרה (x=0). מוטה מעט אחורה (pitch) לזווית-מבט.
  const book = new THREE.Group();
  scene.add(book);

  // ── טקסטורות ──
  const blank = bakeBlank();
  const coverTex = coverTextureFromImage(coverImg);
  // base-right = R1 ; base-left = L3
  const baseRightTex = bakePage(SPREADS[0].right, "right");
  const baseLeftTex = bakePage(SPREADS[2].left, "left");
  // leaf A: front = L1 (spread1 left) , back = R2 (spread2 right)
  const aFront = bakePage(SPREADS[0].left, "left");
  const aBack = bakePage(SPREADS[1].right, "right");
  // leaf B: front = L2 (spread2 left) , back = R3 (spread3 right)
  const bFront = bakePage(SPREADS[1].left, "left");
  const bBack = bakePage(SPREADS[2].right, "right");

  const leafGeo = makeLeafGeometry();

  function makeLeaf(front: THREE.Texture, back: THREE.Texture, zLift: number): Leaf {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uFront: { value: front },
        uBack: { value: back },
        uTheta: { value: Math.PI },
        uCurl: { value: 0 },
        uW: { value: W },
        uLightDir: { value: lightDir },
        uAmbient: { value: AMBIENT },
        uOpacity: { value: 1 },
      },
      vertexShader: leafVertex,
      fragmentShader: leafFragment,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: true,
    });
    const mesh = new THREE.Mesh(leafGeo, mat);
    mesh.position.z = zLift;
    book.add(mesh);
    return { mesh, mat };
  }

  // דפי-בסיס (שטוחים, לא-מתהפכים) — עמוד-ימין (R1, בפָּן-הקדמי ב-θ=0) ועמוד-שמאל
  // (L3, בפָּן-האחורי ב-θ=π: ב-180° נראה הפָּן-האחורי).
  const baseRight = makeLeaf(baseRightTex, blank, 0.0);
  baseRight.mat.uniforms.uTheta.value = 0; // שטוח ימינה
  const baseLeft = makeLeaf(blank, baseLeftTex, 0.0);
  baseLeft.mat.uniforms.uTheta.value = Math.PI; // שטוח שמאלה

  // גיליונות מתהפכים. ב-θ=π (שמאל) נראה הפָּן-האחורי, ב-θ=0 (ימין) הקדמי — ולכן
  // front = עמוד-הימין של ה-spread הבא, back = עמוד-השמאל של ה-spread הנוכחי.
  const leafB = makeLeaf(bBack, bFront, 0.004); // front=R3, back=L2
  const leafA = makeLeaf(aBack, aFront, 0.008); // front=R2, back=L1

  // כריכה: לוח כהה + פני-כריכה (אמנות-המותג) על גיליון-קשה שנפתח.
  const coverGeo = makeLeafGeometry();
  const coverMat = new THREE.ShaderMaterial({
    uniforms: {
      uFront: { value: coverTex },
      uBack: { value: bakeBoardTexture() },
      uTheta: { value: 0 },
      uCurl: { value: 0 },
      uW: { value: W * 1.04 },
      uLightDir: { value: lightDir },
      uAmbient: { value: AMBIENT + 0.05 },
      uOpacity: { value: 1 },
    },
    vertexShader: leafVertex,
    fragmentShader: leafFragment,
    side: THREE.DoubleSide,
  });
  const cover = new THREE.Mesh(coverGeo, coverMat);
  cover.scale.set(1.04, 1.045, 1);
  cover.position.z = 0.014;
  book.add(cover);

  // לוח-כריכה אחורי (מתחת לגוש) — נותן עובי וכהות מאחור.
  const backBoardMat = new THREE.MeshBasicMaterial({
    color: 0x1a1613,
    transparent: true,
    opacity: 0,
  });
  const backBoard = new THREE.Mesh(new THREE.BoxGeometry(W * 2.08, H * 1.045, 0.03), backBoardMat);
  backBoard.position.set(0, 0, -0.05);
  book.add(backBoard);

  // צל-מגע רך על ה„רצפה”.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 3, H * 1.4),
    new THREE.MeshBasicMaterial({
      map: makeRadialShadow(),
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -H * 0.62, 0.2);
  scene.add(shadow);

  book.rotation.x = -0.16; // pitch עדין

  // ── מצלמה ──
  function frame(dist: number) {
    camera.position.set(0, 0.02, dist);
    camera.lookAt(0, 0, 0);
  }
  frame(4.2);

  // ── timeline ──
  // z-order: במחסנית-שמאל הדף שנהפך ראשון הוא העליון; במחסנית-ימין (אחרי היפוך)
  // הדף שנהפך אחרון הוא העליון — ולכן ה-z של כל גיליון *מתחלף* לאורך ההיפוך שלו.
  const CURL_MAX = 2.2;
  const Z_LIFT = 0.09; // התרוממות מרבית באמצע-דפדוף
  function apply(p: number) {
    // כריכה נפתחת: theta 0→PI (phase 0.10–0.28)
    const openT = seg(p, 0.1, 0.28);
    coverMat.uniforms.uTheta.value = lerp(0, Math.PI, openT);
    coverMat.uniforms.uCurl.value = Math.sin(openT * Math.PI) * 0.5;
    // z הכריכה: סגורה/בתחילת-פתיחה — מעל עמוד-ימין (מכסה אותו); אחרי חציית-האנך
    // צונחת אל מתחת לדפים בצד-שמאל (הופכת ללוח-הרקע השמאלי, לא מכסה את הטקסט).
    cover.position.z = openT < 0.5 ? 0.02 : lerp(0.02, -0.006, (openT - 0.5) / 0.5);

    // עמודי-שמאל (leaf A/B/base-left) מתגלים ככל שהכריכה נפתחת — לפני הפתיחה
    // הספר *סגור* (רק הכריכה נראית מימין). fade-in לפי openT.
    const leftReveal = smooth((openT - 0.18) / 0.6);
    leafA.mat.uniforms.uOpacity.value = leftReveal;
    leafB.mat.uniforms.uOpacity.value = leftReveal;
    baseLeft.mat.uniforms.uOpacity.value = leftReveal;
    // לוח-הגב (עובי/כהות מאחורי הספר הפתוח) נחשף עם הפתיחה — סגור מציג רק כריכה.
    backBoardMat.opacity = smooth((openT - 0.1) / 0.5) * 0.9;

    // leaf A: turn PI→0 (phase 0.40–0.56) ; z 0.010(left)→0.006(right)
    const ta = seg(p, 0.4, 0.56);
    leafA.mat.uniforms.uTheta.value = lerp(Math.PI, 0, ta);
    leafA.mat.uniforms.uCurl.value = Math.sin(ta * Math.PI) * CURL_MAX;
    leafA.mesh.position.z = lerp(0.010, 0.006, ta) + Math.sin(ta * Math.PI) * Z_LIFT;

    // leaf B: turn PI→0 (phase 0.66–0.82) ; z 0.006(left)→0.010(right)
    const tb = seg(p, 0.66, 0.82);
    leafB.mat.uniforms.uTheta.value = lerp(Math.PI, 0, tb);
    leafB.mat.uniforms.uCurl.value = Math.sin(tb * Math.PI) * CURL_MAX;
    leafB.mesh.position.z = lerp(0.006, 0.010, tb) + Math.sin(tb * Math.PI) * Z_LIFT;

    // מצלמה: push-in עדין + reframe קטן. בסגור (p→0) הספר מוסט ימינה כך שהכריכה
    // (עמוד-ימין) ממורכזת במסגרת; עם הפתיחה הוא חוזר למרכז (spine ממורכז).
    const pin = smooth(p);
    frame(lerp(3.95, 3.3, pin));
    book.rotation.y = lerp(0.08, 0.0, pin); // ¾ קל בהתחלה → חזיתי בהתיישבות
    book.position.x = lerp(-0.52, 0, seg(p, 0.0, 0.28));
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
    [blank, coverTex, baseRightTex, baseLeftTex, aFront, aBack, bFront, bBack].forEach((t) =>
      t.dispose(),
    );
    leafGeo.dispose();
    coverGeo.dispose();
    [baseRight, baseLeft, leafA, leafB].forEach((l) => l.mat.dispose());
    coverMat.dispose();
    backBoard.geometry.dispose();
    (backBoard.material as THREE.Material).dispose();
    shadow.geometry.dispose();
    (shadow.material as THREE.Material).dispose();
    renderer.dispose();
  }

  const ready = Promise.resolve();
  apply(0);
  return { setProgress, render, resize, dispose, ready };
}

// לוח-כריכה פנימי (liner) — נייר כהה-חמים.
function bakeBoardTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 89;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#26201b";
  ctx.fillRect(0, 0, c.width, c.height);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRadialShadow(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.75)");
  g.addColorStop(0.5, "rgba(0,0,0,0.32)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  return t;
}
