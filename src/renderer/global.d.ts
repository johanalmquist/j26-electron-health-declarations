import type { HealthDeclarationsApi } from "../shared/types";

declare global {
  interface Window {
    healthDeclarations: HealthDeclarationsApi;
  }
}

export {};
