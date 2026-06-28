import { describe, expect, test } from "vitest";
import {
  EMPTY_PLACEHOLDER,
  SECTIONS,
  cleanLabel,
  collectSectionRows,
  isEmpty,
  rowGet,
  warnMissingColumns
} from "../../src/main/generation/mapping";

describe("mapping parity", () => {
  test.each(["", "   ", "-", " - ", null, undefined])("treats %s as empty", (value) => {
    expect(isEmpty(value)).toBe(true);
  });

  test.each(["Ja", "Säkert simma 200 m"])("treats %s as non-empty", (value) => {
    expect(isEmpty(value)).toBe(false);
  });

  test("strips all known prefixes and trims labels", () => {
    expect(cleanLabel("Jamboree26:s frågor - Allergier ")).toBe("Allergier");
    expect(cleanLabel("Kårens frågor - ICE1 - Epost")).toBe("Epost");
    expect(cleanLabel("Kårens frågor - ICE2 - Mobiltelefon")).toBe("Mobiltelefon");
    expect(cleanLabel("Kårens frågor - Simkunnighet ")).toBe("Simkunnighet");
  });

  test("rowGet supports exact and trimmed header matching", () => {
    const row = {
      Namn: "Test Scout",
      "Kårens frågor - Simkunnighet": "Ja"
    };

    expect(rowGet(row, "Namn")).toBe("Test Scout");
    expect(rowGet(row, "Kårens frågor - Simkunnighet ")).toBe("Ja");
    expect(rowGet(row, "Saknas")).toBe("");
  });

  test("always-visible ICE fields render placeholders", () => {
    const iceSection = SECTIONS.find((section) => section.title === "ICE 1");
    expect(iceSection).toBeDefined();

    const rows = collectSectionRows(iceSection!, {});

    expect(rows).toEqual([
      ["Namn", EMPTY_PLACEHOLDER],
      ["E-post", EMPTY_PLACEHOLDER],
      ["Mobiltelefon", EMPTY_PLACEHOLDER]
    ]);
  });

  test("optional blank fields are omitted", () => {
    const basicSection = SECTIONS.find((section) => section.title === "Grundläggande uppgifter");
    expect(basicSection).toBeDefined();

    const rows = collectSectionRows(basicSection!, { Namn: "Test Scout", "Kön": " " });

    expect(rows).not.toContainEqual(["Kön", ""]);
    expect(rows.map(([label]) => label)).not.toContain("Kön");
  });

  test("optional-only empty section returns no rows", () => {
    const transportSection = SECTIONS.find((section) => section.title === "Tillgänglighet och transport");
    expect(transportSection).toBeDefined();

    expect(collectSectionRows(transportSection!, {})).toEqual([]);
  });

  test("warnMissingColumns includes missing expected columns", () => {
    expect(warnMissingColumns({ Namn: "X" })).toContain("Personnummer");
  });

  test("rowGet resolves duplicated Scoutnet question headers", () => {
    const row = {
      "Jamboree26:s frågor - GlutenGluten": "Ja",
      "Jamboree26:s frågor - Sjukdomar och annan medicinsk informationSjukdomar och annan medicinsk information":
        "Syntetisk medicinsk notering"
    };

    expect(rowGet(row, "Jamboree26:s frågor - Gluten")).toBe("Ja");
    expect(rowGet(row, "Jamboree26:s frågor - Sjukdomar och annan medicinsk information")).toBe(
      "Syntetisk medicinsk notering"
    );
  });

  test("exact header values take precedence over duplicated Scoutnet aliases", () => {
    const row = {
      "Jamboree26:s frågor - Gluten": "Exakt värde",
      "Jamboree26:s frågor - GlutenGluten": "Aliasvärde"
    };

    expect(rowGet(row, "Jamboree26:s frågor - Gluten")).toBe("Exakt värde");
  });

  test("warnMissingColumns treats duplicated Scoutnet question headers as present", () => {
    const warnings = warnMissingColumns({
      Namn: "Test Scout",
      Personnummer: "20100101-1234",
      "Jamboree26:s frågor - GlutenGluten": "Ja"
    });

    expect(warnings).not.toContain("Jamboree26:s frågor - Gluten");
    expect(warnings).toContain("Kårens frågor - ICE1 - Namn");
  });

  test("collectSectionRows renders optional values from duplicated Scoutnet headers", () => {
    const allergySection = SECTIONS.find((section) => section.title === "Allergier och medicinsk specialkost");
    expect(allergySection).toBeDefined();

    const rows = collectSectionRows(allergySection!, {
      "Jamboree26:s frågor - Allergier och medicinsk specialkostAllergier och medicinsk specialkost":
        "Syntetisk allergitext"
    });

    expect(rows).toContainEqual(["Allergier och medicinsk specialkost", "Syntetisk allergitext"]);
  });

  test("derives postnummer and postort from aggregated address when separate headers are absent", () => {
    const row = {
      Adress: "Scoutvägen 1, 177 00 Jakobsberg"
    };

    expect(rowGet(row, "Postnummer")).toBe("177 00");
    expect(rowGet(row, "Postort")).toBe("Jakobsberg");
  });

  test("derives telefonnummer from Kontaktinformation Mobiltelefon component when separate header is absent", () => {
    const row = {
      Kontaktinformation: "Mobiltelefon: 070-000 00 00\nAlternativ e-post: scout@example.invalid"
    };

    expect(rowGet(row, "Telefonnummer")).toBe("070-000 00 00");
  });

  test("direct basic contact fields take precedence over derived values", () => {
    const row = {
      Telefonnummer: "070-111 11 11",
      Kontaktinformation: "Mobiltelefon: 070-222 22 22",
      Postnummer: "111 11",
      Postort: "Direktort",
      Adress: "Scoutvägen 1, 177 00 Jakobsberg"
    };

    expect(rowGet(row, "Telefonnummer")).toBe("070-111 11 11");
    expect(rowGet(row, "Postnummer")).toBe("111 11");
    expect(rowGet(row, "Postort")).toBe("Direktort");
  });
});
