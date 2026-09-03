import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר בתצוגת תלת-ממד עדינה (זווית, עובי דפים וצל רך).
 * העיצוב הוא CSS טהור מעל תמונת-כריכה, כך שהעטיפה חדה בכל רזולוציה.
 *
 * `opening` (אופציונלי): רגע-פתיחה קולנועי חד-פעמי — הספר מופיע סגור, הכריכה
 * הקדמית מתרוממת מהשדרה ונפתחת שמאלה, והספר הופך ל־SPREAD אמיתי (עמוד-שמאל +
 * שדרה מרכזית + עמוד-ימין). אז כמה דפים מתהפכים בזה-אחר-זה — כל דף מתעקל מעט
 * בזמן ההיפוך — והספר נשאר פתוח. שכבת-הכריכה הנפתחת משתמשת באותה תמונת-כריכה
 * (רקע), כדי שזהות הכריכה נשמרת בלי לגעת בתמונת המקור; ה-<img> האמיתי הוא מצב-
 * המנוחה הסגור ומקור מעבר-הכריכה אל /preview. מונפש פעם אחת בלבד תחת `.motion-js`.
 * reduced-motion / ללא-JS ⇒ `.book-open` אינו מרונדר והכריכה סטטית לגמרי.
 * transform/opacity/filter בלבד (ללא CLS). הדפים `aria-hidden` (דקורטיביים).
 */

/** גיליון-טקסט אחד (RTL) המודפס על פני-דף. הטקסט הוא ניסוחי-התֵּמה המאושרים של
 *  האתר — לא ציטוטים מהספר ולא המצאות. הטקסט הוא פרט שמגלים אחרי שקוראים „ספר”. */
function SheetParagraph() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__h">דייטינג הוא חיפוש</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">אהבה היא בנייה.</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">לזהות מה חוזר שוב ושוב בקשרים.</span>
    </span>
  );
}
function SheetQuote() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__q">„אהבה היא בנייה.”</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">דייטינג הוא חיפוש.</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">לזהות מה חוזר שוב ושוב בקשרים.</span>
    </span>
  );
}
function SheetSections() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__sub">עובדה</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__sub">סיפור</span>
      <span className="book-open__p">סיפור הוא מה שאנחנו מספרים לעצמנו.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
    </span>
  );
}

/** תוכן פני-הדפים המתהפכים (p0 נפתח ראשון). כל דף פריסה שונה. */
const turningSheets: Record<number, React.ReactNode> = {
  0: <SheetParagraph />,
  1: <SheetQuote />,
  2: <SheetSections />,
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
  const coverUrl = `url(${siteConfig.images.mockup3d})`;
  return (
    <div className={cn("book-cover", opening && "book-cover--open", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />

        {opening ? (
          // רצף-הפתיחה יושב באותו הקשר-3D של הכריכה. `book-open__book` נושא את
          // התאמת-המסגרת (recenter+scale) כדי שה-spread ייפתח בלי לחדור לטקסט,
          // ושכבת-הכריכה `book-open__cover` (רקע = אותה תמונת-כריכה) נפתחת שמאלה.
          <span
            className="book-open"
            aria-hidden="true"
            style={{ ["--cover-src" as string]: coverUrl }}
          >
            <span className="book-open__book">
              {/* בסיס ה-SPREAD: עמוד-ימין (נחשף מתחת לכריכה) + עמוד-שמאל (הלוח
                  שהכריכה נפתחת אליו) + עובי-דפים בשני הקצוות + שדרה מרכזית. */}
              <span className="book-open__stack book-open__stack--right" />
              <span className="book-open__stack book-open__stack--left" />
              <span className="book-open__leaf book-open__leaf--right">
                <SheetQuote />
              </span>
              {/* עמוד-שמאל: יושב מעל הדפים שנוחתים (translateZ גבוה), ולכן הוא
                  „עמוד-השמאל” הקבוע — הדפים המתהפכים חולפים מעליו ואז נתחבים
                  מאחוריו. נושא טקסט משלו. */}
              <span className="book-open__leaf book-open__leaf--left">
                <SheetSections />
              </span>

              {/* הדפים המתהפכים — hinge בשדרה, כל אחד עם עטיפת-עיקול (curl). */}
              {[2, 1, 0].map((i) => (
                <span
                  key={i}
                  className={`book-open__page book-open__page--p${i}`}
                  style={{ ["--i" as string]: String(i), zIndex: 20 - i }}
                >
                  <span className="book-open__curl">
                    <span className="book-open__face book-open__face--front">
                      {turningSheets[i]}
                    </span>
                    {/* גב-הדף — נייר בלבד; נתחב מאחורי עמוד-השמאל בנחיתה. */}
                    <span className="book-open__face book-open__face--back" />
                  </span>
                </span>
              ))}

              {/* השדרה — קפל מרכזי: צל-מרזב פנימי + הבזק-אור עדין. מעל הבסיס. */}
              <span className="book-open__gutter" />

              {/* שכבת-הכריכה הקדמית: אותה תמונת-כריכה, נפתחת סביב השדרה ונשארת
                  פתוחה כלוח-שמאל. ה-face הוא הכריכה; ה-inner הוא הצד הפנימי. */}
              <span className="book-open__cover">
                <span className="book-open__cover-face" />
                <span className="book-open__cover-liner" />
              </span>
            </span>
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
