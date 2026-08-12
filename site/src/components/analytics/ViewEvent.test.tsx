import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  vi,
} from "vitest";
import { render, cleanup, act } from "@testing-library/react";

import { ViewEvent } from "@/components/analytics/ViewEvent";

/**
 * רגרסיה ל-E1 (אובדן צפייה ראשונה). מוודא ש-ViewEvent:
 *  - אינו שולח דבר לפני הסכמה;
 *  - שולח *פעם אחת* לאחר שההסכמה ניתנה אחרי העלייה;
 *  - אינו יוצר כפילויות גם אם ההסכמה/הספק משתנים כמה פעמים;
 *  - אינו מאבד את האירוע כשספק ה-GA4 נטען מעט אחרי העלייה.
 */

const CONSENT_KEY = "cookie-consent";

function grantConsent() {
  window.localStorage.setItem(
    CONSENT_KEY,
    JSON.stringify({ necessary: true, analytics: true, marketing: false }),
  );
}

/** מדמה טעינת ספק GA4 ישיר (gtag) — מה ש-AnalyticsScripts מזריק לאחר הסכמה. */
function attachGtagProvider() {
  const gtag = vi.fn();
  window.gtag = gtag as unknown as typeof window.gtag;
  window.dataLayer = [];
  return gtag;
}

function eventCalls(gtag: ReturnType<typeof vi.fn>, name: string) {
  return gtag.mock.calls.filter((c) => c[0] === "event" && c[1] === name);
}

describe("ViewEvent — E1 first-view retry", () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete (window as { gtag?: unknown }).gtag;
    delete (window as { dataLayer?: unknown }).dataLayer;
    vi.useRealTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("does not send any event before consent (even if provider is ready)", () => {
    const gtag = attachGtagProvider();
    render(<ViewEvent event="home_viewed" />);
    // ספק מוכן אך אין הסכמה ⇒ שום אירוע.
    expect(eventCalls(gtag, "home_viewed")).toHaveLength(0);
  });

  it("fires exactly once when consent is granted after mount", () => {
    const gtag = attachGtagProvider();
    render(<ViewEvent event="guide_viewed" params={{ guide: "dating-red-flags" }} />);
    expect(eventCalls(gtag, "guide_viewed")).toHaveLength(0);

    // הסכמה ניתנת אחרי העלייה → אירוע ההסכמה מפעיל שליחה.
    act(() => {
      grantConsent();
      window.dispatchEvent(new Event("cookie-consent-changed"));
    });

    const calls = eventCalls(gtag, "guide_viewed");
    expect(calls).toHaveLength(1);
    expect(calls[0][2]).toEqual({ guide: "dating-red-flags" });
  });

  it("does not duplicate on repeated consent / provider change events", () => {
    const gtag = attachGtagProvider();
    render(<ViewEvent event="book_viewed" />);

    act(() => {
      grantConsent();
      window.dispatchEvent(new Event("cookie-consent-changed"));
    });
    // אותות חוזרים — הסכמה מחדש, storage בין-לשוניות — לא יוצרים כפילות.
    act(() => {
      window.dispatchEvent(new Event("cookie-consent-changed"));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("cookie-consent-changed"));
    });

    expect(eventCalls(gtag, "book_viewed")).toHaveLength(1);
  });

  it("does not lose the event when the provider initializes shortly after mount", async () => {
    vi.useFakeTimers();
    // הסכמה קיימת בעליית העמוד, אך הספק (gtag/dataLayer) עדיין לא נטען.
    grantConsent();
    render(<ViewEvent event="home_viewed" />);

    // בלי ספק — טרם נשלח דבר.
    expect(window.gtag).toBeUndefined();

    // הספק נטען כעבור רגע (כמו סקריפט afterInteractive).
    const gtag = attachGtagProvider();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(eventCalls(gtag, "home_viewed")).toHaveLength(1);

    // גם אחרי טיקים נוספים — עדיין ירי יחיד.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(eventCalls(gtag, "home_viewed")).toHaveLength(1);
  });

  it("sends immediately for a returning consented visitor with provider ready", () => {
    grantConsent();
    const gtag = attachGtagProvider();
    render(<ViewEvent event="home_viewed" />);
    expect(eventCalls(gtag, "home_viewed")).toHaveLength(1);
  });
});
