"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Minus, Plus, Sun, Moon, ArrowLeft } from "lucide-react";

import { sampleReader } from "@/content/sample";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
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
 * קטע קריאה מותאם-כלי — נגזר *כולו* מהתוכן המאושר של אותו כלי (src/content/book.ts):
 * התרחיש, היישום, תובנת המפתח והשאלה. שונה בפועל לכל כלי (לא רק שורת-הקשר), בלי
 * טקסט חדש שהומצא. נבנה בשרת (preview/page.tsx) ומועבר כ-prop.
 */
export type ToolSample = {
  toolName: string;
  contextLine: string;
  /** פתיחת הקטע — התרחיש מהחיים של הכלי. */
  opening: string;
  /** גוף הקטע — היישום בפועל (פסקה אחת או יותר). */
  passage: string[];
  /** תובנת המפתח — מודגשת „בדיו”. */
  insight: string;
  /** שאלה לקורא — שאלת-המסגור של הכלי. */
  question: string;
};

/**
 * מצב קריאה נגיש לטעימה: תוכן HTML (לא תמונות), רוחב שורה נוח, טיפוגרפיה
 * עברית, מד התקדמות עדין, הגדלה/הקטנה של הכתב, ומצב בהיר/כהה — הכל בתוך אזור
 * הקריאה בלבד, עם שמירת העדפה מקומית. אין דפדוף מלאכותי המדמה ספר פיזי.
 *
 * `toolSample` (אופציונלי) מגיע מ-Path Finder עם כלי+תחנה תקפים
 * (`/preview?tool=&station=`): מציג קטע קריאה שונה *בפועל* לאותו כלי, שנבנה כולו
 * מהתוכן המאושר של הכלי — אין אבחון ואין תוכן שהומצא. בלי כלי תקף → הטעימה הכללית.
 */
export function SampleReader({ toolSample }: { toolSample?: ToolSample } = {}) {
  // תוכן הקריאה הפעיל: מותאם-כלי (אם הגענו מ-Path Finder) או הטעימה הכללית.
  // מיפוי מותאם-כלי: תרחיש→פתיחה, יישום→גוף, תובנה→משפט-מפתח מודגש, שאלה→שאלת
  // הרהור סוגרת. השאלה של הכלי אינה מוצגת באמצע (readerQuestion=null) אלא בסוף.
  const contextLine = toolSample?.contextLine;
  const opening = toolSample ? toolSample.opening : sampleReader.opening;
  const passage = toolSample ? toolSample.passage : sampleReader.passage;
  const principle = toolSample
    ? { label: "תובנת מפתח מהספר", text: toolSample.insight, emphasis: toolSample.insight }
    : sampleReader.principle;
  const readerQuestion = toolSample ? null : sampleReader.readerQuestion;
  const ending = toolSample ? null : sampleReader.ending;
  const closingPrompt = toolSample ? toolSample.question : sampleReader.closingPrompt;
  const [scale, setScale] = React.useState(1);
  const [theme, setTheme] = React.useState<Theme>("light");
  const [progress, setProgress] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const articleRef = React.useRef<HTMLElement>(null);
  const completedRef = React.useRef(false);

  // חישוב זול (ללא hook) — פיצול משפט-המפתח שמודגש „בדיו”. React Compiler ממילא
  // ממזכר; אין תלות ב-useMemo שמשתנה בכל render.
  const principleParts = (() => {
    const { text, emphasis } = principle;
    if (emphasis && text.startsWith(emphasis)) {
      return { key: emphasis, rest: text.slice(emphasis.length) };
    }
    return { key: "", rest: text };
  })();

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

  // (הוסר לחלוטין) כל מנגנוני החשיפה של הקורא — „דפדוף עלים” (leaves-armed/
  // reader-leaf/is-turned) ו„דיו חי” מבוסס-IO (is-reading). הם הסתירו תוכן
  // אחרי hydration (opacity:0/transform) עד שאירוע-חשיפה יפעל, וכשלא פעל —
  // התוכן נשאר בלתי-נראה. עכשיו התוכן הוא סטטי וגלוי במלואו: אין state, אין IO,
  // אין setTimeout, ואין class שמתווסף אחרי הטעינה ומשנה נראוּת/מיקום.

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

        {/* שורת-הקשר אישית — רק כשהגענו מ-Path Finder עם כלי+תחנה תקפים. הקטע
            שמתחת נגזר כולו מהתוכן המאושר של אותו כלי (אין אבחון, אין תוכן שהומצא). */}
        {contextLine ? <p className="reader-context">{contextLine}</p> : null}

        {/* קטע הטעימה — סמן-קריאה בטרקוטה ומשפט-מפתח מודגש, במצבם הסופי מיד
            (סטטי, בלי היתלות ב-JS). ה-marker דקורטיבי בלבד (aria-hidden). */}
        <div className="living-ink">
          <span className="living-ink__marker" aria-hidden="true" />

          <p className="reader-lead">{opening}</p>

          {passage.map((para, i) => (
            <p key={i} className="reader-p">
              {para}
            </p>
          ))}

          <aside className="reader-principle" aria-label={principle.label}>
            <span className="reader-principle__label">{principle.label}</span>
            <p className="reader-principle__text">
              {principleParts.key ? (
                <>
                  <span className="ink-key">{principleParts.key}</span>
                  {principleParts.rest}
                </>
              ) : (
                principle.text
              )}
            </p>
          </aside>
        </div>

        {readerQuestion ? (
          <p className="reader-question">{readerQuestion}</p>
        ) : null}

        {ending ? <p className="reader-p reader-ending">{ending}</p> : null}

        <div className="reader-closing">
          <p className="reader-closing__prompt">{closingPrompt}</p>
          <p className="reader-closing__note">{sampleReader.closingNote}</p>
        </div>

        <div className="reader-cta">
          <Button asChild size="lg" className="h-[56px] w-full px-8 text-[17px] sm:w-auto">
            <AmazonBuyLink source="preview">
              רוצים את הספר המלא? זמין עכשיו באמזון
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </AmazonBuyLink>
          </Button>
        </div>
      </article>
    </div>
  );
}
