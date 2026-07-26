import { siteConfig } from "@/config/site";
import { authorAudio } from "@/content/sample";
import { authorContent } from "@/content/author";

/**
 * „למה כתבתי את הספר הזה”.
 *
 * כל עוד אין קובץ שמע אמיתי (siteConfig.author.audioSrc ריק) — אין נגן ואין
 * placeholder; מוצגים הדברים בכתב בלבד, תחת כותרת אישית ומכובדת. רק כשמוזן
 * קובץ אמיתי מופיע נגן נטיבי נגיש עם preload="none" (טעינה עצלה), והטקסט
 * משמש כתמלול מלא. אין לייצר קול מלאכותי.
 */
export function AuthorAudio() {
  const src = siteConfig.author.audioSrc;

  return (
    <section aria-labelledby="author-audio-heading" className="mx-auto mt-16 max-w-[64ch]">
      {src ? <span className="kicker">{authorAudio.eyebrow}</span> : null}
      <h2
        id="author-audio-heading"
        className={`font-serif text-2xl font-semibold text-foreground${src ? " mt-4" : ""}`}
      >
        {authorAudio.title}
      </h2>

      {src ? (
        <div className="mt-5 rounded-3xl border border-border bg-surface-muted p-6 sm:p-7">
          <audio
            controls
            preload="none"
            className="w-full"
            aria-describedby="author-audio-transcript"
          >
            <source src={src} />
            הדפדפן שלכם אינו תומך בנגן השמע. אפשר לקרוא את הדברים למטה.
          </audio>
        </div>
      ) : null}

      <div
        id="author-audio-transcript"
        className="mt-6 flex flex-col gap-4 border-s-2 border-border ps-5"
      >
        {authorContent.fullBio.map((paragraph, index) => (
          <p key={index} className="text-[1.075rem] leading-[1.85] text-foreground/90">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
