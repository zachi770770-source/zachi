"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Sun, Moon, ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { sampleReader } from "@/content/sample";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

const PREFS_KEY = "sample-reader-prefs";
const MIN_SCALE = 0.9;
const MAX_SCALE = 1.5;
const STEP = 0.1;

type Theme = "light" | "dark";

// טעינת ההעדפה לפני ה-paint (useLayoutEffect) כדי למנוע הבזק בהיר לפני
// המעבר למצב כהה. בשרת אין layout effect — נופלים ל-useEffect.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/** מ״הערכת זמן קריאה: ספירת מילים בפועל / קצב עברי סביר. */
function estimateMinutes() {
  const words = [
    sampleReader.opening,
    ...sampleReader.passage,
    sampleReader.principle.text,
    sampleReader.readerQuestion,
    sampleReader.ending,
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

/**
 * מצב קריאה נגיש לטעימה: תוכן HTML (לא תמונות), רוחב שורה נוח, טיפוגרפיה
 * עברית, מד התקדמות עדין, הערכת זמן קריאה, הגדלה/הקטנה של הכתב, ומצב
 * בהיר/כהה — הכל בתוך אזור הקריאה בלבד, עם שמירת העדפה מקומית. אין דפדוף
 * מלאכותי המדמה ספר פיזי.
 */
export function SampleReader() {
  const [scale, setScale] = React.useState(1);
  const [theme, setTheme] = React.useState<Theme>("light");
  const [progress, setProgress] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const articleRef = React.useRef<HTMLElement>(null);
  const minutes = React.useMemo(() => estimateMinutes(), []);

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
      setProgress(Math.min(1, Math.max(0, ratio)));
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

  const primaryHref = siteConfig.salesOpen ? "/#purchase" : "/waitlist";
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
          <span className="reader-time" aria-hidden="true">
            {sampleReader.ui.readingTime(minutes)}
          </span>

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
        <span className="kicker">{sampleReader.eyebrow}</span>
        <h1 className="reader-title">{sampleReader.title}</h1>
        <p className="reader-intro">{sampleReader.intro}</p>

        <p className="reader-lead">{sampleReader.opening}</p>

        {sampleReader.passage.map((para, i) => (
          <p key={i} className="reader-p">
            {para}
          </p>
        ))}

        <aside className="reader-principle" aria-label={sampleReader.principle.label}>
          <span className="reader-principle__label">{sampleReader.principle.label}</span>
          <p className="reader-principle__text">{sampleReader.principle.text}</p>
        </aside>

        <p className="reader-question">{sampleReader.readerQuestion}</p>

        <p className="reader-p reader-ending">{sampleReader.ending}</p>

        <div className="reader-closing">
          <p className="reader-closing__prompt">{sampleReader.closingPrompt}</p>
          <p className="reader-closing__note">{sampleReader.closingNote}</p>
        </div>

        <div className="reader-cta">
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
