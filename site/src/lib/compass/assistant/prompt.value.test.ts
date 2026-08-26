import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  extractValueMarker,
  COMPASS_VALUE_MARKER,
} from "@/lib/compass/assistant/prompt";

/**
 * חילוץ מרקר-הערך: דטרמיניסטי, מסיר את המרקר מהטקסט, ומדווח נוכחות. הנוכחות
 * לבדה אינה `valueDelivered` — השכבה שמעל דורשת גם status "answered".
 */
describe("extractValueMarker", () => {
  it("מרקר בשורה אחרונה → valueDelivered=true, והגוף נקי ממנו", () => {
    const raw = "כדאי להסתכל על הדפוס לאורך זמן, לא על רגע בודד.\n" + COMPASS_VALUE_MARKER;
    const { body, valueDelivered } = extractValueMarker(raw);
    expect(valueDelivered).toBe(true);
    expect(body).not.toContain(COMPASS_VALUE_MARKER);
    expect(body).toBe("כדאי להסתכל על הדפוס לאורך זמן, לא על רגע בודד.");
  });

  it("מרקר אחרי שאלת-המשך → מוסר, והשורה הנגררת נשמרת לחילוץ הבא", () => {
    const raw =
      "כיוון קצר מהספר.\nשאלת המשך: מה הכי חוזר לך?\n" + COMPASS_VALUE_MARKER;
    const { body, valueDelivered } = extractValueMarker(raw);
    expect(valueDelivered).toBe(true);
    expect(body).toContain("שאלת המשך: מה הכי חוזר לך?");
    expect(body).not.toContain(COMPASS_VALUE_MARKER);
  });

  it("בלי מרקר → valueDelivered=false והטקסט ללא שינוי", () => {
    const raw = "רק הקשבתי, בלי כיוון מהקטעים.";
    const { body, valueDelivered } = extractValueMarker(raw);
    expect(valueDelivered).toBe(false);
    expect(body).toBe(raw);
  });

  it("מרקר באמצע (חריג) עדיין מוסר לגמרי מהגוף", () => {
    const raw = `התחלה ${COMPASS_VALUE_MARKER} המשך`;
    const { body, valueDelivered } = extractValueMarker(raw);
    expect(valueDelivered).toBe(true);
    expect(body).not.toContain(COMPASS_VALUE_MARKER);
  });
});
