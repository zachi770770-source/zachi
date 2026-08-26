import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getJourneyFlow } from "@/content/journeyFlow";
import type { JourneyPage as JourneyPageData } from "@/content/journeyPages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * בלוק המשך-המסע — הצעד קדימה במסלול הראשי, מוצג *לפני* אזורי-ההעמקה (מדריכים,
 * מושגים, אמזון) כך שהוא נקרא כהמשך המסע ולא כעוד קישור צדדי. מונע hard-code:
 * התוכן נגזר מ-`getJourneyFlow` (מקור-אמת אחד) לפי תפקיד העמוד:
 *
 *  advance  (לפני/מתחילים) — „התחנה הבאה: …” כפעולה ראשית + קישור-קודם שקט.
 *  complete (בתוך קשר)     — סיום המסלול באתר (לא תחנה 4, בלי gamification).
 *  gateway  (אחרי פרידה)   — שתי אפשרויות שקטות ושוות: להישאר/להעמיק, או לעבור.
 *  bridge   (מתחילים מחדש) — חזרה למסלול „לפני קשר”, עם ניסיון — לא מאפס.
 *
 * הפעולה הראשית משתמשת ברכיב Button (וריאנט ראשי = דיו/פחם), כדי שהטרקוטה
 * תישאר accent בלבד — עקבי עם שאר המסע.
 */
export function JourneyNext({ journey }: { journey: JourneyPageData }) {
  const flow = getJourneyFlow(journey.id);
  const previewHref = `/preview?tool=${journey.sampleTool}&station=${journey.sampleStation}`;

  // „complete” הוא *סיום* המסלול, לא צעד: מוצג כאמירה שקטה בין קווי-שׂיא (בלי
  // קופסה/כפתור), כדי שלא ייקרא כעוד card ברשימה. שאר התפקידים נשארים card של
  // המשך-מסע, עם „המשך המסע” ככותרת-על.
  const isComplete = flow.role === "complete";

  return (
    <section
      aria-labelledby="journey-next-heading"
      className={cn(
        "reveal",
        isComplete
          ? "border-y border-border-strong py-12 text-center sm:py-14"
          : "rounded-3xl border border-border bg-surface-muted/40 px-6 py-9 sm:px-10 sm:py-11",
      )}
    >
      <span className={cn("kicker", isComplete && "justify-center")}>
        {isComplete ? "סוף המסלול" : "המשך המסע"}
      </span>

      {flow.role === "advance" && flow.next ? (
        <div className="mt-3">
          <h2
            id="journey-next-heading"
            className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
          >
            התחנה הבאה: {flow.next.label}
          </h2>
          <div className="mt-5">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/${flow.next.id}`}>
                להמשיך אל „{flow.next.label}”
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          {flow.prev ? (
            <p className="mt-5 text-[14px] text-foreground-muted [text-wrap:pretty]">
              רוצים לחזור צעד אחורה?{" "}
              <Link
                href={`/${flow.prev.id}`}
                className="font-medium underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                חזרה אל „{flow.prev.label}”
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {flow.role === "complete" ? (
        <div className="mt-3">
          <h2
            id="journey-next-heading"
            className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
          >
            הגעתם לסוף המסלול באתר
          </h2>
          <div className="mx-auto mt-4 flex max-w-[54ch] flex-col gap-3 text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
            <p>
              זו התחנה השלישית, וזה סוף המסלול שאפשר ללכת כאן, באתר. אין תחנה
              רביעית שממתינה — לא כי „סיימתם”, אלא כי מכאן העבודה עוברת אל הקשר
              עצמו.
            </p>
            <p>
              זה לא סוף העבודה הזוגית. קשר טוב ממשיך להיבנות שוב ושוב, הרבה אחרי
              העמוד הזה — בבחירה חוזרת, ביום-יום, ובשיחות שממשיכות.
            </p>
          </div>
          {/* תמצית-המסע כטקסט בלבד — לא trophy, לא confetti, לא ניקוד. */}
          <p className="mt-5 type-literary text-[1.0625rem] font-medium text-brand-hover [text-wrap:balance]">
            המסע כאן עבר מבחירה, אל התחלה, אל בנייה: לפני קשר → מתחילים קשר → בתוך
            קשר.
          </p>
          {flow.prev ? (
            <p className="mt-5 text-[14px] text-foreground-muted [text-wrap:pretty]">
              רוצים לחזור צעד אחורה?{" "}
              <Link
                href={`/${flow.prev.id}`}
                className="font-medium underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                חזרה אל „{flow.prev.label}”
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {flow.role === "gateway" && flow.bridge ? (
        <div className="mt-3">
          <h2
            id="journey-next-heading"
            className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
          >
            אין כאן כיוון אחד נכון
          </h2>
          <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
            זו תחנת מעבר. אפשר להישאר עוד עם מה שכאן ולתת לעצמכם זמן לעבד, ואפשר,
            אם וכשזה מרגיש נכון, להעיף מבט קדימה. שתי האפשרויות בסדר גמור.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={previewHref}
              className="group inline-flex items-center gap-2 text-[1.0625rem] font-medium text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:pretty]"
            >
              להישאר כאן ולהעמיק בקטע הקריאה של התחנה הזו
              <ArrowLeft
                className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
            <Link
              href={`/${flow.bridge.id}`}
              className="group inline-flex items-center gap-2 text-[1.0625rem] font-medium text-foreground underline-offset-4 hover:text-brand-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand [text-wrap:pretty]"
            >
              להעיף מבט אל „{flow.bridge.label}”, בקצב שלכם
              <ArrowLeft
                className="h-4 w-4 shrink-0 text-brand transition-transform group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      ) : null}

      {flow.role === "bridge" && flow.bridge ? (
        <div className="mt-3">
          <h2
            id="journey-next-heading"
            className="font-serif text-[clamp(1.5rem,2.4vw,2.05rem)] font-bold leading-[1.15] text-foreground [text-wrap:balance]"
          >
            חזרה למסלול: {flow.bridge.label}
          </h2>
          <p className="mt-4 max-w-[54ch] text-[1.0625rem] leading-relaxed text-foreground/90 [text-wrap:pretty]">
            החזרה אל הבחירה אינה התחלה מאפס. אתם חוזרים אל המסע עם מה שכבר עברתם,
            עם ניסיון והבחנות חדשות — ומהן אפשר לבחור אחרת בפעם הבאה.
          </p>
          <div className="mt-6">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href={`/${flow.bridge.id}`}>
                להמשיך אל „{flow.bridge.label}”
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
