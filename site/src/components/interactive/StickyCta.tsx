"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, X } from "lucide-react";

import { siteConfig } from "@/config/site";
import { trackEvent } from "@/lib/analytics";

/**
 * בר-הטעימה החכם — פעולה דביקה אחת ומאוחדת. בטרום-השקה זו תמיד הטעימה החינמית
 * (ללא חיכוך, ללא הרשמה): „קראו טעימה חינם” → /preview. אחרי פתיחת המכירה הופך
 * לרכישה. מופיע רק אחרי שה-Hero יוצא מהתצוגה; מורם מעל באנר העוגיות (קורא את
 * ה-padding שהבאנר שומר ל-body) כדי לא לכסות עוגיות/משגר/תוכן; ניתן לסגירה,
 * והסגירה נזכרת לאורך ה-session (sessionStorage). נגיש במקלדת (יעד 44px),
 * ומכבד prefers-reduced-motion (הכניסה מגודרת ב-motion-safe). כולל תמונת כריכה
 * זעירה אמיתית וטקסט עובדתי קצר — ללא ניסוח רכישה, ללא דירוג/מונה מזויפים.
 */
const DISMISS_KEY = "mdl_sticky_dismissed";

export function StickyCta() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [bannerHeight, setBannerHeight] = React.useState(0);

  // סגירה נזכרת ל-session — לא מציקים שוב אחרי שהמבקר סגר.
  React.useEffect(() => {
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאה חד-פעמית ב-mount
        setDismissed(true);
      }
    } catch {
      /* אין sessionStorage — הבר פשוט יופיע */
    }
  }, []);

  const [formInView, setFormInView] = React.useState(false);

  // מופיע כשה-Hero (הסקשן הראשון ב-main) יצא מהתצוגה — נמדד ישירות ב-IO
  // (לא לפי אחוז-גלילה שרירותי). לא נוגעים ב-Hero.
  React.useEffect(() => {
    const hero = document.querySelector("main section");
    if (!hero || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  // מתחבא ליד טופסי הרשמה אחרים (למשל אזור העדכון בתחתית): כשכל שדה-אימייל
  // בעמוד נכנס לתצוגה — הבר נעלם, כדי לא להתחרות/לכפול פעולת הרשמה.
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const fields = Array.from(document.querySelectorAll('input[type="email"]'));
    if (!fields.length) return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) seen.add(e.target);
          else seen.delete(e.target);
        }
        setFormInView(seen.size > 0);
      },
      { threshold: 0.2 }
    );
    fields.forEach((f) => io.observe(f));
    return () => io.disconnect();
  }, []);

  // בזמן שסצנת „חיפוש → בנייה” (.s2b) בתחום הצפייה — מסתירים בעדינות את הבר כדי
  // שלא יכסה את הרגע החתימתי; משוחזר כשהסצנה יוצאת. נמדד ב-IO (לא אחוז-גלילה).
  // אינו נוגע בבאנר העוגיות/ההסכמה — רק בבר-הטעימה עצמו.
  const [sceneInView, setSceneInView] = React.useState(false);
  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const scene = document.querySelector(".s2b");
    if (!scene) return; // הסצנה קיימת רק בעמוד הבית
    const io = new IntersectionObserver(
      ([entry]) => setSceneInView(entry.isIntersecting),
      { threshold: 0, rootMargin: "0px 0px -20% 0px" }
    );
    io.observe(scene);
    return () => io.disconnect();
  }, []);

  // הרמה מעל באנר העוגיות: הבאנר שומר padding-bottom על ה-body לפי גובהו.
  React.useEffect(() => {
    const read = () => {
      const pb = parseInt(getComputedStyle(document.body).paddingBottom, 10);
      setBannerHeight(Number.isFinite(pb) ? pb : 0);
    };
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    window.addEventListener("resize", read);
    return () => {
      mo.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);

  const close = React.useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* לא קריטי */
    }
  }, []);

  // בזמן שסצנת „חיפוש → בנייה” בתחום הצפייה — הבר אינו מרונדר כלל (לא רק
  // מוסתר), כדי שלעולם לא יכסה את רגע-השיא. חוזר מיד עם היציאה מהסצנה.
  if (dismissed || !visible || formInView || sceneInView) return null;

  // טרום-השקה: תמיד הטעימה החינמית ללא הרשמה. אחרי פתיחת המכירה — רכישה.
  const preLaunch = !siteConfig.salesOpen;
  const href = preLaunch ? "/preview" : "/book#purchase";
  const label = preLaunch ? "קראו 2 דקות עכשיו" : "לרכישת הספר";

  return (
    <aside
      aria-label="בר הטעימה"
      className="motion-safe:animate-slide-up fixed bottom-0 start-3 end-[90px] z-30 flex items-center gap-2 rounded-2xl border border-border-strong bg-surface/95 p-2 ps-3 shadow-lg backdrop-blur sm:end-auto sm:start-4 sm:max-w-none sm:rounded-full"
      style={{
        bottom: `calc(${bannerHeight}px + max(0.75rem, env(safe-area-inset-bottom)))`,
      }}
    >
      {/* כריכה זעירה אמיתית — נוכחות הספר, ללא הזזת פריסה (רוחב קבוע) */}
      <Image
        src={siteConfig.images.cover}
        alt=""
        aria-hidden="true"
        width={30}
        height={45}
        unoptimized
        className="hidden h-10 w-[27px] shrink-0 rounded-sm shadow-sm sm:block"
      />
      <Link
        href={href}
        onClick={() => preLaunch && trackEvent("sticky_sample_click")}
        className="inline-flex min-h-[44px] flex-1 items-center justify-between gap-2 rounded-full ps-1 text-[15px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:flex-none sm:justify-start"
      >
        <span className="flex flex-col items-start leading-tight">
          <span>{label}</span>
          {preLaunch ? (
            <span className="text-[12px] font-medium text-foreground-muted">
              קטע אמיתי מהספר · בלי הרשמה
            </span>
          ) : null}
        </span>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground text-surface">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
      <button
        type="button"
        onClick={close}
        aria-label="סגירת בר הטעימה"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
