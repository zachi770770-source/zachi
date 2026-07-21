import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.bookTitle} - ${siteConfig.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * satori (המנוע שמאחורי ImageResponse) בגרסה המצורפת ל-Next אינו מיישם
 * את אלגוריתם ה-Unicode Bidi, ולכן טקסט עברי מוצג הפוך. פתרון: הופכים
 * מראש את סדר התווים של מחרוזות RTL "טהורות" (ללא טקסט לועזי מעורב),
 * מה שמניב הצגה נכונה כשה-canvas מצייר אותן משמאל לימין.
 */
function rtl(text: string) {
  return [...text].reverse().join("");
}

async function loadHebrewSerifFont() {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const fontPath = fileURLToPath(new URL("./fonts/FrankRuhlLibre-Bold-static.ttf", import.meta.url));
  return readFile(fontPath);
}

export default async function OpengraphImage() {
  const serifFont = await loadHebrewSerifFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7a1f2b 0%, #4a121a 100%)",
          padding: 80,
          textAlign: "center",
          direction: "rtl",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            letterSpacing: 6,
            color: "#e9c98f",
            marginBottom: 28,
            fontFamily: "SerifHe",
          }}
        >
          {rtl("ספר על דייטים ואהבה")}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            color: "#fbf3e8",
            fontFamily: "SerifHe",
            lineHeight: 1.1,
          }}
        >
          {rtl(siteConfig.bookTitle)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#f4e9da",
            marginTop: 30,
            fontFamily: "SerifHe",
            fontStyle: "italic",
          }}
        >
          {rtl(siteConfig.tagline)}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "SerifHe", data: serifFont, style: "normal", weight: 700 }],
    }
  );
}
