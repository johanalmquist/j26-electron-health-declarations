export type SelectCsvResult =
  | { canceled: true }
  | { canceled: false; path: string; name: string };

export type SelectOutputDirectoryResult =
  | { canceled: true }
  | { canceled: false; path: string; name: string };

export type GenerateErrorCode =
  | "CSV_NOT_FOUND"
  | "CSV_UNREADABLE"
  | "CSV_PARSE_ERROR"
  | "CSV_EMPTY"
  | "OUTPUT_DIRECTORY_MISSING"
  | "OUTPUT_NOT_WRITABLE"
  | "OUTPUT_ALREADY_EXISTS"
  | "GENERATION_IN_PROGRESS"
  | "DOCX_WRITE_FAILED"
  | "UNEXPECTED_ERROR";

export type MissingColumnWarning = {
  column: string;
};

export type GenerationRequest = {
  csvPath: string;
  outputDirectory: string;
  overwrite: boolean;
};

export type GenerateResult =
  | {
      ok: true;
      outputPath: string;
      participantCount: number;
      warnings: MissingColumnWarning[];
    }
  | {
      ok: false;
      code: GenerateErrorCode;
      message: string;
      details?: string[];
    };

export type ShellActionResult =
  | { ok: true }
  | { ok: false; message: string };

export type HealthDeclarationsApi = {
  selectCsv: () => Promise<SelectCsvResult>;
  selectOutputDirectory: () => Promise<SelectOutputDirectoryResult>;
  generate: (request: GenerationRequest) => Promise<GenerateResult>;
  openLastOutput: () => Promise<ShellActionResult>;
  revealLastOutput: () => Promise<ShellActionResult>;
};
