import { describe, it, expect } from "vitest";

import {
  sniffProofMime,
  validateProof,
  READER_PROOF_MAX_BYTES,
} from "@/lib/reader/proof";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);
const PDF = Buffer.from("%PDF-1.7\n...", "latin1");

describe("proof type sniffing (magic bytes, not the declared type)", () => {
  it("recognizes PNG / JPEG / WEBP / PDF by signature", () => {
    expect(sniffProofMime(PNG)).toBe("image/png");
    expect(sniffProofMime(JPEG)).toBe("image/jpeg");
    expect(sniffProofMime(WEBP)).toBe("image/webp");
    expect(sniffProofMime(PDF)).toBe("application/pdf");
  });

  it("rejects a file whose bytes are not an allowed type (e.g. a spoofed .png that is really text)", () => {
    expect(sniffProofMime(Buffer.from("just some text, not an image"))).toBeNull();
    // GIF is not allowed even though it is a real image.
    expect(sniffProofMime(Buffer.from("GIF89a"))).toBeNull();
  });
});

describe("validateProof (size + type)", () => {
  it("accepts a valid small image", () => {
    expect(validateProof(PNG)).toEqual({ ok: true, mime: "image/png" });
  });

  it("rejects an empty file", () => {
    expect(validateProof(Buffer.alloc(0))).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects an oversized file before trusting its content", () => {
    const big = Buffer.concat([PNG, Buffer.alloc(READER_PROOF_MAX_BYTES)]);
    expect(validateProof(big)).toEqual({ ok: false, reason: "too_large" });
  });

  it("rejects an unsupported type", () => {
    expect(validateProof(Buffer.from("<html>nope</html>"))).toEqual({
      ok: false,
      reason: "unsupported_type",
    });
  });
});
