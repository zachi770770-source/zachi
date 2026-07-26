import { FileText } from "lucide-react";

import { siteConfig } from "@/config/site";
import { authorAudio } from "@/content/sample";
import { authorContent } from "@/content/author";

/**
 * „למה כתבתי את הספר הזה” — רכיב השמע של המחבר.
 *
 * הרכיב כולו (כותרת, נגן ותמלול) מוצג אך ורק כאשר קיים קובץ שמע אמיתי
 * (siteConfig.author.audioSrc). כל עוד אין קובץ — הרכיב אינו מרונדר כלל,
 * כדי לא לחזור על סיפור המחבר שכבר מופיע בגוף העמוד. אין לייצר קול מלאכותי.
 *
 * כשמוזן קובץ: נגן נטיבי נגיש עם preload="none" (טעינה עצלה), והתמלול המלא
 * נמצא בתוך <details> נגיש („לקריאת התמלול”) כדי שלא ייצור כפילות חזותית.
 */
export function AuthorAudio() {
  const src = siteConfig.author.audioSrc;
  if (!src) return null;

  return (
    <section aria-labelledby="author-audio-heading" className="mx-auto mt-16 max-w-[64ch]">
      <span className="kicker">{authorAudio.eyebrow}</span>
      <h2
        id="author-audio-heading"
        className="mt-4 font-serif text-2xl font-semibold text-foreground"
      >
        {authorAudio.title}
      </h2>

      <div className="mt-5 rounded-3xl border border-border bg-surface-muted p-6 sm:p-7">
        <audio
          controls
          preload="none"
          className="w-full"
          aria-describedby="author-audio-transcript"
        >
          <source src={src} />
          הדפדפן שלכם אינו תומך בנגן השמע. אפשר לקרוא את התמלול למטה.
        </audio>
      </div>

      <details className="group mt-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md py-2 text-[15px] font-semibold text-brand underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
          <FileText className="h-4 w-4" aria-hidden="true" />
          {authorAudio.transcriptToggle}
        </summary>
        <div
          id="author-audio-transcript"
          className="mt-3 flex flex-col gap-4 border-s-2 border-border ps-5"
        >
          {authorContent.fullBio.map((paragraph, index) => (
            <p key={index} className="text-[1.05rem] leading-[1.8] text-foreground/90">
              {paragraph}
            </p>
          ))}
        </div>
      </details>
    </section>
  );
}
