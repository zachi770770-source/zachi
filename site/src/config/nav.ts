export const navLinks = [
  { href: "/author", label: "על המחבר" },
  { href: "/book", label: "הספר" },
  { href: "/compass", label: "שאל את הספר" },
  { href: "/preview", label: "טעימה" },
  { href: "/faq", label: "שאלות נפוצות" },
] as const;

export const footerLinks = {
  main: [
    { href: "/compass", label: "שאל את הספר" },
    { href: "/preview", label: "טעימה מהספר" },
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
