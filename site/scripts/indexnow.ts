/**
 * IndexNow — הגשה יזומה של כתובות האתר ל-IndexNow (Bing/Yandex ומנועים
 * שותפים), כדי לזרז גילוי/רענון של עמודים חדשים או מעודכנים. חשיפה מהירה
 * ב-Bing מזינה בעקיפין גם חלק ממנועי-החיפוש מבוססי-AI.
 *
 * הרצה ידנית לאחר פריסה לפרודקשן (בסביבה עם גישת-רשת יוצאת):
 *   npx tsx scripts/indexnow.ts
 *
 * מאפיינים מכוונים:
 * - *לא* אוטומטי ו-*לא* חלק מזמן-הריצה של האתר: אין קריאת-רשת ב-runtime, אין
 *   שינוי התנהגות/אבטחה. סקריפט תפעולי בלבד.
 * - רץ רק כשכתובת האתר היא דומיין הפרודקשן ה-https (siteConfig.url). על
 *   localhost/preview הוא נעצר — כדי לא להגיש כתובות שאינן פומביות.
 * - מקור הכתובות: sitemap.xml החי (מקור-אמת יחיד) — אין שכפול של רשימת הנתיבים.
 * - מפתח ה-IndexNow פומבי ומתארח כקובץ תחת /public. הסקריפט מאמת שהקובץ קיים
 *   ותוכנו תואם לפני ההגשה.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { siteConfig } from "../src/config/site";

/** מפתח IndexNow פומבי. חייב להיות זהה לתוכן הקובץ public/<key>.txt. */
const INDEXNOW_KEY = "a3f9c2e7b18d4046b5e2c9f70a6d4c31";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

const here = dirname(fileURLToPath(import.meta.url));
const keyFilePath = join(here, "..", "public", `${INDEXNOW_KEY}.txt`);

function fail(message: string): never {
  console.error(`IndexNow: ${message}`);
  process.exit(1);
}

async function main() {
  const siteUrl = siteConfig.url;

  // שער בטיחות: מגישים אך ורק את דומיין הפרודקשן הפומבי (https, לא vercel.app,
  // לא localhost). אחרת אין טעם/נכונות בהגשה.
  let host: string;
  try {
    const parsed = new URL(siteUrl);
    host = parsed.host;
    if (parsed.protocol !== "https:") fail(`site URL is not https (${siteUrl}) — refusing to submit.`);
    if (host.endsWith(".vercel.app") || host.startsWith("localhost")) {
      fail(`site URL is not the production host (${siteUrl}) — refusing to submit.`);
    }
  } catch {
    fail(`invalid site URL (${siteUrl}).`);
  }

  // אימות שקובץ-המפתח קיים ותוכנו תואם — אחרת IndexNow ידחה את ההגשה.
  const keyFileContent = (await readFile(keyFilePath, "utf8").catch(() => {
    fail(`key file missing at public/${INDEXNOW_KEY}.txt`);
  })) as string;
  if (keyFileContent.trim() !== INDEXNOW_KEY) {
    fail(`key file content does not match the key.`);
  }

  // מקור-אמת יחיד לכתובות: ה-sitemap החי.
  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const res = await fetch(sitemapUrl).catch(() => fail(`could not fetch ${sitemapUrl}`));
  if (!res.ok) fail(`sitemap fetch returned ${res.status}`);
  const xml = await res.text();
  const urlList = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1].trim());
  if (urlList.length === 0) fail("no <loc> URLs found in sitemap.");

  const body = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${siteUrl}/${INDEXNOW_KEY}.txt`,
    urlList,
  };

  const submit = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  }).catch(() => fail("IndexNow POST failed (network)."));

  // IndexNow מחזיר 200 (התקבל) או 202 (התקבל, מעובד). שאר הקודים = בעיה.
  if (submit.status !== 200 && submit.status !== 202) {
    fail(`IndexNow responded ${submit.status} ${submit.statusText}`);
  }
  console.log(`IndexNow: submitted ${urlList.length} URLs for ${host} (HTTP ${submit.status}).`);
}

main();
