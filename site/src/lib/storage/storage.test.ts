import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";

import {
  getStorageConfig,
  resolveDownloadTtlSeconds,
  isStorageConfigured,
} from "@/lib/storage/config";
import {
  issueBookDownloadUrl,
  verifyBookStorage,
  isPaidOrder,
} from "@/lib/storage/bookDelivery";
import { StorageError, isStorageError } from "@/lib/storage/errors";
import { classifyStorageError, formatStorageErrorLog } from "@/lib/storage/diagnostics";

// ה-Supabase client האמיתי לעולם אינו נטען בבדיקות - מחליפים אותו ב-mock מבוקר.
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

const SIGNED_URL = "https://project.supabase.co/storage/v1/object/sign/x?token=SECRETTOKEN";
const STORAGE_ENV = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "BOOK_STORAGE_BUCKET",
  "BOOK_PDF_PATH",
  "BOOK_DOWNLOAD_TTL_SECONDS",
] as const;

function setValidEnv() {
  process.env.SUPABASE_URL = "https://project.supabase.co";
  process.env.SUPABASE_SECRET_KEY = "sb-secret-service-role-key-value";
  process.env.BOOK_STORAGE_BUCKET = "books-private";
  process.env.BOOK_PDF_PATH = "medaytim-laahava-888-final.pdf";
  process.env.BOOK_DOWNLOAD_TTL_SECONDS = "900";
}

function clearEnv() {
  for (const key of STORAGE_ENV) delete process.env[key];
}

/** בונה client מזויף ל-Supabase שמאפשר לשלוט בתגובת createSignedUrl. */
function mockSupabase(result: {
  signedUrl?: string | null;
  error?: unknown;
}) {
  const createSignedUrl = vi.fn(async () => ({
    data:
      result.signedUrl === null
        ? null
        : { signedUrl: result.signedUrl ?? SIGNED_URL },
    error: result.error ?? null,
  }));
  const getPublicUrl = vi.fn(() => ({ data: { publicUrl: "PUBLIC-SHOULD-NOT-BE-USED" } }));
  const from = vi.fn(() => ({ createSignedUrl, getPublicUrl }));
  const client = { storage: { from } };
  vi.mocked(createClient).mockReturnValue(client as never);
  return { from, createSignedUrl, getPublicUrl };
}

beforeEach(() => {
  vi.clearAllMocks();
  clearEnv();
});

afterEach(() => {
  clearEnv();
});

describe("resolveDownloadTtlSeconds", () => {
  it("defaults safely to 900 when missing or empty", () => {
    expect(resolveDownloadTtlSeconds(undefined)).toBe(900);
    expect(resolveDownloadTtlSeconds("")).toBe(900);
    expect(resolveDownloadTtlSeconds("   ")).toBe(900);
  });

  it("accepts a numeric TTL inside the 60–900 range", () => {
    expect(resolveDownloadTtlSeconds("60")).toBe(60);
    expect(resolveDownloadTtlSeconds("300")).toBe(300);
    expect(resolveDownloadTtlSeconds("900")).toBe(900);
  });

  it("rejects non-numeric / non-integer TTL values (fail closed)", () => {
    for (const bad of ["abc", "12.5", "1e2x", "NaN", "-", "90 0"]) {
      expect(() => resolveDownloadTtlSeconds(bad)).toThrow(StorageError);
      expect(isStorageError(safeThrow(() => resolveDownloadTtlSeconds(bad)), "invalid_ttl")).toBe(true);
    }
  });

  it("rejects TTL below the minimum of 60", () => {
    for (const low of ["0", "1", "59"]) {
      expect(() => resolveDownloadTtlSeconds(low)).toThrow(StorageError);
    }
  });

  it("rejects TTL above the maximum of 900 (cannot exceed 900)", () => {
    for (const high of ["901", "1000", "3600", "1000000"]) {
      expect(() => resolveDownloadTtlSeconds(high)).toThrow(StorageError);
      expect(isStorageError(safeThrow(() => resolveDownloadTtlSeconds(high)), "invalid_ttl")).toBe(true);
    }
  });
});

describe("getStorageConfig / isStorageConfigured", () => {
  it("reports not configured and throws configuration_missing when env vars are absent", () => {
    expect(isStorageConfigured()).toBe(false);
    expect(() => getStorageConfig()).toThrow(StorageError);
    expect(isStorageError(safeThrow(() => getStorageConfig()), "configuration_missing")).toBe(true);
  });

  it("throws configuration_missing when only some env vars are present", () => {
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SECRET_KEY = "sb-secret";
    // BOOK_STORAGE_BUCKET and BOOK_PDF_PATH intentionally missing
    expect(isStorageConfigured()).toBe(false);
    expect(isStorageError(safeThrow(() => getStorageConfig()), "configuration_missing")).toBe(true);
  });

  it("returns a validated config when all env vars are present", () => {
    setValidEnv();
    expect(isStorageConfigured()).toBe(true);
    const config = getStorageConfig();
    expect(config.bucket).toBe("books-private");
    expect(config.objectPath).toBe("medaytim-laahava-888-final.pdf");
    expect(config.ttlSeconds).toBe(900);
  });

  it("propagates invalid_ttl from the env-configured TTL", () => {
    setValidEnv();
    process.env.BOOK_DOWNLOAD_TTL_SECONDS = "99999";
    expect(isStorageError(safeThrow(() => getStorageConfig()), "invalid_ttl")).toBe(true);
  });
});

describe("isPaidOrder", () => {
  it("accepts only an explicit paid order object", () => {
    expect(isPaidOrder({ paymentStatus: "paid" })).toBe(true);
  });

  it("rejects unpaid, missing or unknown orders", () => {
    expect(isPaidOrder({ paymentStatus: "pending" })).toBe(false);
    expect(isPaidOrder({ paymentStatus: "failed" })).toBe(false);
    expect(isPaidOrder({ paymentStatus: "cancelled" })).toBe(false);
    expect(isPaidOrder({ paymentStatus: "unknown" })).toBe(false);
    expect(isPaidOrder({})).toBe(false);
    expect(isPaidOrder(null)).toBe(false);
    expect(isPaidOrder(undefined)).toBe(false);
    expect(isPaidOrder("paid")).toBe(false); // a bare string / email is not authorization
  });
});

describe("issueBookDownloadUrl", () => {
  it("rejects unpaid orders without ever calling storage", async () => {
    setValidEnv();
    const { createSignedUrl } = mockSupabase({});
    for (const status of ["pending", "failed", "cancelled", "unknown"]) {
      await expect(
        issueBookDownloadUrl({ paymentStatus: status } as never)
      ).rejects.toMatchObject({ code: "order_not_paid" });
    }
    await expect(issueBookDownloadUrl(null)).rejects.toMatchObject({ code: "order_not_paid" });
    await expect(issueBookDownloadUrl(undefined)).rejects.toMatchObject({ code: "order_not_paid" });
    expect(createSignedUrl).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });

  it("rejects with configuration_missing when a paid order is delivered without config", async () => {
    // env intentionally cleared
    await expect(
      issueBookDownloadUrl({ paymentStatus: "paid" } as never)
    ).rejects.toMatchObject({ code: "configuration_missing" });
  });

  it("issues a fresh signed URL for a paid order using the private bucket", async () => {
    setValidEnv();
    const { from, createSignedUrl, getPublicUrl } = mockSupabase({ signedUrl: SIGNED_URL });

    const url = await issueBookDownloadUrl({ paymentStatus: "paid" } as never);

    expect(url).toBe(SIGNED_URL);
    // בוחר את ה-bucket הפרטי לפי משתנה הסביבה.
    expect(from).toHaveBeenCalledWith("books-private");
    // חותם על נתיב האובייקט מ-BOOK_PDF_PATH, עם ה-TTL מ-env ושם קובץ בטוח.
    expect(createSignedUrl).toHaveBeenCalledWith(
      "medaytim-laahava-888-final.pdf",
      900,
      { download: "medaytim-laahava.pdf" }
    );
    // client עם persistSession/autoRefreshToken כבויים.
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "sb-secret-service-role-key-value",
      expect.objectContaining({
        auth: expect.objectContaining({
          persistSession: false,
          autoRefreshToken: false,
        }),
      })
    );
    // לעולם לא משתמשים ב-getPublicUrl.
    expect(getPublicUrl).not.toHaveBeenCalled();
  });

  it("generates a fresh signed URL on every authorized delivery (no caching)", async () => {
    setValidEnv();
    const { createSignedUrl } = mockSupabase({ signedUrl: SIGNED_URL });
    await issueBookDownloadUrl({ paymentStatus: "paid" } as never);
    await issueBookDownloadUrl({ paymentStatus: "paid" } as never);
    expect(createSignedUrl).toHaveBeenCalledTimes(2);
  });
});

describe("Supabase error handling does not leak secrets", () => {
  const SECRET_LEAK =
    "connect ECONNREFUSED postgres://user:pass@db.project.supabase.co:5432 " +
    "bucket=books-private path=medaytim-laahava-888-final.pdf key=sb-secret-service-role-key-value";

  it("wraps a storage error in a generic StorageError with no internal details", async () => {
    setValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase({
      signedUrl: null,
      error: { name: "StorageApiError", message: SECRET_LEAK, status: 403 },
    });

    let caught: unknown;
    try {
      await issueBookDownloadUrl({ paymentStatus: "paid" } as never);
    } catch (err) {
      caught = err;
    }

    expect(isStorageError(caught, "signing_failed")).toBe(true);
    const message = (caught as Error).message;
    // ההודעה הגלויה גנרית ולא כוללת סוד/URL/נתיב/מפתח/bucket.
    expect(message).not.toContain("supabase");
    expect(message).not.toContain("postgres://");
    expect(message).not.toContain("pass");
    expect(message).not.toContain("books-private");
    expect(message).not.toContain("medaytim-laahava-888-final.pdf");
    expect(message).not.toContain("sb-secret");
    expect(message).not.toContain("ECONNREFUSED");
    expect((caught as Error).stack === undefined || typeof (caught as Error).stack === "string").toBe(true);

    // שורת הלוג היחידה מכילה רק מטא-נתונים בטוחים.
    expect(errorSpy).toHaveBeenCalledTimes(1);
    const logged = String(errorSpy.mock.calls[0]?.[0] ?? "");
    for (const secret of [
      "postgres://",
      "pass",
      "books-private",
      "medaytim-laahava-888-final.pdf",
      "sb-secret",
      "db.project.supabase.co",
      SIGNED_URL,
    ]) {
      expect(logged).not.toContain(secret);
    }
    expect(logged.startsWith("[storage] delivery error")).toBe(true);
    errorSpy.mockRestore();
  });

  it("classifies storage errors from safe metadata only", () => {
    expect(classifyStorageError({ name: "StorageApiError", status: 404 })).toMatchObject({
      stage: "not_found",
      classification: "object_not_found",
    });
    expect(classifyStorageError({ name: "StorageApiError", status: 403 })).toMatchObject({
      stage: "authorization",
      classification: "not_authorized",
    });
    expect(classifyStorageError({ name: "StorageApiError", status: 503 })).toMatchObject({
      stage: "signing",
      classification: "storage_unavailable",
    });
  });

  it("never emits message or stack in the formatted log line", () => {
    const err = Object.assign(new Error(SECRET_LEAK), { status: 500 });
    const line = formatStorageErrorLog(classifyStorageError(err));
    expect(line).not.toContain("postgres://");
    expect(line).not.toContain("pass");
    expect(line).not.toContain("books-private");
    expect(line).not.toContain("sb-secret");
    expect(line.startsWith("[storage] delivery error")).toBe(true);
  });
});

describe("verifyBookStorage", () => {
  it("reports not-ready when configuration is absent (and never calls storage)", async () => {
    const readiness = await verifyBookStorage();
    expect(readiness).toEqual({ configured: false, objectAccessible: false, ok: false });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("reports ready when the private object can be signed, without returning the URL", async () => {
    setValidEnv();
    const { createSignedUrl } = mockSupabase({ signedUrl: SIGNED_URL });

    const readiness = await verifyBookStorage();

    expect(readiness).toEqual({ configured: true, objectAccessible: true, ok: true });
    // אימות משתמש ב-TTL קצר (60) - לא חושף קישור ארוך-טווח.
    expect(createSignedUrl).toHaveBeenCalledWith(
      "medaytim-laahava-888-final.pdf",
      60,
      { download: "medaytim-laahava.pdf" }
    );
    // התוצאה אינה מכילה את הקישור החתום בשום שדה.
    expect(JSON.stringify(readiness)).not.toContain("token");
    expect(JSON.stringify(readiness)).not.toContain("supabase.co");
  });

  it("reports not-ready (safely) when signing fails", async () => {
    setValidEnv();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSupabase({ signedUrl: null, error: { name: "StorageApiError", status: 404 } });

    const readiness = await verifyBookStorage();

    expect(readiness).toEqual({ configured: true, objectAccessible: false, ok: false });
    errorSpy.mockRestore();
  });
});

/** מריץ פונקציה שאמורה לזרוק ומחזיר את השגיאה שנתפסה (לצורך בדיקות isStorageError). */
function safeThrow(fn: () => unknown): unknown {
  try {
    fn();
  } catch (err) {
    return err;
  }
  return undefined;
}
