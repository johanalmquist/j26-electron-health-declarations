import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { collectSectionRows, SECTIONS } from "../../src/main/generation/mapping";
import { loadScoutnetCsv } from "../../src/main/generation/csv";

function writeTempCsv(content: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), "halsodeklarationer-csv-"));
  const csvPath = path.join(dir, "scoutnet.csv");
  writeFileSync(csvPath, content, "utf8");
  return csvPath;
}

describe("loadScoutnetCsv", () => {
  test("UTF-8 BOM before Namn does not break lookup", () => {
    const csvPath = writeTempCsv("\uFEFFNamn,Personnummer\nTest Scout,20100101-1234\n");

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0].Namn).toBe("Test Scout");
    }
  });

  test("quoted multiline medical text stays in one row", () => {
    const csvPath = writeTempCsv(
      'Namn,Personnummer,Jamboree26:s frågor - Sjukdomar och annan medicinsk information\n"Test Scout",20100101-1234,"Rad 1\nRad 2"\n'
    );

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]["Jamboree26:s frågor - Sjukdomar och annan medicinsk information"]).toBe("Rad 1\nRad 2");
    }
  });

  test("quoted commas stay in one field", () => {
    const csvPath = writeTempCsv(
      'Namn,Personnummer,Jamboree26:s frågor - Annan relevant kostinformation\n"Test Scout",20100101-1234,"Äter äpple, banan och päron"\n'
    );

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows[0]["Jamboree26:s frågor - Annan relevant kostinformation"]).toBe("Äter äpple, banan och päron");
    }
  });

  test("headers-only CSV returns CSV_EMPTY", () => {
    const csvPath = writeTempCsv("Namn,Personnummer\n");

    expect(loadScoutnetCsv(csvPath)).toMatchObject({
      ok: false,
      code: "CSV_EMPTY"
    });
  });

  test("missing Personnummer appears in warnings, not as fatal error", () => {
    const csvPath = writeTempCsv("Namn\nTest Scout\n");

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings).toContainEqual({ column: "Personnummer" });
    }
  });

  test("extra unknown columns do not appear in rendered section rows", () => {
    const csvPath = writeTempCsv("Namn,Personnummer,Okänd extra kolumn\nTest Scout,20100101-1234,Ska ignoreras\n");

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      const renderedLabels = SECTIONS.flatMap((section) => collectSectionRows(section, result.rows[0]).map(([label]) => label));
      expect(renderedLabels).not.toContain("Okänd extra kolumn");
    }
  });

  test("duplicated Scoutnet question headers render through mapping and do not warn as missing", () => {
    const csvPath = writeTempCsv(
      [
        "Namn,Personnummer,Adress,Kontaktinformation,Jamboree26:s frågor - GlutenGluten,Jamboree26:s frågor - Sjukdomar och annan medicinsk informationSjukdomar och annan medicinsk information",
        '"Test Scout",20100101-1234,"Scoutvägen 1, 177 00 Jakobsberg","Mobiltelefon: 070-000 00 00","Ja","Rad 1\nRad 2"'
      ].join("\n")
    );

    const result = loadScoutnetCsv(csvPath);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings).not.toContainEqual({ column: "Jamboree26:s frågor - Gluten" });
      expect(result.warnings).not.toContainEqual({
        column: "Jamboree26:s frågor - Sjukdomar och annan medicinsk information"
      });
      expect(result.warnings).not.toContainEqual({ column: "Postnummer" });
      expect(result.warnings).not.toContainEqual({ column: "Postort" });
      expect(result.warnings).not.toContainEqual({ column: "Telefonnummer" });
      expect(result.warnings).toContainEqual({ column: "Kårens frågor - ICE1 - Namn" });

      const allergySection = SECTIONS.find((section) => section.title === "Allergier och medicinsk specialkost");
      expect(allergySection).toBeDefined();
      expect(collectSectionRows(allergySection!, result.rows[0])).toContainEqual(["Gluten", "Ja"]);

      const healthSection = SECTIONS.find((section) => section.title === "Hälsoinformation");
      expect(healthSection).toBeDefined();
      expect(collectSectionRows(healthSection!, result.rows[0])).toContainEqual([
        "Sjukdomar och annan medicinsk information",
        "Rad 1\nRad 2"
      ]);
    }
  });
});
