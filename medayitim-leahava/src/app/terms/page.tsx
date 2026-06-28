import type { Metadata } from "next";
import Link from "next/link";
import { PublicShell, LegalSection } from "@/components/PublicShell";

export const metadata: Metadata = {
  title: "תנאי שימוש — מדייטים לאהבה",
};

export default function TermsPage() {
  return (
    <PublicShell title="תנאי שימוש">
      <p className="text-ink-700">
        כמה דברים חשובים להבנה לפני השימוש ב"מדייטים לאהבה". כתבנו אותם בשפה
        רגועה וברורה.
      </p>

      <LegalSection heading="מה האפליקציה כן">
        <p>
          "מדייטים לאהבה" היא כלי עזר אישי להתבוננות, לחשיבה בהירה ולבחירה
          בוגרת בקשרים. היא נועדה לעזור לכם לעצור, לשים לב ולבחור צעד הבא — בקצב
          שלכם.
        </p>
      </LegalSection>

      <LegalSection heading="מה האפליקציה לא">
        <p>
          האפליקציה אינה טיפול, אינה אבחון, ואינה ייעוץ זוגי, רפואי, נפשי או
          משפטי. היא אינה מחליפה אנשי מקצוע ואינה מספקת המלצה אישית על מה לעשות
          בקשר שלכם.
        </p>
      </LegalSection>

      <LegalSection heading="מצבי סכנה">
        <p>
          אין להשתמש באפליקציה כתחליף לפנייה לעזרה במצבים של אלימות, פחד, שליטה,
          איום או סכנה. במצבים כאלה יש לפנות לעזרה מקצועית — ראו את עמוד{" "}
          <Link href="/help" className="text-clay-600 hover:underline">
            קבלת עזרה מקצועית ובטיחותית
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection heading="אחריות המשתמש">
        <p>
          השימוש באפליקציה והמידע שאתם מכניסים אליה הם באחריותכם. אתם בוחרים מה
          לכתוב, מה לשתף עם עצמכם, ואילו צעדים לעשות בעקבות זאת.
        </p>
      </LegalSection>

      <LegalSection heading="אין הבטחה לתוצאה">
        <p>
          איננו מבטיחים תוצאה זוגית כלשהי. האפליקציה מציעה מסגרות לחשיבה ולבחירה,
          לא הבטחות.
        </p>
      </LegalSection>

      <LegalSection heading="הנתונים שלכם">
        <p>
          השימוש בנתונים שאתם מכניסים מתואר ב
          <Link href="/privacy" className="text-clay-600 hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </LegalSection>
    </PublicShell>
  );
}
