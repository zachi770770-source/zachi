"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, X } from "lucide-react";

import { siteConfig } from "@/config/site";

/**
 * CTA דביק מודע-כוונה: מופיע רק אחרי שה-Hero יוצא מהתצוגה (הקורא כבר גלל
 * לתוך התוכן), ומפנה לפעולה הנכונה למצב הנוכחי — בטרום-השקה לטעימה החינמית,
 * ואחרי פתיחת המכירה לרכישה. שני היעדים והתוויות קיימים כבר באתר.
 *
 * מיקום: צמוד לתחתית בצד המסיים (שמאל ב-RTL — ההפוך מבועת „שאלו את הספר”
 * שנמצאת בצד המתחיל), ומורם מעל באנר העוגיות (קורא את ה-padding שהבאנר שומר
 * ל-body), כך שאינו מכסה עוגיות, את משגר העוזר או תוכן. ניתן לסגירה, נגיש
 * במקלדת, ומכבד prefers-reduced-motion (הכניסה מגודרת ב-motion-safe).
 */
/**
 * #5 שלב המסע של המבקר — נקבע *פעם אחת* ב-mount מ-localStorage ולא משתנה אחר כך
 * (אין מאזין storage), ולכן היעד יציב לחלוטין כל עוד ה-CTA חי — לעולם לא משתנה
 * בזמן שהמצביע/פוקוס עליו. explore → sample (קרא טעימה) → joined (נרשם).
 */
type Stage = "explore" | "sample" | "joined";
const STAGE_CTA: Record<Stage, { href: string; label: string }> = {
  explore: { href: "/preview", label: "לקריאת טעימה מהספר" },
  sample: { href: "/waitlist", label: "להצטרפות לרשימת ההמתנה" },
  joined: { href: "/preview", label: "חזרה לטעימה מהספר" },
};

export function StickyCta() {
  const [visible, setVisible] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const [bannerHeight, setBannerHeight] = React.useState(0);
  const [stage, setStage] = React.useState<Stage>("explore");

  // שלב המסע — קריאה חד-פעמית ב-mount. יציב לכל אורך חיי ה-CTA (focus-safe).
  React.useEffect(() => {
    try {
      const joined = localStorage.getItem("mdl_waitlist_joined") === "1";
      const seen = localStorage.getItem("mdl_sample_seen") === "1";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- קריאה חד-פעמית מ-localStorage ב-mount
      setStage(joined ? "joined" : seen ? "sample" : "explore");
    } catch {
      /* ברירת מחדל: explore */
    }
  }, []);

  // מופיע כשה-Hero (הסקשן הראשון ב-main) יצא מהתצוגה. לא נוגעים ב-Hero.
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

  if (dismissed || !visible) return null;

  // אחרי פתיחת המכירה — רכישה. טרום-השקה — לפי שלב המסע (יציב מ-mount).
  const { href, label } = siteConfig.salesOpen
    ? { href: "/book#purchase", label: "לרכישת הספר" }
    : STAGE_CTA[stage];

  return (
    <aside
      aria-label="קיצור דרך לפעולה"
      className="motion-safe:animate-slide-up fixed start-4 z-30 flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-border-strong bg-surface/95 p-1.5 ps-4 shadow-lg backdrop-blur"
      style={{ bottom: `calc(${bannerHeight}px + 1rem)` }}
    >
      <Link
        href={href}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-full text-[15px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <span key={stage} className="cta-morph">
          {label}
        </span>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-surface">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="סגירת קיצור הדרך"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
