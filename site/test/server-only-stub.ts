// Stub ריק עבור חבילת `server-only` בסביבת הבדיקות (Vitest).
//
// בזמן build של Next.js הייבוא `import "server-only"` נפתר לתנאי react-server
// ואוכף שהמודול אינו נכלל ב-Client Bundle. תחת Vitest אין תנאי react-server,
// ולכן ה-entry ברירת המחדל של החבילה זורק במכוון. אנו ממפים אותו כאן למודול
// ריק כדי שניתן יהיה לבדוק מודולים שרתיים בלי לשבור את גבול השרת בפועל.
export {};
