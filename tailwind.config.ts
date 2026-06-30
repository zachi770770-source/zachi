import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#FBF7F0",
          100: "#F5EFE6",
          200: "#EFE6D9",
          300: "#E5D8C3",
        },
        burgundy: {
          500: "#8B3A47",
          600: "#722F37",
          700: "#5C262C",
          800: "#421A1F",
        },
        ink: {
          900: "#1A1614",
          800: "#2B2622",
          700: "#3D3631",
          500: "#6B5F57",
          400: "#8A7E75",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(60, 30, 30, 0.04), 0 8px 24px rgba(60, 30, 30, 0.06)",
        cardHover: "0 2px 4px rgba(60, 30, 30, 0.06), 0 16px 40px rgba(60, 30, 30, 0.10)",
      },
    },
  },
  plugins: [],
};
export default config;
