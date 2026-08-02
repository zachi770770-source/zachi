import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { render, cleanup, screen, fireEvent, waitFor } from "@testing-library/react";

import { WaitlistCta, CONVERSION_CTA_LABEL } from "@/components/waitlist/WaitlistCta";

/**
 * פעולת ההמרה האחידה (PHASE 16): כפתור יחיד → טופס inline; הרשמה מוצלחת אמיתית
 * פותחת את /preview (router.push) ומדווחת אנליטיקה; כשל אימות/שרת אינו מנווט.
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

  it("navigates to /preview after a genuinely successful registration", async () => {
    mockFetchOk({ success: true });
    render(<WaitlistCta source="hero" />);
    openForm();

    fireEvent.change(screen.getByLabelText("כתובת אימייל"), {
      target: { value: "reader@example.com" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/preview"));
    expect(window.gtag).toHaveBeenCalledWith("event", "waitlist_submit_success", expect.anything());
    expect(window.gtag).toHaveBeenCalledWith("event", "preview_open_after_signup", expect.anything());
  });

  it("does NOT navigate when consent is missing (client validation failure)", async () => {
    const fetchSpy = mockFetchOk({ success: true });
    render(<WaitlistCta source="hero" />);
    openForm();

    fireEvent.change(screen.getByLabelText("כתובת אימייל"), {
      target: { value: "reader@example.com" },
    });
    // ללא סימון ההסכמה — שליחה נכשלת בוולידציה, אין קריאה לשרת ואין ניווט.
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }));

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
    fireEvent.click(screen.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }));

    await screen.findByRole("alert");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
