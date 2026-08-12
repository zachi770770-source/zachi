import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

// נתיבים שאינם-תוכן ולעולם אין לסרוק/לאנדקס: API, סליקה ותודה-על-הזמנה.
// משותף לכל קבוצת user-agent מותרת (בקבוצה בעלת-שם ב-robots.txt אין ירושה
// מ-`*`, ולכן ה-Disallow הזה חוזר במפורש בכל קבוצה מותרת).
const NON_CONTENT_DISALLOW = ["/api/", "/checkout", "/checkout/pay/", "/thank-you"];

/**
 * זחלני חיפוש/אחזור (Search & Retrieval) של מנועי-תשובות מבוססי-AI. אלה
 * מביאים תוכן חי כדי *לענות ולצטט* בזמן אמת (ולהפנות אליו משתמשים) — ולכן הם
 * מותרים לסרוק את התוכן הציבורי, בדיוק כמו Googlebot/Bingbot. מדיניות זו
 * מפורשת ונפרדת ממדיניות אימון-המודלים למטה.
 */
const SEARCH_RETRIEVAL_BOTS = [
  "OAI-SearchBot", // OpenAI — אינדוקס עבור חיפוש ChatGPT/SearchGPT
  "ChatGPT-User", // OpenAI — שליפה יזומה ע"י משתמש בזמן שיחה
  "PerplexityBot", // Perplexity — אינדוקס חיפוש
  "Perplexity-User", // Perplexity — שליפה יזומה ע"י משתמש
  "Claude-SearchBot", // Anthropic — אינדוקס עבור חיפוש
  "Claude-User", // Anthropic — שליפה יזומה ע"י משתמש (Claude)
];

/**
 * זחלני אימון-מודלים (Model Training / dataset crawling). אלה אוספים תוכן
 * לאימון מודלים, לא כדי לענות/לצטט בזמן אמת. מדיניות נפרדת ומכוונת: איננו
 * מתירים אותם אוטומטית רק משום שהתרנו זחלני חיפוש/אחזור. חסימה כאן *אינה*
 * פוגעת בנוכחות במנועי-חיפוש AI (שמשתמשים בזחלני ה-Search/Retrieval שלמעלה).
 * זו החלטת-מדיניות של בעל האתר, וניתן לשנותה בעתיד.
 */
const MODEL_TRAINING_BOTS = [
  "GPTBot", // OpenAI — אימון
  "ClaudeBot", // Anthropic — אימון
  "anthropic-ai", // Anthropic — מזהה ישן
  "Google-Extended", // Google — אימון/הזנת Gemini (נפרד מ-Googlebot)
  "Applebot-Extended", // Apple — אימון Apple Intelligence (נפרד מ-Applebot)
  "Meta-ExternalAgent", // Meta — איסוף לאימון
  "CCBot", // Common Crawl — מזין דאטהסטים לאימון
  "Bytespider", // ByteDance — איסוף אגרסיבי לאימון
];

/**
 * robots.txt זהה בכל הסביבות: מתיר סריקה ומצביע ל-sitemap. הרחקת Preview
 * מהאינדוקס נעשית דרך meta robots=noindex,nofollow (ראו layout), כדי שגוגל
 * *יוכל* לסרוק ולראות את ה-noindex — חסימה ב-robots.txt הייתה מונעת זאת
 * ומהווה אנטי-דפוס.
 *
 * שלוש קבוצות:
 *   1. `*` — כל שאר הזחלנים (כולל Googlebot, Bingbot, DuckDuckBot, Applebot
 *      ומנועים לא-ידועים) מקבלים גישה מלאה לתוכן — גילוי-ראשון.
 *   2. זחלני חיפוש/אחזור AI — מותרים במפורש (אותה מדיניות כמו `*`).
 *   3. זחלני אימון-מודלים — נחסמים במפורש (Disallow: /). מדיניות נפרדת.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: NON_CONTENT_DISALLOW,
      },
      {
        userAgent: SEARCH_RETRIEVAL_BOTS,
        allow: "/",
        disallow: NON_CONTENT_DISALLOW,
      },
      {
        userAgent: MODEL_TRAINING_BOTS,
        disallow: "/",
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
