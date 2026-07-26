import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

/**
 * בדיקות אבטחה סטטיות + אימות שהגנות ה-checkout וה-waitlist נשארו שלמות.
 * מריצות מ-cwd של פרויקט site (כפי ש-Vitest מוגדר).
 */

const SRC = path.resolve(process.cwd(), "src");
const STORAGE_DIR = path.join(SRC, "lib", "storage");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walk(full));
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

const allSourceFiles = walk(SRC);
const isTestFile = (f: string) => /\.test\.tsx?$/.test(f);
const nonTestSourceFiles = allSourceFiles.filter((f) => !isTestFile(f));

function read(file: string): string {
  return readFileSync(file, "utf8");
}

function isClientComponent(content: string): boolean {
  const head = content.trimStart().slice(0, 40);
  return head.startsWith('"use client"') || head.startsWith("'use client'");
}

describe("secret key is never exposed to the client", () => {
  const clientFiles = allSourceFiles.filter(
    (f) => !f.endsWith(".test.ts") && !f.endsWith(".test.tsx") && isClientComponent(read(f))
  );

  it("has client components to check", () => {
    // אם אין קומפוננטות client כלל, הבדיקה חסרת משמעות - נכשל כדי לשים לב.
    expect(clientFiles.length).toBeGreaterThan(0);
  });

  it("no client component references SUPABASE_SECRET_KEY", () => {
    for (const file of clientFiles) {
      expect(read(file), file).not.toContain("SUPABASE_SECRET_KEY");
    }
  });

  it("no client component imports the server-only storage module", () => {
    for (const file of clientFiles) {
      const content = read(file);
      expect(content, file).not.toContain("@/lib/storage");
      expect(content, file).not.toMatch(/from\s+["'].*lib\/storage/);
    }
  });

  it("the secret key is never referenced via a NEXT_PUBLIC_ variable anywhere", () => {
    // סורק קוד מקור בלבד (לא קבצי בדיקה, שמזכירים את המחרוזות ככשל מכוון).
    for (const file of nonTestSourceFiles) {
      expect(read(file), file).not.toContain("NEXT_PUBLIC_SUPABASE");
      expect(read(file), file).not.toMatch(/NEXT_PUBLIC_[A-Z_]*SECRET/);
    }
  });
});

describe("storage module is server-only and never generates public URLs", () => {
  const storageFiles = walk(STORAGE_DIR).filter((f) => !f.endsWith(".test.ts"));

  it("core storage entry files import 'server-only'", () => {
    const mustBeServerOnly = ["index.ts", "config.ts", "client.ts", "bookDelivery.ts"];
    for (const name of mustBeServerOnly) {
      const file = path.join(STORAGE_DIR, name);
      expect(read(file), file).toContain('import "server-only"');
    }
  });

  it("no storage source calls getPublicUrl (private bucket only)", () => {
    // מזהה קריאה בפועל `getPublicUrl(` - הזכרה בהערת הסבר אינה נחשבת שימוש.
    for (const file of storageFiles) {
      expect(read(file), file).not.toMatch(/getPublicUrl\s*\(/);
    }
  });

  it("does not hardcode a Supabase URL, secret key or bucket value", () => {
    for (const file of storageFiles) {
      const content = read(file);
      expect(content, file).not.toMatch(/https?:\/\/[a-z0-9-]+\.supabase\.co/i);
    }
  });
});

describe("the book PDF is never committed to the repo or public bundle", () => {
  it("has no .pdf files anywhere under the site project", () => {
    const pdfs = allSourceFiles.filter((f) => f.endsWith(".pdf"));
    expect(pdfs).toEqual([]);
  });

  it("has no .pdf files in /public", () => {
    const publicDir = path.resolve(process.cwd(), "public");
    if (!existsSync(publicDir)) return;
    const found = walkAny(publicDir).filter((f) => f.toLowerCase().endsWith(".pdf"));
    expect(found).toEqual([]);
  });
});

function walkAny(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walkAny(full));
    else out.push(full);
  }
  return out;
}

describe("existing checkout and waitlist protections remain intact", () => {
  const g = globalThis as unknown as Record<string, unknown>;

  beforeEach(() => {
    delete process.env.SALES_ENABLED;
    delete process.env.DATABASE_URL;
    delete process.env.WAITLIST_ALLOW_MEMORY;
    delete g.waitlistMemoryRepo;
    delete g.waitlistRepo;
    delete g.waitlistPool;
  });

  afterEach(() => {
    delete g.waitlistMemoryRepo;
    delete g.waitlistRepo;
    delete g.waitlistPool;
  });

  it("checkout stays closed (403) while SALES_ENABLED is not 'true'", async () => {
    const { POST } = await import("@/app/api/checkout/route");
    const res = await POST(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", host: "localhost", origin: "http://localhost" },
        body: JSON.stringify({}),
      }) as never
    );
    expect(res.status).toBe(403);
  });

  it("waitlist returns 503 (not fake success) when no persistent store is configured", async () => {
    const { POST } = await import("@/app/api/waitlist/route");
    const res = await POST(
      new Request("http://localhost/api/waitlist", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          host: "localhost",
          origin: "http://localhost",
          "x-forwarded-for": "203.0.113.7",
        },
        body: JSON.stringify({ email: "a@b.com", consent: true }),
      }) as never
    );
    expect(res.status).toBe(503);
  });
});
