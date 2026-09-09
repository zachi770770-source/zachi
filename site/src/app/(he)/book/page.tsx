import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { siteConfig } from "@/config/site";
import { bigIdea } from "@/content/book";
import { pageMetadata } from "@/lib/seo";
import { Container } from "@/components/shared/Container";
import { DeeperEntry } from "@/components/shared/DeeperEntry";
import { BookCover } from "@/components/shared/BookCover";
import { BookTilt } from "@/components/shared/BookTilt";
import { BookLink } from "@/components/shared/BookLink";
import { ThesisSection } from "@/components/sections/ThesisSection";
import { PeekInside } from "@/components/preview/PeekInside";
import { AudienceSection } from "@/components/sections/AudienceSection";
import { MethodSection } from "@/components/sections/MethodSection";
import { ToolsBento } from "@/components/sections/ToolsBento";
import { OutcomesSection } from "@/components/sections/OutcomesSection";
import { PurchaseSection } from "@/components/sections/PurchaseSection";
import { ReaderKitOffer } from "@/components/reader/ReaderKitOffer";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { BookSchema } from "@/components/schema/BookSchema";
import { ViewEvent } from "@/components/analytics/ViewEvent";
import { BuildSpine } from "@/components/shared/BuildSpine";

export const metadata = pageMetadata({
  title: "ספר זוגיות: מדריך מעשי לדייטינג ולבניית קשר",
  description: `מדריך מעשי לזוגיות ולדייטינג: כל מה שיש ב${siteConfig.bookTitle}, למי הספר מיועד, השיטה, מבנה הספר, הכלים המעשיים לבניית קשר, ומה משתנה אחרי הקריאה.`,
  path: "/book",
  ogType: "article",
});

/**
 * עמוד הספר לעומק. עמוד הבית הוא שער מהיר לסריקה; כאן מרוכז הפירוט המלא
 * שהיה פזור בו: הרקע לכתיבת הספר, למי הוא מיועד, השיטה, מבנה הספר והכלים,
 * התוצאות, ולסיום כרטיס המהדורות. אין כפילות עם הבית — התוכן הזה מוצג
 * כאן בלבד, והבית מקשר לכאן.
 */
export default function BookPage() {
  return (
    <>
      {/* מדידה (Phase A) — צפייה בעמוד הספר, פעם אחת. */}
      <ViewEvent event="book_viewed" />
      {/* קו-הקריאה: /book הוא העמוד הארוך באתר (~9,000px), והתנועה היחידה
          שהייתה בגופו היא חשיפת-סקשן גנרית חוזרת. הפס הזה נותן לתנועה תפקיד
          אמיתי — התמצאות: „כמה נשאר”. אינו רכיב חדש אלא אותו BuildSpine
          המאושר שכבר משרת את עמוד-הבית: דסקטופ בלבד, aria-hidden,
          ומכובד תחת reduced-motion (הרכיב יוצא מוקדם וה-CSS מסתיר אותו). */}
      <BuildSpine />
      {/* עמוד הספר הקנוני נושא את סכימת ה-Book (בנוסף לבית) — הישות המבנית
          מופיעה על ה-URL הייעודי של המוצר. */}
      <BookSchema />
      <BreadcrumbSchema
        items={[
          { name: "בית", path: "/" },
          { name: "הספר", path: "/book" },
        ]}
      />

      <header className="border-b border-border bg-surface-muted">
        <Container className="py-9 sm:py-11 lg:py-12">
          {/* לא Reveal: תוכן ה-Hero המרכזי (כותרת/מיצוב/CTA) נקרא מיד — בלי
              „שער” גלילה שמשאיר את הפתיח כמעט ריק. תנועת-הכניסה של הכריכה
              (book-hero-enter) ממשיכה כתנועה תומכת בלבד. */}
          <div className="mx-auto max-w-3xl text-center">
            {/* עוגן המעבר „כניסה לספר” + מוקד עריכתי: הכריכה מכובדת אך מרוסנת —
                גובה ה-Hero מצומצם כדי שהכותרת, המיצוב וה-CTA יהיו מעל הקיפול.
                העטיפה נמשכת לכאן מנקודת המקור בבית. */}
            <div className="book-hero-enter relative mx-auto mb-6 w-[168px] sm:w-[200px] lg:w-[224px]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-secondary/[0.18] blur-3xl"
              />
              {/* צל נחיתה שמתרחב ומתיישב יחד עם כניסת הכריכה (עומק מוצר) */}
              <div
                aria-hidden="true"
                className="book-hero-enter__shadow pointer-events-none absolute -bottom-6 start-1/2 h-12 w-[78%] -translate-x-1/2 rounded-[50%] bg-[color:var(--color-ink)]/25 blur-2xl"
              />
              {/* #6 המשכיות אובייקט: הכריכה גם יעד (בהגעה מהבית) וגם מקור (ביציאה
                  אל /preview) — אותו ספר „ממשיך” הלאה, ללא כריכה כפולה. */}
              <div data-vt-book-dest data-vt-book-source className="w-full">
                <BookTilt><BookCover priority /></BookTilt>
              </div>
            </div>
            <span className="kicker justify-center">הספר לעומק</span>
            <h1 className="type-h1 mt-4">ספר זוגיות: מה יש בו ואיך הוא עובד</h1>
            {/* שורת זהות-ישות — שם הספר + המחבר + הקטגוריה, כדי שאדם/מנוע-חיפוש/
                מערכת אחזור-AI יזהו מיד: „מדייטים לאהבה מאת צחי חן — ספר על
                דייטינג, בחירת בן/בת זוג ובניית קשר”. השם והמחבר מ-config; מונחי
                הקטגוריה נתמכים בתוכן קיים („לבחור בן או בת זוג” —
                /guide/choosing-a-partner; „אהבה היא בנייה” / „בניית קשר” —
                tagline ו-/guide). בלי טענה חדשה או מילות-מפתח כפויות. */}
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-foreground-muted">
              <span className="font-semibold text-foreground">
                {siteConfig.bookTitle}
              </span>{" "}
              מאת {siteConfig.author.name}, מדריך מעשי לדייטינג, לבחירת בן או בת
              זוג ולבניית קשר זוגי.
            </p>
            {/* מיצוב: לא ספר חד-פעמי אלא מלווה לאורך כל המסע הזוגי (ללא טענה
                השוואתית — לא „היחיד” / „הראשון מסוגו”). */}
            <p className="mt-4 font-serif text-[19px] font-semibold leading-snug text-brand-hover">
              לא ספר שקוראים פעם אחת, אלא ספר שחוזרים אליו לאורך המסע הזוגי.
            </p>
            {/* ה-CTA הראשי מיד אחרי המיצוב — כדי שיהיה מעל הקיפול בדסקטופ. הפסקאות
                התיאוריות (תיאור + נקודת האיזון) מגיעות אחריו כפירוט תומך. */}
            <BookLink
              href="/preview"
              morphCover
              className="group mt-5 inline-flex items-center gap-2 text-[16px] font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              קראו טעימה מהספר
              <ArrowLeft
                className="h-4 w-4 transition-transform group-hover:-translate-x-1.5 group-focus-visible:-translate-x-1.5"
                aria-hidden="true"
              />
            </BookLink>
            <p className="type-lead mt-6 text-foreground-muted">
              {siteConfig.description}
            </p>
            {/* נקודת האיזון של הגישה, הועברה לכאן מהשער כדי לשמור על עמוד בית חיובי. */}
            <p className="mx-auto mt-5 max-w-[60ch] text-[15px] leading-relaxed text-foreground-muted">
              {bigIdea.clarification}
            </p>
            <p className="mx-auto mt-4 max-w-[60ch] text-[14px] italic text-foreground-muted">
              לפני שמחליטים, כדאי לראות את התמונה כולה.
            </p>
            {/* דלת-הכלי ירדה מכאן. היא הופיעה בשליש העליון של עמוד-המוצר,
                לפני שהמבקר קרא מה הספר בכלל אומר, וכפלה את אותה דלת שכבר
                קיימת בעמוד הבית. הכלי נגיש מתחת לכרטיס-הרכישה ומהפוטר. */}
          </div>
        </Container>
      </header>

      {/* ── קשת עמוד-המוצר: החלטה קודם, לימוד אחר-כך ─────────────────────
          נמדד לפני: 11,224px בדסקטופ (12.5 מסכים) ו-13,030px במובייל (15.4),
          עם כרטיס-הרכישה ב-90% מהעמוד ו-12 קישורים יוצאים לעמודי-מושג *לפני*
          ההחלטה. עמוד-מוצר שמלמד 8,000px ואז מבקש לקנות מבקש מהמבקר לעבוד
          לפני שנתן לו סיבה.

          עכשיו: רעיון → למי → השיטה → מה משתנה → טעימה → **רכישה** → כלים →
          העמקה. כל מה שהוא חומר-החלטה נמצא מעל הכרטיס; כל מה שהוא חומר-לימוד
          נמצא מתחתיו.

          מה יצא לגמרי: `AttachmentSection` עבר אל /guide/attachment-styles —
          עמוד-החיפוש הקנוני של הנושא, שכבר היה מקושר מכאן. לא נוצר מסלול חדש,
          לא שוכפל תוכן, ולא אבד דבר. */}
      <ThesisSection />
      <AudienceSection />
      <MethodSection />
      <OutcomesSection />

      {/* הצעד שלפני ההחלטה: קטע אמיתי מהספר, ביד. */}
      <Container>
        <PeekInside />
      </Container>
      {/* נקודת-ערך אחת לפני הכרטיס — קישור בלבד, בלי CTA-אמזון מתחרה. */}
      <Container className="pb-4">
        <ReaderKitOffer variant="link" />
      </Container>

      {/* ── ההחלטה ── */}
      <PurchaseSection />

      {/* ── מתחת להחלטה: חומר-לימוד ── ששת הכלים נשארים כאן: הם *הספר*, לא
          רקע תיאורטי, ויש להם עוגני-deep-link מהמצפן וממקומות אחרים. הם רק
          אינם עומדים יותר בין המבקר לבין הכרטיס. */}
      <ToolsBento />

      {/* שני בלוקי-הדפוסים („למה אנחנו חוזרים שוב ושוב לאותו מקום?” ו„הריקוד
          שאף אחד לא בחר בו”) עברו אל /guide/attachment-styles — עמוד-החיפוש
          הקנוני של הנושא, שהיה ממילא יעד-ההעמקה מכאן. במקומם נשאר קישור אחד:
          כוונת-החיפוש והקישור-הפנימי נשמרו, התוכן לא שוכפל ולא אבד, ו-2,000px
          של חומר-לימוד יצאו ממסלול-הרכישה. */}
      <Container className="pb-16">
        <p className="mx-auto max-w-2xl text-center text-[15.5px] leading-relaxed text-foreground-muted">
          רוצים להבין מה חוזר מתחת לפני השטח?{" "}
          <Link
            href="/guide/attachment-styles"
            className="font-semibold text-brand-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            דפוסים חוזרים בזוגיות: מה מניע אותם, וסגנונות ההתקשרות שמאחוריהם
          </Link>
        </p>
        <div className="mt-10">
          <DeeperEntry />
        </div>
      </Container>
    </>
  );
}
