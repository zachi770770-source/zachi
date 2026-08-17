"""
Python mirror of isBlockedRequest() from
site/src/lib/compass/assistant/prompt.ts as merged to main (PR #63).

Book-protection / prompt-injection detection runs BEFORE retrieval, so the
benchmark measures block/extraction accuracy exactly as production would.
Keep in sync with prompt.ts if the production patterns change.
"""
from __future__ import annotations
import re
import unicodedata

_V = r"(סכם|סיכום|תקציר|תמצית|הצג|תציג|תראה|תן|כתוב|שלח|העתק|צטט|פרט|רשום|ספר)"

BLOCK_PATTERNS = [
    r"סכם\s+(לי\s+)?(את\s+)?(כל\s+)?הספר",
    r"סיכום\s+(של\s+)?(כל\s+)?הספר",
    r"תמצית\s+(של\s+)?הספר",
    r"תקציר\s+(של\s+)?הספר",
    r"על\s+מה\s+הספר",
    r"(סכם|סיכום|תקציר|תמצית|הצג|תציג|תראה|תן\s+לי|כתוב\s+לי)\s+(את\s+)?(ה)?פרק",
    r"פרק\s+שלם",
    r"כל\s+ה?פרק",
    r"(ה)?פרק\s+הבא",
    r"(^|\s)המשך(\s|$|[.!?,])",
    r"תמשיך\s+מ",
    r"(הקטע|הפסקה|החלק)\s+הבא",
    r"לפי\s+הסדר",
    # --- PR #63 extraction-block additions ---
    _V + r"(\s+\S+){0,3}?\s+(?:ב|ה|מ|ל)?פרק\s*\d+",
    _V + r"(\s+\S+){0,3}?\s+(מתוך\s+הספר|מהספר|של\s+הספר|מהחלק|מתוך\s+הפרק|מהפרק)",
    r"(קטע|קטעים|משפט|משפטים|פסקה|פסקאות|ציטוט|ציטוטים|שורה|שורות|עמוד|עמודים|תוכן)\s+(שלם\s+|שלמה\s+|מלא\s+|מלאה\s+)?(מתוך|מ)(ה)?(ספר|פרק|חלק)",
    r"(מה\s+)?(כתוב|יש|מופיע|נאמר)\s+.{0,8}?(?:ב|ה)?פרק\s*\d+",
    # --- principles / prompt-exfil / injection ---
    r"(רשימ[הת]|כל|תן\s+לי\s+את\s+כל)\s+.{0,12}עקרונות",
    r"כל\s+ה?עקרונות",
    r"system\s*prompt",
    r"(ה)?פרומפט",
    r"ההנחי(ות|ה)\s+שלך",
    r"הקטעים\s+הגולמיים",
    r"raw\s+(chunks|text|sections)",
    r"מסד\s+הנתונים",
    r"\bSQL\b",
    r"\bembedding",
    r"התעלם\s+מ(כל\s+)?(ה)?הוראות",
    r"ignore\s+(all\s+)?(previous|prior|the)",
    r"disregard\s+(the\s+)?(above|previous|instructions)",
    r"reveal\s+(your|the)\s+(system|prompt|instructions)",
    r"jailbreak",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in BLOCK_PATTERNS]


def is_blocked_request(q: str) -> bool:
    text = unicodedata.normalize("NFC", q or "")
    return any(rx.search(text) for rx in _COMPILED)
