import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` זורק כברירת מחדל מחוץ לתנאי react-server. בבדיקות אנו
      // ממפים אותו למודול ריק כדי לבדוק מודולים שרתיים ללא שבירת גבול השרת.
      "server-only": path.resolve(__dirname, "./test/server-only-stub.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
