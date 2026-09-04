import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת הספר של ה-Hero. במנוחה: כריכת-הספר בתלת-ממד עדין (מקור מעבר-הכריכה
 * ל-/preview). `opening` מוסיף signature-object קולנועי: הספר מופיע סגור, נפתח
 * בתנועה אחת גדולה ל-„ספר פיזי פתוח” בזווית ¾ — לוחות-כריכה, עובי-דפים, שדרה/קפל
 * טבעי, עקמומיות-קצה עדינה וצל-מגע אמיתי על הרקע — ואז דף אחד מתהפך והספר נשאר
 * פתוח. הטקסט שעל הדפים הוא טקסטורה עריכתית (דהוי, לא „reader”). מונפש פעם אחת
 * תחת `.motion-js`; reduced-motion / ללא-JS ⇒ הספר הפתוח אינו מרונדר והכריכה
 * הסגורה נשארת סטטית ומוקפדת. transform/opacity/filter בלבד (CLS=0). דקורטיבי.
 */

/** טקסטורת-טקסט עריכתית דהויה על פני-דף (RTL). ניסוחי-התֵּמה המאושרים בלבד,
 *  מעטים ודהויים — נקראים כ„דף בספר”, לא כתוכן שנועד לקריאה. */
function PageText({ variant }: { variant: "quote" | "plain" }) {
  return (
    <span className="hbook__text" aria-hidden="true">
      {variant === "quote" ? (
        <>
          <span className="hbook__q">„אהבה היא בנייה.”</span>
          <span className="hbook__l">למצוא זה רק ההתחלה.</span>
          <span className="hbook__l">דייטינג הוא חיפוש.</span>
          <span className="hbook__l hbook__l--short">עובדה היא מה שקרה.</span>
        </>
      ) : (
        <>
          <span className="hbook__l">לזהות מה חוזר שוב ושוב.</span>
          <span className="hbook__l">לבחור אחרת מתחיל בלראות אחרת.</span>
          <span className="hbook__l hbook__l--short">ומכאן בונים.</span>
        </>
      )}
    </span>
  );
}

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
            className="hbook"
            aria-hidden="true"
            style={{ ["--cover-src" as string]: coverUrl }}
          >
            {/* צל-מגע על ה„רצפה” — מקרקע את הספר ומפריד אותו מהרקע. */}
            <span className="hbook__shadow" />
            {/* זוהר רך מאחורי הספר — הפרדה נוספת + עומק. */}
            <span className="hbook__halo" />

            {/* הספר עצמו: פרספקטיבה + הטיית-¾. שני חצאים סימטריים סביב השדרה. */}
            <span className="hbook__book">
              <span className="hbook__side hbook__side--left">
                <span className="hbook__board" />
                <span className="hbook__stack" />
                <span className="hbook__page">
                  <PageText variant="plain" />
                </span>
              </span>

              <span className="hbook__side hbook__side--right">
                <span className="hbook__board" />
                <span className="hbook__stack" />
                <span className="hbook__page">
                  <PageText variant="quote" />
                </span>
              </span>

              {/* שדרה/קפל מרכזי — עמק רך בין הדפים. */}
              <span className="hbook__spine" />

              {/* דף אחד מתהפך — התנועה האנושית של „פתיחת ספר”. */}
              <span className="hbook__turn">
                <span className="hbook__turn-face hbook__turn-face--front">
                  <PageText variant="plain" />
                </span>
                <span className="hbook__turn-face hbook__turn-face--back" />
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
          sizes="(max-width: 640px) 196px, (max-width: 1024px) 264px, 392px"
          className="book-cover__img"
        />
      </div>
    </div>
  );
}
