# SETUP — הפעלה מלאה עם credentials

מסמך זה מסביר את שלבי ההפעלה האמיתיים של הכלי. ה-README מתאר את
ה-CLI; SETUP מסביר איך להביא אותו למצב שולח-בפועל.

---

## 1. בחירת backend

| מקרה שימוש | Backend | מה צריך |
|-------------|---------|---------|
| חשבון אישי Outlook.com / Hotmail | **SMTP** | App Password של Microsoft |
| Office 365 / Azure AD ארגוני, שליחה בשם משתמש קבוע | **Graph** | Azure App Registration עם `Mail.Send` (Application) |

- SMTP נכשל עם סיסמה רגילה — Microsoft חסמה Basic Auth. **חובה App
  Password** דרך Account → Security → Advanced → App passwords.
- Graph דורש **admin consent** על ההרשאה `Mail.Send`. משתמש רגיל לא
  יכול להעניק אותה לבד.

## 2. יצירת `.env`

```bash
cp .env.example .env
```

ערוך את `.env` והשאר רק את הבלוק שרלוונטי ל-backend שבחרת:

**SMTP:**
```env
BACKEND=smtp
SMTP_USER=you@outlook.com
SMTP_PASSWORD=<app-password>
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

**Graph:**
```env
BACKEND=graph
AZURE_TENANT_ID=<tenant-guid>
AZURE_CLIENT_ID=<client-guid>
AZURE_CLIENT_SECRET=<secret>
SENDER_EMAIL=sender@yourdomain.com
```

`.env` כבר ב-`.gitignore` — הוא לא ייעלה ל-Git.

## 3. תצוגה מקדימה בלי לשלוח (dry-run)

לפני שליחה אמיתית — כדאי להריץ dry-run כדי לוודא שהתבנית ורשימת
הנמענים תקינים. dry-run לא דורש credentials ולא פונה לרשת:

```bash
# תבנית + נמען יחיד
python main.py send-template --to "you@example.com" --subject "test" \
  --template welcome --name "ישראל" --message "בדיקה" --dry-run

# CSV שלם
python main.py bulk --csv contacts.csv --template welcome \
  --subject "test" --dry-run
```

הפלט מדפיס את הנמענים, תוכן ה-context, ותצוגה מקדימה של ה-HTML. אם
תבנית כלשהי חסרה משתנה — dry-run יזהה את זה מיד.

## 4. בדיקת חיבור עם `python main.py test`

⚠️ **אזהרה: `python main.py test` שולח אימייל אמיתי דרך ה-backend
המוגדר.** הוא דורש credentials תקפים ב-`.env`, ויוצר תעבורת רשת אל
Outlook/Azure. כתובת היעד היא כתובת השולח עצמה (SMTP_USER או
SENDER_EMAIL) — כלומר תקבל את מייל הבדיקה בתיבה שלך.

```bash
python main.py test
```

תוצאה תקינה:
```
✓ Test email sent to you@outlook.com
```

אם הפקודה נופלת — הודעת השגיאה מציינת אם זה credentials חסרים
(EnvironmentError), אימות שנדחה (SMTP: 535 / Graph: 401), או הרשאה
לא-מוענקת (Graph: 403 על `Mail.Send`).

## 5. שליחה בפועל

אחרי ש-`test` עבר, הכלי מוכן:

```bash
python main.py send --to "user@example.com" --subject "hi" --body "hello"
```

לשליחה המונית עם retries אוטומטיים על כישלונות זמניים:

```bash
python main.py bulk --csv contacts.csv --template welcome \
  --subject "welcome" --delay 1.0 --max-retries 2
```

---

## פתרון תקלות מהיר

| שגיאה | סיבה שכיחה |
|-------|------------|
| `SMTP_USER and SMTP_PASSWORD must be set` | `.env` לא נטען, או המשתנים ריקים |
| `535 5.7.139 Authentication unsuccessful` | סיסמה רגילה במקום App Password |
| `AADSTS7000215: Invalid client secret` | ה-secret ב-Azure פג / הועתק חלקית |
| `403 ErrorAccessDenied` (Graph) | חסר admin consent על `Mail.Send` |
| `Template failed for X` ב-dry-run | חסר משתנה ב-context שהתבנית משתמשת בו |
