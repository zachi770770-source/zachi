export type ProfileKey = "seeker" | "runner" | "avoider" | "builder";

export type ProfileScores = Record<ProfileKey, number>;

export interface QuizOption {
  text: string;
  weights: Partial<ProfileScores>;
  readiness: number;
}

export interface QuizQuestion {
  id: number;
  prompt: string;
  options: QuizOption[];
}

export interface ProfileDescriptor {
  key: ProfileKey;
  title: string;
  shortLabel: string;
  summary: string;
  recommendations: string[];
  nextTool: { name: string; reason: string };
  tone: "warm" | "alert" | "growth" | "strong";
}

export const PROFILES: Record<ProfileKey, ProfileDescriptor> = {
  seeker: {
    key: "seeker",
    title: "מחפש/ת ביטחון",
    shortLabel: "מחפש/ת ביטחון",
    summary:
      "את/ה ניגש/ת לדייטים מתוך רצון אמיתי לבטחון רגשי, אבל לפעמים זה מתורגם לדרישת אישור מהיר מהצד השני. הבטחון אינו דבר שניתן לקבל מבחוץ — הוא נבנה מבפנים, דרך עמוד שדרה ברור והבחנה בין צורך לחרדה.",
    recommendations: [
      "לפני כל דייט שאל/י: ׳מה אני מביא/ה לכאן׳ ולא ׳מה אקבל מכאן׳.",
      "תרגל/י ׳עובדה · סיפור · פעולה׳ כדי להפריד בין מה שקרה לבין מה שאת/ה מספר/ת לעצמך.",
      "החליטו מראש על שלוש פעולות שתעשו לעצמך השבוע — בלי תלות בשום קשר.",
    ],
    nextTool: {
      name: "תחזוקת ה־20",
      reason: "כי בנייה של בטחון פנימי דורשת מסגרת קבועה ולא הצלחה חד פעמית.",
    },
    tone: "warm",
  },
  runner: {
    key: "runner",
    title: "רץ/ה מהר מדי",
    shortLabel: "רץ/ה מהר מדי",
    summary:
      "כשמשהו עובד — את/ה לוחץ/ת על הגז. זה יכול להרגיש כמו ׳אהבה גדולה׳ אבל לרוב זה דילוג על שלבי בנייה. כל שלב שלא נבנה — נופל אחר כך תחת לחץ. המתינות היא בחירה — לא חולשה.",
    recommendations: [
      "הפעל/י את ׳נוהל 72 שעות׳ לפני החלטות גדולות (הגדרת זוגיות, עזיבה משותפת, פגישת משפחה).",
      "סמן/י לוח זמנים מינימלי לכל שלב — וכבד/י אותו גם כשמתחשק להאיץ.",
      "שאל/י עצמך מדי שבוע: ׳מה אנחנו בנינו, ולא רק הרגשנו?׳",
    ],
    nextTool: {
      name: "מבחן שלושת השערים",
      reason: "כי מהירות בלי שערים היא הימור — לא מערכת יחסים.",
    },
    tone: "alert",
  },
  avoider: {
    key: "avoider",
    title: "נמנע/ת מקרבה",
    shortLabel: "נמנע/ת מקרבה",
    summary:
      "את/ה מזהה היטב מתי משהו מתחיל לדרוש קרבה אמיתית — ומעדיף/ה לזוז. ההימנעות שלך הגיונית במונחים של הגנה עצמית, אבל היא גם מה שחוסם בנייה. קרבה היא מיומנות, לא תוצאה.",
    recommendations: [
      "זהה/י את הרגע המדויק שבו את/ה ׳נסגר/ת׳ — ותרגל/י נשימה ארוכה במקום ניתוק.",
      "תרגל/י ׳עובדה · סיפור · פעולה׳ כדי לא להפוך אי־נוחות זמנית לסיבה לבריחה.",
      "בקש/י קרבה קטנה אחת בשבוע — שיחה אמיתית, פגישה לא תפקודית — ועקוב/י אחר ההרגשה.",
    ],
    nextTool: {
      name: "מדרג הגבולות",
      reason: "כי גבולות בריאים מאפשרים קרבה. בלעדיהם — או הימנעות או היבלעות.",
    },
    tone: "growth",
  },
  builder: {
    key: "builder",
    title: "בשל/ה לבנייה",
    shortLabel: "בשל/ה לבנייה",
    summary:
      "את/ה מגיע/ה לקשר עם רגלי לקרקע, מודעות לדפוסים שלך, וסבלנות לתהליך. זו לא משמעות שהכל יסתדר בקלות — אלא שיש לך את הכלים הבסיסיים שמאפשרים לבנות. הסכנה היחידה: לקחת את עצמך כמובן מאליו ולהפסיק לתחזק.",
    recommendations: [
      "שמור/י על קביעות עם ׳תחזוקת ה־20׳ — בריאות לא נשמרת לבד.",
      "בחר/י מודע/ת — בקש/י מעצמך בכל פעם שאלה אחת: ׳האם זו בחירה או נוחות?׳",
      "תרגל/י ׳מבחן שלושת השערים׳ עם כל קשר שמתחיל להפוך משמעותי.",
    ],
    nextTool: {
      name: "תחזוקת ה־20",
      reason: "כי כשהבסיס בריא — מה שמתחזק אותו הוא קביעות, לא תיקון בדיעבד.",
    },
    tone: "strong",
  },
};

export const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    prompt: "כשאת/ה חושב/ת על להתחיל קשר חדש — מה המחשבה הראשונה שעולה?",
    options: [
      { text: "סוף סוף מישהו שיהיה איתי.", weights: { seeker: 3, runner: 1 }, readiness: 1 },
      { text: "מקווה שזה ירגיש מהר אמיתי.", weights: { runner: 3, seeker: 1 }, readiness: 1 },
      { text: "אני מעדיף/ה לדעת קודם שאני יציב/ה לבד.", weights: { builder: 3, avoider: 1 }, readiness: 3 },
      { text: "עוד פעם להתאמץ ולתחזק? לא עכשיו.", weights: { avoider: 3 }, readiness: 1 },
    ],
  },
  {
    id: 2,
    prompt: "אחרי דייט שני שהיה בסדר אך לא מהמם — מה את/ה עושה?",
    options: [
      { text: "ממציא/ה סיפור שלם למה זה לא מתאים ומפסיק/ה.", weights: { avoider: 3, seeker: 1 }, readiness: 1 },
      { text: "נותן/ת עוד הזדמנות אמיתית כי ׳בסדר׳ זה בסיס.", weights: { builder: 3 }, readiness: 3 },
      { text: "כבר חושב/ת איך להאיץ ולהפוך את זה למשהו.", weights: { runner: 3 }, readiness: 1 },
      { text: "מחפש/ת איתות שהוא/היא רוצה אותי כדי להחליט.", weights: { seeker: 3 }, readiness: 1 },
    ],
  },
  {
    id: 3,
    prompt: "מה עושה לך הכי לא נוח בדייט?",
    options: [
      { text: "שתיקה ארוכה.", weights: { seeker: 2, runner: 1 }, readiness: 2 },
      { text: "שאלות אישיות אמיתיות.", weights: { avoider: 3 }, readiness: 1 },
      { text: "תחושה שאני לא מוצא/ת חן.", weights: { seeker: 3 }, readiness: 1 },
      { text: "כשמרגיש שעוד אין על מה לבנות.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 4,
    prompt: "ביחס לעצמך כיום — איזה משפט הכי נכון?",
    options: [
      { text: "אני יודע/ת מה אני מביא/ה ומה אני צריך/ה.", weights: { builder: 3 }, readiness: 3 },
      { text: "אני יודע/ת מה אני רוצה — אבל קשה לי לחכות לזה.", weights: { runner: 3, builder: 1 }, readiness: 2 },
      { text: "אני לא בטוח/ה שאני מספיק.", weights: { seeker: 3 }, readiness: 1 },
      { text: "אני בעיקר רוצה שקט. קשר זה הרבה מטלה.", weights: { avoider: 3 }, readiness: 1 },
    ],
  },
  {
    id: 5,
    prompt: "כשאת/ה מתחיל/ה לחבב מישהו — איך זה נראה?",
    options: [
      { text: "אני זמין/ה כל הזמן ומפנה את כל החיים.", weights: { runner: 3, seeker: 1 }, readiness: 1 },
      { text: "אני נסוג/ה כי זה מאיים.", weights: { avoider: 3 }, readiness: 1 },
      { text: "אני מחפש/ת סימן שמרגישים אותי בחזרה.", weights: { seeker: 3 }, readiness: 1 },
      { text: "אני שומר/ת על השגרה שלי וגם בונה לאט.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 6,
    prompt: "מתי בפעם האחרונה ויתרת על גבול שלך כדי שלא יכעסו עליך?",
    options: [
      { text: "לעיתים קרובות. קשה לי לעמוד על שלי.", weights: { seeker: 3 }, readiness: 1 },
      { text: "כשרציתי שהדבר ימשיך — ידעתי שאני מוותר/ת.", weights: { runner: 2, seeker: 2 }, readiness: 1 },
      { text: "לא ממש — אני בקושי מתקרב/ת לזה.", weights: { avoider: 3 }, readiness: 1 },
      { text: "לא בזמן האחרון. אני מודע/ת לזה.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 7,
    prompt: "כשמתעוררת אי הסכמה — איך את/ה מגיב/ה?",
    options: [
      { text: "מתאמץ/ת לפייס מהר כדי שזה יעבור.", weights: { seeker: 3 }, readiness: 1 },
      { text: "סוגר/ת ויוצא/ת לכמה ימים.", weights: { avoider: 3 }, readiness: 1 },
      { text: "מסלים/ה כדי להבטיח שכן רואים אותי.", weights: { runner: 3 }, readiness: 1 },
      { text: "מנסה להפריד עובדה מסיפור — ואז מדבר/ת.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 8,
    prompt: "אחרי פרידה, כמה זמן עובר בדרך כלל עד הקשר הבא?",
    options: [
      { text: "כמעט מיד — לא נעים לי לבד.", weights: { runner: 3, seeker: 1 }, readiness: 1 },
      { text: "תקופה ארוכה מאוד — עדיף לבד.", weights: { avoider: 3 }, readiness: 1 },
      { text: "מנסה לצאת מהר כדי להוכיח שאני בסדר.", weights: { seeker: 3, runner: 1 }, readiness: 1 },
      { text: "לוקח/ת זמן לעבד ואז נכנס/ת מודע/ת.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 9,
    prompt: "איזה משפט הכי קרוב לך?",
    options: [
      { text: "אהבה זה לדעת שלא יעזבו אותי.", weights: { seeker: 3 }, readiness: 1 },
      { text: "אהבה זה לעוף ביחד.", weights: { runner: 3 }, readiness: 1 },
      { text: "אהבה זה כשמשאירים אותי בשקט שלי.", weights: { avoider: 3 }, readiness: 1 },
      { text: "אהבה זה לבנות ביחד — גם כשקשה.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 10,
    prompt: "כשמישהו מבקש קרבה אמיתית — שיחה עמוקה, חולשה — מה קורה לך?",
    options: [
      { text: "מרגיש/ה מדהים, מתחבר/ת מיד.", weights: { runner: 2, builder: 2 }, readiness: 2 },
      { text: "מתחיל/ה לפחד שייעלם אם אחשוף.", weights: { seeker: 3 }, readiness: 1 },
      { text: "מרגיש/ה לחץ ומתרחק/ת.", weights: { avoider: 3 }, readiness: 1 },
      { text: "נושם/ת, נשאר/ת — גם אם זה לא נוח.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 11,
    prompt: "כמה את/ה משקיע/ה בעצמך השבוע — מחוץ לקשר?",
    options: [
      { text: "כלום. כל האנרגיה הולכת לדייטים.", weights: { runner: 2, seeker: 2 }, readiness: 1 },
      { text: "המון — אבל מתוך התנתקות מאחרים.", weights: { avoider: 3 }, readiness: 1 },
      { text: "מעט. אני מחכה שזה יבוא מבחוץ.", weights: { seeker: 3 }, readiness: 1 },
      { text: "יש לי שגרה קבועה לעצמי בלי קשר לסטטוס.", weights: { builder: 3 }, readiness: 3 },
    ],
  },
  {
    id: 12,
    prompt: "מה היית רוצה להיות אמת לגביך בעוד שנה?",
    options: [
      { text: "שמישהו יבחר בי באמת.", weights: { seeker: 3 }, readiness: 1 },
      { text: "שאני כבר בזוגיות יציבה — לא משנה איך.", weights: { runner: 3 }, readiness: 1 },
      { text: "שאני שלם/ה גם לבד, ופתוח/ה לאט.", weights: { builder: 3 }, readiness: 3 },
      { text: "שאני לא צריך/ה לעסוק בזה בכלל.", weights: { avoider: 3 }, readiness: 1 },
    ],
  },
];

export function scoreQuiz(answers: Array<number | null>): {
  profile: ProfileKey;
  scores: ProfileScores;
  readiness: number;
} {
  const scores: ProfileScores = { seeker: 0, runner: 0, avoider: 0, builder: 0 };
  let readinessSum = 0;
  let readinessMax = 0;

  answers.forEach((optionIndex, qIndex) => {
    if (optionIndex == null) return;
    const question = QUESTIONS[qIndex];
    const option = question?.options[optionIndex];
    if (!option) return;
    for (const [k, v] of Object.entries(option.weights)) {
      scores[k as ProfileKey] += v ?? 0;
    }
    readinessSum += option.readiness;
    readinessMax += 3;
  });

  let topKey: ProfileKey = "builder";
  let topVal = -1;
  (Object.keys(scores) as ProfileKey[]).forEach((k) => {
    if (scores[k] > topVal) {
      topVal = scores[k];
      topKey = k;
    }
  });

  const readiness = readinessMax === 0 ? 0 : Math.round((readinessSum / readinessMax) * 100);

  return { profile: topKey, scores, readiness };
}
