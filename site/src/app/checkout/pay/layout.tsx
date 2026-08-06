import type { Metadata } from "next";
import type { ReactNode } from "react";

/**
 * עמוד התשלום (/checkout/pay/[sessionId]) הוא עמוד מערכת מאחורי session דינמי —
 * לעולם אינו אמור להופיע בגוגל. הדף עצמו הוא Client Component ולכן לא יכול
 * לייצא metadata; ה-noindex מוגדר כאן ב-layout של המקטע.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function CheckoutPayLayout({ children }: { children: ReactNode }) {
  return children;
}
