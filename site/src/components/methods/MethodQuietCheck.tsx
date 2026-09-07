/**
 * הדגמת „בדיקת השקט” — הכלי היחיד שבו *התנועה עצמה היא ההסבר*, ולכן הוא
 * מקבל הדגמה ולא רק ציטוט. אין כאן מיני-אפליקציה: אין מצב, אין קלט, אין
 * כפתורים. רכיב שרת בלבד; כל התוכן ב-HTML וקריא מיד.
 *
 * מה נראה:
 *   1. העובדה — שכבה מעוגנת שאינה זזה: „עדיין לא התקבלה תשובה”.
 *   2. הפרשנות — נפרדת ממנה ונסוגה: „פסלו אותי”. המרחק שנוצר *הוא* התובנה.
 *   3. העיקרון — נפתר מתוך ההבחנה ומחזיר אל הקרקע.
 *
 * כל המחרוזות לקוחות מילה-במילה מהתוכן המאושר של העמוד (`methods.ts`) —
 * לא נכתב כאן קופי חדש, ולא הומצאה דוגמה.
 *
 * נגישות: הרצף נמסר בטקסט אמיתי ובסדר-קריאה נכון; התוויות („העובדה” /
 * „הפרשנות”) הן חלק מהתוכן ולא רק צבע. תחת prefers-reduced-motion כל שלוש
 * השכבות מוצגות מיד במצבן הסופי — ההסבר לא תלוי באנימציה.
 */
export function MethodQuietCheck({
  fact,
  interpretation,
  principle,
}: {
  fact: string;
  interpretation: string;
  principle: string;
}) {
  return (
    <figure className="quiet-demo reveal rounded-2xl border border-border bg-surface-muted/40 p-5 sm:p-7">
      <div className="quiet-demo__pair grid gap-3 sm:grid-cols-2">
        <div className="quiet-demo__fact rounded-xl border border-sage-ink/35 bg-surface p-4">
          <p className="text-[12.5px] font-semibold uppercase tracking-wide text-sage-ink">
            העובדה
          </p>
          <p className="mt-2 text-[16px] leading-relaxed text-foreground [text-wrap:pretty]">
            {fact}
          </p>
        </div>
        <div className="quiet-demo__story rounded-xl border border-brand/25 bg-brand-muted p-4">
          <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
            הפרשנות
          </p>
          <p className="mt-2 text-[16px] leading-relaxed text-foreground [text-wrap:pretty]">
            {interpretation}
          </p>
        </div>
      </div>
      <figcaption className="quiet-demo__resolve mt-5 border-t border-border pt-4">
        <p className="font-serif text-[clamp(1.05rem,2vw,1.3rem)] font-medium leading-snug text-foreground [text-wrap:balance]">
          {principle}
        </p>
      </figcaption>
    </figure>
  );
}
