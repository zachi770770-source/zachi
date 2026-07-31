"use client";

import * as React from "react";

import { siteConfig } from "@/config/site";
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

export function CookieConsent() {
  // מבוסס useSyncExternalStore ולא useState+useEffect, כי מדובר בסנכרון
  // עם מקור חיצוני אמיתי (localStorage) שיכול להשתנות גם מלשוניות אחרות.
  const consentRaw = React.useSyncExternalStore(
    subscribeToConsent,
    getConsentRawSnapshot,
    getServerConsentRawSnapshot
  );
  const visible = siteConfig.features.cookieConsent && !consentRaw;

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
    if (!visible) {
      document.body.style.paddingBottom = "";
      setBannerState(false);
      return;
    }
    setBannerState(true);
    const el = bannerRef.current;
    if (!el) {
      return () => setBannerState(false);
    }
    const apply = () => {
      document.body.style.paddingBottom = `${el.offsetHeight}px`;
    };
    apply();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", apply);
      document.body.style.paddingBottom = "";
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
        aria-label="הסכמה לשימוש בעוגיות"
        className="animate-slide-up fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-2 rounded-xl border border-border-strong bg-surface/95 px-3.5 py-2 shadow-[0_12px_32px_-22px_rgba(34,38,43,0.5)] backdrop-blur sm:flex-row sm:items-center sm:gap-3">
        <p className="text-[12.5px] leading-snug text-foreground-muted sm:flex-1">
          אנו משתמשים בעוגיות לשיפור החוויה, ונוספות רק באישורכם.{" "}
          <a
            href="/privacy"
            className="text-brand-hover underline underline-offset-2 hover:text-foreground"
          >
            מדיניות פרטיות
          </a>
        </p>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Button size="sm" onClick={acceptAll}>
            אישור הכל
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={rejectNonEssential}
            aria-label="רק הכרחי - דחיית עוגיות לא הכרחיות"
          >
            רק הכרחי
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setManageOpen(true)}
            aria-label="ניהול העדפות עוגיות"
          >
            ניהול
          </Button>
        </div>
        </div>
      </div>

      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ניהול העדפות עוגיות</DialogTitle>
            <DialogDescription>
              בחרו אילו קטגוריות עוגיות לאשר. עוגיות הכרחיות תמיד פעילות
              ואינן ניתנות לכיבוי.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <Checkbox checked disabled id="necessary" />
              <div>
                <Label htmlFor="necessary">הכרחיות</Label>
                <p className="text-sm text-foreground-muted">
                  נדרשות לתפעול בסיסי של האתר ואינן ניתנות לכיבוי.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="analytics"
                checked={analytics}
                onCheckedChange={(v) => setAnalytics(v === true)}
              />
              <div>
                <Label htmlFor="analytics">אנליטיקה</Label>
                <p className="text-sm text-foreground-muted">
                  עוזרות לנו להבין כיצד משתמשים באתר, לצורך שיפורו.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Checkbox
                id="marketing"
                checked={marketing}
                onCheckedChange={(v) => setMarketing(v === true)}
              />
              <div>
                <Label htmlFor="marketing">שיווק</Label>
                <p className="text-sm text-foreground-muted">
                  משמשות למדידת אפקטיביות של קמפיינים שיווקיים.
                </p>
              </div>
            </div>
          </div>

          <Button onClick={savePreferences}>שמירת העדפות</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
