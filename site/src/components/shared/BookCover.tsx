import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת-הספר של ה-Hero. במנוחה: כריכת-הספר (מקור מעבר-הכריכה ל-/preview).
 * `opening` הופך אותה ל-signature-object: כריכת-המותג האמיתית כאובייקט פיזי
 * יוקרתי — hardcover בזווית ¾ עדינה, spine, עובי-דפים (page-block) בקצוות
 * החופשיים, צל-מגע וזוהר-הפרדה.
 *
 * במהלך ההנפשה הכריכה נפתחת רחב יותר וחושפת שני דפים פנימיים אמיתיים עם טקסט
 * עברי (RTL, קריא, לא-משוקף) — הדף העליון מתהפך, אחריו הדף השני — ואז הספר
 * מתייצב חזרה למצב ה-premium הסופי (כריכה בהצצה דקה בלבד). לכל היותר שני דפדופים.
 * מונפש פעם אחת תחת `.motion-js`; reduced-motion/ללא-JS ⇒ ה-object אינו מרונדר
 * והכריכה הסגורה נשארת סטטית. transform/opacity/filter בלבד (CLS=0). דקורטיבי.
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
  const coverUrl = `url(${siteConfig.images.mockup3d})`;
  return (
    <div className={cn("book-cover", opening && "book-cover--open", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />

        {opening ? (
          <span
            className="pbook"
            aria-hidden="true"
            style={{ ["--cover-src" as string]: coverUrl }}
          >
            {/* צל-מגע על ה„רצפה” + זוהר-הפרדה מאחורי הספר. */}
            <span className="pbook__contact" />
            <span className="pbook__halo" />

            {/* גוף-הספר: hardcover בזווית ¾, עם עובי אמיתי. */}
            <span className="pbook__stage">
              <span className="pbook__slab">
                {/* לוח-הכריכה האחורי (מאחור) */}
                <span className="pbook__back" />
                {/* פאות-העובי: שדרה (ימין — כריכת ספר עברי) + גוש-דפים (שמאל ותחתית) */}
                <span className="pbook__spine" />
                <span className="pbook__edge pbook__edge--fore" />
                <span className="pbook__edge pbook__edge--bottom" />

                {/* גוש-הדפים: דף-בסיס לבן (הצצה סופית) + שני דפים מתהפכים עם
                    טקסט עברי אמיתי (קדמי=טקסט, אחורי=נייר ריק כדי שלא ישוקף). */}
                <span className="pbook__page" />

                {/* דף שני (נחשף אחרי הדפדוף הראשון) — מבנה שתי-מדורות (עובדה / סיפור),
                    כולו מניסוחי-התֵּמה המאושרים. */}
                <span className="pbook__leaf pbook__leaf--p2">
                  <span className="pbook__face pbook__face--front">
                    <span className="pbook__ptext">
                      <span className="pbook__ph">אהבה היא בנייה.</span>
                      <span className="pbook__sub">עובדה</span>
                      <span className="pbook__pl">עובדה היא מה שקרה.</span>
                      <span className="pbook__pl">למצוא זה רק ההתחלה.</span>
                      <span className="pbook__pl">דייטינג הוא חיפוש.</span>
                      <span className="pbook__sub">סיפור</span>
                      <span className="pbook__pl">
                        סיפור הוא מה שאנחנו מספרים לעצמנו.
                      </span>
                      <span className="pbook__pl">
                        לבחור אחרת מתחיל בלראות אחרת.
                      </span>
                      <span className="pbook__pl">
                        לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.
                      </span>
                    </span>
                    <span className="pbook__sheen" aria-hidden="true" />
                  </span>
                  <span className="pbook__face pbook__face--back" />
                </span>

                {/* דף ראשון (העליון — מתהפך ראשון) — פתיח זורם + מדור „לראות אחרת”,
                    כולו מניסוחי-התֵּמה המאושרים. */}
                <span className="pbook__leaf pbook__leaf--p1">
                  <span className="pbook__face pbook__face--front">
                    <span className="pbook__ptext">
                      <span className="pbook__ph">דייטינג הוא חיפוש.</span>
                      <span className="pbook__pl">למצוא זה רק ההתחלה.</span>
                      <span className="pbook__pl">אהבה היא בנייה.</span>
                      <span className="pbook__pl">עובדה היא מה שקרה.</span>
                      <span className="pbook__pl">
                        סיפור הוא מה שאנחנו מספרים לעצמנו.
                      </span>
                      <span className="pbook__sub">לראות אחרת</span>
                      <span className="pbook__pl">
                        לבחור אחרת מתחיל בלראות אחרת.
                      </span>
                      <span className="pbook__pl">
                        לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.
                      </span>
                      <span className="pbook__pl">
                        הספר עוזר לזהות מה חוזר אצלכם, ולבחור אחרת בפעם הבאה.
                      </span>
                    </span>
                    <span className="pbook__sheen" aria-hidden="true" />
                  </span>
                  <span className="pbook__face pbook__face--back" />
                </span>

                {/* הכריכה הקדמית — אמנות-המותג; נפתחת רחב לדפדוף ואז מתייצבת ~13° */}
                <span className="pbook__cover" />
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
          sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 420px"
          className="book-cover__img"
        />
      </div>
    </div>
  );
}
