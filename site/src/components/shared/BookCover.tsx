import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר בתצוגת תלת-ממד עדינה (זווית, עובי דפים וצל רך).
 * העיצוב הוא CSS טהור מעל SVG שטוח, כך שהעטיפה חדה בכל רזולוציה
 * ואינה נחתכת. יש להחליף בעטיפה אמיתית ברגע שתסופק.
 *
 * `sheen` — מעבר-אור יחיד על פני הכריכה, פעם אחת בכניסה. בהסכמה מפורשת בלבד
 * (ה-Hero), כדי שהוא יישאר רגע-מותג יחיד ולא אפקט שחוזר בכל מופע של הכריכה.
 */
export function BookCover({
  className,
  priority = false,
  sheen = false,
}: {
  className?: string;
  priority?: boolean;
  sheen?: boolean;
}) {
  return (
    <div className={cn("book-cover", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />
        {/* האור עובר *מעל* הכריכה ונחתך אליה, כך שהוא נקרא כהשתקפות על נייר
            מודפס ולא כשכבה שמרחפת מעליה. דקורטיבי, ולכן aria-hidden. */}
        {sheen ? (
          <span className="book-cover__sheen" aria-hidden="true">
            <span className="book-cover__sheen-band" />
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
