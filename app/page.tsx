import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-cream-100 via-cream-100 to-cream-200/60" />
        <div className="absolute inset-x-0 -top-32 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-burgundy-500/10 blur-3xl" />
        <div className="container-prose pt-20 sm:pt-28 pb-16 sm:pb-24 text-center">
          <span className="eyebrow">אפליקציית מבוססת ספר ושיטה</span>
          <h1 className="mt-5 font-display text-4xl sm:text-6xl font-semibold text-ink-900 leading-[1.08] tracking-tight">
            מדייטים לאהבה
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-ink-700 max-w-2xl mx-auto leading-relaxed">
            אפליקציה אישית לזיהוי מוכנות, דפוסים ובניית קשר נכון.
          </p>
          <p className="mt-8 font-display text-2xl sm:text-3xl text-burgundy-700 leading-snug">
            דייטינג הוא חיפוש.
            <br className="sm:hidden" /> <span className="text-ink-900">אהבה היא בנייה.</span>
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/quiz" className="btn-primary">
              להתחיל אבחון
            </Link>
            <Link href="/method" className="btn-secondary">
              לקרוא על השיטה
            </Link>
          </div>
        </div>
      </section>

      <section className="container-wide py-14 sm:py-20">
        <div className="grid gap-5 sm:gap-6 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card text-right">
              <div className="font-display text-xl text-burgundy-700 mb-3">{p.title}</div>
              <p className="text-ink-700 leading-relaxed">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-prose py-14 sm:py-20 text-right">
        <span className="eyebrow">על מה זה עונה</span>
        <h2 className="section-heading mt-3">השאלות שכל אחד שואל את עצמו לפני הקשר הבא</h2>
        <ul className="mt-8 space-y-4 text-lg text-ink-700">
          {questions.map((q) => (
            <li key={q} className="flex items-start gap-3">
              <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-burgundy-600 shrink-0" />
              <span className="leading-relaxed">{q}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link href="/quiz" className="btn-primary">
            להתחיל אבחון אישי
          </Link>
          <Link href="/tools" className="btn-secondary">
            לכלים המעשיים
          </Link>
        </div>
      </section>

      <section className="container-prose pb-20 sm:pb-28 text-right">
        <div className="rounded-3xl bg-burgundy-700 text-cream-50 p-8 sm:p-12 shadow-card">
          <span className="inline-block text-xs sm:text-sm uppercase tracking-[0.18em] text-cream-200/80">
            מהספר ׳מדייטים לאהבה׳
          </span>
          <p className="mt-4 font-display text-2xl sm:text-3xl leading-snug">
            ״לא מחפשים אדם מושלם. מחפשים בסיס בריא — ובונים עליו.״
          </p>
        </div>
      </section>
    </>
  );
}

const pillars = [
  {
    title: "מוכנות",
    body: "להבין איפה אתה היום — לא איפה היית רוצה להיות. מוכנות לקשר היא נקודת הפתיחה האמיתית.",
  },
  {
    title: "דפוסים",
    body: "כל אחד מגיע לדייט עם דפוס שמוכר לו. זיהוי הדפוס משחרר אותך לבחור אחרת.",
  },
  {
    title: "בנייה",
    body: "אחרי החיפוש מתחילה העבודה האמיתית — בחירה, גבולות, תקשורת, תיקון ואחריות.",
  },
];

const questions = [
  "האם אני באמת מוכן/ה לקשר עכשיו?",
  "מאיזה דפוס אני מגיע/ה לדייטים?",
  "האם אני רץ/ה מהר מדי קדימה?",
  "האם אני נמנע/ת מקרבה?",
  "האם אני מחפש/ת ביטחון במקום לבנות אמון?",
  "מה הפעולה הבאה הבריאה שלי?",
];
