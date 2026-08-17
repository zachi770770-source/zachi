import { cn } from "@/lib/utils";

/**
 * הסימן החתום של „מדייטים לאהבה” — „מחיפוש לבנייה”.
 *
 * המותג במשפט אחד: „דייטינג הוא חיפוש. אהבה היא בנייה.” הסימן מבטא אותו כקו
 * אחד: בצד ההתחלה (ימין, כיוון הקריאה בעברית) נקודות קטנות, עמומות ומפוזרות עם
 * מרווחים גדֵלים — החיפוש; משם הן מתלכדות לקו טרקוטה מלא ולצומת מעוגן אחד —
 * הבנייה. אין לבבות, אין קלישאות: רק פיזור שמתמסד למבנה.
 *
 * זהו פרימיטיב חזותי יחיד, מיושם במשׂורה ברגעי-המותג המרכזיים בלבד. דקורטיבי
 * ולכן aria-hidden. קווי-החיבור נושאים את מחלקת `route-line` הקיימת, כך שהם
 * „נמשכים” בעדינות עם הגלילה — ומכובד `prefers-reduced-motion` דרך אותה מערכת.
 *
 * tone="ink"      — על נייר בהיר (ברירת מחדל).
 * tone="inverse"  — על משטח-עומק כהה (הפוטר): הנקודות בגוון הטקסט ההפוך.
 */
export function SignatureMark({
  className = "",
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "inverse";
}) {
  const scatter =
    tone === "inverse" ? "bg-secondary-foreground/35" : "bg-border-strong/55";
  const scatterStrong =
    tone === "inverse" ? "bg-secondary-foreground/60" : "bg-border-strong/80";
  const line =
    tone === "inverse" ? "bg-secondary-foreground/40" : "bg-border-strong";

  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center", className)}
    >
      {/* חיפוש — נקודות מפוזרות, מרווחים גדֵלים (ימין = תחילת הקריאה) */}
      <span className={cn("h-1 w-1 shrink-0 rounded-full", scatter)} />
      <span className="w-2 shrink-0" />
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", scatterStrong)} />
      {/* מעבר — הקו מתחיל להיווצר, הנקודה מקבלת גוון מותג */}
      <span className={cn("route-line h-px w-4 shrink-0 sm:w-5", line)} />
      <span className="h-2 w-2 shrink-0 rounded-full bg-brand/45" />
      {/* בנייה — קו טרקוטה מלא וצומת מעוגן */}
      <span className="route-line h-[2px] w-9 shrink-0 rounded-full bg-brand sm:w-11" />
      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand ring-4 ring-brand/15" />
    </span>
  );
}
