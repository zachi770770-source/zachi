import Link from "next/link";

interface Tool {
  name: string;
  tagline: string;
  what: string;
  when: string;
  example: string;
}

const TOOLS: Tool[] = [
  {
    name: "עובדה · סיפור · פעולה",
    tagline: "מפרידים בין מה שקרה למה שאני מספר/ת לעצמי",
    what:
      "כלי בסיסי לעצירה בזמן רגש חזק. מפרקים את האירוע לשלושה רבדים: העובדה היבשה שקרתה, הסיפור שאני מספר/ת לעצמי עליה, והפעולה הבריאה שאני בוחר/ת לעשות עכשיו.",
    when:
      "כשמתעוררת תגובה רגשית חזקה אחרי הודעה, שתיקה, איחור או אי הסכמה — לפני שמגיבים.",
    example:
      "עובדה: לא ענה/תה לי שעה. סיפור: ׳הוא כבר מתחיל לאבד עניין׳. פעולה: אני חוזר/ת לעיסוק שלי, נושם/ת, ולא שולח/ת הודעת בדיקה.",
  },
  {
    name: "מבחן שלושת השערים",
    tagline: "שלוש שאלות שמחליטות אם להתקדם או לעצור",
    what:
      "שלוש שאלות שעוברים איתן לפני קבלת החלטה משמעותית בקשר: 1) האם זה בריא לי? 2) האם זה בנוי על אמת — שלי, של/ה, של שנינו? 3) האם זה צעד מתוך בחירה או מתוך פחד?",
    when:
      "לפני הגדרת זוגיות, מעבר משותף, חשיפה משפחתית, החלטה לסיים, או כל צעד שמשנה את צורת הקשר.",
    example:
      "מציעים לעבור לגור ביחד אחרי 3 חודשים. שער 1: כן, אני שמח/ה. שער 2: לא בדיוק — אנחנו לא מדברים על כסף. נעצור פה — השער השני נסגר, צריך שיחה לפני המעבר.",
  },
  {
    name: "מדרג הגבולות",
    tagline: "סולם בריא בין ׳אני׳ ל׳אנחנו׳",
    what:
      "סולם של חמישה רבדים: גוף, זמן, רגש, כסף, ערכים. בכל רובד מסמנים מה הגבול שלי, מה גמיש, ומה לא נסחר. הסולם לא מקפיא — הוא מבהיר.",
    when:
      "בתחילת קשר, כשמרגישים שמתחילים לאבד את העצמי, או אחרי ויכוח שהשאיר טעם של ויתור.",
    example:
      "גוף: התקדמות פיזית רק כשאני מוכן/ה. זמן: ערב אחד בשבוע נשאר רק שלי. רגש: אני לא מקבל/ת תיוגים גם בכעס. כסף: לא מערבבים חשבונות בלי שיחה. ערכים: לא מוותר/ת על המשפחה שלי.",
  },
  {
    name: "תחזוקת ה־20",
    tagline: "20 דקות ביום שמחזיקות את הקשר ואת עצמך",
    what:
      "תרגול יומי קצר ב־3 חלקים: 10 דקות לעצמי (תנועה, נשימה, כתיבה), 5 דקות מודעות לדפוסים שעלו היום, 5 דקות נוכחות אמיתית עם בן/בת הזוג בלי מסכים.",
    when:
      "כל יום. במיוחד בתקופות לחוצות בעבודה, בהורות, או כשמרגישים שהקשר נכנס ל׳לוגיסטיקה׳ בלבד.",
    example:
      "בוקר: 10 דקות הליכה בשקט. אחה״צ: רושם/ת — ׳היום נסגרתי כשהיא דיברה על אמא שלה׳. ערב: 5 דקות שיחה עם קפה, בלי טלפונים. סוף שבוע: מסתכלים אחורה.",
  },
  {
    name: "נוהל 72 שעות",
    tagline: "אין החלטות גדולות בתוך גל רגשי",
    what:
      "כל החלטה משמעותית — להגדיר, לעזוב, להבטיח, להישבר — מחכה 72 שעות לפני שמוציאים אותה לפועל. בתוך הזמן הזה: לא מסתירים מבן/בת הזוג, אבל גם לא פועלים.",
    when:
      "כשמתחשק לכתוב הודעת פרידה, להציע חתונה ברגע התרגשות, להפסיק קשר אחרי ויכוח, או להוסיף התחייבות גדולה אחרי לילה טוב במיוחד.",
    example:
      "אחרי ויכוח לוחץ/ת ׳סיימנו׳. נוהל: שולח/ת ׳אני צריך/ה לעבד, נדבר ביום ראשון׳, וממתין/ה 72 שעות. ב־95% מהמקרים — ההחלטה הסופית שונה ממה שעלה בלהט.",
  },
];

export default function ToolsPage() {
  return (
    <section className="container-wide pt-14 sm:pt-20 pb-20 text-right">
      <div className="container-prose mx-auto px-0">
        <span className="eyebrow">ארגז הכלים</span>
        <h1 className="section-heading mt-3">חמישה כלים מעשיים מהשיטה</h1>
        <p className="mt-5 text-lg text-ink-700 leading-relaxed">
          לא תיאוריה. כל כלי כאן מיועד לרגע מסוים שצץ במציאות — לפני הודעה, באמצע ויכוח, אחרי דייט. תרגול חוזר הוא מה שהופך אותם לאוטומטיים.
        </p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {TOOLS.map((tool, i) => (
          <article key={tool.name} className="card flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs text-ink-500 mb-1">כלי {i + 1}</div>
                <h2 className="font-display text-2xl text-burgundy-700 leading-snug">{tool.name}</h2>
                <p className="text-ink-500 mt-1">{tool.tagline}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4 text-ink-800">
              <Section title="מה זה">{tool.what}</Section>
              <Section title="מתי משתמשים">{tool.when}</Section>
              <Section title="דוגמה מעשית">{tool.example}</Section>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/quiz" className="btn-primary">לאבחון אישי</Link>
        <Link href="/method" className="btn-secondary">להכיר את השיטה</Link>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.14em] text-burgundy-700 font-medium mb-1.5">
        {title}
      </div>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
