import { BrowserWindow, ipcMain, shell } from "electron";
import fs from "node:fs";
import { IPC_CHANNELS } from "../shared/ipc-channels";
import type { GenerateResult, GenerationRequest, ShellActionResult } from "../shared/types";
import { selectCsv, selectOutputDirectory } from "./dialogs";
import { generateHealthDeclarations } from "./generation/generate";

let lastGeneratedOutputPath: string | null = null;

function unauthorizedGenerate(): GenerateResult {
  return { ok: false, code: "UNEXPECTED_ERROR", message: "Otillåten begäran." };
}

function unauthorizedShell(): ShellActionResult {
  return { ok: false, message: "Otillåten begäran." };
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  for (const channel of Object.values(IPC_CHANNELS)) {
    ipcMain.removeHandler(channel);
  }

  ipcMain.handle(IPC_CHANNELS.selectCsv, (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Unauthorized IPC sender");
    }
    return selectCsv(mainWindow);
  });

  ipcMain.handle(IPC_CHANNELS.selectOutputDirectory, (event) => {
    if (event.sender !== mainWindow.webContents) {
      throw new Error("Unauthorized IPC sender");
    }
    return selectOutputDirectory(mainWindow);
  });

  ipcMain.handle(IPC_CHANNELS.generate, async (event, request: GenerationRequest): Promise<GenerateResult> => {
    if (event.sender !== mainWindow.webContents) {
      return unauthorizedGenerate();
    }
    const result = await generateHealthDeclarations(request);
    if (result.ok) {
      lastGeneratedOutputPath = result.outputPath;
    }
    return result;
  });

  ipcMain.handle(IPC_CHANNELS.openLastOutput, async (event): Promise<ShellActionResult> => {
    if (event.sender !== mainWindow.webContents) {
      return unauthorizedShell();
    }
    if (!lastGeneratedOutputPath || !fs.existsSync(lastGeneratedOutputPath)) {
      return { ok: false, message: "Det finns inget skapat dokument att öppna." };
    }
    const error = await shell.openPath(lastGeneratedOutputPath);
    return error ? { ok: false, message: error } : { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.revealLastOutput, (event): ShellActionResult => {
    if (event.sender !== mainWindow.webContents) {
      return unauthorizedShell();
    }
    if (!lastGeneratedOutputPath || !fs.existsSync(lastGeneratedOutputPath)) {
      return { ok: false, message: "Det finns inget skapat dokument att visa." };
    }
    shell.showItemInFolder(lastGeneratedOutputPath);
    return { ok: true };
  });
}
