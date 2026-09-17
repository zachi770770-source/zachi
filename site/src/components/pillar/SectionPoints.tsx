/**
 * תת-מקטעים (H3) בתוך פרק של עמוד-אב.
 *
 * נועד למקרה אחד בלבד: פסקה שמונה כמה דברים נפרדים, שכל אחד מהם הוא באמת דבר
 * אחר שאפשר לעשות או לשים לב אליו. אז הכותרת אינה עיצוב אלא מבנה, והיררכיית
 * H2 → H3 מתארת נכון את מה שקורה בעמוד. לא להשתמש בו כדי „לשבור טקסט”.
 */
export function SectionPoints({
  points,
  variant = "list",
}: {
  points: readonly { readonly title: string; readonly body: string }[];
  /**
   * `"list"` — ברירת המחדל: תת-מקטעים בזה אחר זה עם קו-צד אחד.
   *
   * `"cards"` — אותם תת-מקטעים בדיוק, בפריסת כרטיסים. משמש במקטע אחד או שניים
   * לכל עמוד-אב, כנקודת-נשימה באמצע קריאה ארוכה: כשכל מקטע נראה כמו הקודם
   * (כותרת → פסקאות → קישור), העמוד מתחיל להרגיש כמו מאמר ארוך מאוד ולא כמו
   * עמוד-סמכות. לא להפוך את זה לברירת מחדל — רשת כרטיסים חוזרת תיצור בדיוק
   * את אותה בעיה בכיוון ההפוך.
   *
   * התוכן זהה בשני המצבים, וגם ההיררכיה (H3): זהו שינוי פריסה בלבד.
   */
  variant?: "list" | "cards";
}) {
  if (variant === "cards") {
    return (
      // נשבר לעמודה אחת במובייל; שתיים מ-sm; שלוש מ-lg. פריט חמישי/שישי
      // פשוט ממשיך לשורה הבאה, בלי „חור” בפריסה.
      // `items-stretch` + `h-full` — כל הכרטיסים בשורה מקבלים את אותו גובה גם
      // כשהטקסט שלהם באורך שונה. בלי זה כרטיס קצר „תלוי” גבוה משכניו, וזה
      // הדבר שהכי מסגיר רשת שלא עוצבה.
      <ul className="mt-7 grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {points.map((p) => (
          <li key={p.title} className="h-full">
            <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-[22px] sm:p-6">
              <h3 className="font-serif text-[1.06rem] font-semibold leading-snug text-foreground">
                {p.title}
              </h3>
              <p className="mt-2.5 text-[1rem] leading-[1.8] text-foreground-muted">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="mt-6 space-y-5 border-s border-border ps-5">
      {points.map((p) => (
        <div key={p.title}>
          <h3 className="font-serif text-[1.08rem] font-semibold text-foreground">{p.title}</h3>
          <p className="mt-1.5 max-w-[60ch] text-[1.01rem] leading-[1.8] text-foreground-muted">
            {p.body}
          </p>
        </div>
      ))}
    </div>
  );
}
