import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import { renderToString, renderToStaticMarkup } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";

import { StagedTextReveal } from "@/components/shared/StagedTextReveal";

/**
 * הקטע בפועל (מ-bigIdea): כותרת (2 משפטים) + פתיח (2 משפטים) = 4 משפטים.
 * המילים בסדר ה-DOM = סדר הקריאה החזותי ב-RTL (מימין לשמאל).
 */
const GROUPS = [
  {
    text: "דייטינג הוא חיפוש. אהבה היא בנייה.",
    as: "h2" as const,
    id: "thesis-heading",
  },
  {
    text: "הספר אינו מבקש מכם להתפשר. הוא מבקש מכם לבדוק אחרת.",
    as: "p" as const,
  },
];

const EXPECTED_WORDS = [
  "דייטינג",
  "הוא",
  "חיפוש.",
  "אהבה",
  "היא",
  "בנייה.",
  "הספר",
  "אינו",
  "מבקש",
  "מכם",
  "להתפשר.",
  "הוא",
  "מבקש",
  "מכם",
  "לבדוק",
  "אחרת.",
];

// ---- מוקים ל-jsdom (אין לו IntersectionObserver / matchMedia כברירת מחדל) ----

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = [];
  cb: IntersectionObserverCallback;
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn(() => {
    this.disconnected = true;
  });
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "";
  thresholds = [];
  disconnected = false;
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb;
    MockIntersectionObserver.instances.push(this);
  }
  // דוגמה נאמנה למציאות: אחרי disconnect ה-observer אינו יורה שוב.
  fire(isIntersecting = true) {
    if (this.disconnected) return;
    act(() => {
      this.cb(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    });
  }
}

function setMatchMedia(reduce: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduce && /reduce/.test(query),
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  setMatchMedia(false);
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
  // ברירת מחדל: הקטע מתחת-לקיפול ⇒ נבחר מסלול ה-IntersectionObserver (ולא
  // החשיפה-המיידית של „כבר בתצוגה”). בדיקה ייעודית לחשיפה-המיידית דורסת זאת.
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 10000,
    bottom: 10100,
    left: 0,
    right: 100,
    width: 100,
    height: 100,
    x: 0,
    y: 10000,
    toJSON: () => ({}),
  } as DOMRect);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("StagedTextReveal", () => {
  it("1. renders Hebrew words in correct visual (DOM) order", () => {
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const words = Array.from(container.querySelectorAll(".staged-word")).map(
      (el) => el.textContent
    );
    expect(words).toEqual(EXPECTED_WORDS);
  });

  it("2. exposes each full sentence/group to screen readers exactly once", () => {
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const srOnly = Array.from(container.querySelectorAll(".sr-only")).map(
      (el) => el.textContent
    );
    expect(srOnly).toEqual([GROUPS[0].text, GROUPS[1].text]);
  });

  it("3. hides the animated word spans from assistive tech (aria-hidden)", () => {
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const wordSpans = container.querySelectorAll(".staged-word");
    expect(wordSpans.length).toBe(EXPECTED_WORDS.length);
    for (const span of wordSpans) {
      expect(span.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it("4. prefers-reduced-motion: shows everything immediately (never armed)", () => {
    setMatchMedia(true);
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const root = container.querySelector(".staged-reveal")!;
    expect(root.classList.contains("is-armed")).toBe(false);
    expect(root.classList.contains("is-revealing")).toBe(false);
    // כל הטקסט עדיין נוכח וגלוי כברירת מחדל.
    expect(container.textContent).toContain("דייטינג הוא חיפוש.");
    expect(container.textContent).toContain("הוא מבקש מכם לבדוק אחרת.");
  });

  it("5. no-JS / server render contains the complete text and is not armed", () => {
    const html = renderToStaticMarkup(<StagedTextReveal groups={GROUPS} />);
    expect(html).toContain("דייטינג");
    expect(html).toContain("בנייה.");
    expect(html).toContain("הספר אינו מבקש מכם להתפשר.");
    expect(html).toContain("הוא מבקש מכם לבדוק אחרת.");
    // ברירת המחדל בשרת = גלוי (ללא is-armed).
    expect(html).not.toContain("is-armed");
  });

  it("6. IntersectionObserver unsupported: text stays visible (never armed)", () => {
    (globalThis as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
      undefined;
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const root = container.querySelector(".staged-reveal")!;
    expect(root.classList.contains("is-armed")).toBe(false);
    expect(container.textContent).toContain("אהבה היא בנייה.");
  });

  it("7. reveals only once — observer disconnects after first intersection", () => {
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const root = container.querySelector(".staged-reveal")!;
    expect(root.classList.contains("is-armed")).toBe(true);

    const io = MockIntersectionObserver.instances[0];
    expect(io).toBeTruthy();
    expect(io.observe).toHaveBeenCalledTimes(1);

    io.fire(true);
    expect(root.classList.contains("is-revealing")).toBe(true);
    expect(io.disconnect).toHaveBeenCalledTimes(1);

    // כניסה חוזרת לא מפעילה שוב ולא מנתקת שוב.
    io.fire(true);
    expect(io.disconnect).toHaveBeenCalledTimes(1);
    expect(root.classList.contains("is-revealing")).toBe(true);
  });

  it("8. cleans up the observer on unmount (no leaked observer/timers)", () => {
    const { unmount } = render(<StagedTextReveal groups={GROUPS} />);
    const io = MockIntersectionObserver.instances[0];
    expect(io.disconnect).not.toHaveBeenCalled();
    unmount();
    expect(io.disconnect).toHaveBeenCalledTimes(1);
  });

  it("8b. already in view: reveals immediately without needing the observer (no stuck words)", () => {
    // הקטע כבר בתצוגה (top קטן מגובה החלון) ⇒ חשיפה מיידית, בלי IO.
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      top: 10,
      bottom: 210,
      left: 0,
      right: 100,
      width: 100,
      height: 200,
      x: 0,
      y: 10,
      toJSON: () => ({}),
    } as DOMRect);
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const root = container.querySelector(".staged-reveal")!;
    // נחשף מיד — לא מחכה ל-IntersectionObserver.
    expect(root.classList.contains("is-revealing")).toBe(true);
    expect(MockIntersectionObserver.instances.length).toBe(0);
  });

  it("9. hydrates server markup without hydration warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const container = document.createElement("div");
    document.body.appendChild(container);
    container.innerHTML = renderToString(<StagedTextReveal groups={GROUPS} />);

    act(() => {
      hydrateRoot(container, <StagedTextReveal groups={GROUPS} />);
    });

    const hydrationWarnings = errorSpy.mock.calls.filter((call) =>
      call.some(
        (arg) =>
          typeof arg === "string" &&
          /hydrat|did not match|server (?:HTML|rendered)/i.test(arg)
      )
    );
    expect(hydrationWarnings).toEqual([]);
    container.remove();
  });

  it("assigns a staggered transition-delay per word (word-by-word, not per-letter)", () => {
    const { container } = render(<StagedTextReveal groups={GROUPS} />);
    const words = Array.from(
      container.querySelectorAll<HTMLElement>(".staged-word")
    );
    // מילה ראשונה: 0ms; שנייה: 75ms; המילה הראשונה במשפט השני מקבלת גם
    // השהיית-משפט (index*75 + sentenceIndex*220).
    expect(words[0].style.getPropertyValue("--staged-delay")).toBe("0ms");
    expect(words[1].style.getPropertyValue("--staged-delay")).toBe("75ms");
    expect(words[3].style.getPropertyValue("--staged-delay")).toBe("445ms"); // 3*75 + 1*220
  });
});

/**
 * הערה לגבי דרישה #10 (ללא גלישה אופקית ב-320/360/390/768/1440): נבדק
 * ב-Playwright מול השרת האמיתי (scrollWidth === innerWidth בכל הרחבים),
 * כי jsdom אינו מבצע layout אמיתי. ראו דוח האימות.
 */
