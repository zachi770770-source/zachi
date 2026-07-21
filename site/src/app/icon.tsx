import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

async function loadHebrewSerifFont() {
  const { readFile } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const fontPath = fileURLToPath(new URL("./fonts/FrankRuhlLibre-Bold-static.ttf", import.meta.url));
  return readFile(fontPath);
}

export default async function Icon() {
  const serifFont = await loadHebrewSerifFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5a1420",
          borderRadius: 14,
          color: "#fdf8f3",
          fontFamily: "SerifHe",
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        מ
      </div>
    ),
    { ...size, fonts: [{ name: "SerifHe", data: serifFont, style: "normal", weight: 700 }] }
  );
}
