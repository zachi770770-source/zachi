"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, HelpCircle } from "lucide-react";

import { stuckSelector, type StuckState } from "@/content/stuck";
import { trackEvent } from "@/lib/analytics";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

const URL_PARAM = "stuck";
const STORAGE_KEY = "stuck:last";
const VALID_IDS = new Set(stuckSelector.states.map((s) => s.id));

/** קריאה בטוחה מ-localStorage (עלול להיחסם/לזרוק במצב פרטי). */
function readStored(): StuckState["id"] | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && VALID_IDS.has(v as StuckState["id"]) ? (v as StuckState["id"]) : null;
  } catch {
    return null;
  }
}

/**
 * „איפה אתם נתקעים?” — בורר רפלקטיבי עם ארבעה מצבים קבועים ומבוקרים מתוך
 * גישת הספר (התוכן ב-src/content/stuck.ts). אין אבחון, ציון או הבטחה.
 *
 * חוויית משתמש: ללא הרשמה, ללא שמירה בשרת. הבחירה ניתנת להחלפה בכל רגע,
 * ומשוקפת ב-URL (?stuck=<id>) לצורך שיתוף — דרך history.replaceState בלבד.
 * במחשב כל האפשרויות גלויות תחת התוצאה; במובייל, לאחר בחירה, נשארת האפשרות
 * הנבחרת בלבד עם קישור „שינוי הבחירה”. נגישות: radiogroup נטיבי (חיצי
 * מקלדת), אזור תוצאה עם aria-live. עובד גם ללא אנימציה.
 *
 * variant="compact" (עמוד הבית כשער): גרסה קצרה — התוצאה מציגה זיהוי,
 * עיקרון, שאלה ל-CTA טעימה, ומפנה לעמוד הספר המלא. רשימת הפרקים
 * המפורטת מוצגת רק ב-variant="full" (למשל בעמוד ייעודי), כדי לשמור על
 * בית ניתן לסריקה בלי לאבד את התוכן — הוא נשאר זמין ב-/book וב-/preview.
 */
export function StuckSelector({
  variant = "full",
}: {
  variant?: "full" | "compact";
}) {
  const compact = variant === "compact";
  const [selected, setSelected] = React.useState<StuckState["id"] | null>(null);
  // מובייל בלבד: לאחר בחירה מקפלים את שאר האפשרויות ומציגים „שינוי הבחירה”.
  const [collapsed, setCollapsed] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);
  const groupRef = React.useRef<HTMLDivElement>(null);
  const openedRef = React.useRef(false);

  // קריאת בחירה משותפת מה-URL בטעינה (שיתוף קישור), ללא ניווט שרת.
  // ה-setState כאן מכוון: אי אפשר לקרוא את window ב-initializer של useState
  // (הרכיב עובר גם SSR), ולכן מסנכרנים מה-URL פעם אחת אחרי ה-mount.
  React.useEffect(() => {
    // עדיפות ל-URL (קישור משותף); אחרת נשחזר את הבחירה האחרונה מהמכשיר.
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    const restored =
      raw && VALID_IDS.has(raw as StuckState["id"])
        ? (raw as StuckState["id"])
        : readStored();
    if (restored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- סנכרון חד-פעמי בטעינה
      setSelected(restored);
      setCollapsed(true);
    }
  }, []);

  // „פתיחת הרכיב” — אירוע אנונימי חד-פעמי כשהרכיב נכנס לתצוגה.
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !openedRef.current) {
            openedRef.current = true;
            trackEvent("stuck_open");
            io.disconnect();
          }
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const choose = React.useCallback((id: StuckState["id"]) => {
    setSelected(id);
    setCollapsed(true);
    trackEvent("stuck_select", { option: id });
    // עדכון ה-URL לשיתוף — בלי לרענן, בלי לגלול, בלי שרת.
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, id);
    window.history.replaceState(null, "", url.toString());
    // שמירה מקומית — כדי לשחזר את הבחירה בביקור הבא (ללא שרת, ללא מעקב).
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      /* מצב פרטי/חסום — פשוט לא שומרים */
    }
  }, []);

  // „שינוי הבחירה” (מובייל) — מחזיר את כל האפשרויות ומעביר פוקוס לקבוצה.
  const expand = React.useCallback(() => {
    setCollapsed(false);
    requestAnimationFrame(() => {
      const group = groupRef.current;
      if (!group) return;
      group.scrollIntoView({ block: "nearest" });
      group.querySelector<HTMLInputElement>('input[type="radio"]')?.focus();
    });
  }, []);

  const active = selected
    ? stuckSelector.states.find((s) => s.id === selected) ?? null
    : null;

  return (
    <section
      ref={sectionRef}
      id="stuck"
      className="scroll-mt-24 py-20 sm:py-24"
      aria-labelledby="stuck-heading"
    >
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <span className="kicker">נקודת מבט</span>
          <h2 id="stuck-heading" className="type-h2 mt-4">
            {stuckSelector.title}
          </h2>
          <p
            id="stuck-intro"
            className="type-lead mt-5 text-[1.2rem] text-foreground-muted sm:text-[1.3rem]"
          >
            {stuckSelector.intro}
          </p>
        </div>

        <fieldset className="mx-auto mt-10 max-w-4xl border-0 p-0 sm:mt-12">
          <div
            ref={groupRef}
            role="radiogroup"
            aria-labelledby="stuck-heading"
            aria-describedby="stuck-intro"
            className="grid gap-4 sm:grid-cols-2 sm:gap-5"
          >
            {stuckSelector.states.map((state) => {
              const checked = selected === state.id;
              // במובייל, לאחר בחירה, מוסתרות האפשרויות שלא נבחרו (במחשב תמיד גלויות).
              const hiddenOnMobile = collapsed && !checked;
              return (
                <label
                  key={state.id}
                  className={
                    "group relative min-h-[76px] cursor-pointer items-center gap-4 rounded-lg border bg-surface px-5 py-5 transition-[color,background-color,border-color,box-shadow] duration-200 ease-out hover:border-secondary/50 hover:bg-surface-muted hover:shadow-sm has-[:checked]:border-secondary has-[:checked]:bg-secondary-muted has-[:checked]:shadow-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:px-6 sm:py-6 " +
                    (checked ? "border-secondary" : "border-border") +
                    " " +
                    (hiddenOnMobile ? "hidden sm:flex" : "flex")
                  }
                >
                  <input
                    type="radio"
                    name="stuck-option"
                    value={state.id}
                    checked={checked}
                    onChange={() => choose(state.id)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-border-strong transition-colors group-has-[:checked]:border-secondary"
                  >
                    <span className="h-3 w-3 scale-0 rounded-full bg-secondary transition-transform group-has-[:checked]:scale-100" />
                  </span>
                  <span className="text-start text-[18px] font-medium leading-snug text-foreground sm:text-[19px]">
                    {state.option}
                  </span>
                </label>
              );
            })}
          </div>

          {/* מובייל: קישור „שינוי הבחירה” המחזיר את כל האפשרויות */}
          {collapsed && active ? (
            <button
              type="button"
              onClick={expand}
              className="mt-4 inline-flex items-center gap-2 rounded-md px-2 py-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:hidden"
            >
              שינוי הבחירה
            </button>
          ) : null}
        </fieldset>

        {/* אזור התשובה — נקרא ע"י קורא מסך (aria-live). מוצג רק המצב הנבחר. */}
        <div aria-live="polite" className="mx-auto mt-8 max-w-[44rem] sm:mt-10">
          {active ? (
            <article
              key={active.id}
              className={
                "stuck-answer rounded-lg border-s-2 border-brand bg-surface-muted/60 px-5 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-10 sm:py-10 sm:pb-10 " +
                (compact ? "" : "sm:min-h-[24rem]")
              }
            >
              <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                בחרתם
              </p>
              <p className="mt-2.5 text-[1.4rem] font-semibold leading-[1.4] text-foreground sm:text-[1.65rem]">
                {active.identification}
              </p>

              <div className="mt-8 flex flex-col gap-7">
                <div className="flex gap-4">
                  <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                      {stuckSelector.ui.principleLabel}
                    </h3>
                    <p className="mt-2 text-[1.1rem] leading-[1.75] text-foreground/90">
                      {active.principle}
                    </p>
                  </div>
                </div>

                {compact ? null : (
                  <div className="flex gap-4">
                    <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                    <div>
                      <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                        {stuckSelector.ui.chaptersLabel}
                      </h3>
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {active.chapters.map((chapter) => (
                          <li key={chapter} className="text-[1.1rem] leading-relaxed text-foreground/90">
                            {chapter}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                      {stuckSelector.ui.questionLabel}
                    </h3>
                    <p className="mt-2 font-serif text-[1.2rem] italic leading-[1.6] text-foreground">
                      {active.question}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="h-[56px] w-full px-8 text-[17px] sm:w-auto">
                  <Link
                    href={stuckSelector.sampleHref}
                    onClick={() => trackEvent("stuck_to_sample", { option: active.id })}
                  >
                    {stuckSelector.ui.sampleCta}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="hidden text-sm text-foreground-muted sm:block">
                  {stuckSelector.ui.changeHint}
                </p>
              </div>

              <p className="mt-7 border-t border-border pt-5 text-[13.5px] leading-relaxed text-foreground-muted">
                {stuckSelector.disclaimer}
              </p>
            </article>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
