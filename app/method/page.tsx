import Link from "next/link";

export default function MethodPage() {
  return (
    <section className="container-prose pt-14 sm:pt-20 pb-20 text-right">
      <span className="eyebrow">השיטה</span>
      <h1 className="section-heading mt-3">דייטינג הוא חיפוש. אהבה היא בנייה.</h1>

      <p className="mt-6 text-lg text-ink-700 leading-relaxed">
        ׳מדייטים לאהבה׳ היא שיטה שמפרידה בין שני שלבים שלא מבדילים ביניהם מספיק:
        שלב החיפוש, ושלב הבנייה. רוב הקשרים שנשברים — נשברים כי נכנסים לבנייה
        בלי לעבור באמת את החיפוש, או נשארים בחיפוש גם כשהגיע הזמן לבנות.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <div className="card">
          <div className="text-xs uppercase tracking-[0.14em] text-burgundy-700 font-medium">שלב 1</div>
          <h2 className="font-display text-2xl text-ink-900 mt-2">דייטינג — שלב החיפוש</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            לבדוק. להכיר. לזהות מי את/ה ומול מי. לא לבחור עדיין. השלב הזה דורש סקרנות, סבלנות,
            וכנות פנימית — כי קשה לבחור נכון אם לא יודעים מה מחפשים.
          </p>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-[0.14em] text-burgundy-700 font-medium">שלב 2</div>
          <h2 className="font-display text-2xl text-ink-900 mt-2">אהבה — שלב הבנייה</h2>
          <p className="mt-3 text-ink-700 leading-relaxed">
            אחרי שיש בחירה — מתחילה עבודה. גבולות, תקשורת, תיקון אחרי משבר, ואחריות הדדית.
            השלב הזה לא בא במתנה — הוא נבנה יום אחרי יום.
          </p>
        </div>
      </div>

      <h2 className="section-heading mt-16">חמשת עמודי הבנייה</h2>
      <p className="mt-4 text-ink-700 leading-relaxed">
        קשר נכון נשען על חמישה עמודים. אם אחד נופל — אפשר לתקן. אם שניים נופלים — צריך לעצור ולבדוק.
      </p>
      <ol className="mt-8 grid gap-5">
        {PILLARS.map((p, i) => (
          <li key={p.title} className="rounded-2xl border border-cream-300 bg-cream-50/70 p-6 sm:p-7">
            <div className="flex items-start gap-4">
              <div className="font-display text-2xl text-burgundy-700 w-8 shrink-0">{i + 1}</div>
              <div>
                <h3 className="font-display text-xl text-ink-900">{p.title}</h3>
                <p className="mt-2 text-ink-700 leading-relaxed">{p.body}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-3xl bg-burgundy-700 text-cream-50 p-8 sm:p-12 shadow-card">
        <span className="text-cream-200/80 text-sm uppercase tracking-[0.14em]">העיקרון המרכזי</span>
        <p className="mt-4 font-display text-2xl sm:text-3xl leading-snug">
          המטרה אינה למצוא אדם מושלם, אלא לזהות בסיס בריא — ולבנות עליו ביחד.
        </p>
        <p className="mt-5 text-cream-100/90 leading-relaxed">
          אדם מושלם לא קיים. בסיס בריא כן — כשיש בו אמת, מוכנות, רצון לתקן, ויכולת להישאר גם כשקשה.
        </p>
      </div>

      <h2 className="section-heading mt-16">איך מתחילים</h2>
      <ol className="mt-6 space-y-4 text-ink-700">
        <li className="flex items-start gap-3"><Step n={1} /> לעשות את האבחון האישי — לזהות איפה אני היום.</li>
        <li className="flex items-start gap-3"><Step n={2} /> לבחור כלי אחד מהשיטה ולהתחיל לתרגל אותו השבוע.</li>
        <li className="flex items-start gap-3"><Step n={3} /> לעבור לכלי הבא רק כשהראשון הפך כמעט אוטומטי.</li>
        <li className="flex items-start gap-3"><Step n={4} /> לחזור לאבחון אחרי שלושה חודשים ולראות את התזוזה.</li>
      </ol>

      <div className="mt-12 flex flex-col sm:flex-row gap-3">
        <Link href="/quiz" className="btn-primary">להתחיל אבחון</Link>
        <Link href="/tools" className="btn-secondary">לעבור לכלים</Link>
      </div>
    </section>
  );
}

const PILLARS = [
  {
    title: "בחירה",
    body: "להגיד כן מתוך אמת, לא מתוך פחד מבדידות או לחץ סביבתי. בחירה אמיתית חוזרת על עצמה כל יום מחדש — לא רק ביום הראשון.",
  },
  {
    title: "גבולות",
    body: "מה אני מביא/ה לקשר ומה לא נסחר. גבולות הם מה שמאפשר קרבה אמיתית — לא מה שחוסם אותה.",
  },
  {
    title: "תקשורת",
    body: "להפריד עובדה מסיפור, לדבר מאחריות ולא מהאשמה, להקשיב כדי להבין — לא כדי להגיב.",
  },
  {
    title: "תיקון",
    body: "כל קשר ייפצע. השאלה היא האם יש שניים שמוכנים לחזור אחורה, להכיר במה שנשבר, ולתקן — לא רק להמשיך.",
  },
  {
    title: "אחריות",
    body: "האחריות שלי על מה שאני מביא/ה ועל מה שאני מתחזק/ת. לא לחכות שהשני יזיז את הקשר — להזיז ביחד.",
  },
];

function Step({ n }: { n: number }) {
  return (
    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-burgundy-600 text-cream-50 text-sm font-semibold">
      {n}
    </span>
  );
}
