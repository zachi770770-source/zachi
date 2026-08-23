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

/**
 * מודל האירועים. חלק מהשמות דורמנטיים (רשימת המתנה / סליקה מקומית / קונסולת
 * ה-Compass הישנה) — הם נשמרים כדי לא לשבור callers, אך *אינם נורים* בזרימה
 * החיה. ראו הסימון „DORMANT” ליד כל קבוצה.
 *
 * המשפך החי למדידה (Phase A) — מודל שיוך, לא רצף כפוי:
 *   home_viewed
 *     → journey_page_viewed  |  guide_viewed
 *       → ask_open / ask_result / ask_book_clicked   (היכן שנעשה שימוש בעוזר)
 *         → preview_opened / view_sample
 *           → book_viewed
 *             → amazon_purchase_clicked { source, source_detail? }
 *   „amazon_purchase_clicked” = קליק יוצא לאמזון (כוונת-רכישה), לא מכירה מאושרת.
 */
export type AnalyticsEventName =
  // ═══ המשפך החי (מדידה — Phase A). מזהים בלבד, ללא PII. ═══
  // צפייה בעמוד:
  | "home_viewed"
  | "book_viewed"
  | "guide_viewed"
  | "journey_page_viewed"
  // „אהבה” (/love) — עמוד-הסמכות הרוחבי של אשכול אהבה/זוגיות, priority 0.9
  // כמו /book. עד כה לא נמדד כלל, ולכן לא היה אפשר לדעת אם הוא עובד.
  | "love_viewed"
  // „שאל את הספר” — מנוע הכוונה סגור ודטרמיניסטי (תחנה→דילמה→הקשר→תוצאה):
  | "ask_open"
  | "ask_station"
  | "ask_dilemma"
  | "ask_context"
  | "ask_result"
  | "ask_safety"
  | "ask_tool_click"
  | "ask_sample_click"
  | "ask_change"
  | "ask_restart"
  | "ask_book_clicked"
  // טעימה:
  | "view_sample"
  | "preview_opened"
  | "preview_reached_end"
  // רכישה חיצונית — קליק יוצא לאמזון (כוונת-רכישה): { source, source_detail? }.
  | "amazon_purchase_clicked"
  //
  // ═══ אירועים פעילים שאינם חלק מהמשפך ═══
  | "faq_open"
  | "author_page_opened"
  | "sticky_sample_click"
  | "persona_select"
  | "audio_play"
  | "video_play"
  //
  // ═══ DORMANT — נשמרים לתאימות callers, אך *אינם נורים* בזרימה החיה ═══
  // (רשימת המתנה / סליקה מקומית סגורה / קונסולת Compass ישנה / קדם-Phase A /
  //  בוררים לא-מותקנים). לא למחוק ללא בדיקת callers.
  | "view_home"
  | "view_product"
  | "view_author"
  | "download_sample"
  | "click_buy_hero"
  | "click_buy_sticky"
  | "add_to_cart"
  | "begin_checkout"
  | "checkout_error"
  | "payment_success"
  | "payment_failure"
  | "purchase"
  | "newsletter_signup"
  | "waitlist_signup"
  | "waitlist_from_preview"
  | "hero_waitlist_open"
  | "waitlist_submit_success"
  | "preview_open_after_signup"
  | "ask_waitlist_click"
  | "ask_open_home"
  | "stuck_open"
  | "stuck_select"
  | "stuck_to_sample"
  | "compass_ask"
  | "compass_answer_success"
  | "compass_refused"
  | "compass_limit"
  | "path_finder_start"
  | "path_finder_complete"
  | "compass_start"
  | "compass_complete"
  | "home_path_selected"
  | "chapter2_context_selected"
  | "journey_selected"
  | "contextual_sample_clicked";

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

/**
 * שולח אירוע לספקי האנליטיקה. מחזיר `true` רק אם האירוע *באמת* נשלח לספק
 * GA4/GTM (gtag או dataLayer קיימים) — כלומר יש הסכמה *וגם* ספק מוכן. מחזיר
 * `false` כשאין הסכמה או שהספק עדיין לא נטען, כדי שקוראים כמו `ViewEvent`
 * יוכלו לנסות שוב מאוחר יותר במקום לאבד את האירוע. הערך המוחזר אופציונלי
 * לקוראים קיימים (למשל קליק אמזון) — הם מתעלמים ממנו וההתנהגות אינה משתנה.
 */
export function trackEvent(
  name: AnalyticsEventName,
  payload: AnalyticsPayload = {},
): boolean {
  if (typeof window === "undefined") return false;
  if (!hasAnalyticsConsent()) return false;

  // „נשלח” נמדד רק מול ספקי GA4/GTM. Meta Pixel (שיווק) אינו חלק ממשפך
  // הצפיות ולכן אינו קובע את הערך המוחזר.
  let dispatched = false;
  if (window.gtag) {
    window.gtag("event", name, payload);
    dispatched = true;
  }
  if (window.dataLayer) {
    window.dataLayer.push({ event: name, ...payload });
    dispatched = true;
  }
  if (window.fbq && hasMarketingConsent()) {
    window.fbq("trackCustom", name, payload);
  }
  return dispatched;
}
