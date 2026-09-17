import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import type { JourneyStation } from "@/content/guideIndex";

/**
 * ציר-המסע: „דייטים → היכרות → בניית קשר → זוגיות → אהבה”.
 *
 * זה הנכס העריכתי של /guide, ומה שהופך אותו מספריית-קישורים לעמוד שאפשר לנחות
 * עליו ישירות מגוגל ולצאת ממנו עם כיוון. הוא עונה על שלוש שאלות בזו אחר זו:
 * איפה אני עכשיו, מה האתגר כאן, ומה לקרוא הלאה.
 *
 * למה זה מזהה טוב יותר מרשימת שלבים: כל תחנה מוצגת דרך *האתגר* שלה ולא דרך
 * ההגדרה שלה. איש אינו מחפש „שלב בניית קשר”, אבל הרבה אנשים מזהים מיד את
 * „כבר לא סתם יוצאים, עדיין לא בדיוק ביחד”.
 *
 * ביצועים ונגישות לזחילה: אין כאן שום JavaScript. הרצף מצויר ב-CSS (עיגול
 * ממוספר + קו מקשר), הכול מרונדר בשרת, וכל הטקסט והקישורים נמצאים ב-HTML.
 * `<ol>` כי לתחנות יש סדר אמיתי.
 */
export function JourneySpine({
  title,
  lead,
  stations,
  aside,
  asideLink,
}: {
  title: string;
  lead: string;
  stations: readonly JourneyStation[];
  aside?: string;
  asideLink?: { readonly href: string; readonly label: string };
}) {
  return (
    <section aria-labelledby="journey-heading" className="scroll-mt-24">
      <h2 id="journey-heading" className="type-section font-serif text-foreground">
        {title}
      </h2>
      <p className="mt-3 max-w-[60ch] text-[1.05rem] leading-relaxed text-foreground-muted">
        {lead}
      </p>

      <ol className="mt-8">
        {stations.map((st, i) => (
          <li key={st.id} className="relative flex gap-4 pb-8 last:pb-0">
            {i < stations.length - 1 ? (
              <span
                aria-hidden="true"
                className="absolute top-10 bottom-0 start-[19px] w-px bg-border"
              />
            ) : null}
            <span
              aria-hidden="true"
              className="relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-serif text-[15px] font-semibold text-brand"
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-1">
              <h3 className="font-serif text-[1.18rem] font-semibold text-foreground">
                <Link
                  href={st.href}
                  className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {st.name}
                </Link>
              </h3>
              <p className="mt-1.5 max-w-[58ch] text-[1.01rem] leading-[1.8] text-foreground-muted">
                {st.what}
              </p>
              {/* האתגר — המשפט שבו הקורא מזהה את עצמו. מודגש כי זו נקודת הכניסה. */}
              <p className="mt-2 max-w-[58ch] text-[1.01rem] leading-[1.8] text-foreground">
                <span className="text-foreground-muted">האתגר כאן: </span>
                {st.challenge}
              </p>
              {st.start ? (
                <Link
                  href={st.start.href}
                  className="group mt-2.5 inline-flex items-center gap-2 text-[14.5px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  להתחיל כאן: {st.start.label}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </Link>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {aside && asideLink ? (
        <p className="mt-2 max-w-[60ch] text-[1.01rem] leading-relaxed text-foreground-muted">
          {aside}{" "}
          <Link
            href={asideLink.href}
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {asideLink.label}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
