"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { homePaths, homePathUi, type HomePathId } from "@/content/homePaths";
import { trackEvent } from "@/lib/analytics";

const STORAGE_KEY = "mdl_home_path";
const VALID = new Set<HomePathId>(homePaths.map((p) => p.id));

/** sessionStorage בלבד: רענון באותה גלישה זוכר את הבחירה; ביקור חדש מתחיל נקי. */
function readSession(): { path?: string; chapter2?: boolean } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { path?: string; chapter2?: boolean }) : null;
  } catch {
    return null;
  }
}

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — בחירה דטרמיניסטית מקומית (ללא AI,
 * ללא שרת). ארבעה כפתורי-מצב אמיתיים (aria-pressed), toggle „פרק ב’”, ובלוק תוכן
 * שמתחלף במקום. כל ארבעת הבלוקים מרונדרים ב-SSR (הקישורים לתחנות הם <a> אמיתיים
 * וקיימים ב-HTML לצורכי SEO/נגישות); רק הבלוק הנבחר גלוי (השאר `hidden`). מצב
 * הבסיס גלוי לחלוטין — האנימציה רק משפרת תוכן שכבר קיים (לא חוזרים על באג
 * /preview). הבחירה נשמרת מקומית להמשך אותה גלישה, בלי מידע אישי.
 */
export function HomePathSelector() {
  const [selected, setSelected] = React.useState<HomePathId | null>(null);
  const [chapter2, setChapter2] = React.useState(false);
  const pendingFocus = React.useRef(false);

  // שחזור בחירה קודמת (אותה גלישה בלבד, sessionStorage) — לא ממקד ולא שולח
  // אנליטיקה. ביקור חדש (session חדש) מתחיל נקי.
  React.useEffect(() => {
    const saved = readSession();
    if (saved?.path && VALID.has(saved.path as HomePathId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- שחזור חד-פעמי ב-mount
      setSelected(saved.path as HomePathId);
      if (saved.chapter2) setChapter2(true);
    }
  }, []);

  const persist = React.useCallback((path: HomePathId | null, ch2: boolean) => {
    try {
      if (path) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path, chapter2: ch2 }));
    } catch {
      /* אחסון חסום — לא קריטי */
    }
  }, []);

  const choose = (id: HomePathId) => {
    pendingFocus.current = true;
    setSelected(id);
    persist(id, chapter2);
    trackEvent("home_path_selected", { path: id });
  };

  const toggleChapter2 = (on: boolean) => {
    setChapter2(on);
    persist(selected, on);
    if (on) trackEvent("chapter2_context_selected");
  };

  // מיקוד לכותרת הבלוק רק לאחר בחירה יזומה (לא בשחזור). נגישות: קורא-מסך קופץ
  // לתוכן שנפתח, בלי scroll-jump אגרסיבי.
  React.useEffect(() => {
    if (!selected || !pendingFocus.current) return;
    pendingFocus.current = false;
    const el = document.getElementById(`path-panel-${selected}-heading`);
    if (el) {
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selected]);

  return (
    <section id="path" className="scroll-mt-20 py-11 sm:py-14" aria-labelledby="path-heading">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="path-heading" className="type-h2">
            {homePathUi.heading}
          </h2>
          <p className="type-lead mt-3 text-foreground-muted [text-wrap:pretty]">
            {homePathUi.sub}
          </p>
          <p className="mx-auto mt-3 max-w-xl text-[14px] italic text-foreground-muted">
            לא צריך לדעת הכול כדי להתחיל נכון.
          </p>
        </div>

        {/* ארבעת המצבים — כפתורים גדולים ובולטים (aria-pressed), „זה אני”, לא
            radio של טופס. 2×2 בדסקטופ, ערימה קומפקטית במובייל. */}
        <div
          role="group"
          aria-label="בחירת המצב שלך במסע"
          className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-2"
        >
          {homePaths.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => choose(p.id)}
                className={`group flex items-center justify-between gap-4 rounded-2xl border-2 p-6 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-7 ${
                  active
                    ? "border-brand bg-brand-muted/50 shadow-sm"
                    : "border-border bg-surface hover:border-brand/50 hover:bg-surface-muted"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-[1.4rem] font-bold leading-tight text-foreground">
                      {p.buttonTitle}
                    </span>
                    {p.gate ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-semibold text-brand-foreground">
                        {homePathUi.gateBadge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1.5 block text-[15px] leading-snug text-foreground-muted [text-wrap:pretty]">
                    {p.buttonSub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-brand text-brand-foreground" : "bg-surface-muted text-brand group-hover:bg-brand-muted"
                  }`}
                >
                  {active ? <Check className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* שכבת פרק ב’ — toggle עדין מתחת לארבעת המצבים. */}
        <div className="mx-auto mt-4 flex max-w-4xl items-center gap-2.5">
          <input
            id="home-chapter2"
            type="checkbox"
            checked={chapter2}
            onChange={(e) => toggleChapter2(e.target.checked)}
            className="h-4 w-4 shrink-0 rounded border-border-strong text-brand accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          />
          <label htmlFor="home-chapter2" className="text-[14.5px] font-medium text-foreground">
            {homePathUi.chapter2Label}
          </label>
        </div>

        {/* בלוקי התוכן — כולם ב-DOM (SEO/נגישות: הקישורים לתחנות <a> אמיתיים);
            רק הנבחר גלוי (`hidden` על השאר). מצב הבסיס גלוי, האנימציה רק כניסה. */}
        <div aria-live="polite" className="mx-auto mt-5 max-w-3xl">
          {homePaths.map((p) => (
            <article
              key={p.id}
              id={`path-panel-${p.id}`}
              hidden={selected !== p.id}
              className="path-panel border-t border-border pt-8 sm:pt-10"
            >
              {/* כותרת השיקוף — נוכחות של משפט מתוך ספר, הדבר הראשון שהעין קוראת. */}
              <h3
                id={`path-panel-${p.id}-heading`}
                tabIndex={-1}
                className="max-w-[26ch] font-serif text-[1.65rem] font-semibold leading-[1.2] text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:balance] sm:text-[2rem]"
              >
                {p.heading}
              </h3>
              <p className="mt-4 max-w-[60ch] text-[17px] leading-[1.75] text-foreground/85 [text-wrap:pretty]">
                {p.text}
              </p>

              {/* פסקת התאמה לפרק ב’ — ציטוט עם קו-הדגשה עדין, בלי קופסה. */}
              {chapter2 ? (
                <p className="mt-5 max-w-[60ch] border-s-2 border-brand/70 ps-4 font-serif text-[16px] italic leading-[1.7] text-foreground/80 [text-wrap:pretty]">
                  {p.chapter2}
                </p>
              ) : null}

              {/* שלושת המוקדים — שלוש עמודות editorial עם מספר וקו-הפרדה עדין,
                  לא כרטיסי-UI. במובייל נערמים עם קו עליון דק. */}
              <ol className="mt-9 grid gap-6 sm:grid-cols-3 sm:gap-0">
                {p.focuses.map((f, i) => (
                  <li
                    key={f.title}
                    className="border-t border-border/70 pt-4 first:border-t-0 first:pt-0 sm:border-t-0 sm:border-s sm:border-border sm:px-6 sm:pt-0 sm:first:border-s-0 sm:first:ps-0"
                  >
                    <span aria-hidden="true" className="font-serif text-[0.9rem] font-bold tracking-wide text-brand">
                      {`0${i + 1}`}
                    </span>
                    <h4 className="mt-1.5 font-serif text-[1.15rem] font-semibold leading-snug text-foreground">
                      {f.title}
                    </h4>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                      {f.line}
                    </p>
                  </li>
                ))}
              </ol>

              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/preview">
                    {homePathUi.ctaPrimary}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Link
                  href="/compass"
                  className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {homePathUi.ctaSecondary}
                </Link>
                <Link
                  href={p.stationHref}
                  className="group inline-flex items-center gap-1.5 text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:ms-auto"
                >
                  {p.stationLabel}
                  <ArrowLeft
                    className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
