import Link from "next/link";

import { Container } from "@/components/shared/Container";
import { whyTheBook } from "@/content/homeStory";

/**
 * התשובה לשאלה המסחרית שהעמוד לא ענה עליה: אם באתר יש מדריכים, כלים,
 * עמודי-מסע ו„שאל את הספר” — למה בכלל לקנות ספר?
 *
 * הטענה („האתר עונה על שאלה. הספר מלווה תהליך.”) לא השתנתה. מה שהשתנה הוא
 * ה*הצגה*: קודם היא ישבה בתוך פאנל מוקף-מסגרת שבתוכו רשימה ממוספרת בת ארבע
 * שורות עם צמתים מלאים — כלומר ההבדל בין אתר לספר הוצג בשפה של ממשק-מוצר,
 * בעמוד שכל תפקידו הוא למכור ספר. כאן אין מיכל: כותרת, שתי שורות שמעמידות
 * את ההשוואה זו-מול-זו על פני ציר, ושלוש אמירות-תוצאה. טיפוגרפיה, שטח לבן
 * וקווים דקים — לא כרטיס.
 *
 * רגע-החתימה (PHASE NARRATIVE — POINT → PATH) נשמר במלואו ובאותם סלקטורים:
 * צד-האתר הוא *נקודה* בודדה, וצד-הספר הוא אותה נקודה ש*נפתחת לציר* שהשורות
 * נבנות עליו בזו-אחר-זו. הכול opacity/transform (ללא CLS), מגודר ב-`.motion-js`,
 * ומכבד prefers-reduced-motion (מצב סופי מיידי). מה שירד הוא רק כרום-הכרטיס
 * והמספור, לא הכוריאוגרפיה.
 *
 * השורות הן `outcomes.items` המאושרות כלשונן (ראו ההערה ב-homeStory), ולא
 * תוכן חדש. תוכן-העניינים עבר ל-`/book` ומקושר מכאן בקישור-טקסט משני.
 */
export function WhyTheBook() {
  return (
    <section aria-labelledby="why-book-heading" className="s2p reveal py-6 sm:py-10">
      <Container>
        <div className="s2p__head mx-auto max-w-3xl text-center">
          <span className="kicker justify-center">{whyTheBook.eyebrow}</span>
          <h2 id="why-book-heading" className="type-h2 mt-3 [text-wrap:balance]">
            {whyTheBook.title}
          </h2>
        </div>

        <div className="s2p__body mx-auto mt-7 max-w-3xl sm:mt-9">
          {/* האתר — נקודה אחת: צומת יחיד + משפט. */}
          <div className="s2p__point">
            <span className="s2p__dot" aria-hidden="true" />
            <p className="s2p__side-label">{whyTheBook.site.label}</p>
            <p className="s2p__side-line">{whyTheBook.site.line}</p>
          </div>

          {/* הספר — הנקודה נפתחת לציר, והתוצאות נבנות עליו לפי סדר. */}
          <div className="s2p__path">
            <span className="s2p__axis" aria-hidden="true" />
            <p className="s2p__side-label s2p__book-label">{whyTheBook.book.label}</p>
            <ul className="s2p__stations">
              {whyTheBook.book.lines.map((line, i) => (
                <li
                  key={line}
                  className="s2p__station"
                  style={{ ["--i" as string]: String(i) }}
                >
                  <span className="s2p__node" aria-hidden="true" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="s2p__note">
              {whyTheBook.book.note}{" "}
              <Link href="/book" className="s2p__link">
                {whyTheBook.linkLabel}
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
