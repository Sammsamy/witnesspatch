"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { createStoredBundleZip } from "@/engine/browser-bundle-zip.mjs";

const MAX_FILE_BYTES = 512 * 1024;
const MAX_ERROR_CHARACTERS = 360;

type LocalCompilationReceipt = {
  status: "compiled_red";
  mode: "locally_hashed_unverified_inputs";
  hashes: { computed: 2; verified: 0; total: 2 };
  session_input_verification: {
    mode: "locally_hashed_unverified_inputs";
    hashes_computed: 2;
    hashes_verified: 0;
    external_manifest_verified: false;
  };
  bundle_id: string;
  case_id: string;
  case_title: string;
  source_run_id: string;
  target_rule_id: string;
  fresh_evaluation: {
    status: "fail";
    score: number;
    critical_failures: string[];
  };
  file_count: number;
  manifest_sha256: string;
  failure_known_at_minute: number;
  starting_fact_count: number;
  minimal_fact_count: number;
  regression_initial_status: "red";
  regression_source: string;
  receipt: unknown;
  files: Array<{ path: string; contents: string }>;
  trust_boundary: string;
};

type LocalCompilerModule = {
  compileBrowserWitnessFromBytes: (input: {
    caseBytes: Uint8Array;
    runBytes: Uint8Array;
    subtle: SubtleCrypto;
  }) => Promise<LocalCompilationReceipt>;
};

type LocalWitnessCompilerProps = {
  onReturn: () => void;
};

type CompileState = "idle" | "compiling" | "compiled" | "error";

function conciseError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Unknown local compilation failure.";
  const compact = message.replace(/\s+/gu, " ").trim();
  if (compact.length <= MAX_ERROR_CHARACTERS) return compact;
  return `${compact.slice(0, MAX_ERROR_CHARACTERS - 1)}…`;
}

function assertJsonFile(file: File, label: string) {
  if (!file.name.toLowerCase().endsWith(".json")) {
    throw new Error(`${label} must be a .json file.`);
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${label} exceeds the 512 KiB local file limit.`);
  }
}

function assertLocalReceipt(receipt: LocalCompilationReceipt) {
  const validManifestHash = /^[a-f0-9]{64}$/u.test(receipt.manifest_sha256);
  const validFiles =
    receipt.file_count === 9 &&
    Array.isArray(receipt.files) &&
    receipt.files.length === 9;
  const validFailure =
    receipt.status === "compiled_red" &&
    receipt.regression_initial_status === "red" &&
    receipt.fresh_evaluation?.status === "fail" &&
    Array.isArray(receipt.fresh_evaluation.critical_failures);
  const validIntegrity =
    receipt.mode === "locally_hashed_unverified_inputs" &&
    receipt.hashes?.computed === 2 &&
    receipt.hashes.verified === 0 &&
    receipt.hashes.total === 2 &&
    receipt.session_input_verification?.mode ===
      "locally_hashed_unverified_inputs" &&
    receipt.session_input_verification.hashes_computed === 2 &&
    receipt.session_input_verification.hashes_verified === 0 &&
    receipt.session_input_verification.external_manifest_verified === false;

  if (!validManifestHash || !validFiles || !validFailure || !validIntegrity) {
    throw new Error(
      "The local compiler returned an incomplete or incorrectly labeled receipt.",
    );
  }
}

export function LocalWitnessCompiler({ onReturn }: LocalWitnessCompilerProps) {
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [runFile, setRunFile] = useState<File | null>(null);
  const [syntheticConfirmed, setSyntheticConfirmed] = useState(false);
  const [compileState, setCompileState] = useState<CompileState>("idle");
  const [sampleLoading, setSampleLoading] = useState(false);
  const [compilationReceipt, setCompilationReceipt] =
    useState<LocalCompilationReceipt | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [bundleExported, setBundleExported] = useState(false);
  const caseInputRef = useRef<HTMLInputElement | null>(null);
  const runInputRef = useRef<HTMLInputElement | null>(null);
  const generationRef = useRef(0);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      generationRef.current += 1;
      if (objectUrlRef.current) {
        window.URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    },
    [],
  );

  function revokeObjectUrl() {
    if (!objectUrlRef.current) return;
    window.URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
  }

  function invalidateResult(nextAnnouncement = "Inputs changed. Compile a new witness.") {
    generationRef.current += 1;
    revokeObjectUrl();
    setSampleLoading(false);
    setCompileState("idle");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    setAnnouncement(nextAnnouncement);
  }

  function reflectSelectedFile(
    input: HTMLInputElement | null,
    file: File,
  ) {
    if (!input || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
  }

  async function loadIncludedSample() {
    invalidateResult("Loading the included fully synthetic sample inputs.");
    const generation = generationRef.current;
    setSampleLoading(true);
    setCaseFile(null);
    setRunFile(null);
    setSyntheticConfirmed(false);

    try {
      const routes = [
        "/runs/v2/postpartum-warning-signs-case.json",
        "/runs/v2/postpartum-warning-signs-baseline.json",
      ];
      const responses = await Promise.all(
        routes.map((route) =>
          window.fetch(route, { cache: "no-store", redirect: "error" }),
        ),
      );
      for (const [index, response] of responses.entries()) {
        if (!response.ok || response.redirected) {
          throw new Error(
            `Included sample ${index + 1} returned HTTP ${response.status}.`,
          );
        }
      }
      const [caseBuffer, runBuffer] = await Promise.all(
        responses.map((response) => response.arrayBuffer()),
      );
      if (generationRef.current !== generation) return;

      const includedCase = new File(
        [caseBuffer],
        "postpartum-warning-signs-case.json",
        { type: "application/json" },
      );
      const includedRun = new File(
        [runBuffer],
        "postpartum-warning-signs-baseline.json",
        { type: "application/json" },
      );
      assertJsonFile(includedCase, "Included case input");
      assertJsonFile(includedRun, "Included run input");
      setCaseFile(includedCase);
      setRunFile(includedRun);
      reflectSelectedFile(caseInputRef.current, includedCase);
      reflectSelectedFile(runInputRef.current, includedRun);
      setAnnouncement(
        "Included synthetic sample loaded. Review and select the synthetic-data confirmation before compiling; the local receipt will still report zero externally verified inputs.",
      );
    } catch (error) {
      if (generationRef.current !== generation) return;
      const message = conciseError(error);
      setCompileState("error");
      setErrorMessage(message);
      setAnnouncement(`Included sample loading failed closed. ${message}`);
    } finally {
      if (generationRef.current === generation) setSampleLoading(false);
    }
  }

  function handleCaseFile(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult();
    setCaseFile(event.target.files?.[0] ?? null);
  }

  function handleRunFile(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult();
    setRunFile(event.target.files?.[0] ?? null);
  }

  function handleSyntheticConfirmation(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult(
      event.target.checked
        ? "Synthetic-data declaration recorded."
        : "Synthetic-data declaration removed. Compilation is disabled.",
    );
    setSyntheticConfirmed(event.target.checked);
  }

  async function compileFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!caseFile || !runFile || !syntheticConfirmed) return;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    revokeObjectUrl();
    setCompileState("compiling");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    setAnnouncement(
      "Reading the two selected files locally and compiling a static red witness.",
    );

    try {
      assertJsonFile(caseFile, "Case input");
      assertJsonFile(runFile, "Run input");
      if (!window.crypto?.subtle) {
        throw new Error("WebCrypto is unavailable in this browser.");
      }

      const [caseBuffer, runBuffer] = await Promise.all([
        caseFile.arrayBuffer(),
        runFile.arrayBuffer(),
      ]);
      if (generationRef.current !== generation) return;

      const compilerModule = (await import(
        "@/engine/browser-witness-compiler.mjs"
      )) as unknown as LocalCompilerModule;
      if (generationRef.current !== generation) return;

      const receipt = await compilerModule.compileBrowserWitnessFromBytes({
        caseBytes: new Uint8Array(caseBuffer),
        runBytes: new Uint8Array(runBuffer),
        subtle: window.crypto.subtle,
      });
      if (generationRef.current !== generation) return;

      assertLocalReceipt(receipt);
      setCompilationReceipt(receipt);
      setCompileState("compiled");
      setAnnouncement(
        `Compiled a red witness for ${receipt.case_id}: ${receipt.file_count} local bundle files, with no external manifest verification.`,
      );
    } catch (error) {
      if (generationRef.current !== generation) return;
      const message = conciseError(error);
      setCompileState("error");
      setErrorMessage(message);
      setAnnouncement(`Local compilation failed closed. ${message}`);
    }
  }

  function exportBundle() {
    if (!compilationReceipt) return;

    try {
      assertLocalReceipt(compilationReceipt);
      revokeObjectUrl();
      const archive = createStoredBundleZip(compilationReceipt.files);
      const archiveBuffer = archive.buffer.slice(
        archive.byteOffset,
        archive.byteOffset + archive.byteLength,
      );
      const url = window.URL.createObjectURL(
        new Blob([archiveBuffer], { type: "application/zip" }),
      );
      objectUrlRef.current = url;
      const link = document.createElement("a");
      link.href = url;
      link.download = `${compilationReceipt.bundle_id}.zip`;
      link.style.display = "none";
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => {
        if (objectUrlRef.current !== url) return;
        window.URL.revokeObjectURL(url);
        objectUrlRef.current = null;
      }, 0);
      setBundleExported(true);
      setAnnouncement(
        `Exported ${compilationReceipt.file_count} files as ${compilationReceipt.bundle_id}.zip.`,
      );
    } catch (error) {
      setBundleExported(false);
      setAnnouncement(`Bundle export failed closed. ${conciseError(error)}`);
    }
  }

  function clearWorkspace() {
    invalidateResult("Local workspace cleared.");
    setCaseFile(null);
    setRunFile(null);
    setSyntheticConfirmed(false);
    if (caseInputRef.current) caseInputRef.current.value = "";
    if (runInputRef.current) runInputRef.current.value = "";
  }

  function returnToReference() {
    generationRef.current += 1;
    revokeObjectUrl();
    onReturn();
  }

  const isCompiling = compileState === "compiling";
  const canCompile =
    caseFile !== null &&
    runFile !== null &&
    syntheticConfirmed &&
    !isCompiling &&
    !sampleLoading;

  return (
    <section className="local-workspace" id="top" aria-labelledby="local-title">
      <header className="local-header">
        <div className="local-heading-copy">
          <p className="local-eyebrow">LOCAL WITNESS WORKSPACE</p>
          <h1 id="local-title">Compile your synthetic failure</h1>
          <p className="local-intro">
            Load one case and one recorded run. The files are read and hashed in
            this browser, then converted into a static red regression bundle.
          </p>
        </div>
        <button
          className="local-return-button"
          type="button"
          onClick={returnToReference}
        >
          Return to reference demo
        </button>
      </header>

      <section className="local-boundary" aria-labelledby="local-boundary-title">
        <h2 id="local-boundary-title">Local-data boundary</h2>
        <p>
          Selected files are processed locally in this browser and are not
          submitted by this workspace. Each file must be JSON and no larger than
          512 KiB.
        </p>
        <p className="local-warning">
          Your declaration is not a PHI scanner. WitnessPatch cannot detect
          protected health information or prove that data is deidentified.
        </p>
      </section>

      <section className="local-sample-tools" aria-labelledby="local-sample-title">
        <div>
          <p className="local-sample-kicker">NO-REBUILD JUDGE PATH</p>
          <h2 id="local-sample-title">Try the included synthetic pair</h2>
          <p>
            Load the manifest-listed case and failed run into the same local-input
            path, or download both files and inspect them first.
          </p>
        </div>
        <div className="local-sample-actions">
          <button
            type="button"
            onClick={() => void loadIncludedSample()}
            disabled={sampleLoading || isCompiling}
          >
            {sampleLoading ? "Loading sample…" : "Load included sample"}
          </button>
          <span className="local-sample-downloads">
            <a
              href="/runs/v2/postpartum-warning-signs-case.json"
              download="postpartum-warning-signs-case.json"
            >
              Download case
            </a>
            <a
              href="/runs/v2/postpartum-warning-signs-baseline.json"
              download="postpartum-warning-signs-baseline.json"
            >
              Download failed run
            </a>
          </span>
        </div>
      </section>

      <form
        className="local-form"
        onSubmit={compileFiles}
        aria-busy={isCompiling}
      >
        <fieldset className="local-file-fields">
          <legend>Local JSON inputs</legend>
          <div className="local-field">
            <label htmlFor="local-case-file">Synthetic case .json</label>
            <input
              ref={caseInputRef}
              id="local-case-file"
              name="case-file"
              type="file"
              accept=".json,application/json"
              onChange={handleCaseFile}
              aria-describedby="local-file-limit"
            />
          </div>
          <div className="local-field">
            <label htmlFor="local-run-file">Recorded run .json</label>
            <input
              ref={runInputRef}
              id="local-run-file"
              name="run-file"
              type="file"
              accept=".json,application/json"
              onChange={handleRunFile}
              aria-describedby="local-file-limit"
            />
          </div>
          <p className="local-file-limit" id="local-file-limit">
            Maximum 512 KiB per file. File contents remain on this device.
          </p>
        </fieldset>

        <label className="local-confirmation" htmlFor="local-synthetic-confirmation">
          <input
            id="local-synthetic-confirmation"
            name="synthetic-confirmation"
            type="checkbox"
            checked={syntheticConfirmed}
            onChange={handleSyntheticConfirmation}
          />
          <span>
            I confirm both files are fully synthetic and contain no patient or
            production data.
          </span>
        </label>

        <div className="local-actions">
          <button
            className="local-compile-button"
            type="submit"
            disabled={!canCompile}
          >
            {isCompiling ? "Compiling locally…" : "Compile red witness"}
          </button>
          <button
            className="local-clear-button"
            type="button"
            onClick={clearWorkspace}
          >
            Clear workspace
          </button>
        </div>
      </form>

      {compileState === "error" ? (
        <section className="local-error" role="alert" aria-labelledby="local-error-title">
          <h2 id="local-error-title">Workspace stopped</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {compilationReceipt ? (
        <section className="local-result" aria-labelledby="local-result-title">
          <header className="local-result-header">
            <div>
              <p className="local-result-status">COMPILED RED</p>
              <h2 id="local-result-title">{compilationReceipt.case_title}</h2>
              <p>{compilationReceipt.case_id}</p>
            </div>
            <button
              className="local-export-button"
              type="button"
              onClick={exportBundle}
            >
              {bundleExported ? "Export ZIP again" : "Export 9-file ZIP"}
            </button>
          </header>

          <dl className="local-result-grid">
            <div>
              <dt>Source run</dt>
              <dd>{compilationReceipt.source_run_id}</dd>
            </div>
            <div>
              <dt>Target rule</dt>
              <dd>{compilationReceipt.target_rule_id}</dd>
            </div>
            <div>
              <dt>Fresh score</dt>
              <dd>{compilationReceipt.fresh_evaluation.score}/100</dd>
            </div>
            <div>
              <dt>Critical failures</dt>
              <dd>
                {compilationReceipt.fresh_evaluation.critical_failures.join(", ") ||
                  "None"}
              </dd>
            </div>
            <div>
              <dt>Failure known</dt>
              <dd>
                T+
                {String(compilationReceipt.failure_known_at_minute).padStart(
                  2,
                  "0",
                )}
              </dd>
            </div>
            <div>
              <dt>Static fact reduction</dt>
              <dd>
                {compilationReceipt.starting_fact_count} →{" "}
                {compilationReceipt.minimal_fact_count} facts
              </dd>
            </div>
            <div>
              <dt>Bundle</dt>
              <dd>{compilationReceipt.file_count} files</dd>
            </div>
            <div>
              <dt>Input integrity</dt>
              <dd>2 hashes computed · 0 externally verified</dd>
            </div>
          </dl>

          <div className="local-manifest">
            <h3>Manifest SHA-256</h3>
            <code>{compilationReceipt.manifest_sha256}</code>
          </div>
          <p className="local-trust-boundary">
            {compilationReceipt.trust_boundary}
          </p>
        </section>
      ) : null}

      <p className="local-announcement" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
    </section>
  );
}
