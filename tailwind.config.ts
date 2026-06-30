import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-heebo)", "system-ui", "sans-serif"],
        serif: ["var(--font-frank)", "Georgia", "serif"],
      },
      colors: {
        // Premium, calm, Apple-level palette — earthy, warm, not "dating app"
        sand: {
          50: "#FAF8F4",
          100: "#F4EFE6",
          200: "#E8DFCD",
          300: "#D9CBAE",
          400: "#C2AE85",
          500: "#A89469",
        },
        ink: {
          50: "#F7F7F8",
          100: "#EBEBEE",
          200: "#D1D1D7",
          300: "#9FA0AA",
          400: "#6B6C78",
          500: "#3F4049",
          600: "#26272D",
          700: "#161618",
        },
        clay: {
          50: "#F8EFE9",
          100: "#EFDBCE",
          200: "#DFB69E",
          300: "#C68D6C",
          400: "#A56841",
          500: "#85522F",
        },
        sage: {
          50: "#F0F3EE",
          100: "#DDE5D7",
          200: "#B7C6AC",
          300: "#8FA37E",
          400: "#69815A",
          500: "#4F6443",
        },
        accent: {
          50: "#F5EEEC",
          100: "#E8D7D3",
          200: "#CFAEA6",
          300: "#B07F73",
          400: "#8E5848",
          500: "#6F3F30",
        },
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      boxShadow: {
        soft: "0 1px 3px rgba(38,39,45,0.04), 0 6px 24px rgba(38,39,45,0.06)",
        lift: "0 2px 8px rgba(38,39,45,0.06), 0 24px 48px rgba(38,39,45,0.08)",
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "rise": "rise 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        rise: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
