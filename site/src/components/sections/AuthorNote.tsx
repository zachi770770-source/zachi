import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { SignatureMark } from "@/components/shared/SignatureMark";
import { authorNote } from "@/content/homeStory";

/**
 * הסיבה האנושית לתת אמון. קודם לכן עמוד הבית הכיל את המחבר רק כקישור בתוך
 * רצועת-אמון שתוכנה העיקרי היה גילוי נאות — כלומר הדבר היחיד שנאמר על צחי חן
 * היה מה שהוא *אינו*. כאן הוא אומר בעצמו למה כתב את הספר.
 *
 * הטקסט הוא `authorContent.fullBio` כלשונו — נוסח מאושר ששמור מפני ייחוס
 * הכשרה/מקצוע טיפולי (ראו author.test.ts ו-`authorNote` ב-homeStory).
 * משפט-הגבול נשמר מרצועת-האמון שהוסרה, אך עכשיו הוא יושב במקום הנכון: לצד
 * האדם, לא במקומו.
 */
export function AuthorNote() {
  return (
    <section aria-labelledby="author-note-heading" className="py-8 sm:py-14">
      <Container>
        <div className="reveal mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-6 sm:p-9">
          {/* בלי קיקר: „מי כתב את זה” והכותרת „למה כתבתי את…” תייגו את אותו
              דבר בדיוק, בזו אחר זו. הכותרת מספיקה. */}
          <h2
            id="author-note-heading"
            className="font-serif text-[clamp(1.35rem,2.4vw,1.75rem)] font-bold leading-snug text-foreground [text-wrap:balance]"
          >
            {authorNote.title}
          </h2>
          {authorNote.body.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-4 text-[clamp(1.02rem,1.4vw,1.15rem)] leading-[1.7] text-foreground/90 [text-wrap:pretty]"
            >
              {paragraph}
            </p>
          ))}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <SignatureMark />
              <span className="font-serif text-[16px] font-semibold text-foreground">
                {authorNote.signature}
              </span>
            </div>
            <Link
              href="/author"
              className="group inline-flex min-h-[44px] items-center gap-2 text-[15px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {authorNote.linkLabel}
              <ArrowLeft
                className="h-4 w-4 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          {/* הגבול נשאר מפורש — מה שהספר אינו, במקום שבו הוא רלוונטי. */}
          <p className="mt-4 text-[13.5px] leading-snug text-foreground-muted">
            {authorNote.boundary}
          </p>
        </div>
      </Container>
    </section>
  );
}
