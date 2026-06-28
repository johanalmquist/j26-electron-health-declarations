import { existsSync } from "node:fs";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import JSZip from "jszip";
import { describe, expect, test } from "vitest";
import { renderDocument } from "../../src/main/generation/docx";

async function docxEntry(docxPath: string, entryPath: string): Promise<string> {
  const zip = await JSZip.loadAsync(await readFile(docxPath));
  const entry = zip.file(entryPath);
  expect(entry).not.toBeNull();
  return entry!.async("string");
}

describe("renderDocument", () => {
  test("writes a combined health declaration document", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "halsodeklarationer-docx-"));
    const outputPath = path.join(dir, "nested", "Hälsodeklarationer.docx");

    await renderDocument({
      title: "Hälsodeklaration",
      outputPath,
      rows: [
        {
          Namn: "Test Scout",
          Personnummer: "20100101-1234",
          "Kårens frågor - Simkunnighet ": "Ja",
          Adress: "Scoutvägen 1, 177 00 Jakobsberg",
          Kontaktinformation: "Mobiltelefon: 070-000 00 00",
          "Jamboree26:s frågor - Sjukdomar och annan medicinsk informationSjukdomar och annan medicinsk information":
            "Syntetisk medicinsk notering",
          "Jamboree26:s frågor - Allergier och medicinsk specialkostAllergier och medicinsk specialkost":
            "Syntetisk allergitext"
        },
        {
          Namn: "Scout Två",
          Personnummer: "20120202-5678",
          "Kårens frågor - Simkunnighet ": "Ja"
        }
      ]
    });

    expect(existsSync(outputPath)).toBe(true);
    const xml = await docxEntry(outputPath, "word/document.xml");
    const stylesXml = await docxEntry(outputPath, "word/styles.xml");
    expect(xml).toContain("Hälsodeklaration");
    expect(xml).toContain("Namn: Test Scout");
    expect(xml).toContain("Personnummer: 20100101-1234");
    expect(xml).toContain("GRUNDLÄGGANDE UPPGIFTER");
    expect(xml).toContain("KÅRENS FRÅGOR");
    expect(xml).toContain("ICE 1");
    expect(xml).toContain("ICE 2");
    expect(xml).toContain("HÄLSOINFORMATION");
    expect(xml).toContain("TILLGÄNGLIGHET OCH TRANSPORT");
    expect(xml).toContain("ALLERGIER OCH MEDICINSK SPECIALKOST");
    expect(xml).toContain("Inga uppgifter angivna i anmälan.");
    expect(xml).toContain('w:type="page"');
    expect(xml).toContain("Postnummer");
    expect(xml).toContain("177 00");
    expect(xml).toContain("Postort");
    expect(xml).toContain("Jakobsberg");
    expect(xml).toContain("Telefonnummer");
    expect(xml).toContain("070-000 00 00");
    expect(xml).toContain("Sjukdomar och annan medicinsk information");
    expect(xml).toContain("Syntetisk medicinsk notering");
    expect(xml).toContain("Allergier och medicinsk specialkost");
    expect(xml).toContain("Syntetisk allergitext");
    expect(stylesXml).toContain("Calibri");
    expect(stylesXml).toContain('w:sz w:val="22"');
  });
});
