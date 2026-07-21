/**
 * שכבת הפשטה לספק דיוור. מאפשרת לחבר ספק אמיתי (Mailchimp, Klaviyo,
 * ConvertKit, ActiveTrail וכו') בעתיד מבלי לשנות את ה-route handler.
 */

export interface NewsletterSubscriber {
  firstName: string;
  email: string;
  marketingConsent: boolean;
}

export interface NewsletterProvider {
  readonly name: string;
  subscribe(subscriber: NewsletterSubscriber): Promise<{ success: boolean }>;
}

/**
 * מימוש ברירת מחדל שרק רושם ליומן השרת - אין ספק דיוור מחובר בפועל.
 * להחלפה בספק אמיתי: ממשו NewsletterProvider חדש ורשמו אותו ב-
 * getNewsletterProvider() למטה.
 */
class LoggingNewsletterProvider implements NewsletterProvider {
  readonly name = "logging-only";

  async subscribe(subscriber: NewsletterSubscriber) {
    // אין רושמים את כתובת המייל עצמה ליומן - רק את העובדה שהייתה הרשמה.
    console.log("[newsletter] נרשם חדש (לא נשלח לספק אמיתי):", {
      marketingConsent: subscriber.marketingConsent,
    });
    return { success: true };
  }
}

let provider: NewsletterProvider | null = null;

export function getNewsletterProvider(): NewsletterProvider {
  if (!provider) {
    provider = new LoggingNewsletterProvider();
  }
  return provider;
}
