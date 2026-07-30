import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { stations } from "@/content/book";

/**
 * "באיזו תחנה אתם נמצאים?" - שלוש נקודות פתיחה לאותו ספר ואותו מסע
 * (לפני קשר / מתחילים מחדש / בתוך קשר). מבהיר שמדובר בספר אחד עם רעיון
 * מאחד, וכל כרטיס מוביל לדף התחנה הייעודי שלו.
 */
export function StationsSection() {
  return (
    <section
      id="stations"
      className="scroll-mt-20 py-14 sm:py-16"
      aria-labelledby="stations-heading"
    >
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="kicker">{stations.eyebrow}</span>
          <h2 id="stations-heading" className="type-h2 mt-4">
            {stations.title}
          </h2>
          <p className="type-lead mt-5 text-foreground-muted">{stations.intro}</p>
        </Reveal>

        <Reveal className="mt-12 grid gap-x-10 gap-y-11 md:grid-cols-3">
          {stations.tracks.map((track, i) => (
            <Link
              key={track.id}
              href={track.href}
              className="group flex flex-col text-start focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand md:border-s md:border-border md:ps-8 md:first:border-s-0 md:first:ps-0"
            >
              <span
                aria-hidden="true"
                className="font-serif text-[2.5rem] font-bold leading-none text-foreground-muted [font-variant-numeric:tabular-nums]"
              >
                {`0${i + 1}`}
              </span>
              <h3 className="mt-4 font-serif text-2xl font-semibold text-foreground transition-colors group-hover:text-brand-hover">
                {track.title}
              </h3>
              <p className="mt-3 flex-1 text-[17px] leading-relaxed text-foreground-muted">
                {track.description}
              </p>
              <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-brand transition-colors group-hover:text-brand-hover">
                {track.linkLabel}
                <ArrowLeft
                  className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
