import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { stations } from "@/content/book";

/**
 * "באיזו תחנה אתם נמצאים?" - שלוש נקודות פתיחה לאותו ספר ואותו מסע
 * (לפני קשר / מתחילים מחדש / בתוך קשר). מבהיר שמדובר בספר אחד עם רעיון
 * מאחד, וכל כרטיס מוביל לדף התחנה הייעודי שלו.
 *
 * PHASE 14: מסילת מסע אחת מחברת את שלוש התחנות למסלול יחיד — אופקית
 * בדסקטופ (RTL: נמשכת מימין לשמאל) ואנכית במובייל. המסילה דקורטיבית
 * (aria-hidden) ו-CSS-first; כל כרטיס נשאר קישור עצמאי ולחיץ.
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

        {/* מסילת המסע האופקית (דסקטופ) — שלוש תחנות על קו אחד */}
        <div aria-hidden="true" className="mt-12 hidden items-center md:flex">
          <span className="h-px flex-1" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span className="route-line h-px flex-[2] bg-border-strong" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span className="route-line h-px flex-[2] bg-border-strong" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
          <span className="h-px flex-1" />
        </div>

        <Reveal className="relative mt-7 grid gap-x-10 gap-y-11 md:mt-6 md:grid-cols-3">
          {/* מסילת המסע האנכית (מובייל) — עמוד שדרה שמחבר את התחנות */}
          <span
            aria-hidden="true"
            className="route-line--v absolute inset-y-2 start-[3px] w-px bg-border-strong md:hidden"
          />
          {stations.tracks.map((track, i) => (
            <Link
              key={track.id}
              href={track.href}
              className="group flex flex-col text-start ps-7 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand md:ps-0"
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
                <ArrowLeft className="edlink-arrow h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
