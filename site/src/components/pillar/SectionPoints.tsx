/**
 * תת-מקטעים (H3) בתוך פרק של עמוד-אב.
 *
 * נועד למקרה אחד בלבד: פסקה שמונה כמה דברים נפרדים, שכל אחד מהם הוא באמת דבר
 * אחר שאפשר לעשות או לשים לב אליו. אז הכותרת אינה עיצוב אלא מבנה, והיררכיית
 * H2 → H3 מתארת נכון את מה שקורה בעמוד. לא להשתמש בו כדי „לשבור טקסט”.
 */
export function SectionPoints({
  points,
}: {
  points: readonly { readonly title: string; readonly body: string }[];
}) {
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
