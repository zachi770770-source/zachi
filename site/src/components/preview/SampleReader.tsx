"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Sun, Moon, ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { sampleReader } from "@/content/sample";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { BookCover } from "@/components/shared/BookCover";

const PREFS_KEY = "sample-reader-prefs";
const MIN_SCALE = 0.9;
const MAX_SCALE = 1.5;
const STEP = 0.1;

type Theme = "light" | "dark";

// טעינת ההעדפה לפני ה-paint (useLayoutEffect) כדי למנוע הבזק בהיר לפני
// המעבר למצב כהה. בשרת אין layout effect — נופלים ל-useEffect.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/**
 * מצב קריאה נגיש לטעימה: תוכן HTML (לא תמונות), רוחב שורה נוח, טיפוגרפיה
 * עברית, מד התקדמות עדין, הגדלה/הקטנה של הכתב, ומצב בהיר/כהה — הכל בתוך אזור
 * הקריאה בלבד, עם שמירת העדפה מקומית. אין דפדוף מלאכותי המדמה ספר פיזי.
 *
 * `contextToolName` (אופציונלי) מגיע מ-Path Finder עם כלי+תחנה תקפים
 * (`/preview?tool=&station=`): מוצגת שורת-הקשר אישית קצרה, אך התוכן עצמו נשאר
 * הטעימה המאושרת בלבד — אין אבחון ואין תוכן שהומצא.
 */
export function SampleReader({ contextToolName }: { contextToolName?: string } = {}) {
  const [scale, setScale] = React.useState(1);
  const [theme, setTheme] = React.useState<Theme>("light");
  const [progress, setProgress] = React.useState(0);
  // „דיו חי” (PHASE 4B): כשקטע הטעימה נכנס לתצוגה, סמן קריאה בטרקוטה נמשך
  // לצד השורות ומשפט-המפתח מודגש בדיו. חד-פעמי (IO), לא נגרר-גלילה — נוח במובייל.
  const [reading, setReading] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const articleRef = React.useRef<HTMLElement>(null);
  const livingRef = React.useRef<HTMLDivElement>(null);
  const completedRef = React.useRef(false);

  const principleParts = React.useMemo(() => {
    const { text, emphasis } = sampleReader.principle;
    if (emphasis && text.startsWith(emphasis)) {
      return { key: emphasis, rest: text.slice(emphasis.length) };
    }
    return { key: "", rest: text };
  }, []);

  // טעינת העדפות מקומיות לפני ה-paint — ללא הבזק בהיר.
  useIsomorphicLayoutEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { scale?: number; theme?: Theme };
        if (typeof p.scale === "number") {
          setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, p.scale)));
        }
        if (p.theme === "dark" || p.theme === "light") {
          setTheme(p.theme);
        }
      }
    } catch {
      /* localStorage לא זמין — נשארים בברירת המחדל */
    }
  }, []);

  // אירוע צפייה אנונימי + הדלקת מעברי הצבע רק אחרי ה-mount (דרך ה-DOM,
  // ללא state) כדי שהחלת ההעדפה השמורה לא תיראה כהבזק מבהיר לכהה.
  React.useEffect(() => {
    rootRef.current?.classList.add("is-ready");
    trackEvent("view_sample");
    trackEvent("preview_opened");
  }, []);

  // שמירת העדפות — מקומית בלבד.
  React.useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ scale, theme }));
    } catch {
      /* מתעלמים אם אחסון חסום */
    }
  }, [scale, theme]);

  // מד התקדמות קריאה — מבוסס גלילה, throttle ב-rAF, נקי בכל דפדפן.
  React.useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = articleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const ratio = scrollable > 0 ? (0 - rect.top) / scrollable : 0;
      const clamped = Math.min(1, Math.max(0, ratio));
      setProgress(clamped);
      // „הגעה לסוף העמוד” — נמדד פעם אחת בלבד בכל טעינת עמוד. אינו טוען
      // שהטעימה נקראה במלואה, רק שהגולש גלל עד הסוף. אינו שומר תוכן.
      if (!completedRef.current && clamped >= 0.985) {
        completedRef.current = true;
        trackEvent("preview_reached_end");
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // „דיו חי” — הפעלה חד-פעמית כשקטע הטעימה נכנס לתצוגה (רק כשתנועה מותרת).
  React.useEffect(() => {
    const el = livingRef.current;
    if (!el) return;
    if (!document.documentElement.classList.contains("motion-js")) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setReading(true);
          io.disconnect();
        }
      },
      { threshold: 0.28 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // „דפדוף” בין חלקי הקריאה: כל „עלה” (reader-leaf) נכנס במעבר-דף עדין (CSS
  // בלבד, ללא WebGL) כשהוא מגיע לתצוגה. מצב הבסיס גלוי במלואו (ללא JS /
  // reduced-motion → אין הסתרה); רק תחת motion-js ה-JS „מפדף” אותם פנימה.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (!document.documentElement.classList.contains("motion-js")) return;
    if (typeof IntersectionObserver === "undefined") return;
    const leaves = Array.from(root.querySelectorAll<HTMLElement>(".reader-leaf"));
    root.classList.add("leaves-armed"); // רק כעת מסתירים — no-JS נשאר גלוי
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-turned");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    leaves.forEach((leaf) => io.observe(leaf));
    return () => io.disconnect();
  }, []);

  const adjust = (delta: number) =>
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round((s + delta) * 10) / 10)));

  const toggleTheme = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    // View Transitions API כאשר נתמך — מעבר בהיר/כהה חלק; אחרת החלפה מיידית.
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => void;
    };
    if (typeof doc.startViewTransition === "function") {
      doc.startViewTransition(() => setTheme(next));
    } else {
      setTheme(next);
    }
  };

  const primaryHref = siteConfig.salesOpen ? "/book#purchase" : "/waitlist";
  const primaryLabel = siteConfig.salesOpen
    ? "לרכישת הספר"
    : "קבלו עדכון כשהספר יוצא";

  return (
    <div
      ref={rootRef}
      className="sample-reader"
      data-reader-theme={theme}
      style={{ ["--reader-fs" as string]: String(scale) }}
    >
      <div className="reader-toolbar">
        <Link href="/" className="reader-back">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
          {sampleReader.backLabel}
        </Link>

        <div className="reader-tools">
          <div className="reader-fontgroup" role="group" aria-label={sampleReader.ui.fontLabel}>
            <button
              type="button"
              onClick={() => adjust(-STEP)}
              disabled={scale <= MIN_SCALE}
              className="reader-btn"
              aria-label={sampleReader.ui.fontSmaller}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="reader-fonticon">
              א
            </span>
            <button
              type="button"
              onClick={() => adjust(STEP)}
              disabled={scale >= MAX_SCALE}
              className="reader-btn"
              aria-label={sampleReader.ui.fontLarger}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="reader-btn"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? sampleReader.ui.themeLight : sampleReader.ui.themeDark}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <div
          className="reader-progress"
          role="progressbar"
          aria-label={sampleReader.ui.progressLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        >
          <span className="reader-progress__fill" style={{ transform: `scaleX(${progress})` }} />
        </div>
      </div>

      <article ref={articleRef} className="reader-content">
        {/* עמוד-שער זעיר לטעימה: העטיפה האמיתית של הספר, שהיא גם יעד המעבר
            „כניסה לטעימה” — הכריכה מהשער נמשכת ומשתנה גודל אל כאן. מרוסן,
            ואינו דוחק את חוויית הקריאה. */}
        <div data-vt-book-dest className="reader-cover">
          <BookCover />
        </div>
        <h1 className="reader-title">{sampleReader.title}</h1>
        <p className="reader-intro">{sampleReader.intro}</p>

        {/* שורת-הקשר אישית — רק כשהגענו מ-Path Finder עם כלי+תחנה תקפים. התוכן
            שמתחת נשאר הטעימה המאושרת בלבד (אין אבחון, אין תוכן שהומצא). */}
        {contextToolName ? (
          <p className="reader-context">{sampleReader.contextLine(contextToolName)}</p>
        ) : null}

        {/* קטע הטעימה עם „דיו חי”: סמן קריאה בטרקוטה נמשך לצד השורות ומשפט-
            המפתח מודגש בדיו. הטקסט נשאר בחירה/נגיש; ה-marker דקורטיבי בלבד. */}
        <div ref={livingRef} className={`living-ink reader-leaf${reading ? " is-reading" : ""}`}>
          <span className="living-ink__marker" aria-hidden="true" />

          <p className="reader-lead">{sampleReader.opening}</p>

          {sampleReader.passage.map((para, i) => (
            <p key={i} className="reader-p">
              {para}
            </p>
          ))}

          <aside className="reader-principle" aria-label={sampleReader.principle.label}>
            <span className="reader-principle__label">{sampleReader.principle.label}</span>
            <p className="reader-principle__text">
              {principleParts.key ? (
                <>
                  <span className="ink-key">{principleParts.key}</span>
                  {principleParts.rest}
                </>
              ) : (
                sampleReader.principle.text
              )}
            </p>
          </aside>
        </div>

        <p className="reader-question reader-leaf">{sampleReader.readerQuestion}</p>

        <p className="reader-p reader-ending reader-leaf">{sampleReader.ending}</p>

        <div className="reader-closing reader-leaf">
          <p className="reader-closing__prompt">{sampleReader.closingPrompt}</p>
          <p className="reader-closing__note">{sampleReader.closingNote}</p>
        </div>

        <div className={`reader-cta${reading ? " is-ready" : ""}`}>
          <Button asChild size="lg" className="h-[56px] w-full px-8 text-[17px] sm:w-auto">
            <Link href={primaryHref}>
              {primaryLabel}
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}
