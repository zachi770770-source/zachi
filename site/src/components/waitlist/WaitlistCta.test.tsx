import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent } from "@testing-library/react";

import { WaitlistCta, CONVERSION_CTA_LABEL } from "@/components/waitlist/WaitlistCta";

/**
 * פעולת ההמרה האחידה: כפתור יחיד → טופס inline; הרשמה מוצלחת מציגה מצב-הצלחה
 * עם „לקריאת הטעימה” ושיתוף (ללא ניווט אוטומטי); כשל אימות/שרת אינו מנווט.
 */

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));

function mockFetchOk(payload: unknown, ok = true) {
  const fn = vi.fn(() =>
    Promise.resolve({ ok, json: () => Promise.resolve(payload) })
  );
  // @ts-expect-error - מדמים fetch גלובלי
  global.fetch = fn;
  return fn;
}

beforeEach(() => {
  // הסכמת אנליטיקה, כדי ש-trackEvent אכן יזרים ל-gtag שנרגל אחריו.
  window.localStorage.setItem(
    "cookie-consent",
    JSON.stringify({ necessary: true, analytics: true, marketing: false })
  );
  window.gtag = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  pushMock.mockReset();
  window.localStorage.clear();
  delete window.gtag;
});

function openForm() {
  fireEvent.click(screen.getByRole("button", { name: CONVERSION_CTA_LABEL }));
}

describe("WaitlistCta", () => {
  it("is closed by default: shows the single dominant CTA, no email field", () => {
    render(<WaitlistCta source="hero" />);
    expect(screen.getByRole("button", { name: CONVERSION_CTA_LABEL })).toBeInTheDocument();
    expect(screen.queryByLabelText("כתובת אימייל")).toBeNull();
  });

  it("reveals the inline form on click and fires the open analytics event", () => {
    render(<WaitlistCta source="hero" openEvent="hero_waitlist_open" />);
    openForm();
    expect(screen.getByLabelText("כתובת אימייל")).toBeInTheDocument();
    expect(window.gtag).toHaveBeenCalledWith("event", "hero_waitlist_open", expect.anything());
  });

  it("shows the success state (read-sample + share) after a genuine registration, without navigating", async () => {
    mockFetchOk({ success: true });
    render(<WaitlistCta source="hero" />);
    openForm();

    fireEvent.change(screen.getByLabelText("כתובת אימייל"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהמהדורה הישירה תיפתח" }));

    await screen.findByText(/נרשמת בהצלחה/);
    expect(screen.getByRole("link", { name: /לקריאת הטעימה/ })).toBeInTheDocument();
    expect(window.gtag).toHaveBeenCalledWith("event", "waitlist_submit_success", expect.anything());
    // אין ניווט אוטומטי אחרי הרשמה — הטעימה נגישה דרך הכפתור.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does NOT navigate when consent is missing (client validation failure)", async () => {
    const fetchSpy = mockFetchOk({ success: true });
    render(<WaitlistCta source="hero" />);
    openForm();

    fireEvent.change(screen.getByLabelText("כתובת אימייל"), {
      target: { value: "reader@example.com" },
    });
    // ללא סימון ההסכמה — שליחה נכשלת בוולידציה, אין קריאה לשרת ואין ניווט.
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהמהדורה הישירה תיפתח" }));

    await screen.findByRole("alert");
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does NOT navigate when the API responds with an error", async () => {
    mockFetchOk({ error: "אירעה תקלה בשמירת הפרטים. נסו שוב." }, false);
    render(<WaitlistCta source="hero" />);
    openForm();

    fireEvent.change(screen.getByLabelText("כתובת אימייל"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהמהדורה הישירה תיפתח" }));

    await screen.findByRole("alert");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
