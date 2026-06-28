import { describe, expect, test } from "vitest";
import { rendererLoadTarget } from "../../src/main/renderer-target";

describe("rendererLoadTarget", () => {
  test("uses the dev URL only outside packaged builds", () => {
    expect(rendererLoadTarget({ isPackaged: false, devUrl: "http://localhost:5173", rendererIndexPath: "/app/index.html" })).toEqual({
      kind: "url",
      value: "http://localhost:5173"
    });
  });

  test("ignores ELECTRON_RENDERER_URL in packaged builds", () => {
    expect(rendererLoadTarget({ isPackaged: true, devUrl: "https://attacker.invalid", rendererIndexPath: "/app/index.html" })).toEqual({
      kind: "file",
      value: "/app/index.html"
    });
  });
});
