# Phase 2 — מדריך הפעלה

הקוד של Phase 2 כבר ב-repo. כדי להפעיל אותו (RAG + Claude אמיתי במקום Mock), צריך לבצע שלושה דברים בלבד:

---

## 1. הקמת Supabase

### א. צור project חדש
1. כנס ל-https://supabase.com/dashboard עם המייל **zachicoach@gmail.com**.
2. New project → בחר שם (למשל `midatim-leahavah`), region קרובה (Frankfurt או Mumbai), והגדר סיסמת DB.
3. המתן 2-3 דקות לאתחול.

### ב. הפעל את הרחבת pgvector
1. בתפריט הצדדי: **Database** → **Extensions**.
2. חפש `vector` והפעל אותו.

### ג. הרץ את שלושת ה-migrations
1. בתפריט הצדדי: **SQL Editor** → **New query**.
2. הדבק את התוכן של `supabase/migrations/0001_initial_schema.sql` → Run.
3. חזור על אותו דבר עם `0002_row_level_security.sql` ו-`0003_rag_search_function.sql`.

### ד. אסוף 3 ערכים שתצטרך עוד מעט
מתפריט הצדדי: **Settings** → **API**:
- `Project URL` → ערך של `NEXT_PUBLIC_SUPABASE_URL`
- `Project API keys → anon (public)` → ערך של `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `Project API keys → service_role (secret)` → ערך של `SUPABASE_SERVICE_ROLE_KEY` ⚠️ סודי

---

## 2. הוספת מפתחות API ל-Vercel

ב-https://vercel.com/<your-account>/zachi → **Settings** → **Environment Variables**.
הוסף את הבאים (לכל אחד — סמן את כל הסביבות: Production, Preview, Development):

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | מ-Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | מ-Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | מ-Supabase API settings (סודי!) |
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/account/keys |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys (רק ל-embeddings ב-RAG) |
| `AI_PROVIDER` | `claude` |
| `ANTHROPIC_MODEL` | `claude-opus-4-8` (אופציונלי, ברירת מחדל) |

> **חשוב**: לעולם אל תשתף את `SUPABASE_SERVICE_ROLE_KEY` ואת `ANTHROPIC_API_KEY` בצ'אט, ב-PRs או ב-screenshots. Vercel הם הביתם.

---

## 3. אינדוקס הספר ל-RAG

זה פעולה חד פעמית. מריצים אחרי שה-DB מוכן ו-ENV מוגדר.

### אפשרות א — מקומי (מומלץ)
```bash
# במחשב שלך, אחרי git clone של הפרויקט:
npm install

# צור קובץ .env.local עם 4 הערכים:
echo "NEXT_PUBLIC_SUPABASE_URL=..." > .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=..." >> .env.local
echo "OPENAI_API_KEY=..." >> .env.local

# הרץ את האינדוקס
npm run index:book
```

הסקריפט:
1. קורא את `content/book/manuscript.txt`
2. מחלק ל-304 chunks סמנטיים (כל אחד 300-700 תווים)
3. מחשב embedding לכל chunk (OpenAI)
4. שומר ב-Supabase pgvector

זמן: ~1-2 דקות. עלות OpenAI: ~$0.005 (חצי סנט).

### אפשרות ב — GitHub Actions (אוטומטי בעתיד)
אפשר להוסיף workflow שמריץ אינדוקס בכל push ל-`content/book/manuscript.txt`. לא הוכן ב-MVP, נוסיף אם תרצה.

---

## 4. הפעלה ובדיקה

אחרי שהשלמת את 3 השלבים:

1. ב-Vercel → **Deployments** → trigger redeploy (או pushe שיגרום ל-rebuild אוטומטי).
2. פתח את ה-Preview URL.
3. עבור ל-`/coach`.
4. בחר אינטנט, שלח שאלה.

אם משהו לא עובד, בדוק:
- Vercel logs (Project → Logs)
- Browser console
- האם `book_chunks` מכיל ~300 שורות (`select count(*) from book_chunks` ב-Supabase SQL Editor)

---

## מה עוד נשאר ב-Phase 2 (אופציונלי, כשתגיע אליו)

- **Auth (Guest mode)** — להוסיף Magic Link / Google login כדי שמשתמשים יוכלו לסנכרן זיכרון בין מכשירים. הקוד מוכן (`SupabaseMemoryService`), צריך רק לחבר.
- **Streaming responses** — Claude תומך ב-streaming, אבל ב-MVP אנחנו מחזירים תשובה שלמה. ברגע שתרצה — אוסיף.
- **Conversation summaries** — לכל שיחה ארוכה, סיכום קצר שעובר ל-Memory הבאה. נוסיף אם תרצה.

---

## מה ה-Phase הזה לא עושה (השאר ל-Phase 3)

- **PostHog Analytics** — תשתית מוכנה, צריך רק API key.
- **Free/Premium** — תשתית מוכנה, צריך Stripe + UI ל-pricing.
- **Streaming + Real-time** — Coach UI כבר תומך, נחבר ב-Phase 3.
