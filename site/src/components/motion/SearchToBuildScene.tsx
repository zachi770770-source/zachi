"use client";

import * as React from "react";

import { Container } from "@/components/shared/Container";
import { StagedTextReveal } from "@/components/shared/StagedTextReveal";
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
const CHAR_STAGGER_MS = 55; // 45–65ms בין גרפמות
const WORD_GAP_MS = 100; // 80–120ms הפרדה נוספת בין מילים
/**
 * מודל „אות-אחר-אות” בסדר קריאה RTL לוגי: לכל מילה רשימת גרפמות עם ההשהיה
 * המצטברת. „אהבה” נבנית ראשונה, „היא”, ואז „בנייה.” משלימה — לא בבת אחת.
 */
const BUILD_CHARS: { ch: string; delay: number }[][] = (() => {
  let ci = 0;
  return BUILD_WORDS.map((word, wi) =>
    toGraphemes(word).map((ch) => {
      const delay = ci * CHAR_STAGGER_MS + wi * WORD_GAP_MS;
      ci += 1;
      return { ch, delay };
    })
  );
})();

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
    const revealBuild = () => buildEl?.classList.add("is-building");

    // גיבוי קשיח: אם ה-GSAP/scrub לא הפעיל את חשיפת-האותיות — הן ייחשפו בכל מקרה
    // כשהסצנה בתצוגה, כך שלעולם אינן נשארות ב-opacity 0 (כמו שאר מנגנוני הבטיחות).
    let failsafeTimer = 0;
    let failsafeIO: IntersectionObserver | undefined;
    if (buildEl && typeof IntersectionObserver !== "undefined") {
      failsafeIO = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
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

          // ===== דסקטופ/טאבלט — רצף pinned עם scrub =====
          mm.add("(min-width: 768px)", () => {
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
            tl
              // (1→2) הפיזור מתכווץ, מסתובב ונמוג אל המרכז = „חיפוש שמתלכד”
              .to(q(".s2b__scatter"), { scale: 0.45, rotate: -14, autoAlpha: 0, duration: 0.34 }, 0.04)
              // (3) „דייטינג הוא חיפוש” נסוג, מחליק ומתעמעם
              .to(q(".s2b__search"), { autoAlpha: 0.22, y: -40, scale: 0.92, duration: 0.22 }, 0.3)
              // (4) המבנה נבנה — הקו נמשך בהדגשה, הצמתים „קופצים” לתוקף (overshoot)
              .to(q(".s2b__line"), { strokeDashoffset: 0, duration: 0.34 }, 0.42)
              .to(q(".s2b__node"), { autoAlpha: 1, scale: 1, stagger: 0.06, duration: 0.26, ease: "back.out(2.2)" }, 0.5)
              .fromTo(q(".s2b__node-ring"), { scale: 0.4, autoAlpha: 0.6, transformOrigin: "center" }, { scale: 1.9, autoAlpha: 0, stagger: 0.06, duration: 0.34 }, 0.56)
              // (5) „אהבה היא בנייה” נבנית אות-אחר-אות — הטריגר מפעיל חשיפת-CSS
              // מבוססת-זמן (stagger בין גרפמות), והמשפט המורכב מוחזק לקריאה.
              .call(revealBuild, undefined, 0.72)
              // (6) קו הטרקוטה ממשיך אל התחנות — אחרי שהמשפט הורכב והוחזק
              .to(q(".s2b__route"), { scaleY: 1, duration: 0.16 }, 0.98);

            return () => tl.scrollTrigger?.kill();
          });

          // ===== מובייל — שלושה שלבים מטריגרים, ללא pin =====
          mm.add("(max-width: 767px)", () => {
            // מצב-התחלה (כמו בדסקטופ) — נקבע פעם אחת; הבסיס הקריא נשאר לנפילה.
            gsap.set(q(".s2b__scatter"), { autoAlpha: 0, scale: 1, transformOrigin: "50% 55%" });
            gsap.set(q(".s2b__line"), { strokeDashoffset: 1 });
            gsap.set(q(".s2b__node"), { autoAlpha: 0, scale: 0.35, transformOrigin: "center" });
            gsap.set(q(".s2b__route"), { scaleY: 0, transformOrigin: "top center" });

            // שלב 1 — הפיזור (חיפוש/רעש) מופיע ומרחף
            gsap.to(q(".s2b__scatter"), {
              scrollTrigger: { trigger: rootRef.current, start: "top 80%", once: true },
              autoAlpha: 1, duration: 0.5, ease: "power2.out",
            });
            gsap.to(q(".s2b__scatter-dot"), {
              x: "random(-8,8)", y: "random(-6,6)",
              duration: 1.4, ease: "sine.inOut", repeat: -1, yoyo: true,
              stagger: { each: 0.12, from: "random" },
            });
            // שלב 2 — הפיזור מתלכד ונמוג, והמבנה נבנה (קו + צמתים + פעימה)
            gsap.timeline({ scrollTrigger: { trigger: q(".s2b__motif"), start: "top 62%", once: true } })
              .to(q(".s2b__scatter"), { scale: 0.55, rotate: -12, autoAlpha: 0, duration: 0.55, ease: "power1.in" })
              .to(q(".s2b__line"), { strokeDashoffset: 0, duration: 0.75, ease: "power1.inOut" }, 0.2)
              .to(q(".s2b__node"), { autoAlpha: 1, scale: 1, stagger: 0.09, duration: 0.44, ease: "back.out(2.2)" }, 0.5)
              .fromTo(q(".s2b__node-ring"), { scale: 0.4, autoAlpha: 0.6, transformOrigin: "center" }, { scale: 1.9, autoAlpha: 0, stagger: 0.09, duration: 0.5 }, 0.6);
            // שלב 3 — „אהבה היא בנייה” נבנית אות-אחר-אות (טריגר → חשיפת-CSS) + קו ההמשך
            gsap.timeline({ scrollTrigger: { trigger: q(".s2b__build"), start: "top 82%", once: true } })
              .call(revealBuild)
              .to(q(".s2b__route"), { scaleY: 1, duration: 0.4, ease: "power2.out" }, 0.9);
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
      ctx?.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="s2b">
      <div ref={stageRef} className="s2b__stage">
        <Container className="relative">
          <div className="s2b__grid mx-auto grid max-w-5xl items-center gap-x-16 gap-y-10 md:grid-cols-2">
            {/* עמודת הטקסט — טקסט אמיתי קריא (התזה המלאה) */}
            <div className="s2b__text text-start">
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
                  <span aria-hidden="true">
                    {BUILD_CHARS.map((chars, wi) => (
                      <React.Fragment key={wi}>
                        <span className="s2b__build-word inline-block">
                          {chars.map(({ ch, delay }, ci) => (
                            <span
                              key={ci}
                              className="s2b__char"
                              style={
                                { "--char-delay": `${delay}ms` } as React.CSSProperties
                              }
                            >
                              {ch}
                            </span>
                          ))}
                        </span>
                        {wi < BUILD_CHARS.length - 1 ? " " : null}
                      </React.Fragment>
                    ))}
                  </span>
                  <span className="sr-only">{BUILD_TEXT}</span>
                </span>
              </h2>
              {/* התזה בפרוזה — „קריאה מבוקרת” מילה-אחר-מילה (StagedTextReveal).
                  חשיפה עצמאית ב-IntersectionObserver; GSAP אינו נוגע ב-s2b__intro
                  כדי שלא תהיה שליטה כפולה. בטוח-נפילה: הטקסט המלא מרונדר ב-SSR. */}
              <StagedTextReveal
                groups={[
                  {
                    text: bigIdea.intro,
                    as: "p",
                    className:
                      "s2b__intro mt-6 max-w-[42ch] text-lg leading-relaxed text-secondary-foreground/85 sm:text-xl",
                  },
                ]}
              />
            </div>

            {/* עמודת המוטיב — דקורטיבי (aria-hidden) */}
            <div className="s2b__motif relative">
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
                      {/* טבעת „פעימת בנייה” שמתפשטת כשהצומת מתמצק */}
                      <circle className="s2b__node-ring" cx={cx} cy={cy} r="9" fill="none" stroke="var(--color-brand)" strokeWidth="1.6" />
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
