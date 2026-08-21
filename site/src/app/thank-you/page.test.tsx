import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, cleanup, screen } from "@testing-library/react";

/**
 * `/thank-you` הוא עמוד-אישור של הזמנה: הוא דורש `?order=`, שולף את ההזמנה
 * *בצד השרת*, ומסרב במפורש לסמוך על כל דגל-הצלחה שמגיע דרך ה-URL.
 *
 * העמוד נשלח בלי בדיקה ייעודית — הבדיקה ההיסטורית אבדה במיזוג-squash, ומאז
 * `link-audit.spec.ts` רק מוודא שהנתיב קיים ברשימת-הקישורים הפנימיים; אין שום
 * כיסוי התנהגותי. `salesOpen` כרגע `false` ולכן המסלול רדום, אבל הקוד נשלח
 * ויהיה חי ברגע שהדגל יתהפך — כלומר זהו נתיב שנוגע בכסף וללא בדיקה.
 *
 * ארבעה מקרים, והמכריע הוא הרביעי: הזמנה אמיתית אך *לא משולמת* לעולם אינה
 * מוצגת כאישור-תשלום. זה מה שמקבע את התכונה „לא סומכים על ה-URL”.
 *
 * בדיקה בלבד — אין כאן שינוי התנהגות.
 */

const getById = vi.hoisted(() => vi.fn());
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    // ב-Next `notFound()` זורק כדי לעצור את הרינדור; משחזרים את החוזה הזה.
    throw new Error("NEXT_NOT_FOUND");
  }),
);

vi.mock("next/navigation", () => ({ notFound }));
vi.mock("@/lib/orders", () => ({ getOrderRepository: () => ({ getById }) }));

import ThankYouPage from "@/app/thank-you/page";

const PAID_ORDER = {
  id: "ORDER123",
  orderNumber: "MLA-1042",
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
  customerName: "ישראלה ישראלי",
  email: "reader@example.com",
  format: "digital" as const,
  items: [{ title: "מדייטים לאהבה", quantity: 1, unitPrice: 8900 }],
  subtotal: 8900,
  discount: 0,
  shipping: 0,
  total: 8900,
  currency: "ILS",
  paymentStatus: "paid" as const,
  fulfillmentStatus: "access_granted" as const,
  paymentProvider: "mock",
  providerTransactionId: "tx_1",
  idempotencyKey: "idem_1",
  marketingConsent: false,
};

/** אותה הזמנה בדיוק — רק שהתשלום לא הושלם. */
const PENDING_ORDER = {
  ...PAID_ORDER,
  paymentStatus: "pending" as const,
  fulfillmentStatus: "unfulfilled" as const,
};

/** רינדור רכיב-שרת אסינכרוני. */
async function renderPage(searchParams: { order?: string }) {
  const ui = await ThankYouPage({ searchParams: Promise.resolve(searchParams) });
  render(ui);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("/thank-you order confirmation", () => {
  it("404s when no ?order param is present, without consulting the repository", async () => {
    await expect(renderPage({})).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
    // אין סיבה לגעת במאגר בלי מזהה — וזו גם הגנה מפני סריקה.
    expect(getById).not.toHaveBeenCalled();
  });

  it("404s for an unknown order id, after actually looking it up", async () => {
    getById.mockResolvedValue(null);
    await expect(renderPage({ order: "BOGUS" })).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getById).toHaveBeenCalledWith("BOGUS");
    expect(notFound).toHaveBeenCalled();
  });

  it("shows the paid confirmation for a real paid order", async () => {
    getById.mockResolvedValue(PAID_ORDER);
    await renderPage({ order: "ORDER123" });

    expect(getById).toHaveBeenCalledWith("ORDER123");
    expect(
      screen.getByRole("heading", { name: "תודה! ההזמנה התקבלה בהצלחה" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/MLA-1042/)).toBeInTheDocument();
  });

  it("shows the pending state for a real but unpaid order, never the paid confirmation", async () => {
    getById.mockResolvedValue(PENDING_ORDER);
    await renderPage({ order: "ORDER123" });

    expect(
      screen.getByRole("heading", { name: "התשלום עדיין בעיבוד" }),
    ).toBeInTheDocument();
    // הלב של הבדיקה: מצב-התשלום נקבע מהמאגר, לא מהגעה לעמוד ההצלחה.
    expect(screen.queryByText("תודה! ההזמנה התקבלה בהצלחה")).toBeNull();
    expect(screen.queryByText("סיכום ההזמנה")).toBeNull();
    expect(notFound).not.toHaveBeenCalled();
  });
});
