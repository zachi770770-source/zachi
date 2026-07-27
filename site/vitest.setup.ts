import "@testing-library/jest-dom/vitest";

// Polyfill ל-jsdom: רכיבי Radix (למשל Checkbox) משתמשים ב-ResizeObserver,
// שאינו קיים ב-jsdom. שים (stub) מינימלי לטובת בדיקות רכיבים.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
