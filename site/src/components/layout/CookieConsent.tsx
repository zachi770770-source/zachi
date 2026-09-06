"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { siteConfig } from "@/config/site";
import { isEnglishPath } from "@/lib/language";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ConsentCategories } from "@/lib/analytics";

const STORAGE_KEY = "cookie-consent";

function writeConsent(consent: ConsentCategories) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new Event("cookie-consent-changed"));
}

function subscribeToConsent(callback: () => void) {
  window.addEventListener("cookie-consent-changed", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("cookie-consent-changed", callback);
    window.removeEventListener("storage", callback);
  };
}

/**
 * מחזיר את מחרוזת ה-JSON הגולמית מ-localStorage, ולא אובייקט מפוענח.
 * useSyncExternalStore דורש שה-snapshot יחזיר ערך יציב (===) כל עוד
 * שום דבר לא השתנה בפועל - JSON.parse היה יוצר אובייקט חדש בכל קריאה
 * וגורם ל-loop אינסופי של re-render (React error #185).
 */
function getConsentRawSnapshot() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerConsentRawSnapshot() {
  return null;
}

const COPY = {
  he: {
    region: "הסכמה לשימוש בעוגיות",
    body: "אנו משתמשים בעוגיות לשיפור החוויה, ונוספות רק באישורכם.",
    privacy: "מדיניות פרטיות",
    acceptAll: "אישור הכל",
    essentialOnly: "רק הכרחי",
    essentialOnlyAria: "רק הכרחי - דחיית עוגיות לא הכרחיות",
    manage: "ניהול",
    manageAria: "ניהול העדפות עוגיות",
    dialogTitle: "ניהול העדפות עוגיות",
    dialogDesc:
      "בחרו אילו קטגוריות עוגיות לאשר. עוגיות הכרחיות תמיד פעילות ואינן ניתנות לכיבוי.",
    necessary: "הכרחיות",
    necessaryDesc: "נדרשות לתפעול בסיסי של האתר ואינן ניתנות לכיבוי.",
    analytics: "אנליטיקה",
    analyticsDesc: "עוזרות לנו להבין כיצד משתמשים באתר, לצורך שיפורו.",
    marketing: "שיווק",
    marketingDesc: "משמשות למדידת אפקטיביות של קמפיינים שיווקיים.",
    save: "שמירת העדפות",
  },
  en: {
    region: "Cookie consent",
    body: "We use cookies to improve your experience; non-essential ones are set only with your consent.",
    privacy: "Privacy policy",
    acceptAll: "Accept all",
    essentialOnly: "Essential only",
    essentialOnlyAria: "Essential only — reject non-essential cookies",
    manage: "Manage",
    manageAria: "Manage cookie preferences",
    dialogTitle: "Manage cookie preferences",
    dialogDesc:
      "Choose which cookie categories to allow. Essential cookies are always on and cannot be turned off.",
    necessary: "Essential",
    necessaryDesc: "Required for basic site operation and cannot be turned off.",
    analytics: "Analytics",
    analyticsDesc: "Help us understand how the site is used, in order to improve it.",
    marketing: "Marketing",
    marketingDesc: "Used to measure the effectiveness of marketing campaigns.",
    save: "Save preferences",
  },
} as const;

export function CookieConsent() {
  const english = isEnglishPath(usePathname());
  const t = english ? COPY.en : COPY.he;
  // מבוסס useSyncExternalStore ולא useState+useEffect, כי מדובר בסנכרון
  // עם מקור חיצוני אמיתי (localStorage) שיכול להשתנות גם מלשוניות אחרות.
  const consentRaw = React.useSyncExternalStore(
    subscribeToConsent,
    getConsentRawSnapshot,
    getServerConsentRawSnapshot
  );
  const wantsBanner = siteConfig.features.cookieConsent && !consentRaw;

  // „חימוש” הבאנר — מתי מותר להציגו. הבאנר נעוץ-תחתית, ובמסכים נמוכים ה-CTA
  // הראשי של ה-Hero יושב בקצה-התחתון של אזור-הצפייה בטעינה; באנר תחתון *אינו
  // יכול* שלא לכסות אותו שם (אין מקום על-המסך מתחתיו). לכן:
  //  • מסכים גבוהים/דסקטופ (≥900px) — ה-CTA לעולם אינו בפס-הבאנר → מציגים מיד.
  //  • מסכים נמוכים (מובייל/טאבלט) — מציגים *רק* אחרי שה-CTA הראשי גלל אל מעל
  //    פס-הבאנר (scrollY > 140), כך שהבאנר לעולם אינו מכסה ולו פיקסל מה-CTA
  //    (כולל 375×667 ו-360×800). עוגיות לא-הכרחיות ממילא מגודרות-הסכמה, כך
  //    שדבר אינו נמדד/נשמר לפני הבחירה. אין SSR לבאנר (armed=false בשרת
  //    ובריצה הראשונה בלקוח — ללא אי-התאמת הידרציה).
  const [armed, setArmed] = React.useState(false);
  React.useEffect(() => {
    if (!wantsBanner) return;
    let raf = 0;
    const arm = () => {
      // מסך גבוה/דסקטופ (≥900px): ה-CTA הראשי לעולם אינו בפס-הבאנר → מזיינים
      // מיד. מסך נמוך: מזיינים רק אחרי שה-CTA גלל אל מעל פס-הבאנר (scrollY>140),
      // כך שהבאנר לעולם לא מכסה ולו פיקסל מה-CTA (כולל 375×667 / 360×800).
      if (window.innerHeight >= 900 || window.scrollY > 140) {
        setArmed(true);
        window.removeEventListener("scroll", arm);
      }
    };
    window.addEventListener("scroll", arm, { passive: true });
    // בדיקה ראשונית מחוץ לגוף ה-effect (rAF) — לא setState סינכרוני באפקט.
    raf = window.requestAnimationFrame(arm);
    return () => {
      window.removeEventListener("scroll", arm);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [wantsBanner]);

  const visible = wantsBanner && armed;

  const [manageOpen, setManageOpen] = React.useState(false);
  const [analytics, setAnalytics] = React.useState(false);
  const [marketing, setMarketing] = React.useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  // אות-מצב מפורש: כשהבאנר גלוי מסמנים data-cookie-banner="open" על ה-body
  // ומשדרים „cookie-banner-change”, כדי שבקרות צפות (למשל הבועה „שאלו את הספר”)
  // יגיבו למצב אמיתי ולא יסיקו אותו מריווח CSS. במקביל הבאנר, שהוא fixed
  // בתחתית, שומר לעצמו padding-bottom לפי גובהו — זהו ריווח פריסה בלבד, לא
  // אות-מצב — כדי שלא יכסה CTA/פוטר/תוכן בשום רוחב או מצב טקסט.
  const setBannerState = React.useCallback((bannerOpen: boolean) => {
    if (bannerOpen) {
      document.body.setAttribute("data-cookie-banner", "open");
    } else {
      document.body.removeAttribute("data-cookie-banner");
    }
    window.dispatchEvent(
      new CustomEvent("cookie-banner-change", { detail: { open: bannerOpen } })
    );
  }, []);

  React.useEffect(() => {
    // ניקוי משותף של ריווח-הפריסה ושל משתנה-הגובה (`--cookie-banner-height`)
    // שבקרות צפות (הבועה „מה הספר אומר על המצב שלי?”) קוראות ב-CSS טהור כדי
    // להתרומם מעל הבאנר — בלי מדידת-JS ובלי פיגור-רינדור.
    const clear = () => {
      document.body.style.paddingBottom = "";
      document.body.style.removeProperty("--cookie-banner-height");
    };
    if (!visible) {
      clear();
      setBannerState(false);
      return;
    }
    setBannerState(true);
    const el = bannerRef.current;
    if (!el) {
      return () => setBannerState(false);
    }
    const apply = () => {
      const h = `${el.offsetHeight}px`;
      document.body.style.paddingBottom = h;
      // המשתנה יורש לכל צאצאי ה-body (כולל הבועה ה-fixed); CSS מגיב מיידית
      // ברגע שהוא נקבע — אין צורך ב-observer/re-render בצד הבועה.
      document.body.style.setProperty("--cookie-banner-height", h);
    };
    apply();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", apply);
      clear();
      setBannerState(false);
    };
  }, [visible, setBannerState]);

  function acceptAll() {
    writeConsent({ necessary: true, analytics: true, marketing: true });
    setManageOpen(false);
  }

  function rejectNonEssential() {
    writeConsent({ necessary: true, analytics: false, marketing: false });
    setManageOpen(false);
  }

  function savePreferences() {
    writeConsent({ necessary: true, analytics, marketing });
    setManageOpen(false);
  }

  if (!visible) return null;

  return (
    <>
      <div
        ref={bannerRef}
        role="region"
        aria-label={t.region}
        {...(english ? { lang: "en", dir: "ltr" } : {})}
        className="animate-slide-up fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-border-strong bg-surface/95 px-3.5 py-2 shadow-[0_12px_32px_-22px_rgba(34,38,43,0.5)] backdrop-blur sm:flex-row sm:items-center sm:gap-3">
        <p className="text-[12.5px] leading-snug text-foreground-muted sm:flex-1">
          {t.body}{" "}
          <a
            href="/privacy"
            className="whitespace-nowrap text-brand-hover underline underline-offset-2 hover:text-foreground"
          >
            {t.privacy}
          </a>
        </p>
        {/* יעדי-מגע ≥44px (min-h-11) בשלושת הכפתורים — מעל מינימום WCAG, נוח
            במובייל — תוך שמירה על מראה קומפקטי (px מרוסן). */}
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Button size="sm" onClick={acceptAll} className="min-h-11">
            {t.acceptAll}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rejectNonEssential}
            aria-label={t.essentialOnlyAria}
            className="min-h-11"
          >
            {t.essentialOnly}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManageOpen(true)}
            aria-label={t.manageAria}
            className="min-h-11"
          >
            {t.manage}
          </Button>
        </div>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.dialogTitle}</DialogTitle>
            <DialogDescription>{t.dialogDesc}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Checkbox checked disabled id="necessary" />
              <div>
                <Label htmlFor="necessary">{t.necessary}</Label>
                <p className="text-sm text-foreground-muted">{t.necessaryDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="analytics"
                checked={analytics}
                onCheckedChange={(v) => setAnalytics(v === true)}
              />
              <div>
                <Label htmlFor="analytics">{t.analytics}</Label>
                <p className="text-sm text-foreground-muted">{t.analyticsDesc}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing"
                checked={marketing}
                onCheckedChange={(v) => setMarketing(v === true)}
              />
              <div>
                <Label htmlFor="marketing">{t.marketing}</Label>
                <p className="text-sm text-foreground-muted">{t.marketingDesc}</p>
              </div>
            </div>
          </div>

          <Button onClick={savePreferences}>{t.save}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
