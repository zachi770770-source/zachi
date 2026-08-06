import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { stations as stationContent } from "@/content/stations";
import { stations as bookStations } from "@/content/book";

/**
 * אזור קומפקטי אחד: „שלוש תחנות ושער מעבר אחד” — ארבעה כרטיסים קצרים, משפט אחד
 * וקישור בכל כרטיס אל דף התחנה הייעודי. כל הטקסטים לקוחים ממקור-האמת של דפי
 * התחנות (src/content/stations.ts) — ללא תוכן חדש. הכרטיס הרביעי הוא „שער מעבר”
 * (אחרי פרידה), ומסומן ככזה. מחליף את בורר-הפרסונות ואת מקטע ה„שאל את הספר”
 * שהיו כאן: הבית קצר יותר, שער-סריקה בלבד.
 */
const CARDS = [
  { id: "before-relationship", gate: false, linkLabel: "לתחנה" },
  { id: "building-relationship", gate: false, linkLabel: "לתחנה" },
  { id: "inside-relationship", gate: false, linkLabel: "לתחנה" },
  { id: "after-breakup", gate: true, linkLabel: "לשער המעבר" },
] as const;

export function HomeStations() {
  return (
    <section
      id="stations"
      className="scroll-mt-20 py-14 sm:py-16"
      aria-labelledby="stations-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker justify-center">{bookStations.eyebrow}</span>
          <h2 id="stations-heading" className="type-h2 mt-4">
            שלוש תחנות ושער מעבר אחד
          </h2>
          <p className="type-lead mt-4 text-foreground-muted [text-wrap:pretty]">
            {bookStations.intro}
          </p>
        </Reveal>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          {CARDS.map(({ id, gate, linkLabel }) => {
            const s = stationContent[id];
            return (
              <Link
                key={id}
                href={`/${id}`}
                className="reveal group flex flex-col rounded-2xl border border-border bg-surface p-6 text-start transition-colors hover:border-brand/40 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {gate ? (
                  <span className="mb-2 inline-flex w-fit items-center rounded-full bg-brand px-2.5 py-0.5 text-[12px] font-semibold text-brand-foreground">
                    {s.eyebrow}
                  </span>
                ) : null}
                <h3 className="font-serif text-[1.2rem] font-semibold text-foreground">
                  {s.navLabel}
                </h3>
                <p className="mt-2 text-[15.5px] leading-relaxed text-foreground-muted [text-wrap:pretty]">
                  {s.lead}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand-hover">
                  {linkLabel}
                  <ArrowLeft
                    className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
