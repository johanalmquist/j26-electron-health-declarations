import { existsSync, readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import type { GenerateErrorCode, MissingColumnWarning } from "../../shared/types";
import { warnMissingColumns } from "./mapping";

export type CsvLoadSuccess = {
  ok: true;
  rows: Array<Record<string, string | undefined>>;
  warnings: MissingColumnWarning[];
};

export type CsvLoadFailure = {
  ok: false;
  code: Extract<
    GenerateErrorCode,
    "CSV_NOT_FOUND" | "CSV_UNREADABLE" | "CSV_PARSE_ERROR" | "CSV_EMPTY"
  >;
  message: string;
  details?: string[];
};

export type CsvLoadResult = CsvLoadSuccess | CsvLoadFailure;

export function loadScoutnetCsv(csvPath: string): CsvLoadResult {
  if (!existsSync(csvPath)) {
    return {
      ok: false,
      code: "CSV_NOT_FOUND",
      message: "CSV-filen finns inte längre. Välj CSV-filen igen."
    };
  }

  let content: string;
  try {
    content = readFileSync(csvPath, "utf8");
  } catch {
    return {
      ok: false,
      code: "CSV_UNREADABLE",
      message: "Appen kan inte läsa CSV-filen. Kontrollera att filen inte är öppen eller skyddad och försök igen."
    };
  }

  let rows: Array<Record<string, string | undefined>>;
  try {
    rows = parse(content, {
      bom: true,
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: false
    });
  } catch (error) {
    const parserMessage = error instanceof Error ? error.message : "Okänt CSV-fel";
    return {
      ok: false,
      code: "CSV_PARSE_ERROR",
      message: "CSV-filen kunde inte läsas. Kontrollera att du valt Scoutnet-exporten och försök igen.",
      details: [parserMessage]
    };
  }

  if (rows.length === 0) {
    return {
      ok: false,
      code: "CSV_EMPTY",
      message: "CSV-filen innehåller inga deltagare att skapa hälsodeklarationer för."
    };
  }

  return {
    ok: true,
    rows,
    warnings: warnMissingColumns(rows[0]).map((column) => ({ column }))
  };
}
