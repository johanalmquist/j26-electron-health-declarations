import { BrowserWindow, dialog } from "electron";
import path from "node:path";
import type { SelectCsvResult, SelectOutputDirectoryResult } from "../shared/types";

export async function selectCsv(window: BrowserWindow): Promise<SelectCsvResult> {
  const result = await dialog.showOpenDialog(window, {
    properties: ["openFile"],
    filters: [
      { name: "CSV-filer", extensions: ["csv"] },
      { name: "Alla filer", extensions: ["*"] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = result.filePaths[0];
  return { canceled: false, path: filePath, name: path.basename(filePath) };
}

export async function selectOutputDirectory(window: BrowserWindow): Promise<SelectOutputDirectoryResult> {
  const result = await dialog.showOpenDialog(window, {
    properties: ["openDirectory", "createDirectory"]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const dirPath = result.filePaths[0];
  return { canceled: false, path: dirPath, name: path.basename(dirPath) || dirPath };
}
