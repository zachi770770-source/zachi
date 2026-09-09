/**
 * הניווט הראשי — **הספר בלבד**.
 *
 * ‎/compass ירד מכאן. פריט-תפריט ראשי מצהיר „זה אחד מחמשת הדברים שהאתר הזה
 * עושה”, וכשאחד מהם היה שאלון, המסר היה שהאתר מאבחן קשרים. הכלי לא הוסר —
 * הוא ירד לשכבה שאליה הוא שייך: פוטר + דלת אחת מסומנת בגוף העמוד
 * (`DeeperEntry`). ארבעה פריטים + כפתור-רכישה, כולם על המוצר עצמו.
 */
export const navLinks = [
  { href: "/author", label: "על המחבר" },
  { href: "/book", label: "הספר" },
  { href: "/preview", label: "טעימה" },
  { href: "/faq", label: "שאלות נפוצות" },
] as const;

export const footerLinks = {
  main: [
    { href: "/love", label: "מהי אהבה" },
    // הכלי נשאר נגיש — בפוטר, בשמו האמיתי.
    { href: "/compass", label: "איפה להתחיל בספר?" },
    { href: "/preview", label: "טעימה מהספר" },
    { href: "/reader", label: "ערכת הקורא" },
    { href: "/author", label: "מאחורי הספר" },
    { href: "/faq", label: "שאלות נפוצות" },
    { href: "/contact", label: "יצירת קשר" },
  ],
  legal: [
    { href: "/terms", label: "תקנון" },
    { href: "/privacy", label: "מדיניות פרטיות" },
    { href: "/shipping-returns", label: "מדיניות מוצר, משלוחים וביטולים" },
    { href: "/accessibility", label: "הצהרת נגישות" },
  ],
};
