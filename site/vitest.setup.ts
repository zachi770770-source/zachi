import "@testing-library/jest-dom/vitest";

// jsdom אינו מספק ResizeObserver, שבו רכיבי Radix (למשל Checkbox) משתמשים.
// polyfill מינימלי כדי שבדיקות המרנדרות טפסים לא יקרסו.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
