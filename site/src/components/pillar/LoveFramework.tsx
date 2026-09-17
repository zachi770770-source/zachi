import { love } from "@/content/love";

/**
 * „איך אהבה נבנית, לפי הסדר” — הנכס הציטוטי של ‎/love‎.
 *
 * ── למה זה קיים ───────────────────────────────────────────────────────────
 * התוצאות המובילות לשאילתה „אהבה” בעברית מתחלקות לשלוש: מילונים (מילוג,
 * ויקימילון) שאומרים *מה המילה אומרת*, אנציקלופדיות והגות (ויקיפדיה, אתרי
 * יהדות) שאומרות *מה המושג אומר*, ומדורי יחסים שמספרים *סיפורים*. אף אחת
 * מהן אינה עונה על „איך זה נבנה בפועל, ובאיזה סדר”.
 *
 * זה הפער, וזה הדבר היחיד בעמוד שיש סיבה עניינית לצטט אותו. עורך שכותב על
 * אהבה יכול לקחת הגדרה מכל מקום; שרשרת עם סדר פנימי — לא.
 *
 * ── למה זה ‎<ol>‎ ולא תמונה ────────────────────────────────────────────────
 * הסדר הוא התוכן, ולכן הוא צריך להיות סדר גם במבנה ולא רק בפיקסלים: רשימה
 * מסודרת של שישה שלבים, טקסט אמיתי, ניתנת להעתקה, לקריאה בקורא-מסך
 * ולאינדוקס. תרשים כתמונה היה נראה דומה ולא היה ניתן לציטוט.
 *
 * ── האמת של הציטוטים ─────────────────────────────────────────────────────
 * כל שורת-ציטוט נשלפת ב-`love.framework` מהמקור המאושר (מאגר-הציטוטים או
 * קטע-המבוא) ואינה מועתקת. אין כאן ניסוח חדש שמיוחס לספר.
 */
export function LoveFramework() {
  const { framework } = love;
  return (
    <section
      aria-labelledby="love-framework-heading"
      className="mx-auto w-full max-w-4xl rounded-3xl border border-brand/15 bg-brand-muted/25 px-5 py-9 sm:px-9 sm:py-12"
    >
      <span className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
        {framework.kicker}
      </span>
      <h2
        id="love-framework-heading"
        className="type-section mt-3 font-serif text-foreground [text-wrap:balance]"
      >
        {framework.title}
      </h2>
      <p className="mt-3 max-w-[58ch] text-[1.03rem] leading-[1.8] text-foreground-muted">
        {framework.lead}
      </p>

      {/* המסלול: קו רציף שעליו יושבים השלבים. אותה שפה של „החצייה” שכבר
          קיימת בעמודי-האב, בקנה-מידה של רשימה. */}
      <ol
        className="relative mt-9 space-y-7"
        style={{ ["--rail" as string]: "1.5rem", paddingInlineStart: "var(--rail)" }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-2 start-0 w-px"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-sage-ink) 42%, transparent)",
          }}
        />
        {framework.steps.map((step, i) => (
          <li key={step.name} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-[0.55em] h-[7px] w-[7px] rounded-full bg-brand"
              style={{
                insetInlineStart: "calc(var(--rail) * -1 - 3.5px)",
                marginTop: "-3.5px",
              }}
            />
            <h3 className="type-literary text-[clamp(1.15rem,2.1vw,1.45rem)] font-medium leading-[1.35] text-foreground">
              <span className="me-2 text-[0.72em] font-semibold text-brand-hover">
                {i + 1}
              </span>
              {step.name}
            </h3>
            <p className="mt-1.5 max-w-[52ch] text-[0.99rem] leading-[1.8] text-ink-soft">
              {step.note}
            </p>
            {/* הציטוט מהספר — מילה במילה מהמקור המאושר. */}
            <blockquote className="mt-2.5 border-s-2 border-brand/40 ps-4 text-[1rem] leading-[1.7] text-foreground [text-wrap:pretty]">
              {step.quote}
            </blockquote>
          </li>
        ))}
      </ol>

      <p className="mt-9 text-[0.95rem] leading-relaxed text-foreground-muted">
        השלבים והציטוטים מתוך „מדייטים לאהבה” מאת צחי חן.
      </p>
    </section>
  );
}
