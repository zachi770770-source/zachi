import { describe, it, expect, afterEach } from "vitest";

import {
  resolveCompassSurface,
  isFreeTextUiPreviewEnabled,
  isCompassFeatureEnabled,
} from "@/lib/compass/assistant/config";

/**
 * מצב-התצוגה של /compass — הפרדה מכוונת בין „מוכנות-ממשק” ל„מוכנות-מנוע”.
 * ברירת מחדל בטוחה: guided (המצפן המודרך בלבד). דגל התצוגה אינו מפעיל מענה
 * ואינו גובר על העוזר האמיתי.
 */

const KEYS = ["COMPASS_ASSISTANT_ENABLED", "COMPASS_FREE_TEXT_UI_PREVIEW"] as const;

afterEach(() => {
  for (const k of KEYS) delete process.env[k];
});

describe("resolveCompassSurface", () => {
  it("defaults to guided when no flags are set (production-safe)", () => {
    expect(resolveCompassSurface()).toBe("guided");
    expect(isCompassFeatureEnabled()).toBe(false);
    expect(isFreeTextUiPreviewEnabled()).toBe(false);
  });

  it("is free-text-preview when only the UI-preview flag is on", () => {
    process.env.COMPASS_FREE_TEXT_UI_PREVIEW = "true";
    expect(resolveCompassSurface()).toBe("free-text-preview");
  });

  it("is free-text-live when the assistant feature is enabled", () => {
    process.env.COMPASS_ASSISTANT_ENABLED = "true";
    expect(resolveCompassSurface()).toBe("free-text-live");
  });

  it("lets the real assistant win over the UI-preview flag", () => {
    process.env.COMPASS_ASSISTANT_ENABLED = "true";
    process.env.COMPASS_FREE_TEXT_UI_PREVIEW = "true";
    expect(resolveCompassSurface()).toBe("free-text-live");
  });

  it("ignores the preview flag unless it is exactly \"true\"", () => {
    process.env.COMPASS_FREE_TEXT_UI_PREVIEW = "1";
    expect(isFreeTextUiPreviewEnabled()).toBe(false);
    expect(resolveCompassSurface()).toBe("guided");
  });
});
