import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת-הספר של ה-Hero. במנוחה: כריכת-הספר (מקור מעבר-הכריכה ל-/preview).
 * `opening` הופך אותה ל-signature-object: כריכת-המותג האמיתית כאובייקט פיזי
 * יוקרתי — hardcover בזווית ¾ עדינה, spine, עובי-דפים (page-block) בקצוות
 * החופשיים, צל-מגע וזוהר-הפרדה. הכריכה הקדמית נפתחת מעט בלבד (~24°) וחושפת הצצה
 * דקה של דפים לבנים — בלי spread, בלי טקסט-reader. הכריכה היא הגיבור הוויזואלי.
 * מונפש פעם אחת תחת `.motion-js` (presence → lift → partial-open → settle);
 * reduced-motion/ללא-JS ⇒ ה-object אינו מרונדר והכריכה הסגורה נשארת סטטית.
 * transform/opacity/filter בלבד (CLS=0). דקורטיבי.
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
                {/* פאות-העובי: שדרה (שמאל) + גוש-דפים (ימין ותחתית) */}
                <span className="pbook__spine" />
                <span className="pbook__edge pbook__edge--fore" />
                <span className="pbook__edge pbook__edge--bottom" />
                {/* הדף העליון הלבן — נחשף בהצצה כשהכריכה נפתחת מעט */}
                <span className="pbook__page" />
                {/* הכריכה הקדמית — אמנות-המותג; נפתחת ~24° סביב השדרה */}
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
