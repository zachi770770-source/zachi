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
  const [inview, setInview] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);
  const routeRef = React.useRef<HTMLDivElement>(null);
  const markerRef = React.useRef<HTMLSpanElement>(null);

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

  // כניסה לתצוגה — הפעלת „משיכת המסלול” (רק כשתנועה מתקדמת מותרת).
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (!document.documentElement.classList.contains("motion-js")) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInview(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // הזזת סמן המסלול אל מרכז התחנה הנבחרת (נמדד — בטוח ל-RTL). מגיב לשינוי
  // בחירה ולשינוי גודל. ה-transition מוגדר ב-CSS ומכובד תחת reduced-motion.
  React.useEffect(() => {
    const route = routeRef.current;
    const marker = markerRef.current;
    if (!route || !marker) return;
    const place = () => {
      if (currentIndex < 0) return;
      const nodes = route.querySelectorAll<HTMLElement>(".station-route__node");
      const node = nodes[currentIndex];
      if (!node) return;
      const rr = route.getBoundingClientRect();
      const nr = node.getBoundingClientRect();
      marker.style.setProperty("--mx", `${nr.left + nr.width / 2 - rr.left}px`);
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [currentIndex]);

  return (
    <section
      ref={sectionRef}
      id="where"
      className="scroll-mt-20 py-14 sm:py-16"
      aria-labelledby="where-heading"
    >
      <Container>
        {/* #3 המשכיות נרטיב — קו המשך שנמשך מסצנת „חיפוש→בנייה” שמעל אל מסלול
            התחנות, כך שהסיפור אינו מתאפס אחרי הסצנה הנעוצה. דקורטיבי. */}
        <span
          aria-hidden="true"
          className={`journey-connector${inview ? " is-inview" : ""}`}
        />
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

        {/* מסלול המסע — קו טרקוטה דרך שלוש התחנות (ממשיך את קו הסצנה שמעל),
            נמשך בכניסה לתצוגה, וסמן שנע לתחנה הנבחרת. דקורטיבי (aria-hidden);
            הבחירה הנגישה היא ב-radiogroup שמתחת. */}
        <div
          ref={routeRef}
          aria-hidden="true"
          className={`station-route mx-auto mt-9 max-w-2xl${inview ? " is-inview" : ""}${
            currentIndex >= 0 ? " has-selection" : ""
          }`}
        >
          <span className="station-route__line" />
          <span ref={markerRef} className="station-route__marker" />
          <div className="station-route__nodes">
            {stationOrder.map((id, i) => (
              <span
                key={id}
                className="station-route__node"
                data-active={currentIndex >= 0 && i <= currentIndex ? "true" : "false"}
                data-current={i === currentIndex ? "true" : "false"}
                style={{ "--i": i } as React.CSSProperties}
              >
                <span className="station-route__num">{`0${i + 1}`}</span>
              </span>
            ))}
          </div>
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
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
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
