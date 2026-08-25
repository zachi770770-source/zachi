import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import sharp from "sharp";

import { siteConfig } from "@/config/site";

/**
 * תמונת-השיתוף (Open Graph / Twitter) של עמוד הבית — קמפיין-ספר, לא באנר-אתר:
 * הכריכה האמיתית של הספר כעוגן ויזואלי, לצד משפט-הקמפיין. 1200×630, PNG,
 * נוצרת סטטית ב-build (בלי בקשה חיה, בלי רינדור-לקוח) — מוגשת ציבורית ב-200.
 *
 * העוגן חייב להיות הכריכה האמיתית: קוראים את `book-cover-final.webp` המקורי
 * (המקור לפי `siteConfig.images.cover`) וממירים אותו ל-JPEG משובץ — satori אינו
 * מפענח webp. אין ציור-מחדש ואין שינוי של האמנות: רק המרת-פורמט והקטנה לתצוגה.
 */

export const alt = `${siteConfig.bookTitle} — למצוא זה רק ההתחלה. אהבה בונים.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * satori (המנוע שמאחורי ImageResponse) אינו מיישם את אלגוריתם ה-Unicode Bidi,
 * ולכן טקסט עברי מוצג הפוך. פתרון: הופכים מראש את סדר התווים של מחרוזות RTL
 * „טהורות” (עברית + פיסוק, בלי טקסט לועזי מעורב), כך שהציור שמאל-לימין מניב
 * הצגה נכונה — כולל הנקודה שמופיעה בקצה השמאלי, כמצופה ב-RTL.
 */
function rtl(text: string) {
  return [...text].reverse().join("");
}

async function loadHebrewSerifFont() {
  const fontPath = fileURLToPath(
    new URL("./fonts/FrankRuhlLibre-Bold-static.ttf", import.meta.url),
  );
  return readFile(fontPath);
}

/**
 * הכריכה האמיתית, ממקור הפרויקט. ממירים ל-JPEG ברוחב צנוע (מוצג ב-320px) —
 * חד לגמרי בקנבס 1200×630, וקל דיו כדי להישאר הרבה מתחת לתקרת ה-500KB של
 * ImageResponse. אין חיתוך/צביעה/עריכה — יחס-הצדדים המקורי (2:3) נשמר.
 */
async function loadBookCover() {
  const coverPath = join(process.cwd(), "public", siteConfig.images.cover);
  const webp = await readFile(coverPath);
  const jpeg = await sharp(webp).resize({ width: 640 }).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
}

export default async function OpengraphImage() {
  const [serifFont, coverSrc] = await Promise.all([
    loadHebrewSerifFont(),
    loadBookCover(),
  ]);

  const ink = "#262a2f";
  const brand = "#ad5836";
  const cream = "#fbf8f3";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 72,
          padding: "0 96px",
          background: cream,
        }}
      >
        {/* הכריכה — עוגן ויזואלי, בולטת אך עם אוויר, וצל רך ל„הרמה” עריכתית. */}
        <img
          src={coverSrc}
          alt=""
          width={320}
          height={480}
          style={{
            width: 320,
            height: 480,
            borderRadius: 6,
            boxShadow: "0 26px 60px rgba(38, 42, 47, 0.30)",
          }}
        />

        {/* הטקסט — משפט-הקמפיין בלבד, מיושר לימין (RTL). ללא קופי-משנה זעיר. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "center",
            maxWidth: 596,
            textAlign: "right",
          }}
        >
          {/* קו-מותג דק ומרוסן — מבטא, לא רעש. */}
          <div
            style={{
              display: "flex",
              width: 84,
              height: 6,
              borderRadius: 3,
              background: brand,
              marginBottom: 40,
            }}
          />
          <div
            style={{
              display: "flex",
              fontFamily: "SerifHe",
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 1.12,
              color: ink,
            }}
          >
            {rtl("למצוא זה רק ההתחלה.")}
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "SerifHe",
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 1.12,
              color: brand,
              marginTop: 6,
            }}
          >
            {rtl("אהבה בונים.")}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "SerifHe", data: serifFont, style: "normal", weight: 700 }],
    },
  );
}
