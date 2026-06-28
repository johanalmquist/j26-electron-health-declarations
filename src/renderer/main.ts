import "./styles.css";
import type {
  GenerateResult,
  MissingColumnWarning,
  SelectCsvResult,
  SelectOutputDirectoryResult,
  ShellActionResult
} from "../shared/types";

const OUTPUT_FILENAME = "Hälsodeklarationer.docx";

type UiMode = "idle" | "ready" | "confirmOverwrite" | "running" | "success" | "failure";

type Selection = {
  path: string;
  name: string;
};

const appRoot = document.querySelector<HTMLDivElement>("#app");
if (!appRoot) {
  throw new Error("Missing app root");
}
const root: HTMLDivElement = appRoot;

let selectedCsv: Selection | null = null;
let selectedOutputDirectory: Selection | null = null;
let mode: UiMode = "idle";
let lastResult: GenerateResult | null = null;
let shellMessage: string | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function currentMode(): UiMode {
  if (mode === "running" || mode === "confirmOverwrite" || mode === "success" || mode === "failure") {
    return mode;
  }
  return selectedCsv && selectedOutputDirectory ? "ready" : "idle";
}

function warningList(warnings: MissingColumnWarning[]): string {
  if (warnings.length === 0) {
    return "";
  }

  const items = warnings.map((warning) => `<li>${escapeHtml(warning.column)}</li>`).join("");
  return `
    <section class="warning-panel" aria-live="polite">
      <h2>Varningar (${warnings.length})</h2>
      <p>CSV-filen saknar förväntade kolumner. Dokumentet skapades ändå.</p>
      <ul>${items}</ul>
    </section>
  `;
}

function detailsList(details: string[] | undefined): string {
  if (!details || details.length === 0) {
    return "";
  }

  const items = details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("");
  return `
    <details class="technical-details">
      <summary>Tekniska detaljer</summary>
      <ul>${items}</ul>
    </details>
  `;
}

function selectionValue(selection: Selection | null): string {
  return selection ? `${escapeHtml(selection.name)} <span>${escapeHtml(selection.path)}</span>` : "Inte vald";
}

function renderStatus(activeMode: UiMode): string {
  if (activeMode === "idle") {
    return `<p class="status muted">Välj både CSV-fil och mapp för att fortsätta.</p>`;
  }

  if (activeMode === "running") {
    return `<p class="status running">Skapar dokument…</p>`;
  }

  if (activeMode === "confirmOverwrite") {
    return `
      <section class="confirm-panel" aria-live="assertive">
        <p>Hälsodeklarationer.docx finns redan i den här mappen. Vill du ersätta den?</p>
        <div class="actions">
          <button id="confirm-overwrite" type="button">Ersätt</button>
          <button id="cancel-overwrite" type="button" class="secondary">Avbryt</button>
        </div>
      </section>
    `;
  }

  if (activeMode === "success" && lastResult?.ok) {
    return `
      <section class="success-panel" aria-live="polite">
        <h2>Klart! Word-dokumentet har skapats.</h2>
        <p>Skapade ${lastResult.participantCount} hälsodeklaration(er).</p>
        <p class="output-path">${escapeHtml(lastResult.outputPath)}</p>
        ${warningList(lastResult.warnings)}
        ${shellMessage ? `<p class="status failure">${escapeHtml(shellMessage)}</p>` : ""}
        <div class="actions">
          <button id="open-output" type="button">Öppna dokument</button>
          <button id="reveal-output" type="button" class="secondary">Visa i mappen</button>
          <button id="create-again" type="button" class="secondary">Skapa igen</button>
        </div>
      </section>
    `;
  }

  if (activeMode === "failure" && lastResult && !lastResult.ok) {
    return `
      <section class="failure-panel" aria-live="assertive">
        <h2>Dokumentet kunde inte skapas</h2>
        <p>${escapeHtml(lastResult.message)}</p>
        ${detailsList(lastResult.details)}
      </section>
    `;
  }

  return `<p class="status ready">Redo att skapa dokumentet.</p>`;
}

function render(): void {
  const activeMode = currentMode();
  const controlsDisabled = activeMode === "running";
  const generateDisabled = controlsDisabled || !selectedCsv || !selectedOutputDirectory;

  root.innerHTML = `
    <section class="app-shell">
      <header class="hero">
        <p class="eyebrow">Jakobsbergs Scoutkår / Jamboree26</p>
        <h1>Skapa hälsodeklarationer</h1>
        <p>Välj Scoutnet-exporten som CSV och välj mappen där Word-dokumentet ska sparas.</p>
      </header>

      <section class="selection-card" aria-label="Val">
        <div class="button-row">
          <button id="select-csv" type="button" ${controlsDisabled ? "disabled" : ""}>Välj CSV-fil…</button>
          <button id="select-output" type="button" class="secondary" ${controlsDisabled ? "disabled" : ""}>Välj mapp…</button>
        </div>

        <dl class="summary">
          <div>
            <dt>CSV</dt>
            <dd>${selectionValue(selectedCsv)}</dd>
          </div>
          <div>
            <dt>Spara i</dt>
            <dd>${selectionValue(selectedOutputDirectory)}</dd>
          </div>
          <div>
            <dt>Filnamn</dt>
            <dd>${OUTPUT_FILENAME}</dd>
          </div>
        </dl>

        <button id="generate" type="button" class="primary" ${generateDisabled ? "disabled" : ""}>Skapa Word-dokument</button>
      </section>

      ${renderStatus(activeMode)}
    </section>
  `;

  document.querySelector<HTMLButtonElement>("#select-csv")?.addEventListener("click", selectCsv);
  document.querySelector<HTMLButtonElement>("#select-output")?.addEventListener("click", selectOutputDirectory);
  document.querySelector<HTMLButtonElement>("#generate")?.addEventListener("click", () => generate(false));
  document.querySelector<HTMLButtonElement>("#confirm-overwrite")?.addEventListener("click", () => generate(true));
  document.querySelector<HTMLButtonElement>("#cancel-overwrite")?.addEventListener("click", () => {
    mode = selectedCsv && selectedOutputDirectory ? "ready" : "idle";
    lastResult = null;
    render();
  });
  document.querySelector<HTMLButtonElement>("#open-output")?.addEventListener("click", () => shellAction("open"));
  document.querySelector<HTMLButtonElement>("#reveal-output")?.addEventListener("click", () => shellAction("reveal"));
  document.querySelector<HTMLButtonElement>("#create-again")?.addEventListener("click", () => {
    mode = selectedCsv && selectedOutputDirectory ? "ready" : "idle";
    lastResult = null;
    shellMessage = null;
    render();
  });
}

async function selectCsv(): Promise<void> {
  const result: SelectCsvResult = await window.healthDeclarations.selectCsv();
  if (!result.canceled) {
    selectedCsv = { path: result.path, name: result.name };
    mode = selectedOutputDirectory ? "ready" : "idle";
    lastResult = null;
    shellMessage = null;
    render();
  }
}

async function selectOutputDirectory(): Promise<void> {
  const result: SelectOutputDirectoryResult = await window.healthDeclarations.selectOutputDirectory();
  if (!result.canceled) {
    selectedOutputDirectory = { path: result.path, name: result.name };
    mode = selectedCsv ? "ready" : "idle";
    lastResult = null;
    shellMessage = null;
    render();
  }
}

async function generate(overwrite: boolean): Promise<void> {
  if (!selectedCsv || !selectedOutputDirectory) {
    mode = "idle";
    render();
    return;
  }

  mode = "running";
  lastResult = null;
  shellMessage = null;
  render();

  const result = await window.healthDeclarations.generate({
    csvPath: selectedCsv.path,
    outputDirectory: selectedOutputDirectory.path,
    overwrite
  });

  lastResult = result;
  mode = result.ok ? "success" : result.code === "OUTPUT_ALREADY_EXISTS" ? "confirmOverwrite" : "failure";
  render();
}

async function shellAction(action: "open" | "reveal"): Promise<void> {
  const result: ShellActionResult =
    action === "open" ? await window.healthDeclarations.openLastOutput() : await window.healthDeclarations.revealLastOutput();
  shellMessage = result.ok ? null : result.message;
  render();
}

render();
