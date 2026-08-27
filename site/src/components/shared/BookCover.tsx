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
            <span className="book-open__spread book-open__face" />
            {[2, 1, 0].map((i) => (
              <span
                key={i}
                className="book-open__page book-open__face"
                style={{ ["--i" as string]: String(i), zIndex: 10 - i }}
              />
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
