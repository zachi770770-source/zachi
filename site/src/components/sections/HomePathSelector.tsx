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
function readSession(): { path?: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { path?: string }) : null;
  } catch {
    return null;
  }
}

/**
 * לב עמוד הבית: „איפה זה פוגש אותך עכשיו?” — בחירה דטרמיניסטית מקומית (ללא AI,
 * ללא שרת). ארבעה כפתורי-מצב קומפקטיים (aria-pressed), ובלוק תוצאה יחיד שמתחלף
 * *במקום*: לפני בחירה אין תוצאה כלל; אחרי בחירה מוצג רק המסלול שנבחר — כותרת,
 * שיקוף קצר, עד שלוש נקודות, פעולה ראשית „שאל את הספר” וקישור לעמוד התחנה.
 *
 * כל ארבעת הבלוקים מרונדרים ב-SSR (קישורי-התחנות הם <a> אמיתיים וקיימים ב-HTML
 * לצורכי SEO/נגישות); רק הבלוק הנבחר גלוי (השאר `hidden`). האנימציה משפרת בלבד
 * תוכן שכבר קיים (reduced-motion בטוח). הבחירה נשמרת לאותה גלישה בלבד, בלי מידע
 * אישי ובלי חשבון.
 */
export function HomePathSelector() {
  const [selected, setSelected] = React.useState<HomePathId | null>(null);
  const pendingFocus = React.useRef(false);

  // שחזור בחירה קודמת (אותה גלישה בלבד, sessionStorage) — לא ממקד ולא שולח
  // אנליטיקה. ביקור חדש (session חדש) מתחיל נקי.
  React.useEffect(() => {
    const saved = readSession();
    if (saved?.path && VALID.has(saved.path as HomePathId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- שחזור חד-פעמי ב-mount
      setSelected(saved.path as HomePathId);
    }
  }, []);

  const choose = (id: HomePathId) => {
    pendingFocus.current = true;
    setSelected(id);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ path: id }));
    } catch {
      /* אחסון חסום — לא קריטי */
    }
    trackEvent("home_path_selected", { path: id });
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

        {/* ארבעת המצבים — כפתורים קומפקטיים (aria-pressed), „זה אני”, לא radio של
            טופס. 2×2 בדסקטופ, ערימה קומפקטית במובייל כדי להגיע מהר לתוצאה. */}
        <div
          role="group"
          aria-label="בחירת המצב שלך במסע"
          className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 sm:gap-4"
        >
          {homePaths.map((p) => {
            const active = selected === p.id;
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={active}
                onClick={() => choose(p.id)}
                className={`group flex items-center justify-between gap-3 rounded-2xl border-2 p-4 text-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-6 ${
                  active
                    ? "border-brand bg-brand-muted/50 shadow-sm"
                    : "border-border bg-surface hover:border-brand/50 hover:bg-surface-muted"
                }`}
              >
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-[1.15rem] font-bold leading-tight text-foreground sm:text-[1.35rem]">
                      {p.buttonTitle}
                    </span>
                    {p.gate ? (
                      <span className="inline-flex shrink-0 items-center rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground sm:text-[12px]">
                        {homePathUi.gateBadge}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[13.5px] leading-snug text-foreground-muted [text-wrap:pretty] sm:text-[15px]">
                    {p.buttonSub}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors sm:h-11 sm:w-11 ${
                    active ? "bg-brand text-brand-foreground" : "bg-surface-muted text-brand group-hover:bg-brand-muted"
                  }`}
                >
                  {active ? <Check className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* בלוק התוצאה — אחד בלבד. כל הבלוקים ב-DOM (SEO/נגישות: קישורי-התחנות
            <a> אמיתיים); רק הנבחר גלוי (`hidden` על השאר). לפני בחירה — אין תוצאה.
            החלפת מצב מחליפה כאן את התוכן במקום, עם אנימציית-כניסה עדינה. */}
        <div aria-live="polite" className="mx-auto mt-6 max-w-2xl">
          {homePaths.map((p) => (
            <article
              key={p.id}
              id={`path-panel-${p.id}`}
              hidden={selected !== p.id}
              className="path-panel border-t border-border pt-6 sm:pt-8"
            >
              {/* תווית ההקשר — המצב שנבחר (אישור קצר של הבחירה) + תג שער-מעבר. */}
              <p className="flex flex-wrap items-center gap-2">
                <span className="kicker">{p.buttonTitle}</span>
                {p.gate ? (
                  <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-semibold text-brand-foreground">
                    {homePathUi.gateBadge}
                  </span>
                ) : null}
              </p>

              {/* כותרת השיקוף — משפט אחד, קצר, הדבר הראשון שהעין קוראת. */}
              <h3
                id={`path-panel-${p.id}-heading`}
                tabIndex={-1}
                className="mt-2 max-w-[30ch] font-serif text-[1.4rem] font-semibold leading-[1.25] text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:balance] sm:text-[1.75rem]"
              >
                {p.heading}
              </h3>

              {/* עד שלוש נקודות — רשימה קומפקטית (כותרת מודגשת + שורה), לא כרטיסים. */}
              <ul className="mt-5 flex flex-col gap-2.5">
                {p.focuses.slice(0, 3).map((f) => (
                  <li key={f.title} className="flex items-start gap-2.5 text-[15px] leading-relaxed">
                    <span
                      aria-hidden="true"
                      className="mt-[0.6rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    />
                    <span className="[text-wrap:pretty]">
                      <span className="font-semibold text-foreground">{f.title}</span>
                      <span className="text-foreground-muted"> — {f.line}</span>
                    </span>
                  </li>
                ))}
              </ul>

              {/* פעולה ראשית „שאל את הספר” + קישור משני לעמוד התחנה. אפשר לעבור
                  למצב אחר בכל רגע דרך הכפתורים שמעל. */}
              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/compass">
                    {homePathUi.ctaSecondary}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
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
