import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell, LegalSection } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "מדיניות פרטיות — מדייטים לאהבה",
};

export default function PrivacyPage() {
  return (
    <PublicShell title="מדיניות פרטיות">
      <p className="text-ink-700">
        המידע שאתם מכניסים ל"מדייטים לאהבה" הוא אישי ורגיש. כתבנו את העמוד הזה
        בשפה ברורה כדי שתדעו בדיוק מה נאסף, למה, ומה אתם יכולים לעשות עם זה.
      </p>

      <LegalSection heading="איזה מידע נאסף">
        <ul className="list-inside list-disc space-y-1">
          <li>פרטי חשבון בסיסיים: כתובת אימייל ושם לתצוגה.</li>
          <li>השלב בקשר שבחרתם (לפני קשר, דייטים, קשר מתהווה, קשר קיים, אחרי ריב).</li>
          <li>מצבים שאתם כותבים בעצמכם — מה שקרה ואיך הרגשתם.</li>
          <li>התשובות שלכם בכלים (למשל עובדה·סיפור·פעולה, מבחן שלושת השערים).</li>
          <li>רשומות היומן והצ׳ק-אין השבועי של תחזוקת ה־20.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="למה המידע נשמר">
        <p>
          המידע נשמר כדי להציג לכם יומן אישי, לאפשר חזרה ושימוש חוזר בכלים, וכדי
          שנוכל בעתיד להציע תובנות אישיות על בסיס מה שכתבתם. המידע משמש אתכם —
          לא אותנו.
        </p>
      </LegalSection>

      <LegalSection heading="המידע אישי ורגיש">
        <p>
          אנחנו מתייחסים למידע הזה כאל מידע רגיש. הוא נוגע ברגשות, ביחסים
          ובהתלבטויות אישיות, ולכן הגישה אליו מוגבלת רק לכם, דרך החשבון שלכם.
        </p>
      </LegalSection>

      <LegalSection heading="לא מוכרים מידע">
        <p>
          איננו מוכרים את המידע שלכם לצדדים שלישיים ואיננו משתפים אותו לצורכי
          פרסום. הוא לא "המוצר".
        </p>
      </LegalSection>

      <LegalSection heading="היכן המידע נשמר">
        <p>
          הנתונים נשמרים בשירות{" "}
          <span className="font-medium text-ink-800">Supabase</span> (ספק
          תשתית מסדי נתונים), עם בקרת הרשאות שמבטיחה שכל משתמש ניגש רק לנתונים
          של עצמו.
        </p>
      </LegalSection>

      <LegalSection heading="שליטה ומחיקה">
        <p>
          אתם יכולים לייצא את הנתונים שלכם או למחוק את החשבון בכל עת מתוך עמוד{" "}
          <Link href="/settings" className="text-clay-600 hover:underline">
            ההגדרות
          </Link>
          . מחיקת חשבון מוחקת את הנתונים שלכם מהמערכת.
        </p>
      </LegalSection>

      <LegalSection heading="לא טיפול ולא תחליף לעזרה מקצועית">
        <p>
          "מדייטים לאהבה" הוא כלי עזר אישי להתבוננות ובהירות. הוא אינו טיפול,
          אינו אבחון ואינו תחליף לייעוץ מקצועי. אם אתם במצוקה או בסכנה, ראו את
          עמוד{" "}
          <Link href="/help" className="text-clay-600 hover:underline">
            קבלת עזרה מקצועית ובטיחותית
          </Link>
          .
        </p>
      </LegalSection>

      <p className="text-sm text-clay-500">
        לשאלות בנושא פרטיות או בקשת מחיקה ידנית, אפשר לפנות אלינו.
      </p>
    </PublicShell>
  );
}
