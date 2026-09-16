import { cn } from "@/lib/utils";

/**
 * החתימה הוויזואלית של עמודי-האב: שני קווים שנעים זה אל זה.
 *
 * ── למה דווקא זה ─────────────────────────────────────────────────────────
 * כל האתר עומד על משפט אחד: „דייטינג הוא חיפוש. אהבה היא בנייה.” שני קווים
 * שמתקרבים הם הצורה המינימלית של המשפט הזה. הם אינם איור ואינם קישוט: הם
 * *התוכן*, מצויר. וזה גם מה שמבדיל בין שני העמודים בלי לשנות מותג:
 *
 *   • `"converging"` (/dating) — הקווים מתקרבים לאורך כל הרוחב ונשארים
 *     במרחק. לא נפגשו עדיין. זה בדיוק השלב שהעמוד מתאר.
 *   • `"merged"` (/love) — הקווים נפגשים בנקודה, וממנה ממשיכים כקו אחד.
 *     הנקודה היא המפגש, וההמשך הוא הבנייה שאחריו.
 *
 * ── הנקודה כמוטיב חוזר ───────────────────────────────────────────────────
 * העיגול הקטן בקצה קו הוא ה-DNA שחוזר בעמוד: כאן במפגש, בסמן של כל מקטע
 * ב-/love, אחרי המספר ב-/dating, ומעל ציטוט-הסיום. תמיד אותה משמעות — נקודה
 * שבה משהו נפגש או מתחיל. לכן הוא אינו קישוט גם כשהוא זעיר.
 *
 * ── מימוש ────────────────────────────────────────────────────────────────
 * SVG מוטבע, ללא JS, ללא אנימציה, ללא נכס חיצוני. `width`/`height` מפורשים
 * יחד עם `viewBox` נותנים יחס-צדדים אינטרינזי, ולכן הדפדפן מקצה את המקום עוד
 * לפני הצביעה ואין CLS. הקומפוזיציה מתקדמת מימין לשמאל, ככיוון הקריאה.
 * מסומן דקורטיבי — המשמעות נמסרת בטקסט שסביבו.
 *
 * ── עובי הקו ─────────────────────────────────────────────────────────────
 * 2.1 ולא 1.5. בעובי הקודם החתימה הייתה נכונה אבל כמעט בלתי-נראית במבט
 * ראשון, ומוטיב שלא נקלט אינו מוטיב. זה עדיין קו דק — לא איור — אבל עכשיו
 * הוא הדבר שרואים אחרי הכותרת.
 */
export function PillarSignature({
  variant,
  className,
}: {
  variant: "converging" | "merged";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 420 88"
      width={420}
      height={88}
      role="presentation"
      aria-hidden="true"
      focusable="false"
      fill="none"
      className={cn("h-auto w-full", className)}
    >
      {variant === "merged" ? (
        <>
          {/* שני הקווים נפגשים ב-(206,44) */}
          <path
            d="M414 14 C 330 14, 268 44, 206 44"
            className="text-brand"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
          />
          <path
            d="M414 74 C 330 74, 268 44, 206 44"
            className="text-[color:var(--color-sage-ink)]"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
          />
          {/* ומכאן ממשיכים כקו אחד */}
          <path
            d="M206 44 L 16 44"
            className="text-[color:var(--color-sage-ink)]"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
          />
          <circle cx={206} cy={44} r={5} className="text-brand" fill="currentColor" />
        </>
      ) : (
        <>
          {/* מתקרבים לאורך כל הרוחב, ונשארים במרחק */}
          <path
            d="M414 8 C 300 8, 208 30, 16 37"
            className="text-brand"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
          />
          <path
            d="M414 80 C 300 80, 208 58, 16 53"
            className="text-[color:var(--color-sage-ink)]"
            stroke="currentColor"
            strokeWidth={2.1}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

/**
 * המוטיב הזעיר: קו קצר שמסתיים בנקודה.
 *
 * אותה אמירה של החתימה הגדולה, בגודל של תווית. משמש כסמן-מקטע וכפתיחה
 * לציטוט-הסיום. ב-RTL הקו נמתח ימינה והנקודה יושבת בקצהו השמאלי, כלומר
 * בכיוון שאליו הקריאה ממשיכה.
 *
 * המידות כאן אינן שרירותיות: 56px קו ו-7px נקודה. בגרסה הקודמת (36px ו-5px,
 * בקו שקוף למחצה) המוטיב היה נוכח בקוד אך לא בעין — הוא נקרא כרווח לפני
 * הכותרת ולא כסימן. עכשיו הוא נקלט במבט אחד, ועדיין קטן בהרבה מכל אלמנט
 * טיפוגרפי שלידו.
 *
 * `tone="inverse"` הוא אותו סימן על משטח פטרול. הטרקוטה על פטרול עומדת על
 * 3.45:1 — מספיק לגרפיקה (3:1) ולא מספיק לטקסט, ולכן הצבע הזה משמש שם רק
 * לסימן עצמו והטקסט נשאר שנהב.
 */
export function SignatureMarkRule({
  className,
  align = "start",
  tone = "ink",
}: {
  className?: string;
  align?: "start" | "center";
  tone?: "ink" | "inverse";
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center gap-2",
        align === "center" && "justify-center",
        className,
      )}
    >
      <span
        className={cn(
          "h-[1.5px] w-14",
          tone === "inverse" ? "bg-brand/85" : "bg-brand",
        )}
      />
      <span className="h-[7px] w-[7px] rounded-full bg-brand" />
    </span>
  );
}
