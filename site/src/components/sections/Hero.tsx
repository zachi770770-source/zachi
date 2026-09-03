import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { hero } from "@/content/book";
import { AmazonBuyLink } from "@/components/purchase/AmazonBuyLink";
import { Container } from "@/components/shared/Container";
import { BookCover } from "@/components/shared/BookCover";
import { BookTilt } from "@/components/shared/BookTilt";
import { BookLink } from "@/components/shared/BookLink";

/**
 * Hero — „opening scene של מותג” (PHASE SIGNATURE). לא „כריכה ליד טקסט וכפתור”:
 * סצנה עריכתית שכבתית שבה הכריכה היא *אובייקט דומיננטי* היושב על „במה” של שדה-
 * צבע כהה (Ink), חתוכה בקצה, עם עומק וזוהר; והטיפוגרפיה הגדולה חוצה מעליה
 * בשטח-שלילי דרמטי. התזה „מחיפוש לבנייה” גלויה: השורה הראשונה („למצוא זה רק
 * ההתחלה”) *מפוזרת* ורכה (חיפוש), והשנייה („אהבה בונים”) *מתכנסת*, מודגשת, עם
 * קו-חתימה נמשך וחוט מבני שיורד אל האובייקט ואל המשך העמוד.
 *
 * הקופי המאושר לא משתנה, וה-h1 נושא את אותו טקסט. הכריכה נשארת מקור מעבר-הכריכה
 * (`data-vt-book-source` → /preview). הכוריאוגרפיה (on-load) והתנועה מגודרות
 * ב-`.motion-js`; ללא-JS / reduced-motion — המצב הסופי גלוי ויציב מיד.
 *
 * ה-choreography: הרקע/עומק נכנסים ראשונים → הבמה נפרשת → הכריכה מקבלת נוכחות
 * → הכותרת נבנית („חיפוש” מתיישב, „בנייה” מקבל רגע וקו) → ה-CTA אחרון.
 */
export function Hero() {
  return (
    <section className="sig-hero" aria-label={hero.title}>
      {/* עומק-רקע: שדות-צבע גדולים ומטושטשים + גרעין עדין. דקורטיבי בלבד. */}
      <div className="sig-hero__bg" aria-hidden="true">
        <span className="sig-hero__field sig-hero__field--sage" />
        <span className="sig-hero__field sig-hero__field--terra" />
        <span className="sig-hero__grain" />
      </div>

      <Container className="sig-hero__container">
        <div className="sig-hero__scene">
          {/* האובייקט: במת-צבע כהה + כריכה גדולה, חתוכה, עם עומק וזוהר. */}
          <div className="sig-hero__object">
            <span className="sig-hero__stage" aria-hidden="true" />
            <span className="sig-hero__glow" aria-hidden="true" />
            <div data-tilt-scope className="sig-hero__cover">
              <span className="sig-hero__cover-shadow" aria-hidden="true" />
              <BookTilt className="sig-hero__tilt">
                <BookLink
                  href="/preview"
                  morphCover
                  aria-label="הציצו בספר, לקריאת טעימה"
                  className="sig-hero__cover-link"
                >
                  <div data-vt-book-source className="sig-hero__cover-src">
                    <BookCover priority opening className="w-full" />
                  </div>
                </BookLink>
              </BookTilt>
            </div>
          </div>

          {/* הטיפוגרפיה: חוצה מעל הבמה בשטח-שלילי. */}
          <div className="sig-hero__copy">
            <span className="sig-hero__eyebrow">{hero.eyebrow}</span>

            <h1 className="sig-hero__title">
              {/* „חיפוש” — מפוזר ורך; כל מילה מתיישבת בכניסה. המילים הן טקסט
                  קריא רגיל (רווחים אמיתיים בין spans), כך שה-h1 נקרא במלואו. */}
              <span className="sig-hero__search">
                {["למצוא", "זה", "רק", "ההתחלה."].map((w, i, arr) => (
                  <React.Fragment key={w}>
                    <span className="sig-hero__word" style={{ ["--i" as string]: String(i) }}>
                      {w}
                    </span>
                    {i < arr.length - 1 ? " " : null}
                  </React.Fragment>
                ))}
              </span>{" "}
              {/* „בנייה” — מתכנס, מודגש, עם קו-חתימה נמשך. */}
              <span className="sig-hero__build">
                אהבה בונים.
                <span className="sig-hero__stroke" aria-hidden="true" />
              </span>
            </h1>

            {/* שורת-משנה — לפי breakpoint. הניסוח מחזיק את המשמעות המקורית
                („לזהות מה חוזר, ולבחור אחרת”) ובו-בזמן מהדהד את תזת ה-H1 בטקסט
                גלוי ואמיתי: מציאת אדם היא רק ההתחלה, ומכאן בונים זוגיות. כך אוצר-
                המילים של הכותרת (ההתחלה / בונים / זוגיות) מופיע גם בגוף הנקרא,
                ולא רק בכותרת — בלי דחיסת מילות-מפתח. */}
            <p className="sig-hero__sub sig-hero__sub--mobile">
              מציאת אדם היא רק ההתחלה — לזהות מה חוזר בקשרים, ולבנות זוגיות אחרת.
            </p>
            <p className="sig-hero__sub sig-hero__sub--desktop">
              הספר עוזר לזהות מה חוזר אצלכם שוב ושוב בקשרים, ולהבין שמציאת אדם היא רק
              ההתחלה — ומכאן בונים זוגיות בריאה ואחרת בפעם הבאה.
            </p>

            <div className="sig-hero__cta">
              <BookLink href="/preview" morphCover className="sig-hero__cta-primary">
                קראו טעימה מהספר · 2 דקות
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </BookLink>
              <AmazonBuyLink source="home" className="sig-hero__cta-secondary group">
                לרכישת הספר באמזון
                <ArrowLeft
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                  aria-hidden="true"
                />
              </AmazonBuyLink>
            </div>
          </div>
        </div>
      </Container>

      {/* חוט-המשכיות: קו מבני שיורד אל מקטע „איפה אתם נמצאים עכשיו?” — הכניסה
          מובילה לתוך האינטראקציה (המשכיות מרחבית ל-Focus Mode). */}
      <span className="sig-hero__thread" aria-hidden="true" />
    </section>
  );
}
