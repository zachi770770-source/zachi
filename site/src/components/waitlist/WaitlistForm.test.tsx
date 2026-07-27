import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ממקמים את שכבת האנליטיקה כדי לאמת בדיוק אילו אירועים נשלחים.
vi.mock("@/lib/analytics", () => ({ trackEvent: vi.fn() }));

import { trackEvent } from "@/lib/analytics";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

const trackEventMock = vi.mocked(trackEvent);

/** תגובת fetch מדומה. */
function mockFetch(res: { ok: boolean; body: unknown }) {
  const fn = vi.fn().mockResolvedValue({
    ok: res.ok,
    json: async () => res.body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

/** ממלא את הטופס ולוחץ על שליחה. */
async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("כתובת אימייל"), "reader@example.com");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "עדכנו אותי כשהספר יוצא" }));
}

const previewEvents = () =>
  trackEventMock.mock.calls.filter((c) => c[0] === "waitlist_from_preview").length;

describe("WaitlistForm — ייחוס waitlist_from_preview רק להרשמה חדשה בפועל", () => {
  beforeEach(() => trackEventMock.mockClear());
  afterEach(() => vi.unstubAllGlobals());

  it("הרשמה חדשה (created:true) שולחת waitlist_from_preview פעם אחת", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, body: { success: true, created: true } });
    render(<WaitlistForm source="preview" />);

    await submitForm(user);

    await waitFor(() => expect(screen.getByText(/נרשמת בהצלחה/)).toBeInTheDocument());
    expect(previewEvents()).toBe(1);
    expect(trackEventMock).toHaveBeenCalledWith("waitlist_signup", { source: "preview" });
  });

  it("הרשמה כפולה (created:false) אינה שולחת את האירוע, אך עדיין מציגה הצלחה", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: true, body: { success: true, created: false } });
    render(<WaitlistForm source="preview" />);

    await submitForm(user);

    // חוויית המשתמש זהה (הצלחה), אבל אין דיווח על הרשמה חדשה.
    await waitFor(() => expect(screen.getByText(/נרשמת בהצלחה/)).toBeInTheDocument());
    expect(previewEvents()).toBe(0);
    expect(trackEventMock).not.toHaveBeenCalledWith("waitlist_signup", { source: "preview" });
  });

  it("כשל שרת (500) אינו שולח את האירוע ומציג שגיאה", async () => {
    const user = userEvent.setup();
    mockFetch({ ok: false, body: { error: "אירעה תקלה בשמירת הפרטים. נסו שוב." } });
    render(<WaitlistForm source="preview" />);

    await submitForm(user);

    await waitFor(() =>
      expect(screen.getByText("אירעה תקלה בשמירת הפרטים. נסו שוב.")).toBeInTheDocument()
    );
    expect(previewEvents()).toBe(0);
    expect(trackEventMock).not.toHaveBeenCalled();
  });
});
