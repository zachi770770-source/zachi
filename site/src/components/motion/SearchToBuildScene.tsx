"use client";

import * as React from "react";

import { Container } from "@/components/shared/Container";
import { bigIdea } from "@/content/book";

/**
 * SearchToBuildScene — הרגע החתימתי של האתר: „דייטינג הוא חיפוש → אהבה היא
 * בנייה”, מסופר דרך גלילה (PHASE MOTION 3).
 *
 * נרטיב: (1) שברים מפוזרים = חיפוש/רעש → (2) הם מתלכדים → (3) „דייטינג הוא
 * חיפוש” נמוג → (4) מבנה יציב נבנה → (5) „אהבה היא בנייה” נבנית מילה-אחר-מילה →
 * (6) קו הטרקוטה ממשיך אל התחנות.
 *
 * ארכיטקטורה בטוחת-נפילה: ה-DOM מרנדר תמיד את ההרכב הסופי הקריא (שני חלקי
 * התזה, ה-intro, המבנה הבנוי, קו ההמשך). GSAP+ScrollTrigger נטענים דינמית
 * *אחרי* ה-mount (אחרי LCP), ורק אם אין prefers-reduced-motion; הם קובעים את
 * מצב-ההתחלה ומריצים את הכוריאוגרפיה. ללא JS / GSAP / תמיכה — נשאר המצב הסופי.
 * דסקטופ/טאבלט: רצף pinned יחיד (~150vh, scrub). מובייל: שלושה שלבים מטריגרים
 * (ללא pin). גלילה נטיבית נשמרת (scrub/trigger בלבד; ללא Lenis/scroll-jacking).
 */

const SEARCH_TEXT = bigIdea.title.split(".")[0] + "."; // „דייטינג הוא חיפוש.”
const BUILD_TEXT = bigIdea.title.split(".").slice(1).join(".").trim(); // „אהבה היא בנייה.”
const BUILD_WORDS = BUILD_TEXT.split(/\s+/).filter(Boolean);

// חלוקה לגרפמות (grapheme clusters) עברית — Intl.Segmenter עם נפילה בטוחה.
// דטרמיניסטי (טקסט קבוע) ⇒ זהה ב-SSR ובלקוח, בלי אי-התאמת הידרציה.
function toGraphemes(word: string): string[] {
  try {
    const seg = new Intl.Segmenter("he", { granularity: "grapheme" });
    return Array.from(seg.segment(word), (s) => s.segment);
  } catch {
    return Array.from(word); // נפילה: נקודות-קוד (בטוח לעברית ללא ניקוד)
  }
}
/** תזמון חשיפת-האותיות: stagger בין אותיות + מרווח נוסף בין מילים. */
const CHAR_STAGGER_MS = 100; // מרווח בין גרפמה לגרפמה (קצב קריא, אות-אחר-אות)
const WORD_GAP_MS = 210; // השהיית „נשימה” בגבול-מילה (במקום ה-100 הרגיל)
const CHAR_ENTRANCE_MS = 440; // משך כניסת כל אות
/**
 * מודל „אות-אחר-אות” בסדר קריאה RTL לוגי: לכל מילה רשימת גרפמות עם ההשהיה
 * המצטברת. „אהבה” נבנית ראשונה, „היא”, ואז „בנייה.” משלימה — לא בבת אחת.
 * ההשהיה מצטברת ברצף: בין אותיות באותה מילה +CHAR_STAGGER, ובגבול-מילה
 * +WORD_GAP (כך שהפער בין מילים הוא בדיוק WORD_GAP, לא stagger+gap).
 */
const BUILD_CHARS: { ch: string; delay: number }[][] = (() => {
  let acc = 0;
  let first = true;
  return BUILD_WORDS.map((word) =>
    toGraphemes(word).map((ch, gi) => {
      if (first) {
        first = false;
      } else if (gi === 0) {
        acc += WORD_GAP_MS; // גבול-מילה: נשימה ארוכה יותר
      } else {
        acc += CHAR_STAGGER_MS; // אות-אחר-אות בתוך המילה
      }
      return { ch, delay: acc };
    })
  );
})();
/**
 * שורות מוגדרות-מראש (deterministic) לשליטה בשבירה לפי רוחב — ללא wrap אוטומטי
 * שמשתנה תוך כדי האנימציה. שתי מילים ראשונות בשורה אחת („אהבה היא”) והשלישית
 * בשורה שנייה („בנייה.”). בדסקטופ השורות inline ⇒ שורה אחת; בטאבלט/מובייל block
 * ⇒ שתי שורות קבועות. סדר וזמני ההשהיה נשמרים רציפים (RTL) בין השורות.
 */
const LINE_WORD_INDICES: number[][] =
  BUILD_WORDS.length >= 3 ? [[0, 1], [2]] : BUILD_WORDS.map((_, i) => [i]);
const BUILD_LINES = LINE_WORD_INDICES.map((idxs) =>
  idxs.map((i) => BUILD_CHARS[i])
);
/** משך הרכבת המשפט המלא (האות האחרונה + משך כניסתה) — נקודת „הכותרת הושלמה”. */
const LETTERS_TOTAL_MS =
  Math.max(0, ...BUILD_CHARS.flat().map((c) => c.delay)) + CHAR_ENTRANCE_MS;
/** החזקת המשפט המלא לפני הופעת הטקסט המשני (≥1.5ש קריאה). */
const HOLD_BEFORE_INTRO_MS = 1500;

/** מיקומי חמשת צמתי המבנה (עולים = „בנייה”). */
const NODES: Array<[number, number]> = [
  [56, 168],
  [116, 142],
  [172, 152],
  [228, 116],
  [286, 92],
];
const LINE_D = `M${NODES.map(([x, y]) => `${x} ${y}`).join(" L")}`;
/** נקודות „חיפוש” מפוזרות (רעש) — נמוגות/מתכנסות. */
const SCATTER: Array<[number, number]> = [
  [40, 60], [92, 40], [150, 70], [210, 48], [268, 66],
  [70, 100], [134, 108], [196, 96], [252, 118], [110, 60],
];

export function SearchToBuildScene() {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const stageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    // reduced-motion / אין matchMedia ⇒ אין תנועה; נשאר ההרכב הסופי הקריא.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const buildEl = rootRef.current?.querySelector(".s2b__build");
    const introEl = rootRef.current?.querySelector(".s2b__intro");

    // חשיפת הכותרת אות-אחר-אות; ורק לאחר שהמשפט הושלם — fade-up של טקסט ההסבר
    // המשני. מוגן מפני קריאות חוזרות (scrub הלוך-ושוב) כדי לא לערום טיימרים.
    let built = false;
    let introTimer = 0;
    const revealBuild = () => {
      if (built) return;
      built = true;
      buildEl?.classList.add("is-building");
      // המשפט המלא מוחזק ≥1.5ש לפני שהטקסט המשני מופיע (fade-up): החשיפה מתוזמנת
      // ל„סיום האותיות + זמן ההחזקה”.
      introTimer = window.setTimeout(
        () => introEl?.classList.add("is-in"),
        LETTERS_TOTAL_MS + HOLD_BEFORE_INTRO_MS
      );
    };

    // גיבוי קשיח: אם ה-GSAP/scrub לא הפעיל את חשיפת-האותיות — הן ייחשפו בכל מקרה
    // כשהסצנה בתצוגה, כך שלעולם אינן נשארות ב-opacity 0 (כמו שאר מנגנוני הבטיחות).
    let failsafeTimer = 0;
    let failsafeIO: IntersectionObserver | undefined;
    if (buildEl && typeof IntersectionObserver !== "undefined") {
      failsafeIO = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            // גיבוי בלבד (GSAP הוא המפעיל הראשי, בנקודה שבה „דייטינג הוא חיפוש”
            // כבר דעך והמסלול נבנה). מספיק קצר כדי שהאותיות לעולם לא יישארו נסתרות.
            failsafeTimer = window.setTimeout(revealBuild, 2600);
            failsafeIO?.disconnect();
          }
        },
        // rootMargin נדיב + threshold 0 ⇒ נתפס גם בגלילה מהירה/קופצנית שאחרת
        // עלולה „לדלג” על מסגרת ההצטלבות (בטיחות מוחלטת: האותיות תמיד נחשפות).
        { rootMargin: "500px 0px 500px 0px", threshold: 0 }
      );
      failsafeIO.observe(buildEl);
    }

    let killed = false;
    let ctx: { revert: () => void } | undefined;

    (async () => {
      try {
        const [{ gsap }, { ScrollTrigger }] = await Promise.all([
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
        if (killed || !rootRef.current) return;
        gsap.registerPlugin(ScrollTrigger);

        ctx = gsap.context(() => {
          const q = gsap.utils.selector(rootRef);
          const mm = gsap.matchMedia();

          // ===== רצף pinned עם scrub — לכל הרוחבים (דסקטופ ומובייל) =====
          // מובייל מקבל את אותה כוריאוגרפיה נעוצה: הבמה ננעצת וממורכזת, כך
          // שהמשפט „אהבה היא בנייה” נבנה במרכז המסך, מוחזק, והסקשן הבא אינו
          // נכנס עד שהגלילה עברה את אזור ה-pin (הרצף הושלם ונקרא).
          mm.add("(min-width: 1px)", () => {
            // מצב-התחלה: הפיזור גדול ומפוזר (רעש/חיפוש), הצמתים זעירים ונסתרים.
            gsap.set(q(".s2b__scatter"), { autoAlpha: 1, scale: 1.18, rotate: 6, transformOrigin: "50% 55%" });
            gsap.set(q(".s2b__scatter-dot"), { transformOrigin: "center" });
            gsap.set(q(".s2b__line"), { strokeDashoffset: 1 });
            gsap.set(q(".s2b__node"), { autoAlpha: 0, scale: 0.2, transformOrigin: "center" });
            // „אהבה היא בנייה” נחשפת אות-אחר-אות (CSS מבוסס-זמן) בטריגר בהמשך —
            // GSAP אינו נוגע ב-.s2b__char כדי שלא תהיה שליטה כפולה.
            gsap.set(q(".s2b__route"), { scaleY: 0, transformOrigin: "top center" });
            gsap.set(q(".s2b__search"), { autoAlpha: 1, y: 0, scale: 1, transformOrigin: "right center" });

            // „חיפוש חי” — הנקודות נסחפות ברצף כל עוד הן גלויות (לא-scrubbed).
            gsap.to(q(".s2b__scatter-dot"), {
              x: "random(-10,10)", y: "random(-8,8)",
              duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true,
              stagger: { each: 0.12, from: "random" },
            });

            const tl = gsap.timeline({
              defaults: { ease: "none" },
              scrollTrigger: {
                trigger: rootRef.current,
                start: "top top",
                end: "+=180%",
                scrub: 0.6,
                pin: stageRef.current,
                pinSpacing: true,
                anticipatePin: 1,
              },
            });
            // סדר קפדני (מסונכרן-גלילה): (1) פיזור נמוג → (2) „דייטינג הוא חיפוש”
            // דועך ומסתיים → (3) הקו נמשך → (4) הצמתים מתמצקים → ורק אז (5) „אהבה
            // היא בנייה” נבנית אות-אחר-אות. הטריגר של האותיות (0.58) בא *אחרי*
            // שהחיפוש דעך (מסתיים ~0.5) והמסלול נבנה — כך שהסדר לעולם לא מתערבב.
            tl
              // (1→2) הפיזור מתכווץ, מסתובב ונמוג אל המרכז = „חיפוש שמתלכד”
              .to(q(".s2b__scatter"), { scale: 0.45, rotate: -14, autoAlpha: 0, duration: 0.3 }, 0.04)
              // (3) „דייטינג הוא חיפוש” נסוג, מחליק ומתעמעם — מסתיים ~0.5
              .to(q(".s2b__search"), { autoAlpha: 0.18, y: -34, scale: 0.92, duration: 0.24 }, 0.26)
              // (4) הקו נמשך בהדגשה (יסוד המבנה לפני הצמתים)
              .to(q(".s2b__line"), { strokeDashoffset: 0, duration: 0.3 }, 0.4)
              // הצמתים מתמצקים — עלייה חלקה ויציבה (ללא פעימת-טבעת מהבהבת)
              .to(q(".s2b__node"), { autoAlpha: 1, scale: 1, stagger: 0.05, duration: 0.18, ease: "power2.out" }, 0.48)
              // (5) „אהבה היא בנייה” נבנית אות-אחר-אות — הטריגר מפעיל חשיפת-CSS
              // מבוססת-זמן (stagger בין גרפמות), והמשפט המורכב מוחזק לקריאה.
              .call(revealBuild, undefined, 0.58)
              // (6) קו הטרקוטה ממשיך אל התחנות — אחרי שהמשפט הורכב והוחזק
              .to(q(".s2b__route"), { scaleY: 1, duration: 0.16 }, 0.98);

            return () => tl.scrollTrigger?.kill();
          });
        }, rootRef);
      } catch {
        /* GSAP נכשל בטעינה — ההרכב הסופי כבר גלוי (בטוח). */
      }
    })();

    return () => {
      killed = true;
      failsafeIO?.disconnect();
      if (failsafeTimer) clearTimeout(failsafeTimer);
      if (introTimer) clearTimeout(introTimer);
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="s2b">
      <div ref={stageRef} className="s2b__stage">
        <Container className="relative">
          <div className="s2b__grid mx-auto grid max-w-5xl items-center gap-x-16 gap-y-8 md:grid-cols-2 md:gap-y-10">
            {/* עמודת הטקסט — טקסט אמיתי קריא (התזה המלאה). במובייל ממורכז כדי
                שהמשפט „אהבה היא בנייה” יישב במרכז אזור הצפייה הנעוץ. */}
            <div className="s2b__text text-center md:text-start">
              <h2
                id="thesis-heading"
                className="font-serif text-[2.4rem] font-semibold leading-[1.08] text-secondary-foreground sm:text-5xl lg:text-[3.4rem]"
              >
                <span className="s2b__search block text-secondary-foreground/90">
                  {SEARCH_TEXT}
                </span>
                {/* „אהבה היא בנייה.” נבנית אות-אחר-אות (grapheme). העטיפות
                    החזותיות aria-hidden; קוראי-מסך מקבלים את המשפט השלם פעם אחת
                    (sr-only). סדר DOM = סדר קריאה לוגי RTL; ה-bidi של הדפדפן
                    מסדר את הגרפמות מימין-לשמאל — המשפט לעולם אינו מתהפך. */}
                <span className="s2b__build mt-2 block text-brand-muted">
                  {/* מבנה השורות והרוחב שמור מראש; כל אות מונפשת ב-opacity/scale
                      בלבד (ללא הזזת layout, ללא קפיצת-שורה). השורות inline בדסקטופ
                      (שורה אחת) ו-block בטאבלט/מובייל (שתי שורות קבועות). */}
                  <span aria-hidden="true" className="s2b__build-vis">
                    {BUILD_LINES.map((lineWords, li) => (
                      <React.Fragment key={li}>
                        <span className="s2b__build-line">
                          {lineWords.map((chars, wi) => (
                            <React.Fragment key={wi}>
                              <span className="s2b__build-word">
                                {chars.map(({ ch, delay }, ci) => (
                                  <span
                                    key={ci}
                                    className="s2b__char"
                                    style={
                                      {
                                        "--char-delay": `${delay}ms`,
                                      } as React.CSSProperties
                                    }
                                  >
                                    {ch}
                                  </span>
                                ))}
                              </span>
                              {wi < lineWords.length - 1 ? " " : null}
                            </React.Fragment>
                          ))}
                        </span>
                        {/* רווח בין השורות — משמעותי רק כשהשורות inline (דסקטופ) */}
                        {li < BUILD_LINES.length - 1 ? " " : null}
                      </React.Fragment>
                    ))}
                  </span>
                  <span className="sr-only">{BUILD_TEXT}</span>
                </span>
              </h2>
              {/* טקסט ההסבר המשני — מופיע ב-fade-up קצר *רק אחרי* שהכותרת
                  הושלמה אות-אחר-אות (המחלקה .is-in נוספת ב-revealBuild אחרי
                  LETTERS_TOTAL_MS). בטוח-נפילה: הטקסט המלא מרונדר ב-SSR וגלוי
                  כברירת מחדל (ההסתרה מגודרת ב-.motion-js בלבד). */}
              <p className="s2b__intro mx-auto mt-6 max-w-[42ch] text-lg leading-relaxed text-secondary-foreground/85 md:mx-0 sm:text-xl">
                {bigIdea.intro}
              </p>
            </div>

            {/* עמודת המוטיב — דקורטיבי (aria-hidden). במובייל מצומצם וממורכז
                כדי שהרצף כולו יישאר בתוך הבמה הנעוצה בגובה מסך אחד. */}
            <div className="s2b__motif relative mx-auto w-full max-w-[260px] md:max-w-none">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10 mx-auto my-auto h-40 w-[85%] rounded-full bg-secondary-foreground/[0.06] blur-[54px]"
              />
              <svg
                viewBox="0 0 320 210"
                role="presentation"
                aria-hidden="true"
                focusable="false"
                className="w-full"
              >
                {/* חיפוש: פיזור נקודות + קווים מקווקווים (נמוגים) */}
                <g className="s2b__scatter" stroke="var(--color-secondary-foreground)" strokeWidth="1.1" strokeLinecap="round" style={{ opacity: 0 }}>
                  <path d="M40 60 L92 40" strokeDasharray="3 6" opacity="0.5" />
                  <path d="M150 70 L210 48" strokeDasharray="3 6" opacity="0.5" />
                  <path d="M70 100 L134 108" strokeDasharray="3 6" opacity="0.5" />
                  <g fill="var(--color-secondary-foreground)" stroke="none">
                    {SCATTER.map(([cx, cy], i) => (
                      <circle key={i} className="s2b__scatter-dot" cx={cx} cy={cy} r="2.4" opacity="0.7" />
                    ))}
                  </g>
                </g>

                {/* בנייה: קו רציף מודגש דרך חמישה צמתים (המבנה הבנוי) */}
                <path
                  className="s2b__line"
                  d={LINE_D}
                  pathLength={1}
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeOpacity="0.95"
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <g>
                  {NODES.map(([cx, cy], i) => (
                    <g key={i} className="s2b__node">
                      {/* צומת „בנייה” — הילה רכה + ליבה מלאה. ללא טבעת-פעימה
                          (מקור הבהוב); הצומת מתמצק חלק ונשאר יציב. */}
                      <circle cx={cx} cy={cy} r="9.5" fill="var(--color-brand-muted)" opacity="0.32" />
                      <circle cx={cx} cy={cy} r="5.4" fill="var(--color-brand)" />
                    </g>
                  ))}
                </g>
              </svg>
            </div>
          </div>

          {/* (6) קו הטרקוטה שממשיך אל התחנות (מתחת לסצנה) */}
          <span
            aria-hidden="true"
            className="s2b__route mx-auto mt-10 block h-14 w-[2px] rounded-full bg-brand md:mt-14"
          />
        </Container>
      </div>
    </div>
  );
}
