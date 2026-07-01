# SUPABASE_SETUP — הפעלה עם פרויקט Supabase קיים

מסמך זה מנחה שלב-שלב איך להוציא את אפליקציית **מדייטים לאהבה** ממצב
*code-complete/infrastructure-untested* אל *end-to-end verified* מול
פרויקט Supabase אמיתי, כולל בדיקות שכל שלב עבד בפועל.

⚠️ **אל תכניסו secrets לצ׳אטים, ל-Git או ל-README.** `.env.local` הוא
מקומי בלבד ו-`.gitignore` כבר מסמן אותו להתעלמות.

---

## סקירה — סדר השלבים

1. [איסוף ה-credentials מ-Supabase](#1-איסוף-ה-credentials-מ-supabase)
2. [יצירת `.env.local`](#2-יצירת-envlocal)
3. [הרצת המיגרציה](#3-הרצת-המיגרציה)
4. [אימות שהמיגרציה הצליחה](#4-אימות-שהמיגרציה-הצליחה)
5. [הגדרת Auth ו-Redirect URLs](#5-הגדרת-auth-ו-redirect-urls)
6. [הרצה מקומית + בדיקת signup אמיתי](#6-הרצה-מקומית--בדיקת-signup-אמיתי)
7. [בדיקת journal / tool entry / export / delete](#7-בדיקת-journal--tool-entry--export--delete)
8. [סימון האפליקציה כמאומתת מקצה-לקצה](#8-סימון-האפליקציה-כמאומתת-מקצה-לקצה)

---

## 1. איסוף ה-credentials מ-Supabase

בפרויקט הקיים ב-[dashboard של Supabase](https://supabase.com/dashboard):

| ערך | היכן למצוא |
|-----|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** — פורמט `https://<ref>.supabase.co`. פומבי, בטוח בצד לקוח. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Project Settings → API → Project API keys → `anon` `public`** — פומבי; ההגנה על נתונים היא באמצעות RLS. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → Project API keys → `service_role` `secret`** — 🔴 **צד שרת בלבד.** עוקף RLS. שימש רק ב-`src/app/api/account/delete/route.ts` למחיקת רשומת ה-auth. אל תשלח אותו בצ׳אט, אל תדחוף ל-Git, ואל תגדיר עם קידומת `NEXT_PUBLIC_`. |

**גיבוי אבטחה קיים בקוד**: `src/lib/supabase/admin.ts:1` מייבא את החבילה
`server-only` — אם בטעות מישהו ייבא את `createAdminClient` לתוך רכיב
Client Component, `next build` ייכשל. אין אפשרות בטעות לחשוף אותו ללקוח.

## 2. יצירת `.env.local`

בתיקיית `medayitim-leahava/`:

```bash
cp .env.example .env.local
```

ערוך `.env.local` והכנס את הערכים מסעיף 1. הקובץ כבר מסומן להתעלמות
דרך `.gitignore` — לא ייכנס ל-Git.

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key מלא>
SUPABASE_SERVICE_ROLE_KEY=<service role key מלא>
```

**בדיקה שהקובץ אכן מחוץ ל-Git:**

```bash
git check-ignore .env.local   # אמור להדפיס: .env.local
git ls-files | grep '\.env'   # אמור להדפיס רק .env.example
```

## 3. הרצת המיגרציה

הקובץ `supabase/migration.sql` (161 שורות) יוצר את הסכימה המלאה:
4 טבלאות, RLS, אינדקסים, וטריגר.

**שיטה מומלצת — SQL Editor:**

1. Dashboard → **SQL Editor** → **New query**.
2. פתח את `medayitim-leahava/supabase/migration.sql`, העתק את כולו.
3. הדבק ב-SQL Editor → **Run**.

**חלופה — Supabase CLI (אם מותקן):**

```bash
supabase db push < supabase/migration.sql
```

## 4. אימות שהמיגרציה הצליחה

עבור לכל אחד מהבדיקות הבאות ב-SQL Editor. כל אחת מהן צריכה להחזיר את
המצב הצפוי:

**א. הטבלאות קיימות:**

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'situations', 'tool_entries', 'weekly_maintenance')
ORDER BY table_name;
```
✅ צפוי: 4 שורות (`profiles`, `situations`, `tool_entries`, `weekly_maintenance`).

**ב. RLS מופעל על כולן:**

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'situations', 'tool_entries', 'weekly_maintenance');
```
✅ צפוי: `rowsecurity = true` בכל 4 השורות.

**ג. Policies קיימות:**

```sql
SELECT tablename, COUNT(*) AS policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
```
✅ צפוי: `profiles`=3, `situations`=4, `tool_entries`=4, `weekly_maintenance`=4 (SELECT/INSERT/UPDATE/DELETE per user).

**ד. הטריגר הותקן:**

```sql
SELECT tgname FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```
✅ צפוי: שורה אחת. הטריגר הזה יוצר שורת `profiles` אוטומטית כשמשתמש נרשם.

אם בדיקה כלשהי מהארבע נכשלה — עצור, אל תמשיך לסעיף 6. הרץ את המיגרציה
מחדש ובדוק אם היא זרקה שגיאות.

## 5. הגדרת Auth ו-Redirect URLs

בפרויקט Supabase:

1. **Authentication → Providers → Email** — ודא ש-Email מופעל.
2. **לצורך בדיקת signup ראשונית**, כדאי לכבות זמנית את *Confirm email*
   (Authentication → Sign In / Providers → Email → Confirm email — Off).
   זה מאפשר לך להירשם ולהיכנס מיד בלי המתנה למייל.
3. **אם *Confirm email* מופעל**: Authentication → **URL Configuration** →
   **Redirect URLs** → הוסף:
   ```
   http://localhost:3000/auth/callback
   ```
   וגם, אם תפרסם לדומיין אמיתי: `https://<your-domain>/auth/callback`.
   בלי זה — קישור האישור במייל ייחסם על ידי Supabase.

## 6. הרצה מקומית + בדיקת signup אמיתי

```bash
cd medayitim-leahava
npm install
npm run dev
# פתח http://localhost:3000
```

**flow הבדיקה:**

1. עבור ל-`/signup` — מלא שם, אימייל וסיסמה, שלח.
2. אם *Confirm email* כבוי — תופנה מיד ל-`/dashboard`.
3. אם *Confirm email* דלוק — תקבל מייל, לחץ על הקישור, אמור להגיע
   ל-`/auth/callback` ומשם ל-`/dashboard`.

**בדיקת DB לאחר signup:**

חזור ל-SQL Editor והרץ:

```sql
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 1;
SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 1;
```
✅ צפוי:
- שורה אחת ב-`auth.users` עם האימייל שלך.
- שורה אחת ב-`public.profiles` עם אותו `id` (הטריגר עשה את זה — לא הקוד).
  אם `profiles` ריק, הטריגר לא רץ; חזור לסעיף 4 בדיקה ד.

## 7. בדיקת journal / tool entry / export / delete

לאחר signup מוצלח:

**א. יצירת situation (מסלול journal):**
1. `/situation` → מלא כותרת + תיאור + בחר שלב + עוצמה רגשית → שמור.
2. אמור להפנות אותך ל-`/journal/situation-<id>` עם הפרטים.
3. SQL: `SELECT * FROM public.situations ORDER BY created_at DESC LIMIT 1;`
   ✅ שורה חדשה עם `user_id` תואם.

**ב. יצירת tool entry:**
1. `/tools/three-gates` → מלא את 5 השערים (או כל כלי אחר) → שמור.
2. אמור להפנות ל-`/journal/tool-<id>`.
3. SQL: `SELECT tool_name, data FROM public.tool_entries ORDER BY created_at DESC LIMIT 1;`
   ✅ שורה חדשה עם `tool_name='three-gates'` ו-`data` JSONB מלא.

**ג. Journal (רשימה):**
1. `/journal` — אמור להראות את שתי הרשומות (situation + tool_entry).
2. אמור לאפשר סינון ולנווט לפרטי כל רשומה.

**ד. Export:**
1. `/settings` → לחץ **ייצוא נתונים** (או קרא ישירות ל-`/api/account/export`).
2. אמור להוריד קובץ JSON עם `profile`, `situations`, `tool_entries`,
   `weekly_maintenance`, ו-`account.email`.
3. פתח את הקובץ — ודא שהרשומות שיצרת ב-א'/ב' מופיעות בו.

**ה. Delete:**

⚠️ **פעולה בלתי הפיכה** — עשה זאת רק על חשבון בדיקה, לא על משתמש אמיתי.

1. `/settings` → **מחיקת חשבון** → אשר.
2. אמור לצאת מהחשבון ולהחזיר אותך למסך התחברות.
3. SQL בדיקה:
   ```sql
   SELECT COUNT(*) FROM auth.users WHERE email = '<test email>';
   SELECT COUNT(*) FROM public.profiles WHERE id = '<test user id>';
   SELECT COUNT(*) FROM public.situations WHERE user_id = '<test user id>';
   SELECT COUNT(*) FROM public.tool_entries WHERE user_id = '<test user id>';
   ```
   ✅ צפוי: כל אחד מחזיר `0`.

   אם `auth.users` עדיין מכיל שורה: `SUPABASE_SERVICE_ROLE_KEY` לא הוגדר
   ב-`.env.local`, ולכן מחיקת ה-auth user נדלגה (הקוד degrade-ל-null
   בכוונה). אין תקלה — אבל חובה להשלים את המפתח כדי לומר "delete עובד
   מקצה-לקצה".

## 8. סימון האפליקציה כמאומתת מקצה-לקצה

**רק** אחרי שכל אחד מהצ׳ק-בוקסים הבאים אושר בפועל בסביבה חיה:

- [ ] סעיף 4 (בדיקות מיגרציה א–ד) — הצליחו
- [ ] סעיף 6 (signup ויצירת profile אוטומטי) — הצליח
- [ ] סעיף 7.א (situation נשמר וב-DB) — הצליח
- [ ] סעיף 7.ב (tool entry נשמר וב-DB) — הצליח
- [ ] סעיף 7.ג (journal מציג את שתי הרשומות) — הצליח
- [ ] סעיף 7.ד (export מוריד JSON עם הרשומות) — הצליח
- [ ] סעיף 7.ה (delete מנקה את כל השורות + auth user) — הצליח

רק אז מוצדק לומר שהאפליקציה **verified end-to-end** מול Supabase.

---

## פתרון תקלות נפוצות

| תסמין | סיבה סבירה | פעולה |
|-------|-----------|--------|
| signup נכשל עם `Invalid API key` | ה-anon key שגוי או חסר ב-`.env.local` | חזור לסעיף 1 |
| signup הצליח אך `dashboard` נופל על profile חסר | הטריגר לא רץ (המיגרציה לא הושלמה) | בדוק סעיף 4 ד; הרץ מחדש את סעיף `create trigger on_auth_user_created` |
| Redirect URL error במייל האישור | לא הוגדר `http://localhost:3000/auth/callback` תחת Redirect URLs | חזור לסעיף 5 |
| הרשומות שיצרת לא מופיעות ב-journal של משתמש אחר | תקין — RLS עובד כמצופה | — |
| delete מוחק את הנתונים אבל auth user נשאר | `SUPABASE_SERVICE_ROLE_KEY` חסר | הוסף למ-`.env.local`, אתחל את שרת ה-dev |
| build ב-Next נכשל: `admin.ts` נטען ב-client | מישהו ייבא את `createAdminClient` מתוך `"use client"` | חפש `createAdminClient` מחוץ ל-`src/app/api/`; ה-import חייב להיות רק בקוד שרת |
