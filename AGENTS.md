# Repository Guidelines

## Project Overview

This is a private Electron desktop app for Jakobsbergs Scoutkår / Jamboree26. It generates a single Swedish Word document, `Hälsodeklarationer.docx`, from a Scoutnet CSV export.

For code changes, treat the app as a local-file workflow: the user selects a CSV file and output directory, the main process parses CSV data, renders DOCX content, and returns localized status/errors to the renderer.

## Architecture & Data Flow

- **Renderer UI:** `index.html` loads `src/renderer/main.ts`, a plain DOM TypeScript UI. There is no React/Vue/Svelte layer.
- **Preload bridge:** `src/preload/index.ts` exposes `window.healthDeclarations` via `contextBridge`.
- **Shared contract:** `src/shared/ipc-channels.ts` owns IPC channel names; `src/shared/types.ts` owns request/result/API types.
- **Main process:** `src/main/index.ts` creates the Electron app window through `src/main/windows.ts` and registers handlers from `src/main/ipc.ts`.
- **Generation pipeline:** `src/main/generation/generate.ts` validates paths and overwrite state, calls `csv.ts` to parse Scoutnet CSV rows, uses `mapping.ts` to choose/format fields and missing-column warnings, then calls `docx.ts` to write the final Word file.
- **Packaging flow:** `electron-vite` builds main/preload/renderer into `dist/**`; `electron-builder` packages `dist/**` and `index.html` into release artifacts under `release/`.

IPC/data flow:

```text
src/renderer/main.ts
  -> window.healthDeclarations.*
  -> src/preload/index.ts
  -> ipcRenderer.invoke(IPC_CHANNELS.*)
  -> src/main/ipc.ts
  -> dialogs or generation pipeline
  -> typed result union back to renderer
```

When adding or changing an IPC method, update all related files together:

1. `src/shared/ipc-channels.ts`
2. `src/shared/types.ts`
3. `src/preload/index.ts`
4. `src/main/ipc.ts`
5. `src/renderer/global.d.ts` if the `Window` API shape changes
6. The renderer caller in `src/renderer/main.ts`

## Key Directories

- `src/main/` — Electron main process, window creation, IPC, file dialogs, and document generation.
- `src/main/generation/` — core business logic for CSV parsing, field mapping, DOCX rendering, and output validation.
- `src/preload/` — narrow renderer-to-main bridge exposed with Electron `contextBridge`.
- `src/renderer/` — plain DOM UI and CSS.
- `src/shared/` — shared IPC names and TypeScript result/request types.
- `tests/unit/` — Vitest unit tests for generation, CSV, DOCX, mapping, and renderer target selection.
- `tmp/` — ad-hoc smoke fixtures/config; not part of the default test suite.
- `dist/`, `out/`, `release/`, `test-output/` — generated build/package/test-output artifacts; do not treat these as source.

## Development Commands

Use npm; this repository has `package-lock.json` and no observed Bun/pnpm/yarn lockfile.

```bash
npm install          # install dependencies from package-lock.json
npm run dev          # start electron-vite dev mode
npm run build        # typecheck with tsc --noEmit, then electron-vite build
npm test             # run default Vitest suite from tests/**/*.test.ts
npm run dist         # build and package with electron-builder
npm run dist:mac     # build macOS DMG
npm run dist:win     # build Windows NSIS installer
```

There is no observed lint/format script or ESLint/Biome/Prettier/Ultracite config. Do not invent a formatting workflow; follow the existing style and run `npm run build`/`npm test` for verification.

Optional smoke fixture command, when intentionally refreshing repo-local smoke output:

```bash
npx vitest run --config tmp/vitest.smoke.config.ts
```

This smoke test writes to `test-output/smoke/`, so avoid it unless that mutation is intended.

## Code Conventions & Common Patterns

- **Language/style:** TypeScript ESM source, strict compiler settings, ES2022 target, semicolons, two-space indentation in observed files.
- **UI approach:** Renderer uses module-level state (`selectedCsv`, `selectedOutputDirectory`, `mode`, `lastResult`) and rerenders with `root.innerHTML`. Escape dynamic text with `escapeHtml()` before interpolation.
- **Localization:** User-facing text is Swedish. Keep labels, errors, filenames, and status messages localized and practical.
- **Result handling:** User-facing operations return discriminated unions instead of throwing:
  - `GenerateResult` uses `{ ok: true, ... } | { ok: false, code, message, details? }`.
  - Dialogs use `{ canceled: true } | { canceled: false, path, name }`.
  - Shell actions use `{ ok: true } | { ok: false, message }`.
- **Error handling:** Convert expected failures into typed result codes/messages. Reserve thrown errors for programmer/configuration failures such as a missing DOM root.
- **Async patterns:** Renderer actions, Electron dialogs, IPC handlers, shell open/reveal, and DOCX writing are async. CSV parsing and filesystem validation in the generation path are mostly synchronous.
- **Dependency injection:** Keep it simple and parameter-based, e.g. `registerIpcHandlers(mainWindow)`, `selectCsv(window)`, `rendererLoadTarget(options)`, `renderDocument(options)`. No DI container or class hierarchy is used.
- **Security:** Keep `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true` in `src/main/windows.ts`. Expose only narrow, typed preload APIs.
- **Path handling:** Preserve selected paths exactly after validating they are non-empty strings. Tests cover paths ending in whitespace.
- **Sensitive data:** The root Scoutnet CSV export appears to contain real participant/contact/health data. Do not copy it into docs, prompts, tests, or commits unless explicitly required and sanitized.

## Important Files

- `package.json` — app metadata, npm scripts, runtime/dev dependencies, Electron main entry (`dist/main/index.cjs`).
- `package-lock.json` — npm lockfile; use npm for dependency changes.
- `tsconfig.json` — strict TypeScript config; includes `electron.vite.config.ts`, `src/**/*.ts`, and `tests/**/*.ts`.
- `electron.vite.config.ts` — builds main/preload as CommonJS `index.cjs` and renderer from `index.html`.
- `electron-builder.yml` — app ID/product name, asar packaging, `release/` output, mac DMG and Windows NSIS targets.
- `vitest.config.ts` — default Vitest config: Node environment, globals enabled, `tests/**/*.test.ts`.
- `src/main/index.ts` — Electron bootstrap.
- `src/main/windows.ts` — BrowserWindow settings, preload path, renderer loading.
- `src/main/ipc.ts` — IPC registration, sender checks, generation/open/reveal handlers.
- `src/main/generation/generate.ts` — orchestration and generation error codes.
- `src/main/generation/csv.ts` — Scoutnet CSV loading/parsing.
- `src/main/generation/mapping.ts` — field sections, label cleanup, missing-column warnings, placeholders.
- `src/main/generation/docx.ts` — DOCX structure and file writing.
- `src/renderer/main.ts` — UI state machine and button handlers.
- `src/shared/types.ts` — shared result unions and preload API type.

## Runtime/Tooling Preferences

- Package manager: **npm**.
- Runtime/tooling: Electron `31.7.7`, electron-vite, TypeScript, Vitest, electron-builder.
- Source modules: ESM (`"type": "module"`), with main/preload bundled as CJS for Electron runtime output.
- Node version is not declared in the project, but resolved tooling requires modern Node. Use Node `20.19+` or `22.12+` for safest compatibility with the locked electron-vite/Vite toolchain.
- Do not use Bun workspace assumptions here unless the repo is deliberately migrated; no Bun lockfile or workspace config is present.

## Testing & QA

Default test command:

```bash
npm test
```

The default suite runs `tests/**/*.test.ts` in a Node Vitest environment. Existing coverage focuses on:

- CSV parsing: UTF-8 BOM, quoted multiline fields, quoted commas, empty CSV, missing expected columns.
- Mapping: empty values, label prefix cleanup, exact/trimmed header matching, ICE placeholders, optional field omission.
- Generation orchestration: success output, overwrite behavior, missing CSV, output directory validation, write-test probe safety, path whitespace preservation, malformed paths.
- DOCX rendering: generated `.docx` exists, expected XML content/headings/styles/page breaks are present.
- Renderer target selection: dev URL is used only outside packaged builds; packaged builds load local files.

When changing generation behavior, add or update focused unit tests under `tests/unit/` and run the relevant Vitest target or `npm test`. When changing build/runtime wiring, run `npm run build`. For end-to-end confidence, use the smoke fixture only when writing to `test-output/smoke/` is acceptable.