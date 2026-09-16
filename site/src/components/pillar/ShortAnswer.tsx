/**
 * „בשורה אחת” — התשובה הישירה לשאלה הראשית של עמוד-אב, מיד אחרי הפתיחה.
 *
 * הבלוק הזה קיים כדי שקורא שנחת מחיפוש יקבל תשובה מלאה בלי לגלול, ולא כדי
 * לייצר מקטע-מפתח נוסף: הוא קצר בכוונה (שלוש שורות), נכתב פעם אחת לכל עמוד,
 * ואינו חוזר על ה-lead שמעליו. מרונדר בשרת כמו שאר גוף העמוד.
 *
 * ויזואלית זו הדגשה מרוסנת, קו-צד אחד בצבע המותג, ולא כרטיס צבעוני: היא
 * אמורה להרגיש כמו משפט שהמחבר עוצר כדי לומר, לא כמו תיבת-מידע.
 *
 * `body` מקבל גם מערך. במדידה ב-390 התשובה הזאת יצאה שמונה שורות רצופות בשני
 * עמודי-האב — הבלוק הצפוף ביותר שמופיע לפני הגלילה הראשונה, ודווקא זה שאמור
 * להיקרא במבט אחד. פיצול לשתי פסקאות אינו מקצר אותה במילה אחת; הוא רק נותן
 * לעין מקום לנשום בין ההגדרה לבין מה שנובע ממנה.
 */
export function ShortAnswer({
  label,
  body,
}: {
  label: string;
  body: string | readonly string[];
}) {
  const paragraphs = typeof body === "string" ? [body] : body;
  return (
    <div className="mt-9 border-s-2 border-brand ps-5 sm:mt-10 sm:ps-7">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
        {label}
      </p>
      {paragraphs.map((text, i) => (
        <p
          key={text}
          className={`${i === 0 ? "mt-2.5" : "mt-4"} max-w-[60ch] text-[1.12rem] leading-[1.85] text-foreground sm:text-[1.15rem]`}
        >
          {text}
        </p>
      ))}
    </div>
  );
}
