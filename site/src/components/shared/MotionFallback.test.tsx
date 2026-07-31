import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup } from "@testing-library/react";

import { MotionFallback } from "@/components/shared/MotionFallback";

/**
 * בדיקות לשומר-הסף של ה-fallback: מתי הוא מפעיל תנועה ומתי לא. העיקר —
 * שאין עקיפה של prefers-reduced-motion, ושבדפדפן עם תמיכה מקורית הוא לא
 * נכנס לפעולה. IntersectionObserver / CSS.supports / matchMedia מדומים.
 */

vi.mock("next/navigation", () => ({ usePathname: () => "/book" }));

function setup({ supportsView, reduce, hasIO = true }: { supportsView: boolean; reduce: boolean; hasIO?: boolean }) {
  document.documentElement.className = "";
  document.body.innerHTML = `<div class="reveal"></div><ol class="method-steps"><li></li></ol>`;

  // @ts-expect-error - מדמים CSS.supports
  globalThis.CSS = { supports: vi.fn(() => supportsView) };

  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: q.includes("reduce") ? reduce : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));

  const observe = vi.fn();
  const disconnect = vi.fn();
  if (hasIO) {
    // @ts-expect-error - מדמים IntersectionObserver
    window.IntersectionObserver = class {
      observe = observe;
      unobserve = vi.fn();
      disconnect = disconnect;
      constructor(...args: unknown[]) {
        void args;
      }
    };
  } else {
    // @ts-expect-error - מסירים IntersectionObserver
    delete window.IntersectionObserver;
  }
  return { observe, disconnect };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.documentElement.className = "";
});

beforeEach(() => {
  // כברירת מחדל אלמנטים „מחוץ למסך” כדי שייכנסו לתצפית (jsdom מחזיר 0/0).
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    top: 5000, bottom: 5100, left: 0, right: 100, width: 100, height: 100, x: 0, y: 5000, toJSON: () => {},
  })) as unknown as typeof Element.prototype.getBoundingClientRect;
});

describe("MotionFallback — activation guard", () => {
  it("does NOT engage when the browser natively supports scroll-timeline", () => {
    setup({ supportsView: true, reduce: false });
    render(<MotionFallback />);
    expect(document.documentElement.classList.contains("motion-js")).toBe(false);
  });

  it("does NOT engage under prefers-reduced-motion (no override)", () => {
    setup({ supportsView: false, reduce: true });
    render(<MotionFallback />);
    expect(document.documentElement.classList.contains("motion-js")).toBe(false);
  });

  it("engages and observes targets when unsupported and motion is allowed", () => {
    const { observe } = setup({ supportsView: false, reduce: false });
    render(<MotionFallback />);
    expect(document.documentElement.classList.contains("motion-js")).toBe(true);
    // שני יעדים מחוץ למסך (‎.reveal + .method-steps) → נצפים.
    expect(observe).toHaveBeenCalledTimes(2);
  });

  it("does NOT engage when IntersectionObserver is unavailable", () => {
    setup({ supportsView: false, reduce: false, hasIO: false });
    render(<MotionFallback />);
    expect(document.documentElement.classList.contains("motion-js")).toBe(false);
  });
});
