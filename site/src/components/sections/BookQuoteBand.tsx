import { Container } from "@/components/shared/Container";
import { Reveal } from "@/components/shared/Reveal";
import { bigIdea } from "@/content/book";

/**
 * ציטוט קצר מתוך הספר בשליש העליון של העמוד. זהו קול אמיתי מתוך הספר,
 * מסומן במפורש „מתוך הספר” — לא המלצת קורא, לא דירוג ולא נתון מומצא.
 * (אין המלצות אמיתיות עדיין; כשיהיו, הן יוצגו דרך רכיב ההמלצות הקיים.)
 */
export function BookQuoteBand() {
  return (
    <section className="py-4 sm:py-6" aria-label="ציטוט מתוך הספר">
      <Container>
        <Reveal className="mx-auto max-w-3xl border-y border-border py-8 text-center sm:py-10">
          <p className="font-quote text-[clamp(1.35rem,3vw,1.9rem)] font-medium italic leading-[1.4] text-balance text-foreground">
            „{bigIdea.intro}”
          </p>
          <p className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-brand-hover">
            מתוך הספר
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
