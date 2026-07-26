import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  subjectCookieOptions,
  hashSubject,
  newSubjectId,
  SUBJECT_COOKIE_MAX_AGE,
} from "@/lib/compass/assistant/identity";
import { COMPASS_LIMITS } from "@/lib/compass/assistant/config";

describe("עוגיית המבקר — דגלי אבטחה", () => {
  it("HttpOnly, SameSite=Lax, Path=/, ומשך חיים ארוך שמכסה את מגבלת 7 המצטברת", () => {
    const o = subjectCookieOptions();
    expect(o.httpOnly).toBe(true);
    expect(o.sameSite).toBe("lax");
    expect(o.path).toBe("/");
    // הלימיט המצטבר הוא „לכל החיים” של המזהה; העוגיה ארוכת חיים (הדפדפנים
    // מגבילים ל-~400 יום), הרבה מעבר לחלון היממתי של המכסה.
    expect(o.maxAge).toBe(SUBJECT_COOKIE_MAX_AGE);
    expect(o.maxAge).toBeGreaterThan(COMPASS_LIMITS.windowMs / 1000);
  });

  it("Secure מופעל בפרודקשן בלבד", () => {
    const orig = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string>).NODE_ENV = "production";
      expect(subjectCookieOptions().secure).toBe(true);
      (process.env as Record<string, string>).NODE_ENV = "development";
      expect(subjectCookieOptions().secure).toBe(false);
    } finally {
      (process.env as Record<string, string>).NODE_ENV = orig ?? "test";
    }
  });
});

describe("מזהה אנונימי", () => {
  it("hashSubject דטרמיניסטי ולא מחזיר את המזהה עצמו", () => {
    const id = newSubjectId();
    expect(hashSubject(id)).toBe(hashSubject(id));
    expect(hashSubject(id)).not.toBe(id);
    expect(hashSubject(id)).toMatch(/^[a-f0-9]{64}$/);
  });
});
