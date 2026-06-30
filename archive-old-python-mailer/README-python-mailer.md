# Outlook Email Automation

כלי Python לשליחת אימיילים דרך Outlook/Office 365 עם תמיכה ב:
- **SMTP** — לחשבונות Outlook.com / Hotmail
- **Microsoft Graph API** — לחשבונות Office 365 / Azure AD

---

## התקנה

```bash
pip install -r requirements.txt
cp .env.example .env
# ערוך את .env עם הפרטים שלך
```

---

## הגדרת `.env`

### שיטה 1: SMTP (Outlook.com / Hotmail)

```env
BACKEND=smtp
SMTP_USER=your_email@outlook.com
SMTP_PASSWORD=your_app_password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
```

> **הערה:** Microsoft חסמה כניסה עם סיסמה רגילה. יש להפעיל **App Password**:  
> Account Settings → Security → Advanced Security → App passwords

### שיטה 2: Microsoft Graph API (Office 365)

1. פתח [Azure Portal](https://portal.azure.com) → **App registrations** → **New registration**
2. תחת **API permissions** הוסף: `Mail.Send` (Application permission)
3. לחץ **Grant admin consent**
4. צור **Client secret** תחת **Certificates & secrets**

```env
BACKEND=graph
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-value
SENDER_EMAIL=sender@yourdomain.com
```

---

## שימוש

### שליחת אימייל פשוט

```bash
# טקסט רגיל
python main.py send --to "user@example.com" --subject "שלום" --body "מה שלומך?"

# HTML
python main.py send --to "user@example.com" --subject "שלום" --body "<h1>שלום!</h1>" --html

# עם קבצים מצורפים
python main.py send --to "user@example.com" --subject "דוח" --body "ראה מצורף" \
  --attach report.pdf invoice.xlsx

# עם CC ו-BCC
python main.py send --to "user@example.com" --subject "שלום" --body "גוף" \
  --cc "mgr@example.com" --bcc "audit@example.com"
```

### שליחה עם תבנית (Jinja2)

```bash
# תבנית פשוטה
python main.py send-template \
  --to "user@example.com" \
  --subject "ברוך הבא!" \
  --template welcome \
  --name "ישראל" \
  --message "תודה שנרשמת לשירות."

# עם הקשר מלא ב-JSON
python main.py send-template \
  --to "user@example.com" \
  --subject "ברוך הבא!" \
  --template welcome \
  --context '{"name": "ישראל", "message": "ברוך הבא!", "action_url": "https://example.com"}'
```

### שליחה המונית מ-CSV

הכן קובץ `contacts.csv`:

```csv
email,name,message
user1@example.com,ישראל,ברוך הבא לשירות
user2@example.com,שרה,תודה על הרשמתך
```

```bash
python main.py bulk \
  --csv contacts.csv \
  --template welcome \
  --subject "ברוך הבא!" \
  --delay 1.0
```

### בדיקת החיבור

```bash
python main.py test
```

---

## יצירת תבניות מותאמות אישית

צור קבצים בתיקיית `templates/`:
- `my_template.html` — גרסת HTML (עם Jinja2)
- `my_template.txt` — גרסת טקסט רגיל

```html
<!-- templates/my_template.html -->
<h1>שלום {{ name }}</h1>
<p>{{ message }}</p>
```

שימוש:
```bash
python main.py send-template --to "user@example.com" --subject "נושא" \
  --template my_template --name "ישראל" --message "הודעה"
```

---

## שימוש כספריה

```python
from outlook_mailer import Mailer, BulkSender

mailer = Mailer()

# שליחה פשוטה
mailer.send(
    to=["user@example.com"],
    subject="שלום",
    body_html="<p>הודעה</p>",
)

# שליחה עם תבנית
mailer.send_template(
    to="user@example.com",
    subject="ברוך הבא",
    template_name="welcome",
    context={"name": "ישראל", "message": "ברוך הבא!"},
)

# שליחה המונית
sender = BulkSender(mailer, delay=0.5)
results = sender.send_from_csv(
    csv_path="contacts.csv",
    template_name="welcome",
    subject="ברוך הבא!",
)
print(results)  # {"success": [...], "failed": [...]}
```
