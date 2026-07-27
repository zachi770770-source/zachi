"use client";

import * as React from "react";

import { trackEvent } from "@/lib/analytics";

/**
 * מדידה אנונימית של פתיחת עמוד המחבר. אינו מרנדר דבר, אינו שומר תוכן אישי,
 * ומכבד את הסכמת העוגיות (הבדיקה מתבצעת בתוך trackEvent).
 */
export function AuthorPageView() {
  React.useEffect(() => {
    trackEvent("author_page_opened");
  }, []);
  return null;
}
