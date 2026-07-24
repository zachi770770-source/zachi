export const navLinks = [
  { href: "/#big-idea", label: "על הספר" },
  { href: "/#method", label: "מה תלמדו" },
  { href: "/preview", label: "הצצה לספר" },
  { href: "/author", label: "על המחבר" },
  { href: "/faq", label: "שאלות נפוצות" },
] as const;

export const footerLinks = {
  main: [
    { href: "/preview", label: "הצצה לספר" },
    { href: "/author", label: "על המחבר" },
    { href: "/faq", label: "שאלות נפוצות" },
    { href: "/contact", label: "יצירת קשר" },
  ],
  legal: [
    { href: "/terms", label: "תקנון" },
    { href: "/privacy", label: "מדיניות פרטיות" },
    { href: "/shipping-returns", label: "משלוחים, ביטולים והחזרות" },
  ],
};
