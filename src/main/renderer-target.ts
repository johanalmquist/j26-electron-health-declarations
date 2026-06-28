export type RendererLoadTarget =
  | { kind: "url"; value: string }
  | { kind: "file"; value: string };

export type RendererLoadTargetOptions = {
  isPackaged: boolean;
  devUrl: string | undefined;
  rendererIndexPath: string;
};

export function rendererLoadTarget(options: RendererLoadTargetOptions): RendererLoadTarget {
  if (!options.isPackaged && options.devUrl) {
    return { kind: "url", value: options.devUrl };
  }

  return { kind: "file", value: options.rendererIndexPath };
}
