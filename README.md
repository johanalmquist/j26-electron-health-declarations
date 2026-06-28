# Hälsodeklarationer

> Desktop app för Jakobsbergs Scoutkår — genererar hälsodeklarationer från Scoutnet CSV-export till ett utskriftsvänligt Word-dokument.

---

A small Electron application built for [Jamboree26](https://www.jamboree2026.se/). It reads the participant CSV exported from Scoutnet, maps each row through a fixed field schema, and writes a single **`Hälsodeklarationer.docx`** where each participant occupies one page.

> [!NOTE]
> This is an internal tool for Jakobsbergs Scoutkår. The Scoutnet CSV export contains real health and contact data — never commit CSV files, test fixtures with real data, or generated DOCX files to this repository.

## How it works

1. **Select CSV** — pick the Scoutnet export (`Anmalan - deltakere.csv`).
2. **Select output folder** — choose where to write the DOCX.
3. **Generate** — the app parses the CSV, maps fields, and writes `Hälsodeklarationer.docx`.
4. **Open or reveal** — open the document in Word or show it in Finder/Explorer directly from the success screen.

Each participant page follows a fixed section layout:

| Section | Content |
|---|---|
| Header | Name + personal ID number |
| Grundläggande uppgifter | Contact details, address, gender |
| Kårens frågor | Swimming ability, notes, photo consent |
| ICE 1 / ICE 2 | Emergency contacts (name, email, mobile) |
| Hälsoinformation | Medical conditions, medications, consent |
| Tillgänglighet och transport | Mobility needs, internal transport |
| Allergier och medicinsk specialkost | Allergens, dietary requirements |

Fields marked as always-visible (name, ICE contacts, swim ability, consents, etc.) show a `—` placeholder when empty. All other fields are omitted when blank so that printed pages stay clean.

## Installation

Download the latest release from the [GitHub Releases page](https://github.com/johanalmquist/j26-electron-health-declarations/releases).

### macOS

1. Download **`Halsodeklarationer-{version}-arm64.dmg`**.
2. Open the DMG file and drag **Halsodeklarationer** into your Applications folder.
3. Eject the DMG.

> [!WARNING]
> This app is not signed with an Apple Developer certificate. macOS will block it on first launch and show an error saying the developer cannot be verified. The steps below remove that block — you only need to do this once.

**Option A — via Terminal (most reliable, works on all macOS versions)**

Open Terminal and run:

```bash
xattr -d com.apple.quarantine /Applications/Halsodeklarationer.app
```

Then double-click the app normally. It will open without any warning.

**Option B — via System Settings**

1. **First, attempt to open the app** — double-click it in Applications. You will get an error message. This is expected; it registers the block so macOS can show you the override option.
2. Open **Systeminställningar → Integritet och säkerhet** (System Settings → Privacy & Security).
3. In the **Säkerhet** (Security) section, make sure "Tillåt appar från" is set to at least **"App Store och kända utvecklare"**.
4. Scroll down — you should now see a notice about Halsodeklarationer being blocked, with an **"Öppna ändå"** (Open Anyway) button. Click it.
5. Confirm by clicking **Öppna** in the dialog that follows.

The app is now trusted on your Mac and opens normally from that point on.

> [!TIP]
> If you do not see the "Öppna ändå" button in System Settings, go back and try Option A (the Terminal command). It works on all macOS versions regardless of security settings.

### Windows

1. Download **`Halsodeklarationer.Setup.{version}.exe`** and run it.
2. If Windows SmartScreen shows *"Windows protected your PC"*, click **More info** → **Run anyway**.
3. Follow the installer prompts.


## Getting started

**Prerequisites:** Node.js 20.19+ or 22.12+, npm.

```bash
npm install
```

### Development

```bash
npm run dev        # start Electron with hot reload (electron-vite)
```

### Build

```bash
npm run build      # type-check with tsc --noEmit, then electron-vite build
```

### Package

```bash
npm run dist       # build + package for the current platform
npm run dist:mac   # macOS DMG
npm run dist:win   # Windows NSIS installer
```

Packaged artifacts land in `release/`.

## Testing

```bash
npm test           # run all unit tests with Vitest
```

The unit test suite covers:

- **CSV parsing** — UTF-8 BOM handling, quoted multiline fields, quoted commas, empty files, missing columns.
- **Field mapping** — empty-value rules, label prefix cleanup, header matching, ICE placeholders.
- **Generation orchestration** — success path, overwrite guard, missing CSV, unwritable output directory, path whitespace.
- **DOCX output** — presence and structure of generated XML, headings, styles, page breaks.
- **Renderer target selection** — dev vs. packaged build URL resolution.

There is also an optional smoke fixture that writes a real DOCX to `test-output/smoke/`:

```bash
npx vitest run --config tmp/vitest.smoke.config.ts
```

Run it only when you intentionally want to inspect generated output on disk.

## Project structure

```
src/
├── main/
│   ├── generation/
│   │   ├── csv.ts        — Scoutnet CSV loading and parsing
│   │   ├── mapping.ts    — section/field schema, label rules, empty-value logic
│   │   ├── docx.ts       — DOCX document structure and file writing
│   │   └── generate.ts   — orchestration, validation, error codes
│   ├── ipc.ts            — IPC handler registration
│   ├── windows.ts        — BrowserWindow configuration
│   └── index.ts          — Electron entry point
├── preload/
│   └── index.ts          — contextBridge API (window.healthDeclarations)
├── renderer/
│   └── main.ts           — plain DOM UI and state machine
└── shared/
    ├── ipc-channels.ts   — IPC channel name constants
    └── types.ts          — shared result unions and API types
tests/unit/               — Vitest unit tests
```

### IPC data flow

```
renderer/main.ts
  → window.healthDeclarations.*
  → preload/index.ts (contextBridge)
  → ipcRenderer.invoke(IPC_CHANNELS.*)
  → main/ipc.ts
  → dialogs / generation pipeline
  → typed result union back to renderer
```

When adding or changing an IPC method, update all five layers together: `ipc-channels.ts`, `types.ts`, `preload/index.ts`, `main/ipc.ts`, and the renderer caller.

## Security

The window runs with `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`. Only the narrow `HealthDeclarationsApi` surface is exposed to the renderer via `contextBridge`. Do not widen this surface.

## Tech stack

| | |
|---|---|
| Runtime | [Electron](https://www.electronjs.org/) 31.7.7 |
| Build | [electron-vite](https://electron-vite.org/) |
| Language | TypeScript (strict, ES2022) |
| DOCX generation | [docx](https://docx.js.org/) |
| CSV parsing | [csv-parse](https://csv.js.org/parse/) |
| Tests | [Vitest](https://vitest.dev/) |
| Packaging | [electron-builder](https://www.electron.build/) |
