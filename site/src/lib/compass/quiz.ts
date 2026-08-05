/**
 * „המצפן” — חוויה אינטראקטיבית דטרמיניסטית בת שלוש שאלות סגורות, המבוססת אך
 * ורק על התוכן המאושר של „מדייטים לאהבה” (src/content/stations.ts). זה *אינו*
 * צ׳אטבוט ואינו AI: אין טקסט חופשי, אין קריאה ל-API חיצוני, ואין תשובות
 * גנרטיביות. כל האפשרויות סגורות, וכל שאלה „נוטה” לאחת משלוש התחנות.
 *
 * המודול הזה טהור (בלי React / DOM) כדי שיהיה ניתן לבדיקה מלאה: מיפוי כל
 * הצירופים, מצבי שוויון, ושני „הגורמים” שהובילו לתוצאה.
 */

export type CompassStationId =
  | "before-relationship"
  | "starting-again"
  | "inside-relationship";

/** סדר קבוע — משמש גם כשובר-שוויון דטרמיניסטי (הראשון מבין השווים מנצח). */
export const COMPASS_STATION_ORDER: CompassStationId[] = [
  "before-relationship",
  "starting-again",
  "inside-relationship",
];

export interface CompassOption {
  /** תווית סגורה (טקסט מאושר, נאמן לתוכן התחנות). */
  label: string;
  /** התחנה שאליה נוטה האפשרות. */
  station: CompassStationId;
}

export interface CompassQuestion {
  id: string;
  title: string;
  /** בדיוק שלוש אפשרויות, אחת לכל תחנה. */
  options: CompassOption[];
}

/**
 * שלוש השאלות. כל שאלה נוטה לשלוש התחנות (אפשרות אחת לכל אחת), והניסוח נאמן
 * לתוכן המאושר: השלב (navLabel/lead), הקושי (difficulty) והמענה (offer).
 */
export const COMPASS_QUESTIONS: CompassQuestion[] = [
  {
    id: "stage",
    title: "איפה אתם נמצאים עכשיו במסע לאהבה?",
    options: [
      { label: "לפני קשר — יש רצון, אבל קשה באמת להיכנס פנימה", station: "before-relationship" },
      { label: "מתחילים מחדש — חוזרים אחרי קשר משמעותי", station: "starting-again" },
      { label: "בתוך קשר — רוצים להעמיק את מה שכבר יש", station: "inside-relationship" },
    ],
  },
  {
    id: "familiar",
    title: "מה מרגיש הכי מוכר בתקופה האחרונה?",
    options: [
      { label: "פוגשים אדם טוב, ומיד מחפשים מה חסר", station: "before-relationship" },
      { label: "החזרה להיכרויות מרגישה זרה, וקל לגרור את העבר", station: "starting-again" },
      { label: "נכנסה שגרה, וקל להניח שהקשר יחזיק את עצמו", station: "inside-relationship" },
    ],
  },
  {
    id: "draws",
    title: "מה הכי מדבר אליכם עכשיו?",
    options: [
      { label: "לבדוק קשר בפיכחון, בלי למהר להכתיר או לפסול", station: "before-relationship" },
      { label: "להבחין בין ניסיון שמגן לבין דפוס שסוגר", station: "starting-again" },
      { label: "לשמור על קרבה ותשוקה, ולבחור בקשר מחדש", station: "inside-relationship" },
    ],
  },
];

export const COMPASS_QUESTION_COUNT = COMPASS_QUESTIONS.length;

export interface CompassResult {
  /** התחנה שהותאמה. */
  station: CompassStationId;
  /** האם הייתה תיקו (יותר מתחנה אחת עם מספר הקולות הגבוה ביותר). */
  tie: boolean;
  /** אינדקסי שתי השאלות שהובילו לתוצאה (שני „הגורמים”). תמיד שניים. */
  factorIndices: number[];
}

/** האם אינדקס תשובה חוקי לשאלה. */
function isValidAnswer(qIndex: number, optIndex: number): boolean {
  const q = COMPASS_QUESTIONS[qIndex];
  return !!q && Number.isInteger(optIndex) && optIndex >= 0 && optIndex < q.options.length;
}

/**
 * מיפוי דטרמיניסטי: שלוש תשובות → תחנה + שני גורמים + דגל תיקו.
 *
 * הכרעה: התחנה עם מספר הקולות הגבוה ביותר. בתיקו (למשל 1-1-1) שובר-השוויון
 * הוא COMPASS_STATION_ORDER (הראשון מבין השווים). „שני הגורמים” הם שתי השאלות
 * שתשובתן הצביעה על התחנה המנצחת; אם פחות משתיים הצביעו (תיקו), משלימים לפי
 * סדר השאלות — כך שתמיד יש בדיוק שני גורמים.
 *
 * זורק על קלט לא-חוקי (אורך/טווח) — כדי שבדיקות יתפסו „תשובה חסרה”; שכבת
 * ה-persistence והרכיב מוודאים קלט חוקי לפני הקריאה.
 */
export function resolveCompass(answers: number[]): CompassResult {
  if (!Array.isArray(answers) || answers.length !== COMPASS_QUESTION_COUNT) {
    throw new Error(`resolveCompass: expected ${COMPASS_QUESTION_COUNT} answers`);
  }
  answers.forEach((a, i) => {
    if (!isValidAnswer(i, a)) {
      throw new Error(`resolveCompass: invalid answer ${a} for question ${i}`);
    }
  });

  const chosen = answers.map((a, i) => COMPASS_QUESTIONS[i].options[a].station);
  const counts = new Map<CompassStationId, number>(
    COMPASS_STATION_ORDER.map((s) => [s, 0]),
  );
  chosen.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));

  const max = Math.max(...COMPASS_STATION_ORDER.map((s) => counts.get(s) ?? 0));
  const tops = COMPASS_STATION_ORDER.filter((s) => (counts.get(s) ?? 0) === max);
  const station = tops[0];
  const tie = tops.length > 1;

  const pointing = [0, 1, 2].filter((i) => chosen[i] === station);
  const others = [0, 1, 2].filter((i) => chosen[i] !== station);
  const factorIndices = [...pointing, ...others].slice(0, 2);

  return { station, tie, factorIndices };
}

/** תווית התשובה שנבחרה לשאלה (לתצוגת „הגורמים”). */
export function answerLabel(qIndex: number, optIndex: number): string {
  return COMPASS_QUESTIONS[qIndex]?.options[optIndex]?.label ?? "";
}
