"use client";

/**
 * שכבת הפשטה לאנליטיקה. כל קריאה עוברת דרך `trackEvent`, כך שניתן להחליף
 * או להוסיף ספקים (GA / GTM / Meta Pixel) במקום אחד בלבד, מבלי לגעת
 * ברכיבים שקוראים לפונקציה.
 *
 * חשוב: הפונקציה אינה שולחת מידע אישי מזהה (שם, אימייל, טלפון, כתובת).
 * היא גם לא תשלח דבר אם המשתמש לא אישר עוגיות אנליטיקה/שיווק, ראו
 * `hasAnalyticsConsent`.
 */

export type AnalyticsEventName =
  | "view_home"
  | "view_product"
  | "click_buy_hero"
  | "click_buy_sticky"
  | "view_sample"
  | "download_sample"
  | "view_author"
  | "add_to_cart"
  | "begin_checkout"
  | "checkout_error"
  | "payment_success"
  | "payment_failure"
  | "purchase"
  | "faq_open"
  | "newsletter_signup"
  | "waitlist_signup"
  | "stuck_open"
  | "stuck_select"
  | "stuck_to_sample"
  | "compass_ask";

export type AnalyticsPayload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const CONSENT_STORAGE_KEY = "cookie-consent";

export type ConsentCategories = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export function getConsent(): ConsentCategories | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentCategories;
  } catch {
    return null;
  }
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

export function hasMarketingConsent(): boolean {
  return getConsent()?.marketing === true;
}

export function trackEvent(name: AnalyticsEventName, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  if (!hasAnalyticsConsent()) return;

  if (window.gtag) {
    window.gtag("event", name, payload);
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: name, ...payload });
  }
  if (window.fbq && hasMarketingConsent()) {
    window.fbq("trackCustom", name, payload);
  }
}
