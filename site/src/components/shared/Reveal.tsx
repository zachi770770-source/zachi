"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * עוטף תוכן ב-class `reveal` בלבד. החשיפה עצמה (הוספת `is-visible`) מנוהלת
 * גלובלית ב-MotionRoot עבור *כל* אלמנט `.reveal` בעמוד — גם רכיבי <Reveal>
 * וגם שימושים גולמיים ב-class. כך אין תלות ב-IntersectionObserver פר-רכיב,
 * תוכן מעל נקודת-הגלילה/deep-link נחשף מיד, ויש fail-safe שלא משאיר תוכן נסתר.
 *
 * הרכיב אינו מחזיק state ואינו כותב `is-visible` בעצמו — כך רינדור מחדש של
 * React לא „מוחק” את החשיפה שה-controller הוסיף ל-DOM. מצב הבסיס (ללא JS /
 * reduced-motion) הוא התוכן הגלוי במלואו.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  delay?: number;
}) {
  return (
    <Tag
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
