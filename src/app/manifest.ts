import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "מדייטים לאהבה",
    short_name: "מדייטים לאהבה",
    description: "אהבה לא מוצאים. בונים. אפליקציית התפתחות אישית מבוססת הספר של צחי חן.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#FAF8F4",
    lang: "he",
    dir: "rtl",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
