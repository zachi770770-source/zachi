import { Container } from "@/components/shared/Container";
import { siteConfig } from "@/config/site";

/**
 * „מחיפוש לבנייה” — הגשר הוויזואלי של עמוד הבית, בין רגע-הזיהוי לבין בחירת
 * המצב. זהו *המעבר עצמו*, לא עוד מקטע-תוכן: ארבעה שלבים שנקראים כרצף אחד.
 *
 *   1. פיזור   — נקודות מפוזרות בשדה: אפשרויות שעדיין לא התחברו לכלום.
 *   2. בהירות  — הפיזור נרגע; הרעש מפסיק לזוז.
 *   3. יישור   — הנקודות מתיישרות אל ציר אחד. זה הרגע שבו „חיפוש” הופך לכיוון.
 *   4. מבנה    — קו נמשך ומחבר ביניהן לצמתים, והקו ממשיך *כלפי מטה* אל
 *                מסלול-המצבים שמתחתיו — ההעברה אל `#path`.
 *
 * למה גאומטריה ולא עוד טקסט: הטרנספורמציה היא התוכן. הטקסט היחיד כאן הוא
 * שורת-המותג המאושרת (`siteConfig.tagline`) — אותה שורה שכבר מופיעה על כריכת
 * הספר ב-Hero — ושני חצאיה נקשרים לשני צדי המעבר. לא נכתב כאן קופי חדש, ולא
 * שוכפל דבר מ-`ThesisSection` שב-/book: שם זו סצנה עריכתית עם ענן-מילים
 * ושלושה עקרונות; כאן זהו סימן-מעבר גאומטרי.
 *
 * בטיחות: אין pinning ואין scroll-timeline — ולכן ניווט-hash לעולם אינו נתקע
 * כאן, ואף תוכן אינו תלוי בסיום רצף. הטקסט מרונדר בשרת וגלוי כברירת מחדל;
 * ההסתרה מתחילה רק תחת `.motion-js`. transform/opacity בלבד (ללא CLS),
 * ותחת prefers-reduced-motion מתקבל המצב הבנוי הסופי מיד.
 */

/** תשע נקודות: מיקום-פיזור (sx/sy) ומיקום-היישור על הציר (ax). ערכים ב-%. */
const POINTS = [
  { sx: 11, sy: -28, ax: 2 },
  { sx: 6, sy: 22, ax: 14 },
  { sx: 33, sy: -16, ax: 26 },
  { sx: 21, sy: 30, ax: 38 },
  { sx: 58, sy: -30, ax: 50 },
  { sx: 44, sy: 16, ax: 62 },
  { sx: 81, sy: -20, ax: 74 },
  { sx: 69, sy: 28, ax: 86 },
  { sx: 91, sy: -12, ax: 98 },
];

export function SearchToBuild() {
  // „דייטינג הוא חיפוש. אהבה היא בנייה.” — שני חצאים, שני צדי המעבר.
  const [searchHalf, buildHalf] = splitTagline(siteConfig.tagline);

  return (
    <section className="s2b reveal" aria-label="מחיפוש לבנייה">
      <Container>
        <div className="s2b__inner mx-auto max-w-2xl text-center">
          <p className="s2b__line type-literary text-[clamp(1.15rem,2.2vw,1.6rem)] leading-snug">
            <span className="s2b__search">{searchHalf}</span>{" "}
            <span className="s2b__build">{buildHalf}</span>
          </p>

          {/* שדה-הטרנספורמציה. דקורטיבי לחלוטין — המשמעות נמסרת בטקסט שמעליו. */}
          <div className="s2b__field" aria-hidden="true">
            {POINTS.map((pt, i) => (
              <span
                key={i}
                className="s2b__pt"
                style={{
                  ["--sx" as string]: `${pt.sx}%`,
                  ["--sy" as string]: `${pt.sy}px`,
                  ["--ax" as string]: `${pt.ax}%`,
                  ["--i" as string]: String(i),
                }}
              />
            ))}
            {/* הציר שמחבר את הנקודות למבנה אחד. */}
            <span className="s2b__rail" />
            {/* וההמשך כלפי מטה — אל מסלול-המצבים. */}
            <span className="s2b__handoff" />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** מפצל את שורת-המותג לשני חצאיה לפי הנקודה הראשונה. ללא שינוי תוכן. */
function splitTagline(tagline: string): [string, string] {
  const at = tagline.indexOf(".");
  if (at === -1) return [tagline, ""];
  return [tagline.slice(0, at + 1), tagline.slice(at + 1).trim()];
}
