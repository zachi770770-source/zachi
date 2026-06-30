import type { DiagnosisQuestion, UserSegment } from "@/types";

// 12 שאלות אבחון — מבוססות ישירות על פרק 1 + פרק 8 של הספר.
// Likert 1-5: 1 = "ממש לא נכון לגביי", 5 = "מאוד נכון לגביי".
// כל שאלה מנקדת קול אחד. שאלה אחת (#12) הפוכה — ציון גבוה = בריא.

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  {
    id: "q1",
    voice: "approval",
    text: "אני בודק/ת הודעות שוב ושוב כי אני רוצה לדעת שעדיין רוצים אותי.",
  },
  {
    id: "q2",
    voice: "avoidance",
    text: "דווקא ברגעים שבהם משהו מתחיל להרגיש טוב — אני מוצא/ת בו פגם.",
  },
  {
    id: "q3",
    voice: "pleasing",
    text: "אני אומר/ת \"זה בסדר\" כשזה לא באמת בסדר, כדי לא לעשות עניין.",
  },
  {
    id: "q4",
    voice: "rescuer",
    text: "אני נמשך/ת לאנשים שנראה לי שזקוקים לי או שיכולתי \"להציל\".",
  },
  {
    id: "q5",
    voice: "approval",
    text: "כששתיקה נמתחת, אני כותב/ת בראש סיפור שלם של דחייה לפני שיש לי עובדה.",
  },
  {
    id: "q6",
    voice: "avoidance",
    text: "ה\"ניצוץ\" שלי בעבר בא תמיד עם דריכות, חוסר ודאות או רכבת הרים.",
  },
  {
    id: "q7",
    voice: "pleasing",
    text: "בדייט אני שם/ה לב יותר לאיך אני נראה/ית מאשר למה אני באמת מרגיש/ה.",
  },
  {
    id: "q8",
    voice: "pleasing",
    text: "אני מסתיר/ה דעות או צרכים קטנים כדי שלא יחשבו עליי כמסובך/ת.",
  },
  {
    id: "q9",
    voice: "avoidance",
    text: "כשמישהו טוב מתקרב, אני מרגיש/ה צורך פתאומי באוויר.",
  },
  {
    id: "q10",
    voice: "rescuer",
    text: "אחרי ריב או אכזבה אני בודק/ת רק מה שהאחר/ת עשה — לא את האחוז האחד שלי.",
  },
  {
    id: "q11",
    voice: "clinging",
    text: "אם זה לא יקרה השנה — \"אין לי איך לחיות בלי זה\".",
  },
  {
    id: "q12",
    voice: "clinging",
    text: "אני יודע/ת לקחת אחריות חלקית גם כשעוד כועס/ת — בלי \"אבל\".",
    reverse: true,
  },
];

// אונבורדינג: בחירת מסלול לפי "איך להשתמש בספר הזה"
export interface SegmentOption {
  key: UserSegment;
  title: string;
  description: string;
  recommendedStation: number; // 1-8
}

export const SEGMENT_OPTIONS: SegmentOption[] = [
  {
    key: "dating",
    title: "יוצא/ת לדייטים",
    description: "פגישות חדשות, אפליקציות, ניסיון להבדיל בין מה שמושך למה שבונה.",
    recommendedStation: 1,
  },
  {
    key: "new_relationship",
    title: "בתחילת קשר",
    description: "כבר יש משהו ראשוני — והשאלה היא לאן זה הולך וכיצד נשארים נוכחים.",
    recommendedStation: 5,
  },
  {
    key: "long_term",
    title: "בזוגיות ארוכת שנים",
    description: "בית שעובד, אבל לפעמים מרגיש כמו צוות תפעול במקום כמו זוג.",
    recommendedStation: 7,
  },
  {
    key: "after_breakup",
    title: "אחרי פרידה / גירושים",
    description: "בין הקשרים. לא ממהר/ת חזרה, ולא ממהר/ת פנימה.",
    recommendedStation: 1,
  },
  {
    key: "second_chapter",
    title: "פרק ב' — עם ילדים או היסטוריה",
    description: "התחלה חדשה עם בית שכבר עבר טלטלה. בנייה זהירה, לא מאפס.",
    recommendedStation: 5,
  },
];
