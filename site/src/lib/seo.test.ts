import { describe, it, expect } from "vitest";

import { pageMetadata } from "@/lib/seo";

/**
 * עמוד הבית הוא הקישור שמשותף הכי הרבה, ובעבר יצא ב-HTML בלי og:image ובלי
 * twitter:image כלל: `pageMetadata` החריג אותו בהנחה שה-file-convention מכסה
 * אותו, וההנחה הפסיקה להיות נכונה מאז הפיצול לשני root layouts.
 */
describe("pageMetadata — תמונת שיתוף", () => {
  it.each(["/", "/book"])("%s מצהיר og:image ו-twitter:image", (path) => {
    const meta = pageMetadata({ title: "t", description: "d", path });
    expect(JSON.stringify(meta.openGraph)).toContain("/opengraph-image");
    expect(JSON.stringify(meta.twitter)).toContain("/opengraph-image");
  });
});
