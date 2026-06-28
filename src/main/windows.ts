import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { rendererLoadTarget } from "./renderer-target";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 720,
    minWidth: 760,
    minHeight: 560,
    title: "Hälsodeklarationer",
    webPreferences: {
      preload: path.join(currentDir, "../preload/index.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });

  const target = rendererLoadTarget({
    isPackaged: app.isPackaged,
    devUrl: process.env.ELECTRON_RENDERER_URL,
    rendererIndexPath: path.join(currentDir, "../renderer/index.html")
  });
  if (target.kind === "url") {
    void mainWindow.loadURL(target.value);
  } else {
    void mainWindow.loadFile(target.value);
  }

  return mainWindow;
}
