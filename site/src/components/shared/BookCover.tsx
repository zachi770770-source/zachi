import * as React from "react";
import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * עטיפת-הספר של ה-Hero. במנוחה: כריכת-הספר (מקור מעבר-הכריכה ל-/preview).
 *
 * `opening` הופך אותה ל-signature-object: הספר נכנס סגור, הכריכה הקדמית מתרוממת
 * מהשדרה (ימין — ספר עברי) ונפתחת שמאלה, והספר הופך ל-SPREAD אמיתי — עמוד-ימין
 * קבוע + קפל-שדרה רך + עמוד-שמאל — ששני עמודיו *מולחנים* בטקסט עברי אמיתי (RTL,
 * קריא, לא-משוקף). אז מתהפך גיליון אחד עם משקל-נייר ועיקול עדין, חושף את הזוג
 * הבא, והספר *נשאר פתוח* על spread מולחן. אין „עמוד ריק מולחן”: מתחת לכל גיליון
 * מתהפך יש תמיד עמוד-ימין נושא-טקסט ועמוד-שמאל נושא-טקסט.
 *
 * מונפש פעם אחת תחת `.motion-js`; reduced-motion/ללא-JS ⇒ `.book-open` אינו
 * מרונדר והכריכה הסגורה (ה-<img>) נשארת סטטית. transform/opacity/filter בלבד
 * (CLS=0). דקורטיבי (aria-hidden). הטקסט הוא ניסוחי-התֵּמה המאושרים בלבד.
 */

/** עמוד-ימין (recto — נקרא ראשון ב-RTL): הפתיח. */
function RectoOpen() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__h">דייטינג הוא חיפוש.</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">
        סיפור הוא מה שאנחנו מספרים לעצמנו.
      </span>
    </span>
  );
}

/** עמוד-שמאל (verso — ממול): הפנייה קדימה. */
function VersoBuild() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__q">אהבה היא בנייה.</span>
      <span className="book-open__p">לבחור אחרת מתחיל בלראות אחרת.</span>
      <span className="book-open__p">
        לזהות מה חוזר שוב ושוב בקשרים, ולבחור אחרת.
      </span>
    </span>
  );
}

/** הזוג הנחשף אחרי ההיפוך — אותו אוצר-מילים, פריסה שקטה יותר. */
function RectoNext() {
  return (
    <span className="book-open__sheet">
      <span className="book-open__sub">עובדה</span>
      <span className="book-open__p">עובדה היא מה שקרה.</span>
      <span className="book-open__p">למצוא זה רק ההתחלה.</span>
      <span className="book-open__sub">סיפור</span>
      <span className="book-open__p">
        סיפור הוא מה שאנחנו מספרים לעצמנו.
      </span>
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
            className="book-open"
            aria-hidden="true"
            style={{ ["--cover-src" as string]: coverUrl }}
          >
            <span className="book-open__book">
              {/* עובי-דפים (fore-edges) בשני הקצוות. */}
              <span className="book-open__stack book-open__stack--right" />
              <span className="book-open__stack book-open__stack--left" />

              {/* עמוד-ימין הקבוע — נחשף אחרי שהגיליון הראשון מתהפך; נושא טקסט. */}
              <span className="book-open__leaf book-open__leaf--right">
                <RectoNext />
              </span>
              {/* עמוד-שמאל הבסיסי — מתחת ל-liner של הכריכה שנוחת שטוח. */}
              <span className="book-open__leaf book-open__leaf--left">
                <VersoBuild />
              </span>

              {/* גיליון אחד מתהפך — קדמי (recto הראשון) + אחורי (נייר; נתחב מאחורי
                  עמוד-שמאל בנחיתה, לכן אינו נראה כעמוד ריק). */}
              <span
                className="book-open__page book-open__page--p0"
                style={{ ["--i" as string]: "0", zIndex: 20 }}
              >
                <span className="book-open__curl">
                  <span className="book-open__face book-open__face--front">
                    <RectoOpen />
                  </span>
                  <span className="book-open__face book-open__face--back" />
                </span>
              </span>

              {/* קפל-השדרה — crease רך, לא פס-שדרה שחור. */}
              <span className="book-open__gutter" />

              {/* שכבת-הכריכה הקדמית — אותה תמונת-כריכה; נפתחת שטוח (‎-180°)
                  ונשארת כלוח-שמאל. ה-liner (הצד הפנימי) נושא את טקסט עמוד-שמאל
                  הסופי, סימטרי לעמוד-ימין. */}
              <span className="book-open__cover">
                <span className="book-open__cover-face" />
                <span className="book-open__cover-liner">
                  <VersoBuild />
                </span>
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
