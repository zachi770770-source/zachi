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
        role="region"
        aria-label="הסכמה לשימוש בעוגיות"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:p-5"
      >
        <div className="container-page flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-foreground-muted">
            אנו משתמשים בעוגיות הכרחיות להפעלת האתר, ובעוגיות אנליטיקה
            ושיווק רק לאחר אישורכם. ניתן לשנות את ההעדפות בכל עת.{" "}
            <a href="/privacy" className="underline hover:text-foreground">
              מדיניות פרטיות
            </a>
          </p>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
              ניהול העדפות
            </Button>
            <Button variant="ghost" size="sm" onClick={rejectNonEssential}>
              דחיית לא הכרחי
            </Button>
            <Button size="sm" onClick={acceptAll}>
              אישור הכל
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
