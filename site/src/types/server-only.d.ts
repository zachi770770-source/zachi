// הצהרת טיפוס מינימלית עבור חבילת המרקר `server-only`.
// בזמן build של Next.js הייבוא `import "server-only"` נפתר לחבילה האמיתית
// ואוכף שהמודול לא ייכלל ב-Client Bundle. כאן אנו רק מספקים ל-TypeScript
// מודול ריק כך שבדיקת הטיפוסים לא תיכשל על ייבוא ללא טיפוסים.
declare module "server-only";
