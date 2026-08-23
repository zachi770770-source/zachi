import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, act } from "@testing-library/react";
import type { ReactElement } from "react";

import { AuthorPageView } from "@/components/author/AuthorPageView";
import { JourneyView } from "@/components/journey/JourneyView";
import { SampleReader } from "@/components/preview/SampleReader";
import { AskRoute } from "@/components/interactive/AskRoute";

/**
 * רגרסיה להעברת אירועי-הצפייה הראשונה אל `ViewEvent`.
 *
 * הכשל שנסגר: חמשת האירועים האלה נורו מ-`useEffect` של ה-mount בקריאה ישירה
 * ל-`trackEvent`, וערך-ההחזרה נזרק. `trackEvent` מחזיר `false` כשאין הסכמה או
 * כשספק ה-GA4/GTM עדיין לא נטען — ואז האירוע פשוט אבד, בלי ניסיון חוזר.
 * כלומר: מבקר ראשון שאישר עוגיות *אחרי* הרינדור הראשון לא נספר כלל, וזה בדיוק
 * הקהל שהכי חשוב למדוד.
 *
 * הבדיקות כאן רצות מול ה**רכיבים עצמם**, לא מול `ViewEvent` לבדו: לכל אחד מהם
 * יש התנהגות נוספת (sessionStorage, מחלקת `is-ready`, מכונת-מצבים) שחייבת
 * להישאר כשהיא. `ViewEvent.test.tsx` ממשיך לכסות את מנגנון הניסיון-החוזר עצמו.
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

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  delete (window as { gtag?: unknown }).gtag;
  delete (window as { dataLayer?: unknown }).dataLayer;
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

/**
 * ארבעת התרחישים שהפגם נגע בהם, מורצים מול כל רכיב שהועבר.
 * `payload` נבדק כדי לוודא שסמנטיקת המטען לא השתנתה בהעברה.
 */
function describeFirstViewEvent(
  label: string,
  event: string,
  renderComponent: () => ReactElement,
  payload?: Record<string, unknown>,
) {
  describe(`${label} → ${event}`, () => {
    it("אין הסכמה ⇒ לא נשלח דבר, גם כשהספק מוכן", () => {
      const gtag = attachGtagProvider();
      render(renderComponent());
      expect(eventCalls(gtag, event)).toHaveLength(0);
    });

    it("הסכמה + ספק מוכן מראש ⇒ נשלח מיד, פעם אחת", () => {
      grantConsent();
      const gtag = attachGtagProvider();
      render(renderComponent());
      const calls = eventCalls(gtag, event);
      expect(calls).toHaveLength(1);
      expect(calls[0][2]).toEqual(payload ?? {});
    });

    it("הסכמה מתקבלת אחרי הרינדור ⇒ נשלח פעם אחת (הכשל שנסגר)", () => {
      const gtag = attachGtagProvider();
      render(renderComponent());
      expect(eventCalls(gtag, event)).toHaveLength(0);

      act(() => {
        grantConsent();
        window.dispatchEvent(new Event("cookie-consent-changed"));
      });

      const calls = eventCalls(gtag, event);
      expect(calls).toHaveLength(1);
      expect(calls[0][2]).toEqual(payload ?? {});
    });

    it("הספק נטען אחרי הרינדור ⇒ נשלח פעם אחת, ולא שוב", async () => {
      vi.useFakeTimers();
      grantConsent();
      render(renderComponent());
      expect(window.gtag).toBeUndefined();

      const gtag = attachGtagProvider();
      await act(async () => {
        await vi.advanceTimersByTimeAsync(700);
      });
      expect(eventCalls(gtag, event)).toHaveLength(1);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(3000);
      });
      expect(eventCalls(gtag, event)).toHaveLength(1);
    });

    it("רינדורים חוזרים ואותות חוזרים ⇒ אין שליחה כפולה", () => {
      grantConsent();
      const gtag = attachGtagProvider();
      const { rerender } = render(renderComponent());

      act(() => {
        rerender(renderComponent());
        window.dispatchEvent(new Event("cookie-consent-changed"));
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("cookie-consent-changed"));
      });

      expect(eventCalls(gtag, event)).toHaveLength(1);
    });

    it("אין ספק GA/GTM כלל ⇒ אינו קורס", () => {
      grantConsent();
      expect(() => render(renderComponent())).not.toThrow();
    });
  });
}

describeFirstViewEvent("AuthorPageView", "author_page_opened", () => <AuthorPageView />);

describeFirstViewEvent(
  "JourneyView",
  "journey_page_viewed",
  () => <JourneyView station="before-relationship" />,
  { station: "before-relationship" },
);

describeFirstViewEvent("SampleReader", "view_sample", () => <SampleReader />);
describeFirstViewEvent("SampleReader", "preview_opened", () => <SampleReader />);
describeFirstViewEvent("AskRoute", "ask_open", () => <AskRoute />);

/**
 * ההתנהגות הנוספת של הרכיבים — מה שהיה באותו `useEffect` שממנו הוצא האירוע.
 * אם ההעברה הייתה שוברת אותה, המשתמש היה מרגיש; האנליטיקה לא.
 */
describe("behaviour that shared the migrated effect must survive", () => {
  it("JourneyView עדיין שומר את הקשר-המסע ב-sessionStorage", () => {
    grantConsent();
    attachGtagProvider();
    render(<JourneyView station="after-breakup" />);
    expect(JSON.parse(window.sessionStorage.getItem("mdl_home_path") ?? "{}")).toEqual({
      path: "breakup",
    });
  });

  it("JourneyView שומר את ההקשר גם בלי הסכמת אנליטיקה", () => {
    // האחסון המקומי אינו תלוי בהסכמה לאנליטיקה — הוא הקשר-מוצר, לא מדידה.
    render(<JourneyView station="building-relationship" />);
    expect(JSON.parse(window.sessionStorage.getItem("mdl_home_path") ?? "{}")).toEqual({
      path: "building",
    });
  });

  it("SampleReader עדיין מדליק את מחלקת `is-ready` אחרי ה-mount", () => {
    const { container } = render(<SampleReader />);
    expect(container.querySelector(".sample-reader")?.classList.contains("is-ready")).toBe(
      true,
    );
  });

  it("שני אירועי הטעימה נשלחים שניהם מאותו רינדור", () => {
    grantConsent();
    const gtag = attachGtagProvider();
    render(<SampleReader />);
    expect(eventCalls(gtag, "view_sample")).toHaveLength(1);
    expect(eventCalls(gtag, "preview_opened")).toHaveLength(1);
  });
});

/**
 * `/love` — עמוד-הסמכות הרוחבי של אשכול אהבה/זוגיות (priority 0.9, כמו
 * `/book`). עד כה לא נמדד כלל, ולכן לא היה אפשר לדעת אם הוא עובד. הבדיקה כאן
 * מאמתת את החיווט בעמוד עצמו — שמנגנון הניסיון-החוזר מכוסה כבר ב-ViewEvent.
 */
describe("LovePage → love_viewed", () => {
  it("משגר את אירוע-הצפייה פעם אחת כשיש הסכמה וספק", async () => {
    grantConsent();
    const gtag = attachGtagProvider();
    const { default: LovePage } = await import("@/app/love/page");
    render(<LovePage />);
    expect(eventCalls(gtag, "love_viewed")).toHaveLength(1);
  });

  it("אינו משגר דבר בלי הסכמה, ומשגר כשהיא ניתנת אחר כך", async () => {
    const gtag = attachGtagProvider();
    const { default: LovePage } = await import("@/app/love/page");
    render(<LovePage />);
    expect(eventCalls(gtag, "love_viewed")).toHaveLength(0);

    act(() => {
      grantConsent();
      window.dispatchEvent(new Event("cookie-consent-changed"));
    });
    expect(eventCalls(gtag, "love_viewed")).toHaveLength(1);
  });
});
