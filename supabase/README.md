# Supabase setup — Phase 2

המיגרציות בתיקייה זו מקימות את ה-backend המלא של "מדייטים לאהבה".

## Files

- `0001_initial_schema.sql` — טבלאות (auth profiles, diagnoses, patterns, tools, conversations, memory, goals, entitlements, book_chunks, safety, analytics)
- `0002_row_level_security.sql` — RLS policies. כל משתמש קורא וכותב רק את הנתונים שלו.
- `0003_rag_search_function.sql` — `match_book_chunks()` ל-RAG retrieval.

## איך מריצים

### דרך Supabase Dashboard
1. SQL Editor → New query
2. הדבק תוכן של `0001_initial_schema.sql` → Run
3. חזור על אותו דבר עם `0002_*` ו-`0003_*`

### דרך Supabase CLI (מומלץ ל-CI)
```bash
supabase link --project-ref <your-ref>
supabase db push
```

### חובה: התקן extension pgvector
Database → Extensions → חפש `vector` → הפעל.
(Supabase תומך ב-pgvector בכל project חדש; אם זה לא מופיע, וודא ש-Postgres ≥ 15.)

## אחרי המיגרציות

```bash
npm run index:book   # מאכלס את book_chunks
```

ENV נדרש להרצה:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY` (לחישוב embeddings — האפליקציה עצמה לא צריכה אותו אחר כך)
