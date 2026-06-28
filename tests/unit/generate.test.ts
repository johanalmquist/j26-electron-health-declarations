import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import {
  DEFAULT_OUTPUT_FILENAME,
  generateHealthDeclarations
} from "../../src/main/generation/generate";

async function tempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(tmpdir(), prefix));
}

function writeCsv(dir: string, content: string): string {
  const csvPath = path.join(dir, "participants.csv");
  writeFileSync(csvPath, content, "utf8");
  return csvPath;
}

describe("generateHealthDeclarations", () => {
  test("successful generation writes Hälsodeklarationer.docx to the selected output directory", async () => {
    const dir = await tempDir("halsodeklarationer-generate-success-");
    const csvPath = writeCsv(dir, "Namn,Personnummer\nTest Scout,20100101-1234\n");
    const outputDirectory = path.join(dir, "output");
    mkdirSync(outputDirectory);

    const result = await generateHealthDeclarations({ csvPath, outputDirectory, overwrite: false });

    expect(result).toMatchObject({ ok: true, participantCount: 1 });
    if (result.ok) {
      expect(result.outputPath).toBe(path.join(outputDirectory, DEFAULT_OUTPUT_FILENAME));
      expect(existsSync(result.outputPath)).toBe(true);
    }
  });

  test("existing output with overwrite false returns OUTPUT_ALREADY_EXISTS", async () => {
    const dir = await tempDir("halsodeklarationer-generate-existing-");
    const csvPath = writeCsv(dir, "Namn,Personnummer\nTest Scout,20100101-1234\n");
    writeFileSync(path.join(dir, DEFAULT_OUTPUT_FILENAME), "existing", "utf8");

    await expect(generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: false })).resolves.toMatchObject({
      ok: false,
      code: "OUTPUT_ALREADY_EXISTS"
    });
  });

  test("existing output with overwrite true overwrites successfully", async () => {
    const dir = await tempDir("halsodeklarationer-generate-overwrite-");
    const csvPath = writeCsv(dir, "Namn,Personnummer\nTest Scout,20100101-1234\n");
    const outputPath = path.join(dir, DEFAULT_OUTPUT_FILENAME);
    writeFileSync(outputPath, "existing", "utf8");

    const result = await generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: true });

    expect(result).toMatchObject({ ok: true, participantCount: 1, outputPath });
  });

  test("headers-only CSV returns CSV_EMPTY", async () => {
    const dir = await tempDir("halsodeklarationer-generate-empty-");
    const csvPath = writeCsv(dir, "Namn,Personnummer\n");

    await expect(generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: false })).resolves.toMatchObject({
      ok: false,
      code: "CSV_EMPTY"
    });
  });

  test("missing CSV returns CSV_NOT_FOUND", async () => {
    const dir = await tempDir("halsodeklarationer-generate-missing-");

    await expect(
      generateHealthDeclarations({ csvPath: path.join(dir, "missing.csv"), outputDirectory: dir, overwrite: false })
    ).resolves.toMatchObject({
      ok: false,
      code: "CSV_NOT_FOUND"
    });
  });

  test("missing expected columns are warnings on success", async () => {
    const dir = await tempDir("halsodeklarationer-generate-warnings-");
    const csvPath = writeCsv(dir, "Namn\nTest Scout\n");

    const result = await generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: false });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings).toContainEqual({ column: "Personnummer" });
    }
  });

  test("does not overwrite or delete an existing write-test file", async () => {
    const dir = await tempDir("halsodeklarationer-generate-probe-");
    const csvPath = writeCsv(dir, "Namn,Personnummer\nTest Scout,20100101-1234\n");
    const probePath = path.join(dir, ".halsodeklarationer-write-test");
    writeFileSync(probePath, "keep me", "utf8");

    const result = await generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: false });

    expect(result.ok).toBe(true);
    expect(readFileSync(probePath, "utf8")).toBe("keep me");
  });

  test("uses selected paths exactly even when they end with whitespace", async () => {
    const dir = await tempDir("halsodeklarationer-generate-space-");
    const outputDirectory = path.join(dir, "output ");
    mkdirSync(outputDirectory);
    const csvPath = path.join(dir, "participants .csv");
    writeFileSync(csvPath, "Namn,Personnummer\nTest Scout,20100101-1234\n", "utf8");

    const result = await generateHealthDeclarations({ csvPath, outputDirectory, overwrite: false });

    expect(result).toMatchObject({ ok: true, participantCount: 1, outputPath: path.join(outputDirectory, DEFAULT_OUTPUT_FILENAME) });
  });

  test("rejects malformed non-string paths without throwing", async () => {
    const result = await generateHealthDeclarations({ csvPath: undefined, outputDirectory: undefined, overwrite: false } as never);

    expect(result).toMatchObject({ ok: false, code: "CSV_NOT_FOUND" });
  });

  test("real Scoutnet duplicated question headers and aggregate contact fields are not reported as missing", async () => {
    const dir = await tempDir("halsodeklarationer-generate-scoutnet-schema-");
    const csvPath = writeCsv(
      dir,
      [
        "Namn,Personnummer,Adress,Kontaktinformation,Jamboree26:s frågor - GlutenGluten,Jamboree26:s frågor - Allergier och medicinsk specialkostAllergier och medicinsk specialkost,Jamboree26:s frågor - Jag samtycker till behandling av hälsoinformationJag samtycker till behandling av hälsoinformation",
        '"Test Scout",20100101-1234,"Scoutvägen 1, 177 00 Jakobsberg","Mobiltelefon: 070-000 00 00","Ja","Syntetisk allergitext","Ja"'
      ].join("\n")
    );

    const result = await generateHealthDeclarations({ csvPath, outputDirectory: dir, overwrite: false });

    expect(result).toMatchObject({ ok: true, participantCount: 1 });
    if (result.ok) {
      expect(result.warnings).not.toContainEqual({ column: "Jamboree26:s frågor - Gluten" });
      expect(result.warnings).not.toContainEqual({ column: "Jamboree26:s frågor - Allergier och medicinsk specialkost" });
      expect(result.warnings).not.toContainEqual({
        column: "Jamboree26:s frågor - Jag samtycker till behandling av hälsoinformation"
      });
      expect(result.warnings).not.toContainEqual({ column: "Postnummer" });
      expect(result.warnings).not.toContainEqual({ column: "Postort" });
      expect(result.warnings).not.toContainEqual({ column: "Telefonnummer" });
      expect(result.warnings).toContainEqual({ column: "Kårens frågor - ICE1 - Namn" });
      expect(existsSync(result.outputPath)).toBe(true);
    }
  });
});
