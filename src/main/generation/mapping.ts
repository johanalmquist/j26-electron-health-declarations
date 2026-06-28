export const EMPTY_PLACEHOLDER = "—";
export const NO_DATA_MESSAGE = "Inga uppgifter angivna i anmälan.";

export type Field = {
  csvColumn: string;
  displayLabel?: string;
};

export type Section = {
  title: string;
  fields: readonly Field[];
};

export const PREFIXES: readonly string[] = [
  "Jamboree26:s frågor - ",
  "Kårens frågor - ICE1 - ",
  "Kårens frågor - ICE2 - ",
  "Kårens frågor - "
];

export const ALWAYS_VISIBLE_COLUMNS: ReadonlySet<string> = new Set([
  "Namn",
  "Personnummer",
  "E-post",
  "Telefonnummer",
  "Adress",
  "Postort",
  "Postnummer",
  "Kårens frågor - ICE1 - Namn",
  "Kårens frågor - ICE1 - Epost",
  "Kårens frågor - ICE1 - Mobiltelefon",
  "Kårens frågor - ICE2 - Namn",
  "Kårens frågor - ICE2 - Epost",
  "Kårens frågor - ICE2 - Mobiltelefon",
  "Kårens frågor - Simkunnighet ",
  "Jamboree26:s frågor - Jag samtycker till behandling av hälsoinformation",
  "Jamboree26:s frågor - Jag samtycker till behandling av kostinformation"
]);

export const SECTIONS: readonly Section[] = [
  {
    title: "Grundläggande uppgifter",
    fields: [
      { csvColumn: "Namn" },
      { csvColumn: "Kön" },
      { csvColumn: "Personnummer" },
      { csvColumn: "E-post" },
      { csvColumn: "Adress" },
      { csvColumn: "Postort" },
      { csvColumn: "Postnummer" },
      { csvColumn: "Land" },
      { csvColumn: "Telefonnummer" }
    ]
  },
  {
    title: "Kårens frågor",
    fields: [
      { csvColumn: "Kårens frågor - Simkunnighet " },
      { csvColumn: "Kårens frågor - Viktigt att känna till om deltagaren" },
      { csvColumn: "Jamboree26:s frågor - Jag samtycker till publicering av bilder på mitt barn" }
    ]
  },
  {
    title: "ICE 1",
    fields: [
      { csvColumn: "Kårens frågor - ICE1 - Namn" },
      { csvColumn: "Kårens frågor - ICE1 - Epost", displayLabel: "E-post" },
      { csvColumn: "Kårens frågor - ICE1 - Mobiltelefon" }
    ]
  },
  {
    title: "ICE 2",
    fields: [
      { csvColumn: "Kårens frågor - ICE2 - Namn" },
      { csvColumn: "Kårens frågor - ICE2 - Epost", displayLabel: "E-post" },
      { csvColumn: "Kårens frågor - ICE2 - Mobiltelefon" }
    ]
  },
  {
    title: "Hälsoinformation",
    fields: [
      { csvColumn: "Jamboree26:s frågor - Jag samtycker till behandling av hälsoinformation" },
      { csvColumn: "Jamboree26:s frågor - Sjukdomar och annan medicinsk information" },
      { csvColumn: "Jamboree26:s frågor - Tar du/ditt barn någon medicin som jamboreens sjukvårdsteam bör känna till?" },
      { csvColumn: "Jamboree26:s frågor - Vilken medicin tar du/ditt barn som jamboreens sjukvårdsteam bör känna till?" },
      { csvColumn: "Jamboree26:s frågor - Har du/ditt barn behov av kylförvaring för medicin?" },
      { csvColumn: "Jamboree26:s frågor - Har du/ditt barn ett medicinskt behov av elektricitet vid boplatsen?" },
      { csvColumn: "Jamboree26:s frågor - Vad behöver du/ditt barn elektricitet till?" },
      { csvColumn: "Jamboree26:s frågor - Är du/ditt barn allergisk mot något läkemedel?" },
      { csvColumn: "Jamboree26:s frågor - Vilket/vilka läkemedel är du/ditt barn allergisk mot?" },
      { csvColumn: "Jamboree26:s frågor - Har du/ditt barn annan allergi som inte är kostrelaterad (dessa fylls i under kostfrågorna)?" },
      { csvColumn: "Jamboree26:s frågor - Beskriv din/ditt barn icke-kostrelaterade allergi" },
      { csvColumn: "Jamboree26:s frågor - Jag samtycker till behandling av kostinformation" }
    ]
  },
  {
    title: "Tillgänglighet och transport",
    fields: [
      { csvColumn: "Jamboree26:s frågor - Har du/ditt barn behov av interntransport?" },
      { csvColumn: "Jamboree26:s frågor - Beskriv ditt/ditt barns behov av interntransport" },
      { csvColumn: "Jamboree26:s frågor - Andra tillgänglighetsbehov" }
    ]
  },
  {
    title: "Allergier och medicinsk specialkost",
    fields: [
      { csvColumn: "Jamboree26:s frågor - Allergier och medicinsk specialkost" },
      { csvColumn: "Jamboree26:s frågor - Gluten" },
      { csvColumn: "Jamboree26:s frågor - Laktos" },
      { csvColumn: "Jamboree26:s frågor - Mjölkprotein" },
      { csvColumn: "Jamboree26:s frågor - Ägg" },
      { csvColumn: "Jamboree26:s frågor - Soja, baljväxter och lupin" },
      { csvColumn: "Jamboree26:s frågor - Fisk" },
      { csvColumn: "Jamboree26:s frågor - Kräftdjur" },
      { csvColumn: "Jamboree26:s frågor - Blötdjur (snäckor, musslor och bläckfisk)" },
      { csvColumn: "Jamboree26:s frågor - Nötter och jordnötter" },
      { csvColumn: "Jamboree26:s frågor - Sesamfrön" },
      { csvColumn: "Jamboree26:s frågor - Selleri" },
      { csvColumn: "Jamboree26:s frågor - Senap" },
      { csvColumn: "Jamboree26:s frågor - Sulfit" },
      { csvColumn: "Jamboree26:s frågor - Annan relevant kostinformation" }
    ]
  }
];

const alwaysVisibleTrimmedColumns = new Set(
  Array.from(ALWAYS_VISIBLE_COLUMNS, (column) => column.trim())
);

const DERIVED_SOURCE_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  Postnummer: ["Adress"],
  Postort: ["Adress"],
  Telefonnummer: ["Kontaktinformation"]
};

function duplicatedQuestionHeader(column: string): string | null {
  for (const prefix of PREFIXES) {
    if (!column.startsWith(prefix)) {
      continue;
    }

    const label = column.slice(prefix.length).trim();
    if (label === "") {
      return null;
    }

    return `${prefix}${label}${label}`;
  }

  return null;
}

function matchingColumnKey(row: Record<string, string | undefined>, column: string): string | null {
  if (Object.prototype.hasOwnProperty.call(row, column)) {
    return column;
  }

  const target = column.trim();
  for (const key of Object.keys(row)) {
    if (key.trim() === target) {
      return key;
    }
  }

  const duplicated = duplicatedQuestionHeader(column);
  if (duplicated !== null) {
    if (Object.prototype.hasOwnProperty.call(row, duplicated)) {
      return duplicated;
    }

    const duplicatedTarget = duplicated.trim();
    for (const key of Object.keys(row)) {
      if (key.trim() === duplicatedTarget) {
        return key;
      }
    }
  }

  return null;
}

function sourceColumnExists(row: Record<string, string | undefined>, column: string): boolean {
  return matchingColumnKey(row, column) !== null;
}

function formatSwedishPostalCode(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 5) {
    return raw.trim();
  }
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

function addressParts(rawAddress: string): { postnummer: string; postort: string } {
  const normalizedAddress = rawAddress.replace(/\r?\n/g, ", ");
  const match = normalizedAddress.match(/\b\d{3}\s?\d{2}\b/);
  if (match === null || match.index === undefined) {
    return { postnummer: "", postort: "" };
  }

  const postnummer = formatSwedishPostalCode(match[0]);
  const afterPostalCode = normalizedAddress
    .slice(match.index + match[0].length)
    .replace(/^[,\s]+/, "")
    .trim();
  const [postort = ""] = afterPostalCode.split(",");

  return { postnummer, postort: postort.trim() };
}

function mobilePhoneFromContactInformation(rawContactInformation: string): string {
  const match = rawContactInformation.match(/(?:^|[\n,;])\s*Mobiltelefon:\s*([^\n,;]+)/i);
  return match?.[1]?.trim() ?? "";
}

function derivedValue(row: Record<string, string | undefined>, column: string): string | null {
  if (column === "Postnummer") {
    return addressParts(rowGet(row, "Adress")).postnummer;
  }

  if (column === "Postort") {
    return addressParts(rowGet(row, "Adress")).postort;
  }

  if (column === "Telefonnummer") {
    return mobilePhoneFromContactInformation(rowGet(row, "Kontaktinformation"));
  }

  return null;
}

function hasDerivedSource(row: Record<string, string | undefined>, column: string): boolean {
  return (DERIVED_SOURCE_COLUMNS[column] ?? []).some((sourceColumn) => sourceColumnExists(row, sourceColumn));
}

export function isEmpty(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  const text = value.trim();
  return text === "" || text === "-";
}

export function cleanLabel(rawColumn: string): string {
  let label = rawColumn;
  for (const prefix of PREFIXES) {
    if (label.startsWith(prefix)) {
      label = label.slice(prefix.length);
      break;
    }
  }
  return label.trim();
}

export function rowGet(row: Record<string, string | undefined>, column: string): string {
  const key = matchingColumnKey(row, column);
  if (key !== null) {
    return row[key] ?? "";
  }

  return derivedValue(row, column) ?? "";
}

function isAlwaysVisible(column: string): boolean {
  return ALWAYS_VISIBLE_COLUMNS.has(column) || alwaysVisibleTrimmedColumns.has(column.trim());
}

export function formatValue(row: Record<string, string | undefined>, column: string): string | null {
  const raw = rowGet(row, column);
  if (isAlwaysVisible(column)) {
    return isEmpty(raw) ? EMPTY_PLACEHOLDER : raw.trim();
  }
  if (isEmpty(raw)) {
    return null;
  }
  return raw.trim();
}

export function collectSectionRows(section: Section, row: Record<string, string | undefined>): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  for (const field of section.fields) {
    const value = formatValue(row, field.csvColumn);
    if (value !== null) {
      rows.push([field.displayLabel ?? cleanLabel(field.csvColumn), value]);
    }
  }
  return rows;
}

export function headerValues(row: Record<string, string | undefined>): [string, string] {
  const namn = formatValue(row, "Namn") ?? EMPTY_PLACEHOLDER;
  const pnr = formatValue(row, "Personnummer") ?? EMPTY_PLACEHOLDER;
  return [namn, pnr];
}

export function allExpectedColumns(): string[] {
  const columns: string[] = [];
  for (const section of SECTIONS) {
    for (const field of section.fields) {
      columns.push(field.csvColumn);
    }
  }
  return columns;
}

export function warnMissingColumns(row: Record<string, string | undefined>): string[] {
  const missing: string[] = [];
  for (const column of allExpectedColumns()) {
    if (matchingColumnKey(row, column) === null && !hasDerivedSource(row, column)) {
      missing.push(column);
    }
  }
  return missing;
}
