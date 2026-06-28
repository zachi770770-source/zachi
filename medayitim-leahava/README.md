# מדייטים לאהבה

מערכת עבודה אישית לבניית קשר בריא — מהדייט הראשון ועד אהבה יציבה.

אפליקציית ווב בעברית (RTL), מבוססת כלי חשיבה מובנים. **זו אינה אפליקציית היכרויות ואינה צ׳אטבוט** — אלא כלי לרפלקציה מודרכת שעוזר לעבור מבלבול בדייטים לבנייה בוגרת של אהבה.

> הכלים כאן נועדו לעזור לחשוב בבהירות ולבחור בבגרות. הם אינם מהווים ייעוץ או טיפול פסיכולוגי ואינם תחליף לעזרה מקצועית. במצבים של אלימות, פחד, שליטה, השפלה או סכנה — יש לפנות לעזרה מקצועית.

---

## מה נבנה

**עמודים**
- `/` — דף נחיתה (Hero, הסבר, כרטיסי כלים, פוטר)
- `/login`, `/signup` — הרשמה וכניסה (Supabase Auth, אימייל/סיסמה)
- `/dashboard` — מסך הבית: ברכה, בחירת שלב בקשר, CTA, גישה מהירה, רשומות יומן אחרונות
- `/situation` — תיאור מצב מודרך + הצעת כלי מתאים לפי שלב ועוצמה רגשית
- `/tools` — ספריית הכלים
- `/journal` + `/journal/[id]` — יומן קשר עם סינון (לפי כלי / שלב / תאריך) ועמוד פירוט
- `/settings` — פרופיל, שלב בקשר, התנתקות, מחיקת חשבון (placeholder)

**כלים (`/tools/...`)**
1. `fact-story-action` — עובדה·סיפור·פעולה
2. `three-gates` — מבחן שלושת השערים (5 קטגוריות × 3 שאלות, חישוב ממוצע ושיקוף)
3. `safe-silence` — שקט בטוח מול שקט מת
4. `maintenance-20` — תחזוקת ה־20 (צ׳ק-ליסט שבועי)
5. `72-hours` — נוהל 72 שעות (כולל הערת בטיחות)

**ארכיטקטורה**
- Next.js (App Router) + TypeScript + Tailwind CSS v4
- Supabase ל-Auth ולמסד נתונים, עם RLS מלא
- RTL גלובלי, עיצוב mobile-first, פלטה חמה ורגועה
- רכיבים לשימוש חוזר: `Button`, `Card`, `Input`, `Textarea`, `Select`, `RatingScale`, `ToolHeader`, `SaveButton`, `EmptyState`, `JournalEntryCard`
- מסלולים מוגנים דרך `middleware.ts`
- מצבי טעינה, שגיאה, ולידציית טפסים
- מוכן להוספת AI בעתיד (השכבה של עיבוד מצבים והצעת כלים מופרדת ב־`src/lib`)

---

## הרצה מקומית

דרישות מוקדמות: Node.js 18.18+ (מומלץ 20+), חשבון [Supabase](https://supabase.com).

```bash
# 1. התקנת תלויות
npm install

# 2. הגדרת משתני סביבה
cp .env.example .env.local
# ערכו את .env.local עם הפרטים מפרויקט ה-Supabase (ראו למטה)

# 3. הרצת מסד הנתונים — הריצו את supabase/migration.sql ב-SQL Editor של Supabase

# 4. הרצה בפיתוח
npm run dev
# פתחו http://localhost:3000
```

סקריפטים נוספים:
```bash
npm run build      # בנייה לפרודקשן
npm run start      # הרצת build
npm run typecheck  # בדיקת טיפוסים
```

---

## משתני סביבה נדרשים

הערכים נמצאים ב-Supabase: **Project Settings → API**.

| משתנה | תיאור |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | כתובת ה-URL של פרויקט Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מפתח ה-anon הציבורי (מוגן ע"י RLS) |

---

## הגדרת Supabase

1. צרו פרויקט חדש ב-Supabase.
2. פתחו **SQL Editor** והריצו את התוכן של [`supabase/migration.sql`](./supabase/migration.sql).
   המיגרציה יוצרת את הטבלאות `profiles`, `situations`, `tool_entries`, `weekly_maintenance`,
   מפעילה RLS עם מדיניות "כל משתמש רואה/עורך רק את השורות שלו",
   ומוסיפה טריגר שיוצר שורת פרופיל אוטומטית בהרשמה.
3. תחת **Authentication → Providers** ודאו ש-Email מופעל.
   לבדיקות מהירות אפשר לכבות *Confirm email* (Authentication → Sign In / Providers).
4. אם *Confirm email* מופעל — תחת **Authentication → URL Configuration** הוסיפו ל-**Redirect URLs**
   את הכתובת `http://localhost:3000/auth/callback` (ובפרודקשן את כתובת הדומיין המקבילה).
   האפליקציה כוללת route ב-`/auth/callback` שמבצע `exchangeCodeForSession` ומפנה בחזרה לאזור האישי.

---

## הצעדים הבאים (Roadmap)

- שכבת AI אופציונלית: סיכום מצבים, ניסוח עדין של "פעולה בוגרת", זיהוי דפוסים חוזרים ביומן.
- תזכורות שבועיות לתחזוקת ה-20.
- ייצוא היומן.
- מצב כהה ושיפורי נגישות נוספים.
- מחיקת חשבון מלאה (כרגע placeholder).
