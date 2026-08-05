import { afterEach, describe, expect, it, vi } from "vitest";

import { clearCompass, loadCompass, saveCompass } from "./quizStorage";

const KEY = "mlc.compass.v1";

afterEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    /* ignore */
  }
  vi.restoreAllMocks();
});

describe("compass quiz persistence", () => {
  it("round-trips station id + completion", () => {
    saveCompass("inside-relationship");
    expect(loadCompass()).toEqual({ stationId: "inside-relationship", completed: true });
  });

  it("stores only the station id and completion flag (no answers / sensitive data)", () => {
    saveCompass("starting-again");
    const raw = JSON.parse(window.localStorage.getItem(KEY) as string);
    expect(Object.keys(raw).sort()).toEqual(["completed", "stationId"]);
    expect(raw).not.toHaveProperty("answers");
  });

  it("returns null when nothing is stored", () => {
    expect(loadCompass()).toBeNull();
  });

  it("returns null on corrupt JSON", () => {
    window.localStorage.setItem(KEY, "{not valid json");
    expect(loadCompass()).toBeNull();
  });

  it("returns null on wrong shape / unknown station id", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ stationId: "mars", completed: true }));
    expect(loadCompass()).toBeNull();
    window.localStorage.setItem(KEY, JSON.stringify({ stationId: "before-relationship" }));
    expect(loadCompass()).toBeNull(); // completed !== true
    window.localStorage.setItem(KEY, JSON.stringify(["array"]));
    expect(loadCompass()).toBeNull();
  });

  it("ignores an invalid station id on save", () => {
    // @ts-expect-error intentional invalid id
    saveCompass("nowhere");
    expect(loadCompass()).toBeNull();
  });

  it("never throws when localStorage is blocked (getItem/setItem throw)", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => saveCompass("before-relationship")).not.toThrow();
    expect(loadCompass()).toBeNull();
    getSpy.mockRestore();
    setSpy.mockRestore();
  });

  it("clear removes the saved result", () => {
    saveCompass("before-relationship");
    expect(loadCompass()).not.toBeNull();
    clearCompass();
    expect(loadCompass()).toBeNull();
  });
});
