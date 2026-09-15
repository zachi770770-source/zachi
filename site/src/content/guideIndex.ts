import { guides } from "@/content/guides";

/**
 * אינדקס המדריכים — הארגון האנושי של אשכול התוכן.
 *
 * עשרים ושלושה מדריכים ללא עמוד-אב הם בעיה כפולה: הקורא אינו יכול לגלות אותם
 * (הם לא בתפריט, והדרך היחידה אליהם היא דרך עמוד-מסע או מדריך אחר), והזחלן
 * מגיע אליהם רק בקפיצות. אבל רשימה שטוחה של עשרים ושלושה קישורים אינה פתרון
 * אלא בעיה אחרת — היא לא מלמדת כלום על הסדר שביניהם.
 *
 * לכן הארגון כאן הוא לפי *המסע עצמו*, אותו מסע שהאתר כולו בנוי סביבו:
 * דייטים והיכרות → בניית קשר → בתוך זוגיות → פרידה והתחלה מחדש. כל שלב נושא
 * משפט שמסביר מתי הוא רלוונטי, כך שהקורא יכול למצוא את עצמו לפי מצב ולא לפי
 * כותרת. המיפוי מפורש ולא נגזר אוטומטית: מדריך אינו שייך לשלב בגלל ה-hub שלו
 * אלא בגלל מתי באמת קוראים אותו.
 *
 * מקור האמת לכותרות ולתיאורים נשאר `guides.ts` — כאן יושב רק הסדר.
 */

export interface GuideStage {
  id: string;
  /** H2 של השלב. */
  title: string;
  /** מתי השלב הזה רלוונטי — משפט אחד, בגובה העיניים. */
  lead: string;
  /** עמוד-האם של השלב (אשכול/תחנה), כשקיים. */
  hub?: { href: string; label: string };
  slugs: string[];
}

export const guideIndexMeta = {
  title: "מדריכים: דייטים, קשר וזוגיות",
  description:
    "כל המדריכים של „מדייטים לאהבה” לפי שלבי המסע: דייטים והיכרות, בניית קשר, זוגיות קיימת, ופרידה והתחלה מחדש. מאת צחי חן.",
  kicker: "מדריכים",
  h1: "כל המדריכים",
  lead:
    "המדריכים כאן מסודרים לפי המסע עצמו, מהפגישה הראשונה ועד לקשר שנבנה לאורך זמן. אפשר לקרוא לפי הסדר, ואפשר פשוט למצוא את השלב שאתם נמצאים בו עכשיו.",
  byline: {
    prefix: "מאת",
    name: "צחי חן",
    role: "מחבר „מדייטים לאהבה”",
    href: "/author",
  },
  close: {
    title: "המדריכים הם הצצה. הספר הוא השיטה המלאה",
    body:
      "כל מדריך כאן עומד בפני עצמו, וגם לוקח חלק אחד מתוך „מדייטים לאהבה” ומרחיב אותו. הספר מחבר בין כולם לכדי דרך אחת: איך לבחור, איך לבנות, ואיך לחזור זה אל זה כשקשה.",
    cta: "לעמוד הספר",
    href: "/book",
  },
} as const;

export const guideStages: GuideStage[] = [
  {
    id: "dating",
    title: "דייטים והיכרות",
    lead: "השלב שבו פוגשים, בודקים, ומנסים להבין אם יש כאן משהו להמשיך איתו.",
    hub: { href: "/dating", label: "דייטים: מה באמת קורה בשלב ההיכרות" },
    slugs: [
      "first-date",
      "dates-not-progressing",
      "finding-a-relationship",
      "dating-red-flags",
      "attracted-to-unavailable",
      "ready-for-a-relationship",
    ],
  },
  {
    id: "building",
    title: "בניית קשר",
    lead: "כשכבר יש עם מי, והשאלה היא איך זה הופך למשהו יציב.",
    hub: {
      href: "/building-relationship",
      label: "בניית קשר: כשהקשר מתחיל להיות אמיתי",
    },
    slugs: [
      "from-dating-to-relationship",
      "defining-the-relationship",
      "how-fast-is-too-fast",
      "choosing-a-partner",
      "compatibility",
      "hot-and-cold",
      "words-vs-actions",
      "fear-of-commitment",
    ],
  },
  {
    id: "inside",
    title: "בתוך זוגיות",
    lead: "קשר קיים: מה שומר עליו, מה שוחק אותו, ואיך חוזרים זה אל זה.",
    hub: {
      href: "/inside-relationship",
      label: "בתוך קשר: להעמיק ולבנות מחדש",
    },
    slugs: [
      "healthy-relationship",
      "couple-communication",
      "keeping-connection-alive",
      "recurring-fights",
      "attachment-styles",
      "relationship-doubts",
    ],
  },
  {
    id: "endings",
    title: "פרידה והתחלה מחדש",
    lead: "כשקשר נגמר, או כשחוזרים אחריו אל העולם בפעם השנייה.",
    hub: { href: "/after-breakup", label: "אחרי פרידה: לעבד, ורק אז להחליט" },
    slugs: [
      "how-to-end-a-relationship",
      "over-a-breakup",
      "getting-back-with-ex",
    ],
  },
];

/**
 * שער-בטיחות: כל מדריך חייב להופיע בדיוק פעם אחת באינדקס. בלי זה, מדריך חדש
 * שנוסף ל-`guides.ts` היה נעלם מהאינדקס בשקט — בדיוק סוג הבאג שלא מתגלה עד
 * שמישהו שואל למה עמוד לא מקבל תנועה.
 */
export function auditGuideIndex(): { missing: string[]; duplicated: string[] } {
  const listed = guideStages.flatMap((s) => s.slugs);
  const seen = new Set<string>();
  const duplicated: string[] = [];
  for (const slug of listed) {
    if (seen.has(slug)) duplicated.push(slug);
    seen.add(slug);
  }
  const missing = Object.keys(guides).filter((slug) => !seen.has(slug));
  return { missing, duplicated };
}
