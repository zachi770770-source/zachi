import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר בתצוגת תלת-ממד עדינה (זווית, עובי דפים וצל רך).
 * העיצוב הוא CSS טהור מעל SVG שטוח, כך שהעטיפה חדה בכל רזולוציה
 * ואינה נחתכת. יש להחליף בעטיפה אמיתית ברגע שתסופק.
 *
 * `riffle` (אופציונלי): רגע-פתיחה חד-פעמי — הספר „מדפדף” 2–3 דפים מקצה-הפתיחה
 * ואז מתייצב. הדפים הם שכבות aria-hidden בתוך אותו הקשר-3D של הכריכה (spine
 * משותף), נסתרות לגמרי במנוחה; הן מונפשות פעם אחת בלבד תחת `.motion-js`
 * (globals.css). reduced-motion / ללא-JS ⇒ הן אינן מרונדרות כלל (הכריכה סטטית).
 */
export function BookCover({
  className,
  priority = false,
  riffle = false,
}: {
  className?: string;
  priority?: boolean;
  riffle?: boolean;
}) {
  return (
    <div className={cn("book-cover", riffle && "book-cover--riffle", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />
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
        {riffle ? (
          <span className="book-cover__riffle" aria-hidden="true">
            <span className="book-cover__leaf" style={{ ["--i" as string]: "0" }} />
            <span className="book-cover__leaf" style={{ ["--i" as string]: "1" }} />
            <span className="book-cover__leaf" style={{ ["--i" as string]: "2" }} />
          </span>
        ) : null}
      </div>
    </div>
  );
}
