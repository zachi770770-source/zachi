import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר בתצוגת תלת-ממד עדינה (זווית, עובי דפים וצל רך).
 * העיצוב הוא CSS טהור מעל SVG שטוח, כך שהעטיפה חדה בכל רזולוציה
 * ואינה נחתכת. יש להחליף בעטיפה אמיתית ברגע שתסופק.
 *
 * `opening` (אופציונלי): רגע-פתיחה חד-פעמי וברור — הכריכה *נפתחת* סביב השדרה,
 * ואז שלושה דפים מתהפכים בזה-אחר-זה (turn מלא, לא riffle), כל אחד חושף את הדף
 * שמתחתיו, והספר נשאר פתוח לרגע לפני שהוא נסגר בחזרה לכריכה. הדפים הם שכבות
 * aria-hidden בתוך אותו הקשר-3D של הכריכה, עם משטח-נייר אמיתי (חום, שורות,
 * צל-שדרה, צל-קצה). ה-<img> של הכריכה עצמה היא ה„דף” הקדמי שנפתח — כך זהות
 * הכריכה נשמרת ואין כפילות. במנוחה (וכן בסוף הרצף) הכול חוזר לכריכה הסגורה
 * המדויקת. מונפש פעם אחת בלבד תחת `.motion-js` (globals.css). reduced-motion /
 * ללא-JS ⇒ הדפים אינם מרונדרים והכריכה סטטית לגמרי. transform/opacity בלבד.
 */
/**
 * תוכן-הדפים המודפס (טקסט אמיתי, לא placeholders). שלושה עמודים שונים, כל אחד
 * עם פריסה אחרת: עמוד-כותרת+פסקה, עמוד-ציטוט, ועמוד דו-מקטעי. המשפטים הם
 * ניסוחי-התֵּמה המאושרים של האתר („דייטינג הוא חיפוש / אהבה היא בנייה” וכו’) —
 * לא ציטוטים מהספר ולא המצאות. aria-hidden (דקורטיבי; מסתובב עם הדף ב-3D).
 */
const bookOpenPages: Record<number, React.ReactNode> = {
  // עמוד 1 — פסקה: כותרת מודגשת + גוף-טקסט רציף.
  0: (
    <span className="book-open__sheet">
      <span className="book-open__h">דייטינג הוא חיפוש</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">דייטינג הוא חיפוש.</span>
      <span className="book-open__p">אהבה היא בנייה.</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.</span>
      <span className="book-open__p">הספר עוזר לזהות מה חוזר אצלכם, ולבחור אחרת בפעם הבאה.</span>
    </span>
  ),
  // עמוד 2 — ציטוט: ציטוט גדול פותח + שורות-גוף תומכות.
  1: (
    <span className="book-open__sheet">
      <span className="book-open__q">„אהבה היא בנייה.”</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">דייטינג הוא חיפוש.</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.</span>
    </span>
  ),
  // עמוד 3 — שתי פסקאות: תת-כותרת + שורות, פעמיים.
  2: (
    <span className="book-open__sheet">
      <span className="book-open__sub">עובדה</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">דייטינג הוא חיפוש.</span>
      <span className="book-open__sub">סיפור</span>
      <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.</span>
    </span>
  ),
};

export function BookCover({
  className,
  priority = false,
  opening = false,
}: {
  className?: string;
  priority?: boolean;
  opening?: boolean;
}) {
  return (
    <div className={cn("book-cover", opening && "book-cover--open", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />

        {opening ? (
          // בלוק-הדפים יושב *מאחורי* הכריכה ונחשף כשהיא נפתחת. הדף התחתון
          // (spread) הוא הבסיס; מעליו שלושה דפים שמתהפכים בזה-אחר-זה. z-index
          // יורד עם סדר-ההיפוך כך שכל דף חושף את שמתחתיו.
          <span className="book-open" aria-hidden="true">
            <span className="book-open__spine" />
            <span className="book-open__spread book-open__face">
              <span className="book-open__sheet">
                <span className="book-open__h">לראות אחרת</span>
                <span className="book-open__p">למצוא זה רק ההתחלה.</span>
                <span className="book-open__p">דייטינג הוא חיפוש.</span>
                <span className="book-open__p">אהבה היא בנייה.</span>
                <span className="book-open__p">עובדה היא מה שקרה.</span>
                <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
                <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
              </span>
            </span>
            {[2, 1, 0].map((i) => (
              <span
                key={i}
                className={`book-open__page book-open__face book-open__page--p${i}`}
                style={{ ["--i" as string]: String(i), zIndex: 10 - i }}
              >
                {bookOpenPages[i]}
              </span>
            ))}
          </span>
        ) : null}

        <Image
          src={siteConfig.images.mockup3d}
          alt={siteConfig.images.mockup3dAlt}
          width={620}
          height={930}
          priority={priority}
          // גדלי התצוגה בפועל (Hero): 196px במובייל, 264px בטאבלט, 392px בדסקטופ.
          // Next מייצר srcset מותאם, כך שמובייל אינו מוריד את המקור 1400×2100.
          sizes="(max-width: 640px) 196px, (max-width: 1024px) 264px, 392px"
          className="book-cover__img"
        />
      </div>
    </div>
  );
}
