import Link from "next/link";

import { ShortAnswer } from "@/components/pillar/ShortAnswer";
import { CrossingRule } from "@/components/pillar/PillarSignature";

/**
 * ההירו של עמוד-אב, בקומפוזיציית „החצייה”.
 *
 * ── מה הבעיה שזה פותר ────────────────────────────────────────────────────
 * הקודם היה ערימה: כותרת, סימן, פסקה, פסקה. זה היה נקי, אבל נקי הוא לא
 * מותג — ובעיקר: הכותרת נקבעה ב-Heebo 700 בגודל 57.6px, כי `--font-quote`
 * מצביע על `--font-body`. סריף מעולם לא נכנס לכותרות. זו הסיבה האמיתית
 * ש„גדול, כבד ובלוקי”.
 *
 * ── הקומפוזיציה ──────────────────────────────────────────────────────────
 * שלוש שורות, וביניהן החצייה:
 *
 *     [ תווית + כותרת ]            [ פתיח ]
 *     ────────── החצייה חוצה את שתיהן ──────────
 *     [ גוף-פתיחה + ייחוס ]        [ בשורה אחת ]
 *
 * החצייה אינה מונחת ליד הטקסט — היא מפרידה בין שתי השורות ומחזיקה אותן.
 * מוציאים אותה, והקומפוזיציה מתפרקת. העמודה השנייה בשורה התחתונה מחזיקה את
 * „בשורה אחת”, ולכן אין חלל מת מתחת לקו: שתי השורות הן זוג א-סימטרי מלא.
 *
 * ── שני מצבים רגשיים, אותו DNA ───────────────────────────────────────────
 * /love מקבל משקל 400 וגובה-שורה נדיב — שקט, מיושב, „כבר נפגשנו”. /dating
 * מקבל 500 וגובה-שורה הדוק — מכוון, בתנועה. אותה משפחה, שני מצבים.
 *
 * ── מובייל ───────────────────────────────────────────────────────────────
 * אינו הדסקטופ מוערם: החצייה יוצאת מקצה לקצה (`-mx-6`) והופכת לאיפוס
 * חזותי אמיתי במסך הראשון, במקום להצטמק לסימן קטן.
 */
export function PillarHero({
  kicker,
  h1,
  lead,
  intro,
  byline,
  shortAnswer,
  tone,
}: {
  kicker: string;
  h1: string;
  lead: readonly string[];
  intro: string;
  byline: { prefix: string; name: string; href: string; role: string };
  shortAnswer: { label: string; body: string | readonly string[] };
  /** `"settled"` = /love (שקט), `"seeking"` = /dating (מכוון). */
  tone: "settled" | "seeking";
}) {
  const settled = tone === "settled";
  return (
    <div className="mx-auto max-w-5xl pt-2 sm:pt-6">
      {/* ── שורה עליונה: כותרת מול פתיח ─────────────────────────────── */}
      <div className="lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:items-end lg:gap-14">
        <div>
          <span className="kicker">{kicker}</span>
          <h1
            className={`type-literary mt-6 text-foreground ${
              settled ? "type-pillar-h1-settled" : "type-pillar-h1-seeking"
            }`}
          >
            {h1}
          </h1>
        </div>
        <div className="mt-8 lg:mt-0 lg:pb-1">
          {lead.map((line, i) => (
            <p
              key={line}
              className={`type-literary max-w-[40ch] text-[1.17rem] leading-[1.6] text-foreground sm:text-[1.3rem] ${
                i === 0 ? "" : "mt-4"
              }`}
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      {/* ── החצייה ───────────────────────────────────────────────────── */}
      <div className="-mx-6 my-10 sm:mx-0 sm:my-12">
        <CrossingRule variant={settled ? "joined" : "apart"} />
      </div>

      {/* ── שורה תחתונה: גוף-הפתיחה מול „בשורה אחת” ──────────────────── */}
      <div className="lg:grid lg:grid-cols-[1.06fr_0.94fr] lg:items-start lg:gap-14">
        <div>
          <p className="max-w-[54ch] text-[1.03rem] leading-[1.95] text-foreground sm:text-[1.05rem]">
            {intro}
          </p>
          {/* ייחוס נראה: מחבר הספר, עם קישור לעמוד המחבר. בונה אמון בלי תארים. */}
          <p className="mt-7 text-[13.5px] text-foreground-muted">
            {byline.prefix}{" "}
            <Link
              href={byline.href}
              className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              {byline.name}
            </Link>
            , {byline.role}
          </p>
        </div>
        <div className="mt-10 lg:mt-0">
          <ShortAnswer label={shortAnswer.label} body={shortAnswer.body} />
        </div>
      </div>
    </div>
  );
}
