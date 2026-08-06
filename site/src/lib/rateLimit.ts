/**
 * Rate limiting מבוסס-זיכרון (sliding window) לפי מפתח (בדרך כלל IP).
 *
 * ⚠️ זו הגנת best-effort *per-instance בלבד* — לא הגבלת-קצב מבוזרת/מלאה
 * לפרודקשן. המונים חיים בזיכרון של ה-instance הנוכחי ואינם משותפים בין
 * instances מרובים (או cold-starts) בפריסת serverless; תוקף שמפוזר על פני
 * instances יכול לעקוף אותם. היא מספקת הגנה בסיסית מפני שליחות חוזרות/בוט פשוט,
 * ותו לא.
 *
 * להגבלה מבוזרת אמיתית יש להחליף את המאגר בשירות משותף (Upstash Redis / Vercel
 * KV וכו'), תוך שמירה על אותה חתימת פונקציה (`checkRateLimit`). כרגע אין בפרויקט
 * תשתית KV/Redis, ואין להוסיף תלות/חשבון חדש ללא אישור מפורש.
 */

type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  rateLimitBuckets?: Map<string, Bucket>;
};

function getBuckets() {
  if (!globalForRateLimit.rateLimitBuckets) {
    globalForRateLimit.rateLimitBuckets = new Map();
  }
  return globalForRateLimit.rateLimitBuckets;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number } {
  const buckets = getBuckets();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
