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
const MAX_MODEL_RUNS = 6;

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
  input_case_sha256: string;
  input_run_sha256: string;
  source_run_id: string;
  source_requested_model: string | null;
  source_requested_reasoning_effort: string | null;
  source_model_invocation_logged: boolean;
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

type ModelRunInspection = {
  status: "inspected";
  case_id: string;
  case_title: string;
  case_input_sha256: string;
  run_input_sha256: string;
  source_run_id: string;
  variant: "baseline" | "repaired" | "candidate";
  requested_model: string | null;
  requested_reasoning_effort: string | null;
  model_invocation_logged: boolean;
  generation_mode: string;
  honesty_note: string | null;
  evaluation: {
    status: string;
    score: number;
    critical_failures: string[];
    first_missed_contract: {
      id: string;
      deadline_minute: number;
      critical: boolean;
    } | null;
  };
  can_compile_failure: boolean;
  compile_blocker: string | null;
  trust_boundary: string;
};

type InspectedModelRun = {
  file: File;
  inspection: ModelRunInspection | null;
  error: string;
};

type LocalCompilerModule = {
  compileBrowserWitnessFromBytes: (input: {
    caseBytes: Uint8Array;
    runBytes: Uint8Array;
    subtle: SubtleCrypto;
  }) => Promise<LocalCompilationReceipt>;
  inspectBrowserRunFromBytes: (input: {
    caseBytes: Uint8Array;
    runBytes: Uint8Array;
    subtle: SubtleCrypto;
  }) => Promise<ModelRunInspection>;
};

type LocalWitnessCompilerProps = {
  onReturn: () => void;
};

type CompileState = "idle" | "compiling" | "compiled" | "error";
type InspectionState = "idle" | "inspecting" | "inspected" | "error";

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

function assertLocalReceipt(
  receipt: LocalCompilationReceipt,
  selectedInspection: ModelRunInspection | null,
) {
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
  const validSelectedSource =
    selectedInspection !== null &&
    receipt.input_case_sha256 === selectedInspection.case_input_sha256 &&
    receipt.input_run_sha256 === selectedInspection.run_input_sha256 &&
    receipt.source_run_id === selectedInspection.source_run_id &&
    receipt.source_requested_model === selectedInspection.requested_model &&
    receipt.source_requested_reasoning_effort ===
      selectedInspection.requested_reasoning_effort &&
    receipt.source_model_invocation_logged ===
      selectedInspection.model_invocation_logged;

  if (
    !validManifestHash ||
    !validFiles ||
    !validFailure ||
    !validIntegrity ||
    !validSelectedSource
  ) {
    throw new Error(
      "The local compiler returned an incomplete or incorrectly labeled receipt.",
    );
  }
}

export function LocalWitnessCompiler({ onReturn }: LocalWitnessCompilerProps) {
  const [caseFile, setCaseFile] = useState<File | null>(null);
  const [runFiles, setRunFiles] = useState<File[]>([]);
  const [selectedRunIndex, setSelectedRunIndex] = useState(0);
  const [inspectedRuns, setInspectedRuns] = useState<InspectedModelRun[]>([]);
  const [inspectionState, setInspectionState] =
    useState<InspectionState>("idle");
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
  const runFile = runFiles[selectedRunIndex] ?? null;
  const selectedInspection = inspectedRuns[selectedRunIndex]?.inspection ?? null;

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

  function invalidateResult(nextAnnouncement = "Inputs changed. Create a new test.") {
    generationRef.current += 1;
    revokeObjectUrl();
    setSampleLoading(false);
    setInspectionState("idle");
    setInspectedRuns([]);
    setCompileState("idle");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    setAnnouncement(nextAnnouncement);
  }

  function reflectSelectedFiles(
    input: HTMLInputElement | null,
    files: File[],
  ) {
    if (!input || typeof DataTransfer === "undefined") return;
    const transfer = new DataTransfer();
    for (const file of files) transfer.items.add(file);
    input.files = transfer.files;
  }

  async function loadIncludedSample() {
    invalidateResult("Loading the included fully synthetic sample inputs.");
    const generation = generationRef.current;
    setSampleLoading(true);
    setCaseFile(null);
    setRunFiles([]);
    setSelectedRunIndex(0);
    setSyntheticConfirmed(false);

    try {
      const routes = [
        "/runs/v2/postpartum-warning-signs-case.json",
        "/runs/v2/postpartum-warning-signs-baseline.json",
        "/runs/v2/postpartum-warning-signs-repaired.json",
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
      const [caseBuffer, failedRunBuffer, repairedRunBuffer] = await Promise.all(
        responses.map((response) => response.arrayBuffer()),
      );
      if (generationRef.current !== generation) return;

      const includedCase = new File(
        [caseBuffer],
        "postpartum-warning-signs-case.json",
        { type: "application/json" },
      );
      const includedFailedRun = new File(
        [failedRunBuffer],
        "postpartum-warning-signs-baseline.json",
        { type: "application/json" },
      );
      const includedRepairedRun = new File(
        [repairedRunBuffer],
        "postpartum-warning-signs-repaired.json",
        { type: "application/json" },
      );
      assertJsonFile(includedCase, "Included case input");
      assertJsonFile(includedFailedRun, "Included failed run input");
      assertJsonFile(includedRepairedRun, "Included repaired run input");
      setCaseFile(includedCase);
      setRunFiles([includedFailedRun, includedRepairedRun]);
      reflectSelectedFiles(caseInputRef.current, [includedCase]);
      reflectSelectedFiles(runInputRef.current, [
        includedFailedRun,
        includedRepairedRun,
      ]);
      setAnnouncement(
        "The included failed and repaired runs are loaded. Confirm that the files are synthetic, compare them, then create a test from the failed run.",
      );
    } catch (error) {
      if (generationRef.current !== generation) return;
      const message = conciseError(error);
      setCompileState("error");
      setErrorMessage(message);
      setAnnouncement(`Sample loading stopped because the files could not be verified. ${message}`);
    } finally {
      if (generationRef.current === generation) setSampleLoading(false);
    }
  }

  function handleCaseFile(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult();
    setCaseFile(event.target.files?.[0] ?? null);
  }

  function handleRunFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    invalidateResult(
      files.length > MAX_MODEL_RUNS
        ? `Select no more than ${MAX_MODEL_RUNS} recorded runs at once.`
        : "Recorded runs changed. Inspect them before compiling a failure.",
    );
    if (files.length > MAX_MODEL_RUNS) {
      setRunFiles([]);
      setSelectedRunIndex(0);
      event.target.value = "";
      return;
    }
    setRunFiles(files);
    setSelectedRunIndex(0);
  }

  function handleSyntheticConfirmation(event: ChangeEvent<HTMLInputElement>) {
    invalidateResult(
      event.target.checked
        ? "Synthetic-data declaration recorded."
        : "Synthetic-data declaration removed. Compilation is disabled.",
    );
    setSyntheticConfirmed(event.target.checked);
  }

  async function inspectRuns() {
    if (!caseFile || runFiles.length === 0 || !syntheticConfirmed) return;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    revokeObjectUrl();
    setInspectionState("inspecting");
    setInspectedRuns([]);
    setCompileState("idle");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    setAnnouncement(
      `Checking ${runFiles.length} selected recorded ${runFiles.length === 1 ? "run" : "runs"} against one fixed case.`,
    );

    try {
      assertJsonFile(caseFile, "Case input");
      for (const [index, file] of runFiles.entries()) {
        assertJsonFile(file, `Run input ${index + 1}`);
      }
      if (!window.crypto?.subtle) {
        throw new Error("WebCrypto is unavailable in this browser.");
      }

      const [caseBuffer, compilerModule] = await Promise.all([
        caseFile.arrayBuffer(),
        import("@/engine/browser-witness-compiler.mjs") as Promise<unknown>,
      ]);
      if (generationRef.current !== generation) return;
      const compiler = compilerModule as LocalCompilerModule;
      const caseBytes = new Uint8Array(caseBuffer);
      const inspected = await Promise.all(
        runFiles.map(async (file): Promise<InspectedModelRun> => {
          try {
            const runBuffer = await file.arrayBuffer();
            const inspection = await compiler.inspectBrowserRunFromBytes({
              caseBytes,
              runBytes: new Uint8Array(runBuffer),
              subtle: window.crypto.subtle,
            });
            return { file, inspection, error: "" };
          } catch (error) {
            return { file, inspection: null, error: conciseError(error) };
          }
        }),
      );
      if (generationRef.current !== generation) return;

      const validCount = inspected.filter((item) => item.inspection).length;
      if (validCount === 0) {
        throw new Error("None of the selected runs passed local validation.");
      }
      const firstCompilableIndex = inspected.findIndex(
        (item) => item.inspection?.can_compile_failure,
      );
      const firstValidIndex = inspected.findIndex((item) => item.inspection);
      setInspectedRuns(inspected);
      setSelectedRunIndex(
        firstCompilableIndex >= 0 ? firstCompilableIndex : firstValidIndex,
      );
      setInspectionState("inspected");
      setAnnouncement(
        `${validCount} of ${inspected.length} recorded ${inspected.length === 1 ? "run was" : "runs were"} checked. Choose a failed run to create a test.`,
      );
    } catch (error) {
      if (generationRef.current !== generation) return;
      const message = conciseError(error);
      setInspectionState("error");
      setErrorMessage(message);
      setAnnouncement(`Run comparison stopped. ${message}`);
    }
  }

  function selectInspectedRun(index: number) {
    generationRef.current += 1;
    revokeObjectUrl();
    setSelectedRunIndex(index);
    setCompileState("idle");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    const inspection = inspectedRuns[index]?.inspection;
    const isAuthoredExample =
      inspection?.honesty_note?.toLowerCase().includes(
        "not a captured live model completion",
      ) ?? false;
    const selectedLabel = inspection
      ? isAuthoredExample
        ? inspection.variant === "repaired"
          ? "the authored repaired run"
          : "the authored failed run"
        : inspection.requested_model ?? inspection.source_run_id
      : null;
    setAnnouncement(
      inspection
        ? `Selected ${selectedLabel}. Any model settings come from the file and remain unverified. The same fixed rules will be used.`
        : `Selected ${inspectedRuns[index]?.file.name ?? "run"}. Fix its validation error before compiling.`,
    );
  }

  async function compileFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !caseFile ||
      !runFile ||
      !syntheticConfirmed ||
      !selectedInspection?.can_compile_failure
    ) return;

    const generation = generationRef.current + 1;
    generationRef.current = generation;
    revokeObjectUrl();
    setCompileState("compiling");
    setCompilationReceipt(null);
    setErrorMessage("");
    setBundleExported(false);
    setAnnouncement(
      `Creating a failing test from the selected recorded run.`,
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

      assertLocalReceipt(receipt, selectedInspection);
      setCompilationReceipt(receipt);
      setCompileState("compiled");
      setAnnouncement(
        `Created a failing test for ${receipt.case_id} with ${receipt.file_count} local files.`,
      );
    } catch (error) {
      if (generationRef.current !== generation) return;
      const message = conciseError(error);
      setCompileState("error");
      setErrorMessage(message);
      setAnnouncement(`Test creation stopped because the inputs could not be verified. ${message}`);
    }
  }

  function exportBundle() {
    if (!compilationReceipt) return;

    try {
      assertLocalReceipt(compilationReceipt, selectedInspection);
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
      setAnnouncement(`Export stopped because the package could not be verified. ${conciseError(error)}`);
    }
  }

  function clearWorkspace() {
    invalidateResult("Local workspace cleared.");
    setCaseFile(null);
    setRunFiles([]);
    setSelectedRunIndex(0);
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
  const isInspecting = inspectionState === "inspecting";
  const canInspect =
    caseFile !== null &&
    runFiles.length > 0 &&
    syntheticConfirmed &&
    !isInspecting &&
    !isCompiling &&
    !sampleLoading;
  const canCompile =
    canInspect &&
    inspectionState === "inspected" &&
    selectedInspection?.can_compile_failure === true &&
    !isCompiling &&
    !sampleLoading;

  return (
    <section className="local-workspace" id="top" aria-labelledby="local-title">
      <header className="local-header">
        <div className="local-heading-copy">
          <p className="local-eyebrow">PRIVATE LOCAL WORKSPACE</p>
          <h1 id="local-title">Compare recorded runs, then create a test</h1>
          <p className="local-intro">
            Load one synthetic case and up to six WitnessPatch run files.
            WitnessPatch checks every run against the same rules. Choose a failed
            run to create a Node test from that record.
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
        <h2 id="local-boundary-title">Your files stay on this device</h2>
        <p>
          Selected files are processed locally in this browser and are not
          submitted by this workspace. Each file must be JSON and no larger than
          512 KiB.
        </p>
        <p className="local-warning">
          Checking the box below does not scan the files for patient information.
          WitnessPatch cannot detect protected health information or prove that a
          file has been deidentified.
        </p>
      </section>

      <section className="local-sample-tools" aria-labelledby="local-sample-title">
        <div>
          <p className="local-sample-kicker">TRY THE INCLUDED EXAMPLE</p>
          <h2 id="local-sample-title">Compare a failed run with a repaired run</h2>
          <p>
            The two included runs are authored examples, not captured model
            responses. You can also import up to six WitnessPatch run files tagged
            with different model names.
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
            <a
              href="/runs/v2/postpartum-warning-signs-repaired.json"
              download="postpartum-warning-signs-repaired.json"
            >
              Download repaired run
            </a>
          </span>
        </div>
      </section>

      <form
        className="local-form"
        onSubmit={compileFiles}
        aria-busy={isCompiling || isInspecting}
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
            <label htmlFor="local-run-file">Recorded run .json files</label>
            <input
              ref={runInputRef}
              id="local-run-file"
              name="run-file"
              type="file"
              accept=".json,application/json"
              multiple
              onChange={handleRunFiles}
              aria-describedby="local-file-limit"
            />
          </div>
          <p className="local-file-limit" id="local-file-limit">
            Choose up to {MAX_MODEL_RUNS} runs. Maximum 512 KiB per file. File
            contents remain on this device.
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
            I confirm every selected file is fully synthetic and contains no
            patient or production data.
          </span>
        </label>

        {inspectionState === "inspected" ? (
          <section
            className="local-trace-comparison"
            aria-labelledby="local-trace-comparison-title"
          >
            <header className="local-trace-comparison-header">
              <div>
                <p className="local-sample-kicker">SAVED RUNS</p>
                <h2 id="local-trace-comparison-title">
                  Compare recorded runs on the same case
                </h2>
              </div>
              <p>
                Each card is a different imported run. Choose one to inspect its
                result or create a test from its failure.
              </p>
            </header>
            <div
              className="local-trace-grid"
              role="radiogroup"
              aria-label="Choose a saved run"
            >
              {inspectedRuns.map((item, index) => {
                const inspection = item.inspection;
                const isSelected = index === selectedRunIndex;
                const isAuthoredExample =
                  inspection?.honesty_note?.toLowerCase().includes(
                    "not a captured live model completion",
                  ) ?? false;
                const modelLabel = inspection
                  ? isAuthoredExample
                    ? inspection.variant === "repaired"
                      ? "Authored repaired run"
                      : "Authored failed run"
                    : inspection.requested_model ?? "Model not declared"
                  : "Model not declared";
                const attribution = inspection
                  ? inspection.model_invocation_logged
                    ? "The file declares a model call. WitnessPatch cannot verify which model was served."
                    : isAuthoredExample
                      ? "This is an authored example, not a captured model response."
                      : "The file does not declare a logged model call."
                  : "Run file did not pass validation.";
                if (!inspection) {
                  return (
                    <article
                      className="local-trace-option invalid"
                      key={`${item.file.name}-${index}`}
                    >
                      <span className="local-trace-model">{item.file.name}</span>
                      <span className="local-trace-error">{item.error}</span>
                    </article>
                  );
                }
                const resultLabel = inspection.can_compile_failure
                  ? `Failure ready to turn into a test${inspection.evaluation.first_missed_contract ? ` at T+${String(inspection.evaluation.first_missed_contract.deadline_minute).padStart(2, "0")}` : ""}`
                  : inspection.evaluation.status === "pass"
                    ? "This run passes, so there is no failure to turn into a test."
                    : `This run fails, but this failure cannot be compiled${inspection.compile_blocker ? `: ${inspection.compile_blocker}` : "."}`;
                return (
                  <label
                    className={`local-trace-option ${isSelected ? "selected" : ""}`}
                    key={`${item.file.name}-${index}`}
                  >
                    <input
                      className="local-trace-native-radio"
                      type="radio"
                      name="recorded-model-run"
                      checked={isSelected}
                      onChange={() => selectInspectedRun(index)}
                    />
                    <span className="local-trace-radio" aria-hidden="true" />
                    <span className="local-trace-model">{modelLabel}</span>
                    <span className="local-trace-effort">
                      {isAuthoredExample
                        ? "No captured model response"
                        : inspection.requested_reasoning_effort
                        ? `${inspection.requested_reasoning_effort} requested`
                        : "Reasoning mode not declared"}
                    </span>
                    <span className="local-trace-score">
                      {inspection.evaluation.score}/100
                      <small>
                        {inspection.evaluation.critical_failures.length} critical
                        {inspection.evaluation.critical_failures.length === 1
                          ? " failure"
                          : " failures"}
                      </small>
                    </span>
                    <span className="local-trace-meta">
                      {inspection.source_run_id}
                      <small>SHA {inspection.run_input_sha256.slice(0, 12)}</small>
                    </span>
                    <span className="local-trace-attribution">{attribution}</span>
                    <span className="local-trace-result">{resultLabel}</span>
                  </label>
                );
              })}
            </div>
            <p className="local-trace-boundary">
              Model names and reasoning settings come from imported files and are
              marked unverified. WitnessPatch checks saved behavior; it does not call
              or compare live models. For a real cross-model comparison, import one
              saved run from each model. The included sample contains two authored
              saved runs.
            </p>
          </section>
        ) : null}

        <div className="local-actions">
          <button
            className="local-inspect-button"
            type="button"
            onClick={() => void inspectRuns()}
            disabled={!canInspect}
          >
            {isInspecting
              ? "Checking saved runs…"
              : inspectedRuns.length > 0
                ? "Check saved runs again"
                : "Compare saved runs"}
          </button>
          <button
            className="local-compile-button"
            type="submit"
            disabled={!canCompile}
          >
            {isCompiling
              ? "Creating test…"
              : "Create test from selected failure"}
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

      {compileState === "error" || inspectionState === "error" ? (
        <section className="local-error" role="alert" aria-labelledby="local-error-title">
          <h2 id="local-error-title">Workspace stopped</h2>
          <p>{errorMessage}</p>
        </section>
      ) : null}

      {compilationReceipt ? (
        <section className="local-result" aria-labelledby="local-result-title">
          <header className="local-result-header">
            <div>
              <p className="local-result-status">FAILING TEST CREATED</p>
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
              <dt>Requested model</dt>
              <dd>
                {compilationReceipt.source_requested_model ?? "Not declared"}
              </dd>
            </div>
            <div>
              <dt>Requested reasoning</dt>
              <dd>
                {compilationReceipt.source_requested_reasoning_effort ??
                  "Not declared"}
              </dd>
            </div>
            <div>
              <dt>Target rule</dt>
              <dd>{compilationReceipt.target_rule_id}</dd>
            </div>
            <div>
              <dt>Checked score</dt>
              <dd>{compilationReceipt.fresh_evaluation.score}/100</dd>
            </div>
            <div>
              <dt>Required actions missed</dt>
              <dd>
                {compilationReceipt.fresh_evaluation.critical_failures.join(", ") ||
                  "None"}
              </dd>
            </div>
            <div>
              <dt>First missed deadline</dt>
              <dd>
                T+
                {String(compilationReceipt.failure_known_at_minute).padStart(
                  2,
                  "0",
                )}
              </dd>
            </div>
            <div>
              <dt>Facts used to show the miss</dt>
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
              <dt>File checks</dt>
              <dd>Two hashes computed locally. Neither was externally verified.</dd>
            </div>
            <div>
              <dt>Selected run SHA-256</dt>
              <dd>{compilationReceipt.input_run_sha256}</dd>
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
