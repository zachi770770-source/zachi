// ניווט עליון — כל פריט גלוי מנווט לעמוד אמיתי, נבדל ומשמעותי (ללא עוגני #).
// חמישה יעדים ייחודיים: /author, /book, /compass, /preview, /faq. קישור
// הדילוג #main-content מוחרג ואינו חלק מכאן.
export const navLinks = [
  { href: "/author", label: "על המחבר" },
  { href: "/book", label: "הספר" },
  { href: "/compass", label: "שאלו את הספר" },
  { href: "/preview", label: "טעימה" },
  { href: "/faq", label: "שאלות נפוצות" },
] as const;

export const footerLinks = {
  main: [
    { href: "/compass", label: "שאלו את הספר" },
    { href: "/preview", label: "הצצה לספר" },
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
