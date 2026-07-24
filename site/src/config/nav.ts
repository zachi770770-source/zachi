export const navLinks = [
  { href: "/#thesis", label: "על הספר" },
  { href: "/#method", label: "השיטה" },
  { href: "/#sample", label: "טעימה" },
  { href: "/faq", label: "שאלות נפוצות" },
] as const;

export const footerLinks = {
  main: [
    { href: "/preview", label: "הצצה לספר" },
    { href: "/author", label: "מאחורי הספר" },
    { href: "/faq", label: "שאלות נפוצות" },
    { href: "/contact", label: "יצירת קשר" },
  ],
  legal: [
    { href: "/terms", label: "תקנון" },
    { href: "/privacy", label: "מדיניות פרטיות" },
    { href: "/shipping-returns", label: "מדיניות מוצר, משלוחים וביטולים" },
  ],
};
