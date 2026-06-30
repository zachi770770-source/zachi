import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "מדייטים לאהבה — אהבה לא מוצאים. בונים.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FAF8F4 0%, #F4EFE6 100%)",
          padding: "80px 100px",
          fontFamily: "system-ui",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#A56841",
            letterSpacing: "0.15em",
            marginBottom: 32,
            textTransform: "uppercase",
          }}
        >
          מדייטים לאהבה
        </div>
        <div
          style={{
            fontSize: 96,
            color: "#161618",
            lineHeight: 1.05,
            fontWeight: 400,
            textAlign: "right",
            maxWidth: 1000,
          }}
        >
          אהבה לא מוצאים.
          <br />
          <span style={{ color: "#A56841" }}>בונים.</span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#6B6C78",
            marginTop: 40,
            textAlign: "right",
          }}
        >
          צחי חן · מבוסס על הספר
        </div>
      </div>
    ),
    { ...size },
  );
}
