# Search Console baseline — 31.08–27.09.2026

נקודת ההשוואה לתקופת 28 הימים הבאה (28.09–25.10.2026). כל המספרים כאן הועתקו מנתוני Search Console של `sc-domain:zachi.co.il` (דרך Windsor.ai) — שום ערך לא הוערך או הושלם.

| | |
|---|---|
| קוד באוויר בזמן ה-baseline | main `a820b9d` (merge של PR #142, 27.09) — Production `dpl_A3ApQ4TpYi1j3WNWeCU76Bi3nRSz` |
| תקופה נוכחית | 31.08–27.09.2026 |
| תקופה קודמת | 03.08–30.08.2026 |
| לפני 03.08 | אפס חשיפות (סכום שתי התקופות שווה בדיוק לסיכום 3 החודשים) |

## קבצים
| קובץ | מה יש בו | מקור |
|---|---|---|
| `totals.csv` | סיכום האתר ל-28 יום נוכחיים, 28 יום קודמים ו-3 חודשים | GSC Performance |
| `query-page-country.tsv` | 67 שורות Query × Page × Country לשתי התקופות | GSC, אחרי privacy thresholding |
| `query-page-classified.csv` | אותן שורות עם cluster, עמוד יעד וסיווג | ניתוח |
| `pages-current-28d-partial.csv` | 10 עמודים (18 מתוך 19 הקליקים) לתקופה הנוכחית | GSC Pages, **חלקי** |
| `site-snapshot-a820b9d.csv` | מצב טכני של 52 כתובות ב-main `a820b9d` | סריקת build של main |
| `keyword-clusters.csv` | ביטויים, clusters ועמוד היעד המוגדר | קוד + audit |

## מגבלות שחשוב לזכור בהשוואה
- שורות ה-Query מכסות רק 25% מהחשיפות בתקופה הנוכחית (103/418) ו-60% בקודמת (147/244), ואף אחד מ-19 הקליקים הנוכחיים. אין להשוות סכומי שורות בין תקופות.
- `pages-current-28d-partial.csv` חלקי: חסרים העמוד עם הקליק ה-19, כל העמודים עם חשיפות ובלי קליקים, מיקום לשלושה עמודים, וכל נתוני התקופה הקודמת לפי עמוד. הקובץ המלא (`zachi_gsc_pages_28d_compare_2026-09-29.xlsx`) צריך להתווסף לכאן.
- Page Indexing לא נכלל (לא זמין דרך Windsor).
- PR #142 מוזג ב-27.09, היום האחרון בתקופה. כל השפעה שלו תופיע רק בתקופה הבאה. עמודים שהוא שינה: `/`, `/building-relationship`, `/starting-again`, `/after-breakup`, `/guide/from-dating-to-relationship`, `/guide/relationship-doubts`, `/guide/how-to-end-a-relationship`, `/en`, `/reader`, `/compass`, `/author`.
- שאילתה אחת שהייתה שם של אדם פרטי הוחלפה ב-`[redacted: personal name]` (1 חשיפה, מקום 70, `/before-relationship`). הריפו ציבורי. המספרים לא שונו.

## שינויים שנכנסו אחרי ה-baseline
כדי שבהשוואה הבאה אפשר יהיה להפריד בין השפעות:

| תאריך | שינוי | עמודים | commit |
|---|---|---|---|
| 27.09.2026 | PR #142: תיקוני SEO טכניים, שינוי hub לשני מדריכים, titles ל-relationship-doubts ול-/en, קישורים פנימיים | ראו רשימה למעלה | merge `a820b9d` |
| 29.09.2026 | מקטע חדש ב-attachment-styles: תיאוריית ההתקשרות וארבעת הדפוסים (title, description ו-H1 לא שונו; `dateModified` = 2026-09-29) | `/guide/attachment-styles` בלבד | `9aae85f` |

## להשוואה ב-25.10
להוציא את אותם דוחות לאותם אורכי תקופה (28 יום): Performance סיכום, Pages, Query × Page × Country, ובנוסף Page Indexing.
