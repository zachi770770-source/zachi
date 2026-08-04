import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CookieConsent } from "@/components/layout/CookieConsent";

// רגרסיה: useSyncExternalStore עם snapshot לא-יציב (אובייקט חדש בכל
// קריאה) גורם ל"Maximum update depth exceeded" (React error #185) ברגע
// שנכתב לoclaStorage. בדיקה זו הייתה נכשלת (קורסת) לפני התיקון.
describe("CookieConsent", () => {
  beforeEach(() => {
    window.localStorage.clear();
    // הבאנר „מזוין” מיד במסך גבוה (≥900px). הבדיקות בודקות את לוגיקת ההסכמה,
    // לכן מעמידים גובה-חלון גבוה כדי שהבאנר יוצג (כמו דסקטופ). ה„זימון” קורה
    // ב-requestAnimationFrame ⇒ שימוש ב-findBy* (אסינכרוני) במקום getBy*.
    window.innerHeight = 1000;
  });

  it("shows the banner on first visit", async () => {
    render(<CookieConsent />);
    expect(
      await screen.findByRole("region", { name: "הסכמה לשימוש בעוגיות" })
    ).toBeInTheDocument();
  });

  it("accepting all cookies hides the banner without crashing and persists consent", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(await screen.findByRole("button", { name: "אישור הכל" }));

    expect(
      screen.queryByRole("region", { name: "הסכמה לשימוש בעוגיות" })
    ).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem("cookie-consent") ?? "{}");
    expect(stored).toEqual({ necessary: true, analytics: true, marketing: true });
  });

  it("rejecting non-essential cookies hides the banner and persists consent", async () => {
    const user = userEvent.setup();
    render(<CookieConsent />);

    await user.click(
      await screen.findByRole("button", { name: "רק הכרחי - דחיית עוגיות לא הכרחיות" })
    );

    expect(
      screen.queryByRole("region", { name: "הסכמה לשימוש בעוגיות" })
    ).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem("cookie-consent") ?? "{}");
    expect(stored).toEqual({ necessary: true, analytics: false, marketing: false });
  });

  it("does not re-show the banner once consent is already stored", () => {
    window.localStorage.setItem(
      "cookie-consent",
      JSON.stringify({ necessary: true, analytics: false, marketing: false })
    );
    render(<CookieConsent />);
    expect(
      screen.queryByRole("region", { name: "הסכמה לשימוש בעוגיות" })
    ).not.toBeInTheDocument();
  });
});
