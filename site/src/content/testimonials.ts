/**
 * המלצות קוראים אמיתיות בלבד. אין להוסיף כאן טקסט דוגמה, placeholder או
 * המלצות מומצאות בשום צורה. הרשימה מתחילה ריקה בכוונה.
 *
 * רכיב ההמלצות (Testimonials.tsx) נגזר ישירות מהנתונים כאן: הוא מוצג רק
 * כאשר קיימות לפחות שלוש המלצות שאושרו לפרסום. כל עוד אין שלוש מאושרות,
 * הרכיב אינו מרונדר כלל ואינו משאיר שטח ריק.
 *
 * להוספת המלצה אמיתית: הוסיפו אובייקט עם approvedForPublication: true
 * ו-displayOrder לקביעת הסדר.
 */

export type Testimonial = {
  /** הציטוט בלשון הקורא/ת. */
  quote: string;
  /** שם התצוגה (למשל שם פרטי, או שם פרטי ואות של שם המשפחה). */
  displayName: string;
  /** תיאור קצר של הקורא/ת (למשל „לפני קשר” או „אחרי גירושין”). */
  readerDescription: string;
  /** אישור פרסום מפורש. ללא אישור, ההמלצה לא תוצג לעולם. */
  approvedForPublication: boolean;
  /** סדר תצוגה (קטן = מוקדם). */
  displayOrder: number;
};

/** מספר ההמלצות המאושרות המינימלי הנדרש כדי להציג את הרכיב. */
export const TESTIMONIALS_MIN_TO_SHOW = 3;

/** רשימת ההמלצות. ריקה עד שיתקבלו המלצות אמיתיות ומאושרות. */
export const testimonials: Testimonial[] = [];

/** ההמלצות המאושרות בלבד, ממוינות לפי סדר התצוגה. */
export function approvedTestimonials(list: Testimonial[] = testimonials): Testimonial[] {
  return list
    .filter((t) => t.approvedForPublication && t.quote.trim().length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/** האם יש די המלצות מאושרות כדי להציג את הרכיב. */
export function hasEnoughTestimonials(list: Testimonial[] = testimonials): boolean {
  return approvedTestimonials(list).length >= TESTIMONIALS_MIN_TO_SHOW;
}
