/**
 * „בשורה אחת” — התשובה הישירה לשאלה הראשית של עמוד-אב, מיד אחרי הפתיחה.
 *
 * הבלוק הזה קיים כדי שקורא שנחת מחיפוש יקבל תשובה מלאה בלי לגלול, ולא כדי
 * לייצר מקטע-מפתח נוסף: הוא קצר בכוונה (שלוש שורות), נכתב פעם אחת לכל עמוד,
 * ואינו חוזר על ה-lead שמעליו. מרונדר בשרת כמו שאר גוף העמוד.
 *
 * ויזואלית זו הדגשה מרוסנת, קו-צד אחד בצבע המותג, ולא כרטיס צבעוני: היא
 * אמורה להרגיש כמו משפט שהמחבר עוצר כדי לומר, לא כמו תיבת-מידע.
 */
export function ShortAnswer({ label, body }: { label: string; body: string }) {
  return (
    <div className="mt-8 border-s-2 border-brand ps-5 sm:ps-6">
      <p className="text-[12.5px] font-semibold uppercase tracking-wide text-brand-hover">
        {label}
      </p>
      <p className="mt-2 max-w-[62ch] text-[1.08rem] leading-[1.8] text-foreground">{body}</p>
    </div>
  );
}
