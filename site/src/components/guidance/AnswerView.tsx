"use client";

import * as React from "react";

import { useGuidanceFocus } from "@/components/guidance/GuidanceFocus";

/**
 * „Answer View” — מעטפת-תשובה משותפת לכל מסלולי ההכוונה האישית. במצב-תשובה
 * קליפת-הפתיח של העמוד מתקפלת (ראו GuidanceIntro), והתשובה יושבת כאן כמוקד המסך.
 *
 * a11y: כאשר המשטח הוא עמוד-הכוונה מלא (`ownsPageHeading` מה-Provider), המעטפת
 * נושאת את כותרת-ה-h1 *היחידה* של העמוד במצב-תשובה (sr-only — התוכן עצמו נושא
 * כותרת נראית משלו), כך שתמיד יש h1 אחד. בהטמעות (בית/בועה) שכבר יש בהן h1 —
 * אין Provider, ולכן AnswerView אינו מוסיף h1 כפול. אין כאן לוגיקה עסקית ואין
 * שינוי-תוכן — מעטפת-תצוגה בלבד.
 */
export function AnswerView({
  title,
  children,
  className,
}: {
  /** כותרת נגישה למצב-התשובה (sr-only), למשל „ההכוונה שלך מתוך הספר”. */
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ownsPageHeading } = useGuidanceFocus();
  return (
    <section
      aria-label={title}
      className={`answer-view${className ? ` ${className}` : ""}`}
    >
      {ownsPageHeading ? <h1 className="sr-only">{title}</h1> : null}
      {children}
    </section>
  );
}
