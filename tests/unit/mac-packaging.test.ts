import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

function yamlScalar(config: string, key: string): string {
  const line = config.split(/\r?\n/).find((candidate) => candidate.startsWith(`${key}:`));
  if (line === undefined) {
    throw new Error(`Missing ${key} in electron-builder.yml`);
  }

  return line.slice(line.indexOf(":") + 1).trim();
}

describe("macOS packaging metadata", () => {
  test("uses an ASCII product name for Electron bundle startup compatibility", () => {
    const config = readFileSync("electron-builder.yml", "utf8");
    const productName = yamlScalar(config, "productName");

    expect(productName).toBe("Halsodeklarationer");
    expect(productName).toMatch(/^[\x20-\x7E]+$/);
  });
});
