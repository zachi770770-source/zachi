"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

import { stations, stationOrder, type Station } from "@/content/stations";
import { loadCompass } from "@/lib/compass/quizStorage";
import { Container } from "@/components/shared/Container";
import { PathFinder } from "@/components/interactive/PathFinder";

/**
 * מקטע „איפה הספר פוגש אתכם עכשיו?” בבית (#where) — מסגרת המקטע (כותרת + מסלול
 * התחנות) סביב מנוע השאלון המשותף `PathFinder`. אותו שאלון ואותה תוצאה מוצגים
 * גם ב-/compass וב„משגר המצפן” — מנוע אחד, לא שני שאלונים.
 *
 * המסלול מדגיש את התחנה שהותאמה בשאלון (או זו שנשמרה מ„המצפן”). עובד ללא JS
 * (התחנות קישורים ישירים), ומכבד reduced-motion.
 */

type StationId = Station["id"];

// תוויות דילוג קצרות לשלוש התחנות — מקומיות למסלול (לא משנות את navLabel הגלובלי).
const SKIP_LABELS: Record<StationId, string> = {
  "before-relationship": "מחפשים קשר",
  "starting-again": "מתחילים מחדש",
  "inside-relationship": "בתוך קשר",
};

export function StationJourney() {
  // כניסה דרך hash אל השאלון (#where) — נחיתה מיידית (scroll-behavior:auto נקודתי)
  // במקום גלילה חלקה ארוכה. ההחלפה נקודתית — גלילת שאר העוגנים נשמרת.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const landOnWhere = () => {
      if (window.location.hash !== "#where") return;
      const el = document.getElementById("where");
      if (!el) return;
      const html = document.documentElement;
      const prev = html.style.scrollBehavior;
      html.style.scrollBehavior = "auto";
      el.scrollIntoView({ block: "start" });
      requestAnimationFrame(() => {
        html.style.scrollBehavior = prev;
      });
    };
    landOnWhere();
    window.addEventListener("hashchange", landOnWhere);

    // לחיצה על <Link> ל-/#where: הראוטר גולל חלק (~800ms+); מכבים נקודתית את
    // הגלילה החלקה ב-capture כדי לנחות מיד, ומשחזרים אחרי.
    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.('a[href="/#where"], a[href="#where"]');
      if (!a) return;
      const html = document.documentElement;
      html.style.scrollBehavior = "auto";
      window.setTimeout(() => {
        html.style.scrollBehavior = "";
      }, 150);
    };
    document.addEventListener("click", onClickCapture, true);

    return () => {
      window.removeEventListener("hashchange", landOnWhere);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  // מסלול התחנות — כניסה מונפשת מקומית (IO ייעודי). מצב הבסיס גלוי במלואו
  // (ללא JS / reduced-motion); רק תחת no-preference ה-JS „חומש” ואז „מעיר”.
  const journeyRef = React.useRef<HTMLElement>(null);
  React.useEffect(() => {
    const el = journeyRef.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    el.classList.add("journey-armed");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("is-awake");
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // התחנה הפעילה: מה שהותאם בשאלון כאן (אם הושלם) גובר על מה ש„המצפן” שמר.
  const [savedStationId, setSavedStationId] = React.useState<StationId | null>(null);
  const [resolvedStationId, setResolvedStationId] = React.useState<StationId | null>(null);
  React.useEffect(() => {
    // נקרא רק בצד-הלקוח (rAF) — בלי אי-התאמת הידרציה.
    const raf = requestAnimationFrame(() => {
      const saved = loadCompass();
      if (saved) setSavedStationId(saved.stationId);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const activeStationId: StationId | null = resolvedStationId ?? savedStationId;

  return (
    <section
      id="where"
      className="scroll-mt-20 pb-14 pt-6 sm:pb-16 sm:pt-8"
      aria-labelledby="where-heading"
    >
      <Container>
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">
            <MapPin className="h-4 w-4" aria-hidden="true" />
            שלוש שאלות קצרות
          </span>
          <h2 id="where-heading" className="type-h2 mt-4">
            איפה הספר פוגש אתכם עכשיו?
          </h2>
          <p className="type-lead mt-4 text-foreground-muted">
            שלוש תחנות, ספר אחד. לפני קשר, מתחילים מחדש או בתוך זוגיות — שלוש
            נקודות כניסה לאותו ספר. שלוש שאלות קצרות, ותדעו מאיזו תחנה מתאים
            לכם להיכנס עכשיו.
          </p>
        </div>

        <div className="mt-9">
          <PathFinder onResolveStation={setResolvedStationId} />
        </div>

        {/* המשך מהמצפן: אם הושלם „המצפן” (/compass) ועדיין לא ענו על השאלון כאן. */}
        {savedStationId && !resolvedStationId ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-xl border-s-2 border-brand bg-surface-muted/60 p-4 text-start">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-brand-hover">
              השלמתם את המצפן
            </p>
            <p className="mt-1 text-[15px] leading-relaxed text-foreground">
              התחנה שמתאימה לכם:{" "}
              <span className="font-semibold">{stations[savedStationId].navLabel}</span>.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href={`/${savedStationId}`}
                className="group inline-flex items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                להמשיך לתחנה שלי
                <ArrowLeft
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/compass"
                className="text-[14px] font-medium text-foreground-muted underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                למצפן
              </Link>
            </div>
          </div>
        ) : null}

        {/* מסלול התחנות — שלוש התחנות כקו-מסע מחובר. עובד תמיד (גם ללא JS), התחנה
            שהותאמה מקבלת נוכחות ברורה, וכל התוכן במצבו הסופי תחת reduced-motion. */}
        <nav
          ref={journeyRef}
          aria-label="דילוג לתחנות המסע"
          className="station-journey mx-auto mt-8 max-w-2xl"
        >
          <p className="mb-5 text-center text-[13px] text-foreground-muted">
            או דלגו ישר לתחנה שמתאימה לכם:
          </p>
          <ol className="station-journey__track grid grid-cols-3 gap-1.5 sm:gap-3">
            {stationOrder.map((id, i) => (
              <li
                key={id}
                className="station-journey__item"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link
                  href={`/${id}`}
                  aria-current={activeStationId === id ? "true" : undefined}
                  data-active={activeStationId === id ? "" : undefined}
                  className="station-node group focus-visible:outline-none"
                >
                  <span className="station-node__dot" aria-hidden="true">
                    <span className="station-node__pulse" aria-hidden="true" />
                  </span>
                  <span className="station-node__label">{SKIP_LABELS[id]}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </Container>
    </section>
  );
}
