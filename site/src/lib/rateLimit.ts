/**
 * Rate limiting פשוט מבוסס-זיכרון (sliding window) לפי מפתח (בדרך כלל IP).
 *
 * הערה: מימוש בזיכרון אינו משותף בין instances מרובים בפריסת serverless.
 * עבור עומס גבוה יותר, מומלץ להחליף במאגר משותף (Upstash Redis וכו'),
 * תוך שמירה על אותה חתימת פונקציה (`checkRateLimit`).
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
