"use client";

import * as React from "react";

/**
 * „מצב-תגובה” משותף לכל מסלולי ההכוונה האישית (Compass מודרך + שאלה חופשית,
 * וכל מנוע-הכוונה עתידי). ברגע שמתקבלת *תשובה*, קליפת-הפתיח השיווקית של העמוד
 * (כותרות/הסברים/צ'יפים) מתקפלת, והתשובה הופכת למוקד המסך — מנגנון אחד, לא
 * פתרון-נקודה לכל מסלול.
 *
 * המנוע מדווח על מצבו דרך `useReportAnswered`. קליפת-הפתיח עטופה ב-`GuidanceIntro`
 * ומתקפלת אוטומטית. ברירת-המחדל של ה-context היא no-op, כך שכל מנוע עובד גם
 * מחוץ ל-Provider (למשל בבדיקות-יחידה) בלי לשבור.
 */

type GuidanceFocusValue = {
  /** true כשמנוע-ההכוונה מציג תשובה/תגובה (לא מסך-בחירה/שאלה). */
  answered: boolean;
  setAnswered: (value: boolean) => void;
  /**
   * האם משטח-ההכוונה הוא *עמוד* שבו התשובה היא התוכן הראשי (למשל /compass), ולכן
   * AnswerView נושא את כותרת-ה-h1 היחידה במצב-תשובה. false בהטמעות (בית/בועה)
   * שבהן כבר קיים h1 של העמוד — שם AnswerView לא יוסיף h1 כפול.
   */
  ownsPageHeading: boolean;
};

const GuidanceFocusContext = React.createContext<GuidanceFocusValue>({
  answered: false,
  setAnswered: () => {},
  ownsPageHeading: false,
});

export function useGuidanceFocus(): GuidanceFocusValue {
  return React.useContext(GuidanceFocusContext);
}

/**
 * עוטף משטח-הכוונה. `ownsPageHeading` (ברירת-מחדל true) — כשהמשטח הוא עמוד-הכוונה
 * מלא; העבר false אם אין להשתמש בו (אין הטמעות כאלה כרגע — הבית/הבועה אינם
 * עוטפים ב-Provider כלל, ולכן מקבלים את ברירת-המחדל no-op של ה-context).
 */
export function GuidanceFocusProvider({
  children,
  ownsPageHeading = true,
}: {
  children: React.ReactNode;
  ownsPageHeading?: boolean;
}) {
  const [answered, setAnswered] = React.useState(false);
  const value = React.useMemo(
    () => ({ answered, setAnswered, ownsPageHeading }),
    [answered, ownsPageHeading],
  );
  return <GuidanceFocusContext.Provider value={value}>{children}</GuidanceFocusContext.Provider>;
}

/**
 * מנוע-ההכוונה מדווח האם הוא כרגע במצב-תשובה. איפוס אוטומטי כשהמנוע יורד מהמסך
 * (ניווט/החלפה) — כדי שקליפת-הפתיח תחזור למסלול הבא.
 */
export function useReportAnswered(isAnswered: boolean): void {
  const { setAnswered } = useGuidanceFocus();
  React.useEffect(() => {
    setAnswered(isAnswered);
  }, [isAnswered, setAnswered]);
  React.useEffect(() => () => setAnswered(false), [setAnswered]);
}

/**
 * קליפת-הפתיח של עמוד-ההכוונה (כותרת-על, הסברים, צ'יפים) — מתקפלת (display:none)
 * כשמתקבלת תשובה, כדי שהתשובה תעלה למעלה ותהפוך למוקד. שים לב: כותרת ה-h1
 * היחידה של העמוד עוברת ל-`AnswerView` במצב-תשובה, כך שתמיד יש בדיוק h1 אחד.
 */
export function GuidanceIntro({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { answered } = useGuidanceFocus();
  return (
    <div
      data-answered={answered ? "" : undefined}
      className={`guidance-intro${answered ? " guidance-intro--focused" : ""}${
        className ? ` ${className}` : ""
      }`}
    >
      {children}
    </div>
  );
}
