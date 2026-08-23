"use client";

import { ViewEvent } from "@/components/analytics/ViewEvent";

/**
 * מדידה אנונימית של פתיחת עמוד המחבר. אינו מרנדר דבר ואינו שומר תוכן אישי.
 *
 * עובר דרך `ViewEvent` ולא דרך `trackEvent` ישיר: קריאה ישירה ב-useEffect של
 * ה-mount נזרקת לריק כשההסכמה עדיין לא ניתנה או כשספק ה-GA4/GTM טרם נטען —
 * וזה בדיוק המצב של מבקר ראשון. `ViewEvent` ממתין להסכמה ולספק ומשגר פעם אחת.
 */
export function AuthorPageView() {
  return <ViewEvent event="author_page_opened" />;
}
