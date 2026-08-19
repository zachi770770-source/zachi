import { describe, it, expect } from "vitest";

import { normWord, expandWord, expandText, tokenize } from "@/lib/compass/hebrew";

describe("hebrew normalization", () => {
  it("folds final letters to their regular form", () => {
    expect(normWord("שלום")).toBe("שלומ");
    expect(normWord("ארץ")).toBe("ארצ");
    expect(normWord("מךןףץם")).toBe("מכנפצמ");
  });

  it("strips niqqud, cantillation and geresh/gershayim", () => {
    expect(normWord("שָׁלוֹם")).toBe("שלומ");
    expect(normWord("צ׳אט")).toBe("צאט");
  });

  it("does not touch a word with no finals/niqqud beyond NFC", () => {
    expect(normWord("קשר")).toBe("קשר");
  });
});

describe("hebrew prefix expansion", () => {
  it("keeps the normalized form and adds a de-prefixed variant when remainder >= 3", () => {
    // „בפגישות” → also „פגישות”
    expect(expandWord("בפגישות")).toEqual(
      expect.arrayContaining(["בפגישות", "פגישות"]),
    );
    // „ה” article stripped: „הקשר” → also „קשר”
    expect(expandWord("הקשר")).toEqual(expect.arrayContaining(["הקשר", "קשר"]));
  });

  it("does NOT strip when the remainder would be too short (< 3)", () => {
    // „בית” starts with ב but stripping leaves „ית” (2) — not stripped.
    expect(expandWord("בית")).toEqual(["בית"]);
  });

  it("strips a two-letter prefix (כש) once", () => {
    expect(expandWord("כשמתחילים")).toEqual(
      expect.arrayContaining(["כשמתחילימ", "מתחילימ"]),
    );
  });

  it("a bare content word yields just itself", () => {
    expect(expandWord("פגישות")).toEqual(["פגישות"]);
  });
});

describe("expandText / tokenize", () => {
  it("tokenizes on non-letter boundaries and drops single chars", () => {
    expect(tokenize("קשר, אהבה! ו a")).toEqual(["קשר", "אהבה"]);
  });

  it("expands every content word for indexing (index side matches query side)", () => {
    const out = expandText("בפגישות ראשונות").split(" ");
    expect(out).toEqual(expect.arrayContaining(["בפגישות", "פגישות", "ראשונות"]));
  });
});
