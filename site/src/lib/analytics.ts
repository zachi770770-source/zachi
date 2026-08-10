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
  | "compass_ask"
  | "compass_answer_success"
  | "preview_opened"
  | "preview_reached_end"
  | "waitlist_from_preview"
  | "author_page_opened"
  // PHASE 16 — נתיב ההמרה האחיד (טופס ה-Hero, הרשמה מוצלחת, פתיחת הטעימה
  // אחרי הרשמה). ללא מידע אישי; עוברים דרך אותה שכבת consent קיימת.
  | "hero_waitlist_open"
  | "waitlist_submit_success"
  | "preview_open_after_signup"
  // בר-הטעימה החכם + עוגני-מדיה עתידיים (ללא מידע אישי; no-op עד להגדרת ספק).
  | "sticky_sample_click"
  | "path_finder_start"
  | "path_finder_complete"
  | "compass_start"
  | "compass_complete"
  // „שאל את הספר” — מנוע הכוונה סגור ודטרמיניסטי (תחנה→דילמה→הקשר→תוצאה).
  // מזהים בלבד (תחנה/דילמה/הקשר/כלי), לעולם לא טקסט אישי או תוכן חופשי.
  | "ask_open"
  | "ask_station"
  | "ask_dilemma"
  | "ask_context"
  | "ask_result"
  | "ask_safety"
  | "ask_tool_click"
  | "ask_sample_click"
  | "ask_waitlist_click"
  | "ask_change"
  | "ask_restart"
  | "ask_open_home"
  | "persona_select"
  // בחירת מצב במסע בעמוד הבית (orientation דטרמיניסטי מקומי) + שכבת פרק ב’.
  // מזהה בלבד (dating/building/existing/breakup), ללא טקסט אישי או PII.
  | "home_path_selected"
  | "chapter2_context_selected"
  // Personalized Reader Journey — היעד: להכניס את הקורא לספר מהר. מזהה תחנה
  // בלבד (dating/building/existing/breakup), ללא טקסט אישי או PII.
  | "journey_selected"
  | "journey_page_viewed"
  | "contextual_sample_clicked"
  | "ask_book_clicked"
  // רכישה חיצונית באמזון — מזהה מקור בלבד (home/book/preview/journey_*),
  // לעולם לא אימייל, לא תשובות Compass, לא תוכן אישי.
  | "amazon_purchase_clicked"
  | "audio_play"
  | "video_play";

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
