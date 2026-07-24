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
          unoptimized
          className="book-cover__img"
        />
      </div>
    </div>
  );
}
