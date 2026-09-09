import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { authorNote } from "@/content/homeStory";

const PHOTO_ALT = "צחי חן, מחבר הספר מדייטים לאהבה";
/** דיוקן קטן: 220px בדסקטופ, 96px במובייל — לכן די ב-640w. */
const PHOTO_SIZES = "(min-width: 768px) 220px, 96px";

/**
 * הסיבה האנושית לתת אמון. הטקסט לא השתנה — מה שהשתנה הוא שיש כאן עכשיו *אדם*.
 *
 * קודם לכן זה היה מלבן מעוגל עם מסגרת, בין שני מלבנים מעוגלים עם מסגרת: אותה
 * שפה ויזואלית בדיוק כמו „למה בכלל ספר” שמעליו וכמו חמש נקודות-הפתיחה שמתחתיו.
 * מקטע שכל תפקידו הוא אמון נראה כמו עוד לוח-מידע, ולא היה בו שום דבר אנושי —
 * גם לא פנים. הדיוקן המאושר קיים באתר (‎/author) ולא הופיע בעמוד הבית כלל.
 *
 * כאן: אין מיכל. דיוקן, טיפוגרפיה, קו-הפרדה אחד וחתימה. בדסקטופ הדיוקן הוא
 * טור משלו לצד הטקסט; במובייל הוא יורד לשורת-החתימה בגודל קטן, כדי שהפנים
 * יישארו נוכחות בלי שהמקטע יהפוך לבלוק-ביוגרפיה.
 *
 * התמונה היא בדיוק אותה תמונה מאושרת של ‎/author (אותם קבצים ואותו alt) — לא
 * נוצרה ולא הוחלפה תמונה. הגבול הלא-קליני נשאר מילה במילה.
 */
function Portrait({ className }: { className: string }) {
  return (
    <picture>
      <source
        type="image/avif"
        sizes={PHOTO_SIZES}
        srcSet="/images/author/zachi-chen-640.avif 640w, /images/author/zachi-chen-960.avif 960w"
      />
      <source
        type="image/webp"
        sizes={PHOTO_SIZES}
        srcSet="/images/author/zachi-chen-640.webp 640w, /images/author/zachi-chen-960.webp 960w"
      />
      <img
        src="/images/author/zachi-chen-960.jpg"
        width={1600}
        height={2000}
        alt={PHOTO_ALT}
        loading="lazy"
        decoding="async"
        className={className}
      />
    </picture>
  );
}

export function AuthorNote() {
  return (
    <section aria-labelledby="author-note-heading" className="py-6 sm:py-10">
      <Container>
        <div className="author-note reveal mx-auto max-w-3xl">
          {/* דסקטופ/טאבלט: הדיוקן כטור עריכתי לצד הטקסט. */}
          {/* שתי המופעים מתחלפים ב-display לפי breakpoint, ולכן בכל רגע נתון
              רק אחד מהם קיים בעץ-הנגישות — אין כפילות alt. */}
          <div className="author-note__portrait">
            <Portrait className="author-note__img" />
          </div>

          <div className="author-note__text">
            <h2 id="author-note-heading" className="author-note__title">
              {authorNote.title}
            </h2>
            <p className="author-note__body">{authorNote.body}</p>
            <p className="author-note__body">{authorNote.bodyClose}</p>

            <div className="author-note__byline">
              {/* מובייל: הפנים נוכחות כאן, בגודל שורת-חתימה. */}
              <span className="author-note__portrait-inline">
                <Portrait className="author-note__img author-note__img--inline" />
              </span>
              <SignatureMark />
              <span className="author-note__name">{authorNote.signature}</span>
              <Link href="/author" className="author-note__link group">
                {authorNote.linkLabel}
                <ArrowLeft
                  className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {/* הגבול נשאר מפורש — מה שהספר אינו, במקום שבו הוא רלוונטי. */}
            <p className="author-note__boundary">{authorNote.boundary}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
