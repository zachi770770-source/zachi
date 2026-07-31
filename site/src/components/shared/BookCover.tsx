import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר בתצוגת תלת-ממד עדינה (זווית, עובי דפים וצל רך).
 * העיצוב הוא CSS טהור מעל SVG שטוח, כך שהעטיפה חדה בכל רזולוציה
 * ואינה נחתכת. יש להחליף בעטיפה אמיתית ברגע שתסופק.
 */
export function BookCover({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <div className={cn("book-cover", className)}>
      <div className="book-cover__inner">
        <span className="book-cover__pages" aria-hidden="true" />
        <Image
          src={siteConfig.images.mockup3d}
          alt={siteConfig.images.mockup3dAlt}
          width={620}
          height={930}
          priority={priority}
          // גדלי התצוגה בפועל (Hero): 172px במובייל, 264px בטאבלט, 340px בדסקטופ.
          // Next מייצר srcset מותאם, כך שמובייל אינו מוריד את המקור 1400×2100.
          sizes="(max-width: 640px) 172px, (max-width: 1024px) 264px, 340px"
          className="book-cover__img"
        />
      </div>
    </div>
  );
}
