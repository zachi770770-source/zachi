"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Compass, HelpCircle } from "lucide-react";

import { stuckSelector, type StuckState } from "@/content/stuck";
import { trackEvent } from "@/lib/analytics";
import { Container } from "@/components/shared/Container";
import { Button } from "@/components/ui/button";

const URL_PARAM = "stuck";
const VALID_IDS = new Set(stuckSelector.states.map((s) => s.id));

/**
 * „איפה אתם נתקעים?” — בורר רפלקטיבי עם ארבעה מצבים קבועים ומבוקרים מתוך
 * גישת הספר (התוכן ב-src/content/stuck.ts). אין אבחון, ציון או הבטחה.
 *
 * חוויית משתמש: ללא הרשמה, ללא שמירה בשרת. הבחירה ניתנת להחלפה בכל רגע,
 * ומשוקפת ב-URL (?stuck=<id>) לצורך שיתוף — דרך history.replaceState בלבד,
 * בלי ניווט שרת. נגישות: radiogroup נטיבי (חיצי מקלדת), אזור תוצאה עם
 * aria-live. עובד גם ללא אנימציה (התוכן מוצג תמיד; ה-fade הוא קישוט בלבד).
 */
export function StuckSelector() {
  const [selected, setSelected] = React.useState<StuckState["id"] | null>(null);
  const sectionRef = React.useRef<HTMLElement>(null);
  const openedRef = React.useRef(false);

  // קריאת בחירה משותפת מה-URL בטעינה (שיתוף קישור), ללא ניווט שרת.
  // ה-setState כאן מכוון: אי אפשר לקרוא את window ב-initializer של useState
  // (הרכיב עובר גם SSR), ולכן מסנכרנים מה-URL פעם אחת אחרי ה-mount.
  React.useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (raw && VALID_IDS.has(raw as StuckState["id"])) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- סנכרון חד-פעמי מה-URL בטעינה
      setSelected(raw as StuckState["id"]);
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
    trackEvent("stuck_select", { option: id });
    // עדכון ה-URL לשיתוף — בלי לרענן, בלי לגלול, בלי שרת.
    const url = new URL(window.location.href);
    url.searchParams.set(URL_PARAM, id);
    window.history.replaceState(null, "", url.toString());
  }, []);

  const active = selected
    ? stuckSelector.states.find((s) => s.id === selected) ?? null
    : null;

  return (
    <section
      ref={sectionRef}
      id="stuck"
      className="scroll-mt-24 py-20 sm:py-28"
      aria-labelledby="stuck-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker">נקודת מבט</span>
          <h2 id="stuck-heading" className="type-h2 mt-4">
            {stuckSelector.title}
          </h2>
          <p className="type-lead mt-5 text-foreground-muted">
            {stuckSelector.intro}
          </p>
        </div>

        <fieldset className="mx-auto mt-12 max-w-4xl border-0 p-0">
          <legend className="sr-only">{stuckSelector.intro}</legend>
          <div
            role="radiogroup"
            aria-label={stuckSelector.title}
            className="grid gap-4 sm:grid-cols-2"
          >
            {stuckSelector.states.map((state) => {
              const checked = selected === state.id;
              return (
                <label
                  key={state.id}
                  className="group relative flex cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface p-5 transition-colors hover:border-brand/40 hover:bg-surface-muted has-[:checked]:border-brand has-[:checked]:bg-brand-muted has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand sm:p-6"
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
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-border-strong transition-colors group-has-[:checked]:border-brand"
                  >
                    <span className="h-2.5 w-2.5 scale-0 rounded-full bg-brand transition-transform group-has-[:checked]:scale-100" />
                  </span>
                  <span className="text-start text-[17px] font-medium leading-snug text-foreground">
                    {state.option}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* אזור התשובה — נקרא ע"י קורא מסך (aria-live). מוצג רק המצב הנבחר. */}
        <div aria-live="polite" className="mx-auto mt-8 max-w-3xl">
          {active ? (
            <article
              key={active.id}
              className="animate-fade-in rounded-3xl border border-border bg-surface p-6 sm:p-9"
            >
              <p className="text-[1.15rem] font-medium leading-relaxed text-foreground">
                {active.identification}
              </p>

              <div className="mt-7 flex flex-col gap-6">
                <div className="flex gap-3.5">
                  <Compass className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                      {stuckSelector.ui.principleLabel}
                    </h3>
                    <p className="mt-1.5 text-[1.05rem] leading-relaxed text-foreground/90">
                      {active.principle}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                      {stuckSelector.ui.chaptersLabel}
                    </h3>
                    <ul className="mt-1.5 flex flex-col gap-1">
                      {active.chapters.map((chapter) => (
                        <li key={chapter} className="text-[1.05rem] text-foreground/90">
                          {chapter}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3.5">
                  <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                  <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
                      {stuckSelector.ui.questionLabel}
                    </h3>
                    <p className="mt-1.5 font-serif text-[1.15rem] italic leading-relaxed text-foreground">
                      {active.question}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col items-start gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link
                    href={stuckSelector.sampleHref}
                    onClick={() => trackEvent("stuck_to_sample", { option: active.id })}
                  >
                    {stuckSelector.ui.sampleCta}
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <p className="text-sm text-foreground-muted">
                  {stuckSelector.ui.changeHint}
                </p>
              </div>

              <p className="mt-6 rounded-xl bg-surface-muted px-4 py-3 text-[13px] leading-relaxed text-foreground-muted">
                {stuckSelector.disclaimer}
              </p>
            </article>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
