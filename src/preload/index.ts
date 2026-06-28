import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../shared/ipc-channels";
import type { GenerationRequest, HealthDeclarationsApi } from "../shared/types";

const api: HealthDeclarationsApi = {
  selectCsv: () => ipcRenderer.invoke(IPC_CHANNELS.selectCsv),
  selectOutputDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.selectOutputDirectory),
  generate: (request: GenerationRequest) => ipcRenderer.invoke(IPC_CHANNELS.generate, request),
  openLastOutput: () => ipcRenderer.invoke(IPC_CHANNELS.openLastOutput),
  revealLastOutput: () => ipcRenderer.invoke(IPC_CHANNELS.revealLastOutput)
};

contextBridge.exposeInMainWorld("healthDeclarations", api);
