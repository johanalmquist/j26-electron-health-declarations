import { closeSync, existsSync, openSync, statSync, unlinkSync, writeSync } from "node:fs";
import path from "node:path";
import type { GenerateResult, GenerationRequest } from "../../shared/types";
import { loadScoutnetCsv } from "./csv";
import { renderDocument } from "./docx";

export const DEFAULT_TITLE = "Hälsodeklaration";
export const DEFAULT_OUTPUT_FILENAME = "Hälsodeklarationer.docx";

let generationInProgress = false;

function outputDirectoryExists(outputDirectory: string): boolean {
  try {
    return statSync(outputDirectory).isDirectory();
  } catch {
    return false;
  }
}

function canWriteToDirectory(outputDirectory: string): boolean {
  const preferredPath = path.join(outputDirectory, ".halsodeklarationer-write-test");
  const probePath = existsSync(preferredPath)
    ? path.join(outputDirectory, `.halsodeklarationer-write-test-${process.pid}-${Date.now()}`)
    : preferredPath;
  let fileDescriptor: number | null = null;
  let createdProbe = false;

  try {
    fileDescriptor = openSync(probePath, "wx");
    createdProbe = true;
    writeSync(fileDescriptor, "ok");
    closeSync(fileDescriptor);
    fileDescriptor = null;
    unlinkSync(probePath);
    return true;
  } catch {
    try {
      if (fileDescriptor !== null) {
        closeSync(fileDescriptor);
      }
      if (createdProbe && existsSync(probePath)) {
        unlinkSync(probePath);
      }
    } catch {
      // Ignore cleanup errors; the write failure is what matters to the caller.
    }
    return false;
  }
}

export async function generateHealthDeclarations(request: GenerationRequest): Promise<GenerateResult> {
  if (generationInProgress) {
    return { ok: false, code: "GENERATION_IN_PROGRESS", message: "En körning pågår redan." };
  }

  generationInProgress = true;
  try {
    if (typeof request.csvPath !== "string" || request.csvPath.trim() === "") {
      return { ok: false, code: "CSV_NOT_FOUND", message: "CSV-filen finns inte längre. Välj CSV-filen igen." };
    }
    if (typeof request.outputDirectory !== "string" || request.outputDirectory.trim() === "") {
      return { ok: false, code: "OUTPUT_DIRECTORY_MISSING", message: "Mappen finns inte längre. Välj en annan mapp." };
    }

    const csvPath = request.csvPath;
    const outputDirectory = request.outputDirectory;

    if (!outputDirectoryExists(outputDirectory)) {
      return { ok: false, code: "OUTPUT_DIRECTORY_MISSING", message: "Mappen finns inte längre. Välj en annan mapp." };
    }

    if (!canWriteToDirectory(outputDirectory)) {
      return {
        ok: false,
        code: "OUTPUT_NOT_WRITABLE",
        message: "Appen kan inte spara i den valda mappen. Välj en annan mapp, till exempel Dokument."
      };
    }

    const outputPath = path.join(outputDirectory, DEFAULT_OUTPUT_FILENAME);
    if (existsSync(outputPath) && request.overwrite === false) {
      return {
        ok: false,
        code: "OUTPUT_ALREADY_EXISTS",
        message: "Hälsodeklarationer.docx finns redan i den valda mappen."
      };
    }

    const csvResult = loadScoutnetCsv(csvPath);
    if (!csvResult.ok) {
      return {
        ok: false,
        code: csvResult.code,
        message: csvResult.message,
        details: csvResult.details
      };
    }

    try {
      await renderDocument({ rows: csvResult.rows, title: DEFAULT_TITLE, outputPath });
    } catch {
      return {
        ok: false,
        code: "DOCX_WRITE_FAILED",
        message: "Dokumentet kunde inte sparas. Stäng Word om filen är öppen och försök igen, eller välj en annan mapp."
      };
    }

    return {
      ok: true,
      outputPath,
      participantCount: csvResult.rows.length,
      warnings: csvResult.warnings
    };
  } finally {
    generationInProgress = false;
  }
}
