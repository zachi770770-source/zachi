"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import {
  stations,
  stationOrder,
  type Station,
} from "@/content/stations";
// המסגור המאחד של התחנות (הועבר לכאן כשה-StationsSection הכפול הוסר ב-PHASE 16;
// טקסט קיים בלבד): „ספר אחד, מסע אחד” + „אהבה נבנית, לא רק נמצאת”.
import { stations as stationsCopy } from "@/content/book";
import { Container } from "@/components/shared/Container";

const URL_PARAM = "station";
const VALID = new Set(stationOrder);

/**
 * „איפה אתם נמצאים עכשיו?” — בורר אינטראקטיבי לשלוש התחנות הקיימות
 * (לפני קשר / מתחילים מחדש / בתוך קשר). כל התוכן קיים (src/content/stations.ts)
 * וכל תחנה מקשרת לעמוד הייעודי שלה (/before-relationship וכו').
 *
 * נגישות: radiogroup נטיבי (חיצי מקלדת בין האפשרויות), אזור תוצאה עם
 * aria-live שמכריז על הבחירה. עובד ללא JS (ה-fallback הוא שלוש התחנות
 * כקישורים גלויים) ומכבד prefers-reduced-motion (המעבר הוא opacity בלבד).
 *
 * פריסה: דסקטופ — מקטע-מסע אחד בשלושה חלקים על ציר; מובייל — ערימה נגישה.
 */
export function StationJourney() {
  const [selected, setSelected] = React.useState<Station["id"] | null>(null);
  const sectionRef = React.useRef<HTMLElement>(null);

  // בחירה משותפת מה-URL (קישור לשיתוף), פעם אחת אחרי mount.
  React.useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get(URL_PARAM);
    if (raw && VALID.has(raw as Station["id"])) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- סנכרון חד-פעמי מה-URL
      setSelected(raw as Station["id"]);
    }
  }, []);

  const choose = React.useCallback((id: Station["id"]) => {
    setSelected(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(URL_PARAM, id);
      window.history.replaceState(null, "", url.toString());
    } catch {
      /* לא קריטי */
    }
  }, []);

  const active = selected ? stations[selected] : null;
  const currentIndex = selected ? stationOrder.indexOf(selected) : -1;

  return (
    <section
      ref={sectionRef}
      id="where"
      className="scroll-mt-20 py-14 sm:py-16"
      aria-labelledby="where-heading"
    >
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            נקודת פתיחה
          </span>
          <h2 id="where-heading" className="type-h2 mt-4">
            איפה אתם נמצאים עכשיו?
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">
            {stationsCopy.intro} בחרו את התחנה שמדברת אליכם, ונראה מה הספר מציע
            בדיוק שם.
          </p>
        </div>

        {/* מחוון מסע (דקורטיבי) — שלוש תחנות על ציר, RTL. */}
        <div
          aria-hidden="true"
          className="mx-auto mt-9 flex max-w-3xl items-center justify-center gap-2 sm:gap-3"
        >
          {stationOrder.map((id, i) => (
            <React.Fragment key={id}>
              {i > 0 ? (
                <span
                  className={`h-px w-8 sm:w-16 ${
                    currentIndex >= 0 && i <= currentIndex
                      ? "bg-brand/50"
                      : "bg-border-strong"
                  }`}
                />
              ) : null}
              <span
                className={
                  id === selected
                    ? "h-2.5 w-2.5 rounded-full bg-brand ring-4 ring-brand/15"
                    : "h-2 w-2 rounded-full bg-border-strong"
                }
              />
            </React.Fragment>
          ))}
        </div>

        {/* בורר התחנות — radiogroup נגיש, מקטע בדסקטופ / ערימה במובייל */}
        <div
          role="radiogroup"
          aria-label="באיזו תחנה אתם נמצאים"
          className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3"
        >
          {stationOrder.map((id) => {
            const s = stations[id];
            const isSel = id === selected;
            return (
              <label
                key={id}
                className={`stuck-option group relative flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 text-start transition-colors ${
                  isSel
                    ? "border-brand bg-brand-muted/50"
                    : "border-border-strong bg-surface hover:border-brand/40 hover:bg-surface-muted"
                }`}
              >
                <input
                  type="radio"
                  name="station-journey"
                  value={id}
                  checked={isSel}
                  onChange={() => choose(id)}
                  className="sr-only"
                />
                <span className="font-serif text-[1.15rem] font-semibold text-foreground">
                  {s.navLabel}
                </span>
                <span
                  aria-hidden="true"
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    isSel
                      ? "border-brand bg-brand text-brand-foreground"
                      : "border-border-strong"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-current opacity-0 transition-opacity group-has-[:checked]:opacity-100" />
                </span>
              </label>
            );
          })}
        </div>

        {/* אזור התוצאה — תיאור + מה הספר מציע + CTA לתחנה. aria-live. */}
        <div aria-live="polite" className="mx-auto mt-6 max-w-3xl">
          {active ? (
            <article
              key={active.id}
              className="stuck-answer rounded-2xl border border-border bg-surface p-6 text-start sm:p-8"
            >
              <p className="kicker">בחרתם: {active.navLabel}</p>
              <p className="mt-3 text-[1.08rem] leading-[1.75] text-foreground">
                {active.lead}
              </p>

              <div className="mt-5 border-t border-border pt-5">
                <h3 className="font-serif text-lg font-semibold text-foreground">
                  {active.offer.title}
                </h3>
                {active.highlight ? (
                  <p className="mt-2 border-s-2 border-brand ps-3 font-serif text-[1.05rem] italic leading-relaxed text-brand-hover">
                    {active.highlight}
                  </p>
                ) : (
                  <p className="mt-2 text-[16px] leading-relaxed text-foreground-muted">
                    {active.offer.paragraphs[0]}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <Link
                  href={`/${active.id}`}
                  className="group inline-flex items-center gap-2 rounded-md text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  לתחנה המלאה: {active.navLabel}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </article>
          ) : (
            <p className="text-center text-[15px] text-foreground-muted">
              בחרו תחנה למעלה כדי לראות מה הספר מציע בה.
            </p>
          )}
        </div>
      </Container>
    </section>
  );
}
