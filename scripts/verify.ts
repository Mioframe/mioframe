import fs from 'node:fs';
import path from 'node:path';
import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { applyProjectEnv } from './lib/projectEnv.ts';
import {
  withExpensiveCommandLock,
  withVerifyCommandLock,
  type CommandLockHelpers,
  type CommandLockInput,
} from './lib/commandLock.ts';
import { applyProcessResult } from './lib/processResult.ts';
import {
  classifyCommandWeight,
  resolveEslintConcurrency,
  type CommandWeight,
} from './lib/commandWeight.ts';
import { createChildSignalForwarder } from './lib/signalForward.ts';
import {
  canChangedPathsAffectE2E,
  resolveStructuralE2EPlan,
  type StructuralE2EPlan,
} from './lib/e2eRisk.ts';
import { resolveReleaseStaticPlan, type ReleaseStaticPlan } from './lib/releaseStaticRisk.ts';
import { RELEASE_SMOKE_SPEC } from './lib/releaseProofInventory.ts';
import {
  validateE2EProjectApplicability,
  type E2EProjectApplicabilityValidation,
} from './lib/e2eProjectApplicability.ts';
import { validateE2ETargetTree, type E2ETargetTreeValidation } from './lib/e2eOwnerTree.ts';
import {
  resolveStorybookBehaviorPlan,
  type StorybookBehaviorPlan,
} from './lib/storybookBehaviorRisk.ts';
import { resolveStorybookBuildPlan, type StorybookBuildPlan } from './lib/storybookBuildRisk.ts';
import { resolveVisualPlan, type VisualPlan } from './lib/visualRisk.ts';
import {
  listGenericBrowserIntegrationSpecs,
  PRODUCTION_ARTIFACT_SMOKE_SPEC,
  resolveBrowserIntegrationPlan,
  resolveGenericBrowserIntegrationPlan,
  type BrowserIntegrationPlan,
  type GenericBrowserIntegrationPlan,
} from './lib/browserIntegrationRisk.ts';
import {
  getChangedFileProjection,
  resolveChangedPathsScope,
  type ChangedPathsScopeInput,
} from './lib/changedPaths.ts';
import { resolveUnitPlan, type UnitPlan } from './lib/unitRisk.ts';
import { resolveMutationPlan, type MutationPlan } from './lib/mutationTargets.ts';
import {
  formatShellCommand,
  formatVerifyInvocationCommand,
  getCliFilesOverride,
  resolveVerifyInvocation,
  VERIFICATION_TYPES,
  type FixMode,
  type VerificationType,
  type VerifyInvocation,
} from './lib/verifyInvocation.ts';
import {
  comparePlaywrightContainerProfiles,
  resolvePlaywrightContainerProfile,
  VERIFY_PROFILE_ENV,
  type PlaywrightContainerProfile,
} from './playwrightContainer.ts';

// --- Command plan / result contracts -------------------------------------

/** Command entry the planner emits for one child command to run. */
export interface RunCommandEntry {
  kind: 'run';
  label: string;
  command: string;
  args: string[];
  weight?: CommandWeight;
  note?: string | null;
  triggerReason?: string | null;
  /**
   * The single verification type this proof leaf belongs to, or `null` for
   * a pure execution prerequisite. Stamped by {@link withVerificationType} as
   * a final planning pass; individual command-building call sites do not
   * set this themselves.
   */
  verificationType?: VerificationType | null;
}

/** Command entry the planner emits when a check is skipped. */
export interface SkippedCommandEntry {
  kind: 'skipped';
  label: string;
  command: string;
  reason: string;
  triggerReason?: string | null;
  /** See {@link RunCommandEntry.verificationType}. */
  verificationType?: VerificationType | null;
}

/** Command entry the planner emits when a check fails closed before execution. */
export interface FailedCommandEntry {
  kind: 'failed';
  label: string;
  command: string;
  reason: string;
  triggerReason?: string | null;
  /** See {@link RunCommandEntry.verificationType}. */
  verificationType?: VerificationType | null;
}

/** One planned verify command, discriminated by `kind`. */
export type CommandEntry = RunCommandEntry | SkippedCommandEntry | FailedCommandEntry;

interface CommandResultBase {
  label: string;
  hasWarnings: boolean;
  warningSummary: string;
  blockingLogIssue: BlockingLogIssue | null;
  triggerReason: string | null;
  note?: string | null;
  stdout: string;
  stderr: string;
  /**
   * Elapsed wall time for an executed check, measured with a monotonic
   * clock. Diagnostic only; absent for checks that never ran a child
   * process (skipped, or failed closed before execution).
   */
  durationMs?: number;
}

/** Result of a command that actually ran a child process. */
export interface ExecutedCommandResult extends CommandResultBase {
  status: 'passed' | 'failed';
  command: string;
  displayCommand: string;
  logPath: string;
  exitCode: number;
  terminatedBySignal: NodeJS.Signals | null;
  signal: NodeJS.Signals | null;
}

/** Result of a command the planner skipped before execution. */
export interface SkippedCommandResult extends CommandResultBase {
  status: 'skipped';
  command: string;
  reason: string;
  exitCode: null;
}

/** Result of a command that failed closed before execution (invalid plan). */
export interface InvalidCommandResult extends CommandResultBase {
  status: 'failed';
  command: string;
  displayCommand: string;
  reason: string;
  note: string;
  exitCode: null;
}

/** One verify command result, discriminated by `status` and (for `failed`) shape. */
export type CommandResult = ExecutedCommandResult | SkippedCommandResult | InvalidCommandResult;

applyProjectEnv();

const rawCliArgs = process.argv.slice(2);
const isHelpMode = process.argv.includes('--help') || rawCliArgs.includes('help');
const currentVerifyInvocation: VerifyInvocation | null = isHelpMode
  ? null
  : resolveVerifyInvocation(rawCliArgs, process.env);
const isVerboseMode = currentVerifyInvocation?.verbose ?? false;
const isFullMode = currentVerifyInvocation?.scope.kind === 'full';
const VERIFY_DIR = '.verify';
const VERIFY_LOG_DIR = path.posix.join(VERIFY_DIR, 'logs');
const MAX_RELEVANT_LINES = 20;
const MAX_FILE_ARGS_IN_SUMMARY = 4;
const MAX_ROLLING_BUFFER_CHARS = 128 * 1024;
const HEARTBEAT_INTERVAL_MS = 60_000;
const KILL_GRACE_MS = 10_000;
// Fixed, documented allowance for orchestration outside the bounded
// Playwright container: container startup, web-server startup, Playwright
// shutdown, and process-result propagation back to verify.ts.
export const PLAYWRIGHT_COMMAND_OVERHEAD_MS = 2 * 60 * 1000;

/**
 * Derive the outer verify command timeout for a container-backed Playwright
 * lane from the canonical container hard timeout in `config/tooling.json`.
 * The result must stay strictly greater than the container timeout so a
 * completed Playwright run is never killed by the outer verify deadline
 * before the bounded container can exit and report its result normally.
 * @param [containerTimeoutSeconds] Canonical Playwright container timeout,
 * in seconds. Defaults to `config/tooling.json`'s
 * `verification.playwrightContainer.timeoutSeconds`.
 * @returns Outer verify command timeout, in milliseconds.
 */
export function resolvePlaywrightCommandTimeoutMs(
  containerTimeoutSeconds: string | number = toolingConfig.verification.playwrightContainer
    .timeoutSeconds,
): number {
  const containerTimeoutMs = Number(containerTimeoutSeconds) * 1000;

  if (!Number.isFinite(containerTimeoutMs) || containerTimeoutMs <= 0) {
    throw new Error(
      `Invalid config/tooling.json verification.playwrightContainer.timeoutSeconds: ${JSON.stringify(containerTimeoutSeconds)}`,
    );
  }

  return containerTimeoutMs + PLAYWRIGHT_COMMAND_OVERHEAD_MS;
}

const PLAYWRIGHT_COMMAND_TIMEOUT_MS = resolvePlaywrightCommandTimeoutMs();
// Exported read-only so focused tests can prove which labels use the
// derived Playwright container timeout without executing the full CLI.
export const COMMAND_TIMEOUT_MS_BY_LABEL: Partial<Record<string, number>> = {
  'e2e-install': 10 * 60 * 1000,
  e2e: PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  'storybook-behavior': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  visual: PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  'storybook-build': 10 * 60 * 1000,
  mutation: 20 * 60 * 1000,
  build: 10 * 60 * 1000,
  artifact: 8 * 60 * 1000,
  // Two real `vite build` invocations; no Playwright container involved
  // (see scripts/release/managedUpdatesControllerArtifactIdentityProof.ts
  // and productionArtifactStaticProof.ts).
  'artifact-static': 10 * 60 * 1000,
  'release-smoke': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  'managed-updates-static': 8 * 60 * 1000,
  // Split from the historical single `managed-updates` aggregate (see
  // docs/testing/verify-redesign-implementation-preflight.md's
  // "Managed-updates grouping"): three sequential fresh-container sessions
  // (lifecycle, migration-isolation, cross-engine) for the
  // browser-integration proof leaf, and two (activation-UI,
  // data-compatibility) for the E2E proof leaf; each session is bounded by
  // the same derived Playwright container timeout as every other
  // Playwright-backed lane.
  'managed-updates-browser-integration': 3 * PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  'managed-updates-e2e': 2 * PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  // The generic owner-local browser-integration leaf (see
  // scripts/browserIntegration.ts / playwright.browserIntegration.config.ts):
  // a single ordinary Playwright container run, same bound as every other
  // Playwright-backed lane.
  'browser-integration-local': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
};
const cliOnlyType = currentVerifyInvocation?.onlyType ?? null;
const cliProfile = currentVerifyInvocation?.profile ?? null;

// Internal verification-type ownership for every planner leaf label (Pass A
// of the verify redesign: see
// docs/testing/verify-redesign-implementation-preflight.md). The public
// `--only` CLI selects by these types (see resolveVerificationType and
// selectOnlyCommands); leaf labels themselves remain private identifiers for
// logs, weights, timeouts, and locks. Every proof leaf label must appear
// here with exactly one type; a label that is a pure execution prerequisite
// (never itself a proof leaf) is listed in PREREQUISITE_LABELS instead of
// being invented as a ninth type.
const VERIFICATION_TYPE_BY_LABEL: Readonly<Partial<Record<string, VerificationType>>> = {
  'agent-environment': 'static',
  format: 'static',
  oxlint: 'static',
  eslint: 'static',
  'type-check': 'static',
  'storybook-build': 'static',
  'unit-tests': 'unit',
  'unit-related': 'unit',
  e2e: 'e2e',
  'storybook-behavior': 'behavior',
  visual: 'visual',
  mutation: 'mutation',
  'release-version': 'static',
  'release-config': 'static',
  build: 'static',
  'publisher-node-import': 'static',
  'artifact-static': 'static',
  artifact: 'browser-integration',
  'release-smoke': 'e2e',
  'managed-updates-static': 'static',
  'managed-updates-browser-integration': 'browser-integration',
  'managed-updates-e2e': 'e2e',
  'browser-integration-local': 'browser-integration',
};

// Pure execution prerequisites: never a proof leaf on their own, so they
// carry no verification type instead of inventing a ninth type for them
// (see the implementation preflight's "pure execution prerequisites such as
// e2e-install are not invented as a ninth verification type"). Storybook
// buildability itself is a `static` proof leaf (see
// VERIFICATION_TYPE_BY_LABEL); reuse of its build artifact by
// storybook-behavior/visual is a separate execution optimization and does
// not remove that static proof ownership.
const PREREQUISITE_LABELS: ReadonlySet<string> = new Set(['e2e-install']);

/**
 * Resolve the single verification type a planner leaf label belongs to.
 * @param label Verify command label.
 * @returns The owning verification type, or `null` for a pure execution
 * prerequisite label.
 */
function resolveVerificationType(label: string): VerificationType | null {
  const type = VERIFICATION_TYPE_BY_LABEL[label];

  if (type !== undefined) {
    return type;
  }

  if (PREREQUISITE_LABELS.has(label)) {
    return null;
  }

  throw new Error(`No verification type registered for verify command label: ${label}`);
}

/**
 * Stamp one planned command entry with its single owning verification type
 * (or `null` for a pure execution prerequisite). Applied as a final planning
 * pass over the full command list so individual command-building call sites
 * do not each need to repeat label -> type ownership.
 * @param entry Planned command entry.
 * @returns The same entry with `verificationType` resolved.
 */
export function withVerificationType<T extends CommandEntry>(entry: T): T {
  return { ...entry, verificationType: resolveVerificationType(entry.label) };
}

const EXPENSIVE_SKIP_REASON =
  'previous check failed; skipped expensive verification to save CI minutes';
const FORMATTABLE_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.mts',
  '.scss',
  '.ts',
  '.tsx',
  '.vue',
  '.yaml',
  '.yml',
]);

const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.vue']);
const FORMAT_LINT_IGNORED_PREFIXES = ['.github/'];

function isFormatLintIgnored(filePath: string): boolean {
  return FORMAT_LINT_IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function directoryExists(directoryPath: string): boolean {
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

export { getCliFilesOverride };

function isTypeCheckTarget(filePath: string): boolean {
  const baseName = path.posix.basename(filePath);

  return (
    filePath === 'package.json' ||
    filePath === 'config/tooling.json' ||
    filePath === 'pnpm-lock.yaml' ||
    filePath === 'env.d.ts' ||
    filePath === 'vite-env.d.ts' ||
    (filePath.startsWith('src/') && (filePath.endsWith('.ts') || filePath.endsWith('.vue'))) ||
    (filePath.startsWith('tests/') && filePath.endsWith('.ts')) ||
    (filePath.startsWith('scripts/') && filePath.endsWith('.ts')) ||
    (baseName.startsWith('tsconfig') && baseName.endsWith('.json')) ||
    baseName.includes('.config.')
  );
}

function formatCommand(command: string, args: readonly string[]): string {
  return formatShellCommand(command, args);
}

function getLogPath(label: string): string {
  return path.posix.join(VERIFY_LOG_DIR, `${label}.log`);
}

function ensureLogsDirectory(labelsToReset: readonly string[] | null = null): void {
  if (labelsToReset === null) {
    fs.rmSync(VERIFY_LOG_DIR, { recursive: true, force: true });
    fs.mkdirSync(VERIFY_LOG_DIR, { recursive: true });
    return;
  }

  fs.mkdirSync(VERIFY_LOG_DIR, { recursive: true });

  for (const label of labelsToReset) {
    fs.rmSync(getLogPath(label), { force: true });
  }
}

function appendToRollingBuffer(buffer: string, chunk: string): string {
  const nextBuffer = `${buffer}${chunk}`;

  if (nextBuffer.length <= MAX_ROLLING_BUFFER_CHARS) {
    return nextBuffer;
  }

  return nextBuffer.slice(-MAX_ROLLING_BUFFER_CHARS);
}

function closeLogStream(stream: fs.WriteStream): Promise<void> {
  return new Promise((resolve, reject) => {
    stream.once('error', reject);
    stream.end(() => {
      resolve();
    });
  });
}

function summarizeCommandForDisplay(command: string, args: readonly string[]): string {
  const groupedFileArgs: string[] = [];
  const otherArgs: string[] = [];

  for (const arg of args) {
    if (!arg.startsWith('-') && fileExists(arg)) {
      groupedFileArgs.push(arg);
      continue;
    }

    otherArgs.push(arg);
  }

  if (groupedFileArgs.length === 0) {
    return formatCommand(command, args);
  }

  const previewFiles = groupedFileArgs.slice(0, MAX_FILE_ARGS_IN_SUMMARY);
  const remainingCount = groupedFileArgs.length - previewFiles.length;
  const fileSummaryParts = [...previewFiles];

  if (remainingCount > 0) {
    fileSummaryParts.push(`<+${remainingCount} files>`);
  }

  const displayArgs = [...otherArgs, ...fileSummaryParts];
  return formatCommand(command, displayArgs);
}

function trimWarningLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

function isZeroWarningLine(line: string): boolean {
  return /\b0 warnings?\b/i.test(line) && !/\b[1-9]\d* warnings?\b/i.test(line);
}

function getWarningSummary(label: string, output: string): string {
  if (!['oxlint', 'eslint'].includes(label)) {
    return '';
  }

  const lines = output
    .split('\n')
    .map(trimWarningLine)
    .filter((line) => /\bwarnings?\b/i.test(line))
    .filter((line) => !isZeroWarningLine(line));

  if (lines.length === 0) {
    return '';
  }

  return uniqSorted(lines).slice(0, 3).join(' | ');
}

// Blocking log signals: known runtime quality problems that must fail a
// check even when its process exits with code 0. Keep this list narrow and
// label-scoped; generic Vite/Rollup/dependency warnings and ordinary stderr
// output must never become fatal here.
const BLOCKING_LOG_SIGNALS: readonly { label: string; marker: string; reason: string }[] = [
  {
    label: 'unit-tests',
    marker: '[Vue warn]',
    reason: 'Vue runtime warnings were emitted during unit tests',
  },
  {
    label: 'unit-related',
    marker: '[Vue warn]',
    reason: 'Vue runtime warnings were emitted during unit tests',
  },
  // Vitest's own no-test diagnostic (see printNoTestFound in the installed
  // vitest CLI): `--changed`/`related` implicitly default passWithNoTests to
  // true, so a unit-relevant scope with zero matching tests still exits 0.
  // Blocking on this exact line keeps that a visible failure instead of a
  // successful empty pass (see docs/testing/verify-redesign-pass-e-correction.md's "B1").
  {
    label: 'unit-tests',
    marker: 'No test files found, exiting with code 0',
    reason: 'Vitest found no matching unit test files for this affected scope',
  },
  {
    label: 'unit-related',
    marker: 'No test files found, exiting with code 0',
    reason: 'Vitest found no matching unit test files for this related scope',
  },
];

// oxlint-disable-next-line no-control-regex -- ANSI color escapes start with the ESC control character by definition.
const ANSI_ESCAPE_PATTERN = /\[[0-9;]*m/g;

/** A blocking log signal detected in a completed command's captured log. */
export interface BlockingLogIssue {
  reason: string;
  warningSummary: string;
}

/**
 * Find a blocking log signal in a completed command's captured log.
 * Matching is anchored to the start of a log line, so test names, fixture
 * strings, or summaries that merely mention a marker mid-line never match.
 * @param label Verify command label the log belongs to.
 * @param logOutput Full captured log output of the command.
 * @returns Blocking issue with `reason` and `warningSummary`, or `null`.
 */
export function getBlockingLogIssue(label: string, logOutput: string): BlockingLogIssue | null {
  const signals = BLOCKING_LOG_SIGNALS.filter((entry) => entry.label === label);

  if (signals.length === 0) {
    return null;
  }

  const lines = logOutput.split('\n').map((line) => line.replace(ANSI_ESCAPE_PATTERN, ''));

  for (const signal of signals) {
    const matchedLines = lines
      .filter((line) => line.startsWith(signal.marker))
      .map(trimWarningLine);

    if (matchedLines.length === 0) {
      continue;
    }

    return {
      reason: signal.reason,
      warningSummary: uniqSorted(matchedLines).slice(0, 3).join(' | '),
    };
  }

  return null;
}

/**
 * Classify a finished command from its exit code and captured log.
 * A zero exit code still fails when the log carries a blocking signal for
 * this label, so runtime quality problems cannot pass on exit code alone.
 * @param label Verify command label.
 * @param exitCode Process exit code of the command.
 * @param logOutput Full captured log output of the command.
 * @returns `status` plus the `blockingLogIssue` that caused a log-based failure.
 */
export function resolveCommandStatus(
  label: string,
  exitCode: number,
  logOutput: string,
): { status: 'passed' | 'failed'; blockingLogIssue: BlockingLogIssue | null } {
  const blockingLogIssue = getBlockingLogIssue(label, logOutput);

  return {
    status: exitCode === 0 && blockingLogIssue === null ? 'passed' : 'failed',
    blockingLogIssue,
  };
}

function getOutputTail(output: string): string[] {
  const lines = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return ['(no output captured)'];
  }

  return lines.slice(-MAX_RELEVANT_LINES);
}

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

function formatHelpTimeout(milliseconds: number): string {
  const minutes = Math.floor(milliseconds / 60_000);

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function getLastMeaningfulLine(text: string): string | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.at(-1) ?? null;
}

function printHelp(): void {
  console.log('Usage:');
  console.log('  pnpm verify [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help              Show this help.');
  console.log('  --verbose           Stream command output to stdout/stderr.');
  console.log('  --fix               Apply supported format/lint fixes, then run verification.');
  console.log('  --fix-only          Apply supported format/lint fixes only.');
  console.log('                      With either fix mode, --only is valid only with `static`.');
  console.log('  --base <ref>        Verify changes against a local base ref.');
  console.log('                      Local-only default: set VERIFY_BASE in .env.local.');
  console.log('                      Cannot be combined with --full.');
  console.log('  --profile <name>    Override the verify runtime profile.');
  console.log(`                      Env alternative: ${VERIFY_PROFILE_ENV}=local|github-actions.`);
  console.log('  --only <type>       Run one focused verification type.');
  console.log('  --files <paths...>  Override changed-file detection with an explicit file list.');
  console.log('                      Cannot be combined with --full.');
  console.log('  --repeat <count>    With `--only behavior` and `--files` (integer 2-20): repeat');
  console.log('                      the selected behavior tests this many times within one');
  console.log('                      invocation, for deterministic flake diagnosis.');
  console.log(
    '  --full              Literal complete project verification: every verification type,',
  );
  console.log(
    '                      every test/spec, and the complete registered mutation inventory, with',
  );
  console.log(
    '                      no affected-test narrowing. Cannot be combined with --only, --files,',
  );
  console.log('                      --base, --repeat, or --fix-only.');
  console.log('');
  console.log('Types for --only:');

  for (const type of VERIFICATION_TYPES) {
    console.log(`  ${type}`);
  }

  console.log('');
  console.log('Examples:');
  console.log('  pnpm verify');
  console.log('  pnpm verify --verbose');
  console.log('  pnpm verify --base origin/develop');
  console.log('  pnpm verify --profile github-actions --only e2e');
  console.log('  .env.local: VERIFY_BASE=origin/develop');
  console.log(`  ${VERIFY_PROFILE_ENV}=github-actions pnpm verify --only visual`);
  console.log('  pnpm verify --verbose --only static');
  console.log('  pnpm verify --only static --files src/foo.ts src/bar.vue');
  console.log('  pnpm verify --only behavior --files src/foo.behavior.spec.ts --repeat 10');
  console.log('  pnpm verify --fix');
  console.log('  pnpm verify --fix-only');
  console.log('  pnpm verify --full');
  console.log('');
  console.log('Notes:');
  console.log('  - In GitHub Actions, focused verify scope is based on GITHUB_BASE_REF.');
  console.log(
    '  - Full mode ignores GITHUB_BASE_REF and VERIFY_BASE; explicit --base/--files are rejected.',
  );
  console.log('  - Focused --only runs preserve logs from other focused steps.');
  console.log(`  - Logs are written to ${VERIFY_LOG_DIR}/.`);
  console.log('  - Expensive checks have internal heartbeat/timeouts:');

  for (const [label, timeoutMs] of Object.entries(COMMAND_TIMEOUT_MS_BY_LABEL)) {
    if (timeoutMs === undefined) {
      continue;
    }

    console.log(`    - ${label}: ${formatHelpTimeout(timeoutMs)}`);
  }
}

/**
 * Merge verify-level environment overrides into a child-process environment.
 * @param [baseEnv] Base environment passed to verify child commands.
 * @param [profileOverride] Explicit verify profile override, usually from `--profile`.
 * @returns Environment with verify-owned overrides applied.
 */
export function getVerifyProcessEnv(
  baseEnv: NodeJS.ProcessEnv = process.env,
  profileOverride: string | null = cliProfile,
): NodeJS.ProcessEnv {
  if (profileOverride === null) {
    return baseEnv;
  }

  return {
    ...baseEnv,
    [VERIFY_PROFILE_ENV]: profileOverride,
  };
}

function getProfileSummary(processEnv: NodeJS.ProcessEnv): {
  environment: string;
  profile: PlaywrightContainerProfile;
} {
  const profile = resolvePlaywrightContainerProfile(processEnv);

  return {
    environment: processEnv.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local',
    profile,
  };
}

function getHeavyCheckTriggerLines(results: readonly CommandResult[]): string[] {
  return results
    .filter((result) => result.status !== 'skipped' && result.triggerReason)
    .map((result) => `${result.label}: ${result.triggerReason}`);
}

/** Pending GitHub Actions Playwright profile risk after a local pass. */
export interface CiProfileRisk {
  affectedChecks: string[];
  activeProfile: PlaywrightContainerProfile;
  githubActionsProfile: PlaywrightContainerProfile;
  differences: string[];
}

/**
 * Detect unresolved GitHub Actions Playwright profile risk after a local pass.
 * @param results Collected command results in run order.
 * @param [processEnv] Environment object used for profile resolution.
 * @returns Risk details when local Playwright settings differ from GitHub Actions.
 */
export function getCiProfileRisk(
  results: readonly CommandResult[],
  processEnv: NodeJS.ProcessEnv = process.env,
): CiProfileRisk | null {
  const relevantLabels = new Set(['e2e', 'storybook-behavior', 'visual']);
  const affectedChecks = results
    .filter((result) => result.status === 'passed' && relevantLabels.has(result.label))
    .map((result) => result.label);

  if (affectedChecks.length === 0) {
    return null;
  }

  const activeProfile = resolvePlaywrightContainerProfile(processEnv);

  if (activeProfile.name === 'github-actions') {
    return null;
  }

  const githubActionsProfile = resolvePlaywrightContainerProfile({
    ...processEnv,
    GITHUB_ACTIONS: 'true',
    [VERIFY_PROFILE_ENV]: 'github-actions',
  });
  const differences = comparePlaywrightContainerProfiles(activeProfile, githubActionsProfile).map(
    ({ label, left, right }) => `${label}: ${left} -> ${right}`,
  );

  if (differences.length === 0) {
    return null;
  }

  return {
    affectedChecks,
    activeProfile,
    githubActionsProfile,
    differences,
  };
}

async function runCommand(
  label: string,
  command: string,
  args: readonly string[],
  extraEnv: NodeJS.ProcessEnv = {},
  verboseMode: boolean = isVerboseMode,
): Promise<ExecutedCommandResult> {
  const formattedCommand = formatCommand(command, args);
  const displayCommand = summarizeCommandForDisplay(command, args);
  const logPath = getLogPath(label);
  const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });
  logStream.write(`# command\n${formattedCommand}\n\n# output\n`);

  console.log(`\n[${label}] running ${displayCommand}`);

  const child: ChildProcess = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
  });

  let outputBuffer = '';
  let exitCode = 1;
  // Held on a mutable property (rather than a plain reassigned `let`) so a
  // read after `await new Promise(...)` below is not narrowed away by
  // TypeScript's control-flow analysis, which does not track reassignment
  // happening inside a sibling event-callback closure.
  const execState: { spawnError: Error | null } = { spawnError: null };
  let timedOut = false;
  let killGraceTimer: NodeJS.Timeout | null = null;
  const startedAt = Date.now();
  const perfStartedAt = performance.now();
  let lastOutputAt = startedAt;
  let lastOutputLine: string | null = null;
  let incompleteOutputLine = '';
  const commandTimeoutMs = COMMAND_TIMEOUT_MS_BY_LABEL[label] ?? null;
  const forwarder = createChildSignalForwarder(child);

  const writeStatusLine = (line: string, destination: 'stdout' | 'stderr' = 'stdout') => {
    const text = `${line}\n`;
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);

    if (destination === 'stderr') {
      process.stderr.write(text);
      return;
    }

    process.stdout.write(text);
  };

  const heartbeatTimer = setInterval(() => {
    const heartbeatParts = [
      `[${label}] heartbeat: elapsed ${formatDuration(Date.now() - startedAt)}`,
      `last output ${formatDuration(Date.now() - lastOutputAt)} ago`,
      `last line: ${lastOutputLine === null ? '<none>' : JSON.stringify(lastOutputLine)}`,
    ];

    if (commandTimeoutMs !== null) {
      heartbeatParts.push(`timeout ${formatDuration(commandTimeoutMs)}`);
    }

    writeStatusLine(heartbeatParts.join('; '));
  }, HEARTBEAT_INTERVAL_MS);

  const timeoutTimer =
    commandTimeoutMs === null
      ? null
      : setTimeout(() => {
          timedOut = true;
          writeStatusLine(
            `[${label}] timeout: exceeded ${formatDuration(commandTimeoutMs)}; sending SIGTERM`,
            'stderr',
          );
          child.kill('SIGTERM');
          killGraceTimer = setTimeout(() => {
            writeStatusLine(
              `[${label}] timeout: process still running after ${formatDuration(
                KILL_GRACE_MS,
              )}; sending SIGKILL`,
              'stderr',
            );
            child.kill('SIGKILL');
          }, KILL_GRACE_MS);
        }, commandTimeoutMs);

  const cleanupTimers = () => {
    clearInterval(heartbeatTimer);

    if (timeoutTimer !== null) {
      clearTimeout(timeoutTimer);
    }

    if (killGraceTimer !== null) {
      clearTimeout(killGraceTimer);
    }
  };

  const onStdout = (chunk: Buffer) => {
    const text = chunk.toString();
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);
    lastOutputAt = Date.now();
    const completeLines = `${incompleteOutputLine}${text}`.split('\n');
    incompleteOutputLine = completeLines.pop() ?? '';
    const completedOutput = completeLines.join('\n');
    const latestLine = getLastMeaningfulLine(completedOutput);

    if (latestLine !== null) {
      lastOutputLine = latestLine;
    }

    if (verboseMode) {
      process.stdout.write(chunk);
    }
  };

  const onStderr = (chunk: Buffer) => {
    const text = chunk.toString();
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);
    lastOutputAt = Date.now();
    const completeLines = `${incompleteOutputLine}${text}`.split('\n');
    incompleteOutputLine = completeLines.pop() ?? '';
    const completedOutput = completeLines.join('\n');
    const latestLine = getLastMeaningfulLine(completedOutput);

    if (latestLine !== null) {
      lastOutputLine = latestLine;
    }

    if (verboseMode) {
      process.stderr.write(chunk);
    }
  };

  child.stdout?.on('data', onStdout);
  child.stderr?.on('data', onStderr);

  await new Promise<void>((resolve) => {
    child.once('error', (error) => {
      forwarder.cleanup();
      execState.spawnError = error;
      logStream.write(`\n[verify] spawn error: ${error.message}\n`);
      cleanupTimers();
      resolve();
    });

    child.once('close', (code, signal) => {
      forwarder.childClosed = true;
      forwarder.cleanup();
      cleanupTimers();

      if (timedOut) {
        exitCode = 124;
        const signalSuffix = signal ? `; process exited via ${signal}` : '';
        writeStatusLine(
          `[${label}] timeout: command failed after internal timeout${signalSuffix}`,
          'stderr',
        );
        resolve();
        return;
      }

      exitCode = code ?? 1;

      if (signal) {
        logStream.write(`\n[verify] process exited via signal ${signal}\n`);
      }

      const trailingLine = getLastMeaningfulLine(incompleteOutputLine);

      if (trailingLine !== null) {
        lastOutputLine = trailingLine;
      }

      resolve();
    });
  });

  await closeLogStream(logStream);

  if (execState.spawnError) {
    throw execState.spawnError;
  }

  const logOutput = fs.readFileSync(logPath, 'utf8');
  const warningSummary = getWarningSummary(label, logOutput);
  const { status, blockingLogIssue } = resolveCommandStatus(label, exitCode, logOutput);
  const durationMs = performance.now() - perfStartedAt;

  if (status === 'passed' && !warningSummary) {
    console.log(`[${label}] passed ✅`);
  } else if (status === 'passed' && warningSummary) {
    console.log(`[${label}] passed with warnings ⚠️`);
    console.log(`[${label}] warnings: ${warningSummary}`);
    console.log(`[${label}] full log: ${logPath}`);
  } else {
    console.log(`[${label}] failed ❌`);
    console.log(`[${label}] command: ${formattedCommand}`);
    console.log(`[${label}] exit code: ${exitCode}`);

    if (blockingLogIssue) {
      console.log(`[${label}] blocking log signal: ${blockingLogIssue.reason}`);
      console.log(`[${label}] warnings: ${blockingLogIssue.warningSummary}`);
    }

    console.log(`[${label}] output tail:`);

    for (const tailLine of getOutputTail(outputBuffer)) {
      console.log(`  ${tailLine}`);
    }

    console.log(`[${label}] full log: ${logPath}`);
  }

  return {
    label,
    command: formattedCommand,
    displayCommand,
    logPath,
    exitCode,
    status,
    stdout: '',
    stderr: '',
    hasWarnings: warningSummary.length > 0,
    warningSummary,
    blockingLogIssue,
    triggerReason: null,
    durationMs,
    terminatedBySignal: forwarder.terminatedBySignal,
    // Populated for expensive commands to support applyProcessResult.
    signal: forwarder.terminatedBySignal,
  };
}

interface SkippableEntry {
  label: string;
  command: string;
  reason?: string;
  triggerReason?: string | null;
}

function createSkippedResult(
  entry: SkippableEntry,
  reason: string = entry.reason ?? '',
): SkippedCommandResult {
  return {
    label: entry.label,
    command: entry.command,
    status: 'skipped',
    reason,
    exitCode: null,
    stdout: '',
    stderr: '',
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: null,
    triggerReason: entry.triggerReason ?? null,
  };
}

function createFailedResult(entry: FailedCommandEntry): InvalidCommandResult {
  const reason = entry.reason;

  return {
    label: entry.label,
    command: entry.command,
    displayCommand: entry.command,
    status: 'failed',
    reason,
    note: reason,
    exitCode: null,
    stdout: '',
    stderr: '',
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: null,
    triggerReason: entry.triggerReason ?? null,
  };
}

function addE2ECommands(commands: CommandEntry[], e2eCommand: RunCommandEntry): void {
  commands.push(createE2EInstallCommand());
  commands.push(e2eCommand);
}

function createE2EInstallCommand(reason?: string): SkippedCommandEntry {
  return {
    kind: 'skipped',
    label: 'e2e-install',
    command: 'pnpm e2e:host:install',
    reason: reason ?? 'browser install is not required; Playwright container provides browsers',
  };
}

function createE2ECommand(
  extraArgs: readonly string[] = [],
  note: string | null = null,
): RunCommandEntry {
  return {
    kind: 'run',
    label: 'e2e',
    command: 'pnpm',
    args: ['e2e:container', ...extraArgs],
    weight: classifyCommandWeight({ label: 'e2e' }),
    note,
    triggerReason: note,
  };
}

function createStorybookBehaviorCommand(
  extraArgs: readonly string[] = [],
  note: string | null = null,
): RunCommandEntry {
  return {
    kind: 'run',
    label: 'storybook-behavior',
    command: 'pnpm',
    args: ['test:storybook-behavior', ...extraArgs],
    weight: classifyCommandWeight({ label: 'storybook-behavior' }),
    note,
    triggerReason: note,
  };
}

/**
 * Add the `release-smoke` and/or `managed-updates-e2e` production-artifact
 * E2E leaves when a focused structural E2E plan selects a
 * `productionArtifact/` target under their owner (see
 * docs/testing/verify-redesign-pass-d-implementation.md's "Production-artifact
 * E2E execution boundary"). Reuses the exact same leaf commands
 * `addReleaseOnlyCommands` uses purely behind `--full`; this only adds
 * default/`--only e2e` relevance without requiring `--full`. Never called
 * from the `fullMode` branch of the e2e command block, so a selected
 * productionArtifact spec is never duplicated against
 * `addReleaseOnlyCommands`'s own unconditional `--full` leaves.
 * @param commands Command list to push into.
 * @param options Build options.
 * @param options.structuralE2EPlan A focused structural E2E plan.
 */
function addProductionArtifactE2ECommands(
  commands: CommandEntry[],
  { structuralE2EPlan }: { structuralE2EPlan: Extract<StructuralE2EPlan, { mode: 'focused' }> },
): void {
  if (structuralE2EPlan.releaseSmokeSelected) {
    commands.push({
      kind: 'run',
      label: 'release-smoke',
      command: 'pnpm',
      args: ['e2e:release', '--label', 'release-smoke', RELEASE_SMOKE_SPEC],
      weight: classifyCommandWeight({ label: 'release-smoke' }),
      triggerReason: structuralE2EPlan.reasons.join('; '),
    });
  }

  if (structuralE2EPlan.managedUpdatesE2ESelected) {
    commands.push({
      kind: 'run',
      label: 'managed-updates-e2e',
      command: 'node',
      args: ['scripts/release/managedUpdatesProof.ts', '--kind', 'e2e'],
      weight: classifyCommandWeight({ label: 'managed-updates-e2e' }),
      triggerReason: structuralE2EPlan.reasons.join('; '),
    });
  }
}

function addReleaseOnlyCommands(commands: CommandEntry[]): void {
  commands.push({
    kind: 'run',
    label: 'release-version',
    command: 'node',
    args: ['scripts/release/validateVersion.mjs'],
    weight: classifyCommandWeight({ label: 'release-version' }),
  });

  commands.push({
    kind: 'run',
    label: 'release-config',
    command: 'node',
    args: ['scripts/release/validateReleaseConfig.mjs'],
    weight: classifyCommandWeight({ label: 'release-config' }),
  });

  commands.push({
    kind: 'run',
    label: 'build',
    command: 'node',
    args: ['scripts/release/buildArtifact.mjs'],
    weight: classifyCommandWeight({ label: 'build' }),
  });

  commands.push({
    kind: 'run',
    label: 'publisher-node-import',
    command: 'node',
    args: ['scripts/release/publisherWireContractImportProof.mjs'],
    weight: classifyCommandWeight({ label: 'publisher-node-import' }),
  });

  commands.push({
    kind: 'run',
    label: 'artifact-static',
    command: 'node',
    args: ['scripts/release/productionArtifactStaticProof.ts'],
    weight: classifyCommandWeight({ label: 'artifact-static' }),
  });

  commands.push({
    kind: 'run',
    label: 'release-smoke',
    command: 'pnpm',
    args: ['e2e:release', '--label', 'release-smoke', RELEASE_SMOKE_SPEC],
    weight: classifyCommandWeight({ label: 'release-smoke' }),
  });

  commands.push({
    kind: 'run',
    label: 'managed-updates-static',
    command: 'node',
    args: ['scripts/release/managedUpdatesControllerArtifactIdentityProof.ts'],
    weight: classifyCommandWeight({ label: 'managed-updates-static' }),
  });

  commands.push({
    kind: 'run',
    label: 'managed-updates-e2e',
    command: 'node',
    args: ['scripts/release/managedUpdatesProof.ts', '--kind', 'e2e'],
    weight: classifyCommandWeight({ label: 'managed-updates-e2e' }),
  });
}

/**
 * Add the release-sensitive `static` leaves (`release-version`,
 * `release-config`, `build`, `publisher-node-import`, `artifact-static`,
 * `managed-updates-static`) that are relevant outside literal `--full`,
 * using {@link resolveReleaseStaticPlan}'s explicit file capability/
 * configuration ownership (see
 * docs/testing/verify-redesign-final-review-correction.md's "Decision 1").
 * Reuses the exact same leaf commands `addReleaseOnlyCommands` uses purely
 * behind `--full`; this only adds default/`--only static` relevance without
 * requiring `--full`. Never called from the `fullMode` branch, so a leaf is
 * never duplicated against `addReleaseOnlyCommands`'s own unconditional
 * `--full` leaves.
 * @param commands Command list to push into.
 * @param plan Resolved release-sensitive static plan.
 */
function addReleaseStaticCommands(commands: CommandEntry[], plan: ReleaseStaticPlan): void {
  const triggerReason = plan.reasons.join('; ');

  if (plan.releaseVersion) {
    commands.push({
      kind: 'run',
      label: 'release-version',
      command: 'node',
      args: ['scripts/release/validateVersion.mjs'],
      weight: classifyCommandWeight({ label: 'release-version' }),
      triggerReason,
    });
  }

  if (plan.releaseConfig) {
    commands.push({
      kind: 'run',
      label: 'release-config',
      command: 'node',
      args: ['scripts/release/validateReleaseConfig.mjs'],
      weight: classifyCommandWeight({ label: 'release-config' }),
      triggerReason,
    });
  }

  if (plan.build) {
    commands.push({
      kind: 'run',
      label: 'build',
      command: 'node',
      args: ['scripts/release/buildArtifact.mjs'],
      weight: classifyCommandWeight({ label: 'build' }),
      triggerReason,
    });
  }

  if (plan.publisherNodeImport) {
    commands.push({
      kind: 'run',
      label: 'publisher-node-import',
      command: 'node',
      args: ['scripts/release/publisherWireContractImportProof.mjs'],
      weight: classifyCommandWeight({ label: 'publisher-node-import' }),
      triggerReason,
    });
  }

  if (plan.artifactStatic) {
    commands.push({
      kind: 'run',
      label: 'artifact-static',
      command: 'node',
      args: ['scripts/release/productionArtifactStaticProof.ts'],
      weight: classifyCommandWeight({ label: 'artifact-static' }),
      triggerReason,
    });
  }

  if (plan.managedUpdatesStatic) {
    commands.push({
      kind: 'run',
      label: 'managed-updates-static',
      command: 'node',
      args: ['scripts/release/managedUpdatesControllerArtifactIdentityProof.ts'],
      weight: classifyCommandWeight({ label: 'managed-updates-static' }),
      triggerReason,
    });
  }
}

/**
 * Add the two browser-integration managed-update leaves (`artifact`,
 * `managed-updates-browser-integration`) when they are relevant, using
 * {@link resolveBrowserIntegrationPlan}'s owner-local path-based planning
 * (see docs/testing/verify-redesign-pass-c-implementation.md's
 * "Browser-integration type-local planning"). Literal `--full` also goes
 * through the same resolver (via its `fullMode` option) instead of
 * constructing a literal plan directly, so exceptional membership validation
 * runs before every execution boundary, including literal `--full` (see
 * docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
 * "Make releaseProofInventory.ts the sole exceptional membership owner and
 * validate every execution path").
 * @param commands Command list to push into.
 * @param options Build options.
 * @param options.fullMode Full-project release mode.
 * @param options.changedFiles Sorted unique list of repository-relative changed file paths.
 */
function addBrowserIntegrationCommands(
  commands: CommandEntry[],
  {
    fullMode,
    changedFiles,
    packageJsonOldRef,
  }: { fullMode: boolean; changedFiles: readonly string[]; packageJsonOldRef: string | null },
): void {
  const plan: BrowserIntegrationPlan = resolveBrowserIntegrationPlan(changedFiles, {
    packageJsonOldRef,
    fullMode,
  });

  if (plan.mode === 'invalid') {
    commands.push({
      kind: 'failed',
      label: 'artifact',
      command: 'pnpm e2e:release',
      reason: `invalid appUpdate browser-integration exceptional inventory state: ${plan.reasons.join('; ')}`,
    });
    commands.push({
      kind: 'failed',
      label: 'managed-updates-browser-integration',
      command: 'node scripts/release/managedUpdatesProof.ts --kind browser-integration',
      reason: `invalid appUpdate browser-integration exceptional inventory state: ${plan.reasons.join('; ')}`,
    });
    return;
  }

  if (plan.artifact) {
    commands.push({
      kind: 'run',
      label: 'artifact',
      command: 'pnpm',
      args: ['e2e:release', '--label', 'artifact', PRODUCTION_ARTIFACT_SMOKE_SPEC],
      weight: classifyCommandWeight({ label: 'artifact' }),
      triggerReason: plan.reasons.join('; '),
    });
  }

  if (plan.managedUpdates) {
    commands.push({
      kind: 'run',
      label: 'managed-updates-browser-integration',
      command: 'node',
      args: ['scripts/release/managedUpdatesProof.ts', '--kind', 'browser-integration'],
      weight: classifyCommandWeight({ label: 'managed-updates-browser-integration' }),
      triggerReason: plan.reasons.join('; '),
    });
  }
}

/**
 * Add the generic owner-local `browser-integration-local` leaf when relevant
 * (see docs/testing/verify-redesign-pass-d-implementation.md's "Generic
 * owner-local browser-integration execution"). Reuses
 * {@link resolveGenericBrowserIntegrationPlan}'s path-based planning outside
 * full mode; `--full` runs the complete current generic inventory
 * unconditionally. Always passes an explicit spec list — never a bare
 * `pnpm test:browser-integration` invocation — so this generic leaf can
 * never accidentally sweep in the appUpdate managed-update corpus that also
 * matches `playwright.browserIntegration.config.ts`'s broad `src/**` testMatch.
 * @param commands Command list to push into.
 * @param options Build options.
 * @param options.fullMode Full-project release mode.
 * @param options.changedFiles Sorted unique list of repository-relative changed file paths.
 */
function addGenericBrowserIntegrationCommands(
  commands: CommandEntry[],
  { fullMode, changedFiles }: { fullMode: boolean; changedFiles: readonly string[] },
): void {
  const plan: GenericBrowserIntegrationPlan = fullMode
    ? {
        mode: 'full',
        specs: listGenericBrowserIntegrationSpecs(),
        reasons: ['full-project release verification'],
      }
    : resolveGenericBrowserIntegrationPlan(changedFiles);

  if (plan.mode === 'skip' || plan.specs.length === 0) {
    return;
  }

  commands.push({
    kind: 'run',
    label: 'browser-integration-local',
    command: 'pnpm',
    args: ['test:browser-integration', ...plan.specs],
    weight: classifyCommandWeight({ label: 'browser-integration-local' }),
    triggerReason: plan.reasons.join('; '),
  });
}

type BuildCommandsVisualPlan = VisualPlan | { mode: 'invalid'; specs: string[]; reasons: string[] };

/** Options for {@link buildCommands}. */
export interface BuildCommandsOptions {
  /** Full-project release mode; defaults to the `--full` CLI flag. */
  fullMode?: boolean;
  /**
   * Resolved `--only` verification type; defaults to the CLI-resolved value.
   * Gates whether the expensive structural E2E graph/Playwright-ownership
   * acquisition runs at all (see docs/testing/verify-redesign-pass-d-implementation.md's
   * "Do not acquire the graph or Playwright E2E owner inventory for a
   * `--only <non-e2e-type>` invocation"): only relevant when `null` (default,
   * every type) or `'e2e'`.
   */
  onlyType?: VerificationType | null;
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only visual impact refinement. Pass `null` when no reliable base
   * ref is known; that fails closed to visual-relevant.
   */
  packageJsonOldRef?: string | null;
  fixMode?: FixMode;
  structuralE2EPlan?: StructuralE2EPlan | null;
  e2eTargetTreeValidation?: E2ETargetTreeValidation | null;
  projectApplicabilityValidation?: E2EProjectApplicabilityValidation | null;
  storybookBehaviorPlan?: StorybookBehaviorPlan | null;
  storybookBuildPlan?: StorybookBuildPlan | null;
  visualPlan?: BuildCommandsVisualPlan | null;
  /**
   * Resolved changed-path scope input (`git-diff` with per-path add/modify/
   * delete/rename status, or `explicit-files`) the unit planner classifies.
   * Defaults to treating `changedFiles` as an `explicit-files` scope when
   * omitted, matching direct `--files`/test-call usage; `main()` passes the
   * real status-aware scope input resolved by `resolveVerifyChangedPathContext`.
   */
  changedPathsInput?: ChangedPathsScopeInput | null;
  /** Resolved unit affected plan; defaults to {@link resolveUnitPlan} over `changedPathsInput`. */
  unitPlan?: UnitPlan | null;
  /** Resolved mutation affected plan; defaults to {@link resolveMutationPlan} over `changedFiles`. */
  mutationPlan?: MutationPlan | null;
  /**
   * Internal GitHub Actions duplicate-build avoidance for a focused `static`
   * type invocation only (see `.github/workflows/verify.yml`):
   * storybook-behavior and visual run as separate self-contained CI jobs
   * that build their own Storybook when selected, so this narrows the
   * `storybook-build` trigger to the ordinary storybook-build plan alone,
   * skipping whenever a self-contained browser lane will already supply the
   * equivalent static-build prerequisite. Has no effect on any other label
   * and does not change `--full` or the ordinary (non-GitHub-focused-static)
   * reuse-aware trigger. There is no public CLI flag or persisted field for
   * this (see docs/testing/verify-redesign-pass-b-implementation.md's
   * "Storybook CI fallback"); `main()` derives it from the resolved
   * invocation as `profile === 'github-actions' && onlyType === 'static'`.
   * Defaults to `false`.
   */
  storybookBuildCiFallback?: boolean;
  /**
   * Storybook behavior stability repeat count from `--repeat`. Applies only
   * to a runnable `storybook-behavior` command: appends the equivalent
   * Playwright repeated-execution argument (`--repeat-each`) to that
   * command's args. Has no effect on any other label. Null for an ordinary
   * invocation.
   */
  repeat?: number | null;
}

/**
 * Build the verify command list for a given changed-file set.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Build options.
 * @returns Command entries in run order.
 */
export function buildCommands(
  changedFiles: readonly string[],
  {
    fullMode = isFullMode,
    onlyType = cliOnlyType,
    packageJsonOldRef = null,
    fixMode = currentVerifyInvocation?.fixMode ?? 'none',
    structuralE2EPlan: structuralE2EPlanOverride = null,
    e2eTargetTreeValidation: e2eTargetTreeValidationOverride = null,
    projectApplicabilityValidation: projectApplicabilityValidationOverride = null,
    storybookBehaviorPlan: storybookBehaviorPlanOverride = null,
    storybookBuildPlan: storybookBuildPlanOverride = null,
    visualPlan: visualPlanOverride = null,
    storybookBuildCiFallback = false,
    repeat = currentVerifyInvocation?.repeat ?? null,
    changedPathsInput: changedPathsInputOverride = null,
    unitPlan: unitPlanOverride = null,
    mutationPlan: mutationPlanOverride = null,
  }: BuildCommandsOptions = {},
): CommandEntry[] {
  const applyFixers = fixMode === 'fix' || fixMode === 'fix-only';
  const fixOnlyMode = fixMode === 'fix-only';
  const existingChangedFiles = changedFiles.filter(fileExists);
  const formatLintFiles = existingChangedFiles.filter((filePath) => !isFormatLintIgnored(filePath));
  const formattableFiles = formatLintFiles.filter((filePath) =>
    FORMATTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const lintableFiles = formatLintFiles.filter((filePath) =>
    LINTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const commands: CommandEntry[] = [];
  const eslintConcurrency = resolveEslintConcurrency();

  commands.push({
    kind: 'run',
    label: 'agent-environment',
    command: 'node',
    args: ['scripts/agentEnvironment.mjs', applyFixers ? '--fix' : '--check'],
  });

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', ...(applyFixers ? [] : ['--check']), '.'],
    });
  } else if (formattableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', ...(applyFixers ? [] : ['--check']), ...formattableFiles],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'format',
      command: `pnpm exec oxfmt${applyFixers ? '' : ' --check'}`,
      reason: 'no changed formattable existing files',
    });
  }

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'oxlint',
      command: 'pnpm',
      args: ['exec', 'oxlint', ...(applyFixers ? ['--fix'] : []), '.'],
      weight: classifyCommandWeight({ label: 'oxlint', isFullRepo: true }),
    });
    commands.push({
      kind: 'run',
      label: 'eslint',
      command: 'pnpm',
      args: [
        'exec',
        'eslint',
        '--cache',
        ...(applyFixers ? ['--fix'] : []),
        `--concurrency=${eslintConcurrency}`,
        '.',
      ],
      weight: classifyCommandWeight({ label: 'eslint', isFullRepo: true }),
    });
  } else if (lintableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'oxlint',
      command: 'pnpm',
      args: ['exec', 'oxlint', ...(applyFixers ? ['--fix'] : []), ...lintableFiles],
      weight: classifyCommandWeight({ label: 'oxlint', fileCount: lintableFiles.length }),
    });
    commands.push({
      kind: 'run',
      label: 'eslint',
      command: 'pnpm',
      args: [
        'exec',
        'eslint',
        '--cache',
        ...(applyFixers ? ['--fix'] : []),
        `--concurrency=${eslintConcurrency}`,
        ...lintableFiles,
      ],
      weight: classifyCommandWeight({ label: 'eslint', fileCount: lintableFiles.length }),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'oxlint',
      command: `pnpm exec oxlint${applyFixers ? ' --fix' : ''}`,
      reason: 'no changed lintable existing files',
    });
    commands.push({
      kind: 'skipped',
      label: 'eslint',
      command: `pnpm exec eslint --cache${applyFixers ? ' --fix' : ''} --concurrency=${eslintConcurrency}`,
      reason: 'no changed lintable existing files',
    });
  }

  if (fixOnlyMode) {
    return commands.map(withVerificationType);
  }

  // No non-static proof planner/validator is resolved before this point:
  // `--fix-only` constructs and returns its fixer-only command plan above
  // without invoking any of the planners/validators below (see
  // docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
  // "Make --fix-only return before all proof planning").
  const unitPlan: UnitPlan =
    unitPlanOverride ??
    (fullMode
      ? { mode: 'skip', reasons: ['full mode runs the complete unit type unconditionally'] }
      : resolveUnitPlan(
          changedPathsInputOverride ?? { kind: 'explicit-files', files: [...changedFiles] },
          {
            packageJsonOldRef,
          },
        ));
  // Expensive structural E2E graph/Playwright-ownership acquisition only
  // runs when e2e is actually relevant to this invocation (default, or
  // `--only e2e`); see docs/testing/verify-redesign-pass-d-implementation.md's
  // "Do not acquire the graph or Playwright E2E owner inventory for a
  // `--only <non-e2e-type>` invocation". The placeholder plan below is never
  // observed in a final `--only <non-e2e-type>` result: selectOnlyCommands
  // filters every `e2e`-typed entry out for any other type.
  //
  // A second, cheap gate applies even when e2e IS the relevant type for this
  // invocation (default or `--only e2e`): `--fix-only` never needs E2E
  // acquisition at all (already returned above), and a changed-path set that
  // {@link canChangedPathsAffectE2E} can cheaply prove E2E-irrelevant skips
  // acquisition too (see
  // docs/testing/verify-redesign-final-review-correction.md's "Decision 6").
  // The classifier is conservative (false positives acquire; false
  // negatives never happen), and literal `--full` always acquires
  // unconditionally regardless of the classifier, since it must still
  // perform complete structural validation.
  const needsStructuralE2EPlanning =
    (onlyType === null || onlyType === 'e2e') &&
    (fullMode || canChangedPathsAffectE2E(changedFiles, { packageJsonOldRef }));
  const structuralE2EPlan: StructuralE2EPlan =
    structuralE2EPlanOverride ??
    (needsStructuralE2EPlanning
      ? resolveStructuralE2EPlan(changedFiles, { packageJsonOldRef })
      : { mode: 'skip', reasons: ['e2e planning not needed for this invocation'] });
  // Structural target-tree/project-applicability validation is real
  // filesystem/registry inspection, not merely expensive
  // Playwright/dependency-cruiser acquisition, so it is gated behind the same
  // E2E relevance decision as `structuralE2EPlan` above rather than resolved
  // unconditionally (see
  // docs/testing/verify-redesign-final-review-architecture-revision.md's "E2E
  // relevance gate"): an E2E-irrelevant invocation (docs-only default, or
  // `--only <non-e2e>`) must not fail on unrelated `tests/e2e/**` structural
  // drift it never selected. Literal `--full` and every E2E-relevant scope
  // still retain complete validation, matching `needsStructuralE2EPlanning`.
  const e2eTargetTreeValidation: E2ETargetTreeValidation =
    e2eTargetTreeValidationOverride ??
    (needsStructuralE2EPlanning
      ? validateE2ETargetTree()
      : { valid: true, errors: [], targetPaths: [] });
  const projectApplicabilityValidation: E2EProjectApplicabilityValidation =
    projectApplicabilityValidationOverride ??
    (needsStructuralE2EPlanning ? validateE2EProjectApplicability() : { valid: true, errors: [] });
  const storybookBehaviorPlan =
    storybookBehaviorPlanOverride ??
    resolveStorybookBehaviorPlan(changedFiles, { packageJsonOldRef });
  const storybookBuildPlan =
    storybookBuildPlanOverride ?? resolveStorybookBuildPlan(changedFiles, { packageJsonOldRef });
  // Skip resolution in full mode: the full-mode branch below always runs the
  // complete visual lane unconditionally and does not consult the plan.
  const visualPlan: BuildCommandsVisualPlan | null =
    visualPlanOverride ??
    (fullMode ? null : resolveVisualPlan(changedFiles, { packageJsonOldRef }));
  // Deleted/renamed-away mutation infrastructure (e.g. `stryker.config.mjs`)
  // must still be classified: passes the status-preserving `changedFiles`
  // projection, not the filesystem-existence-filtered
  // `existingChangedFiles`, so a removed registered path is never erased
  // before mutation impact classification (see
  // docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
  // "Preserve deleted/renamed mutation infrastructure impact").
  const mutationPlan: MutationPlan =
    mutationPlanOverride ?? resolveMutationPlan(changedFiles, { packageJsonOldRef });
  const releaseStaticPlan: ReleaseStaticPlan = fullMode
    ? {
        mode: 'skip',
        releaseVersion: false,
        releaseConfig: false,
        build: false,
        publisherNodeImport: false,
        artifactStatic: false,
        managedUpdatesStatic: false,
        reasons: ['full mode runs the complete static type unconditionally'],
      }
    : resolveReleaseStaticPlan(changedFiles, { packageJsonOldRef });

  if (fullMode || changedFiles.some(isTypeCheckTarget)) {
    commands.push({
      kind: 'run',
      label: 'type-check',
      command: 'pnpm',
      args: ['type-check'],
      weight: classifyCommandWeight({ label: 'type-check' }),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'type-check',
      command: 'pnpm type-check',
      reason: 'no type-check relevant changes',
    });
  }

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'unit-tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', '--reporter=verbose'],
      weight: classifyCommandWeight({ label: 'unit-tests', isFullRepo: true }),
    });
  } else if (unitPlan.mode === 'skip') {
    commands.push({
      kind: 'skipped',
      label: 'unit-tests',
      command: 'pnpm exec vitest run',
      reason: 'empty focused unit-test scope',
    });
  } else if (unitPlan.mode === 'full') {
    commands.push({
      kind: 'run',
      label: 'unit-tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', '--reporter=verbose'],
      weight: classifyCommandWeight({ label: 'unit-tests', isFullRepo: true }),
      triggerReason: unitPlan.reasons.join('; '),
    });
  } else if (unitPlan.strategy === 'changed') {
    commands.push({
      kind: 'run',
      label: 'unit-tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', '--reporter=verbose', '--changed', unitPlan.baseRef],
      weight: classifyCommandWeight({ label: 'unit-tests' }),
      triggerReason: unitPlan.reasons.join('; '),
    });
  } else {
    if (unitPlan.directTests.length > 0) {
      commands.push({
        kind: 'run',
        label: 'unit-tests',
        command: 'pnpm',
        args: ['exec', 'vitest', 'run', '--reporter=verbose', ...unitPlan.directTests],
        weight: classifyCommandWeight({
          label: 'unit-tests',
          fileCount: unitPlan.directTests.length,
        }),
        triggerReason: unitPlan.reasons.join('; '),
      });
    }

    if (unitPlan.relatedPaths.length > 0) {
      commands.push({
        kind: 'run',
        label: 'unit-related',
        command: 'pnpm',
        args: [
          'exec',
          'vitest',
          'related',
          '--run',
          '--reporter=verbose',
          ...unitPlan.relatedPaths,
        ],
        weight: classifyCommandWeight({
          label: 'unit-related',
          fileCount: unitPlan.relatedPaths.length,
        }),
        triggerReason: unitPlan.reasons.join('; '),
      });
    }
  }

  const e2eInvalidReasons = [
    ...(structuralE2EPlan.mode === 'invalid' ? structuralE2EPlan.reasons : []),
    ...(e2eTargetTreeValidation.valid ? [] : e2eTargetTreeValidation.errors),
    ...(projectApplicabilityValidation.valid ? [] : projectApplicabilityValidation.errors),
  ];

  if (e2eInvalidReasons.length > 0) {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: `invalid target E2E ownership state: ${e2eInvalidReasons.join('; ')}`,
    });
  } else if (fullMode) {
    addE2ECommands(commands, createE2ECommand([], 'full-project release verification'));
  } else if (structuralE2EPlan.mode === 'full') {
    addE2ECommands(commands, createE2ECommand([], structuralE2EPlan.reasons.join('; ')));
    addProductionArtifactE2ECommands(commands, {
      structuralE2EPlan: {
        mode: 'focused',
        ordinarySpecs: [],
        releaseSmokeSelected: true,
        managedUpdatesE2ESelected: true,
        reasons: structuralE2EPlan.reasons,
      },
    });
  } else if (structuralE2EPlan.mode === 'focused') {
    if (structuralE2EPlan.ordinarySpecs.length > 0) {
      addE2ECommands(
        commands,
        createE2ECommand(structuralE2EPlan.ordinarySpecs, structuralE2EPlan.reasons.join('; ')),
      );
    } else {
      commands.push(createE2EInstallCommand('no ordinary target E2E specs selected'));
      commands.push({
        kind: 'skipped',
        label: 'e2e',
        command: 'pnpm e2e:container',
        reason: 'no ordinary target E2E specs selected',
      });
    }

    addProductionArtifactE2ECommands(commands, { structuralE2EPlan });
  } else {
    commands.push(createE2EInstallCommand('empty e2e scope'));
    commands.push({
      kind: 'skipped',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: 'empty e2e scope',
    });
  }

  // storybook-build is its own `static` proof leaf (see
  // VERIFICATION_TYPE_BY_LABEL). Locally, storybook-behavior and visual may
  // reuse its successful build artifact as an execution optimization instead
  // of rebuilding, so schedule it before either lane so a successful build
  // result is already available in `results` (see `getExtraEnvForEntry`)
  // when they run; this reuse does not change or merge proof ownership.
  // Derive the requirement from the three existing plans only: no separate
  // impact registry. `invalid` behavior/visual plans fail closed on their
  // own lane below and must not, by themselves, force an otherwise-unneeded
  // build.
  // In GitHub Actions, storybook-behavior and visual are separate
  // self-contained jobs that never reuse this lane's output (see
  // `storybookBuildCiFallback` below), so this reuse-aware trigger applies
  // only to `--full` and to the ordinary (non-GitHub-focused-static) case,
  // i.e. when `storybookBuildCiFallback` is false.
  const storybookBehaviorNeedsStaticBuild =
    storybookBehaviorPlan.mode === 'full' || storybookBehaviorPlan.mode === 'focused';
  const visualNeedsStaticBuild =
    visualPlan !== null && (visualPlan.mode === 'full' || visualPlan.mode === 'focused');
  const storybookStaticBuildReasons = [
    ...(storybookBuildPlan.mode === 'full' ? storybookBuildPlan.reasons : []),
    ...(storybookBehaviorNeedsStaticBuild
      ? [
          `storybook-behavior lane requires a Storybook static build (${storybookBehaviorPlan.reasons.join('; ')})`,
        ]
      : []),
    ...(visualNeedsStaticBuild
      ? [`visual lane requires a Storybook static build (${visualPlan.reasons.join('; ')})`]
      : []),
  ];

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'storybook-build',
      command: 'pnpm',
      args: ['storybook:build'],
      weight: classifyCommandWeight({ label: 'storybook-build' }),
      triggerReason: 'full-project release verification',
    });
  } else if (storybookBuildCiFallback) {
    // Narrow CI-only fallback contract: fires only for the ordinary
    // storybook-build plan, and only when neither self-contained browser
    // lane will already build an equivalent static Storybook output.
    if (
      storybookBuildPlan.mode === 'full' &&
      !storybookBehaviorNeedsStaticBuild &&
      !visualNeedsStaticBuild
    ) {
      commands.push({
        kind: 'run',
        label: 'storybook-build',
        command: 'pnpm',
        args: ['storybook:build'],
        weight: classifyCommandWeight({ label: 'storybook-build' }),
        triggerReason: storybookBuildPlan.reasons.join('; '),
      });
    } else {
      commands.push({
        kind: 'skipped',
        label: 'storybook-build',
        command: 'pnpm storybook:build',
        reason:
          storybookBehaviorNeedsStaticBuild || visualNeedsStaticBuild
            ? 'CI fallback: a self-contained Storybook browser lane already supplies the static build prerequisite'
            : 'no storybook-relevant changes',
      });
    }
  } else if (storybookStaticBuildReasons.length > 0) {
    commands.push({
      kind: 'run',
      label: 'storybook-build',
      command: 'pnpm',
      args: ['storybook:build'],
      weight: classifyCommandWeight({ label: 'storybook-build' }),
      triggerReason: storybookStaticBuildReasons.join('; '),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'storybook-build',
      command: 'pnpm storybook:build',
      reason: 'no storybook-relevant changes',
    });
  }

  let storybookBehaviorEntry: CommandEntry;

  if (fullMode) {
    storybookBehaviorEntry = createStorybookBehaviorCommand(
      [],
      'full-project release verification',
    );
  } else if (storybookBehaviorPlan.mode === 'full') {
    storybookBehaviorEntry = createStorybookBehaviorCommand(
      [],
      storybookBehaviorPlan.reasons.join('; '),
    );
  } else if (storybookBehaviorPlan.mode === 'focused') {
    storybookBehaviorEntry = createStorybookBehaviorCommand(
      storybookBehaviorPlan.specs,
      storybookBehaviorPlan.reasons.join('; '),
    );
  } else {
    storybookBehaviorEntry = {
      kind: 'skipped',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: 'empty storybook behavior scope',
    };
  }

  // Narrow repeated-execution stability contract (`--repeat`): only ever
  // resolved for `--only behavior --files ...` (see
  // resolveVerifyInvocation's assertModeCombination), so it applies only to
  // this runnable entry and never to another label's command.
  if (repeat !== null && storybookBehaviorEntry.kind === 'run') {
    storybookBehaviorEntry = {
      ...storybookBehaviorEntry,
      args: [...storybookBehaviorEntry.args, '--repeat-each', String(repeat)],
    };
  }

  commands.push(storybookBehaviorEntry);

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'visual',
      command: 'pnpm',
      args: ['test:visual'],
      weight: classifyCommandWeight({ label: 'visual' }),
      triggerReason: 'full-project release verification',
    });
  } else if (visualPlan === null) {
    commands.push({
      kind: 'skipped',
      label: 'visual',
      command: 'pnpm test:visual',
      reason: 'empty visual scope',
    });
  } else if (visualPlan.mode === 'invalid') {
    commands.push({
      kind: 'failed',
      label: 'visual',
      command: 'pnpm test:visual',
      reason: `invalid visual impact plan: ${visualPlan.reasons.join('; ')}`,
    });
  } else if (visualPlan.mode === 'full') {
    commands.push({
      kind: 'run',
      label: 'visual',
      command: 'pnpm',
      args: ['test:visual'],
      weight: classifyCommandWeight({ label: 'visual' }),
      triggerReason: visualPlan.reasons.join('; '),
    });
  } else if (visualPlan.mode === 'focused') {
    commands.push({
      kind: 'run',
      label: 'visual',
      command: 'pnpm',
      args: ['test:visual', ...visualPlan.specs],
      weight: classifyCommandWeight({ label: 'visual' }),
      triggerReason: visualPlan.reasons.join('; '),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'visual',
      command: 'pnpm test:visual',
      reason: 'empty visual scope',
    });
  }

  // Literal full mode runs the complete registered mutation inventory
  // already registered in stryker.config.mjs, with no affected `-m` override.
  // Focused/default mode selects only from the explicit registry (see
  // docs/testing/verify-redesign-pass-e-implementation.md's "Architecture
  // decision — mutation"): a registered target's exact source or owning
  // test changed, or a mutation registry/infrastructure change selects the
  // complete registered inventory. Invalid registry state fails closed
  // before any Stryker execution.
  if (mutationPlan.mode === 'invalid') {
    // Registry structural invalidity must fail before any Stryker child
    // execution in every mode, including literal --full: check this before
    // fullMode so an invalid registry can never reach the unconditional full
    // `pnpm exec stryker run` below (see
    // docs/testing/verify-redesign-pass-e-correction.md's "B3").
    commands.push({
      kind: 'failed',
      label: 'mutation',
      command: 'pnpm exec stryker run',
      reason: `invalid mutation registry state: ${mutationPlan.reasons.join('; ')}`,
    });
  } else if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'mutation',
      command: 'pnpm',
      args: ['exec', 'stryker', 'run'],
      weight: classifyCommandWeight({ label: 'mutation' }),
      triggerReason: 'full-project release verification',
    });
  } else if (mutationPlan.mode === 'focused' || mutationPlan.mode === 'full') {
    commands.push({
      kind: 'run',
      label: 'mutation',
      command: 'pnpm',
      args: ['exec', 'stryker', 'run', '-m', mutationPlan.sources.join(',')],
      weight: classifyCommandWeight({ label: 'mutation' }),
      triggerReason: mutationPlan.reasons.join('; '),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'mutation',
      command: 'pnpm exec stryker run -m <source file>',
      reason: 'empty mutation scope',
    });
  }

  if (fullMode) {
    addReleaseOnlyCommands(commands);
  } else {
    addReleaseStaticCommands(commands, releaseStaticPlan);
  }

  addBrowserIntegrationCommands(commands, { fullMode, changedFiles, packageJsonOldRef });
  addGenericBrowserIntegrationCommands(commands, { fullMode, changedFiles });

  return commands.map(withVerificationType);
}

/**
 * Select the planned command entries for a resolved `--only` verification
 * type. Selects every proof leaf owned by that type, plus the `e2e-install`
 * pure execution prerequisite when `e2e` is selected (see
 * docs/testing/verify-redesign-pass-b-implementation.md's "Type selection");
 * no other type ever selects a leaf owned by another type. An empty
 * selection — for example `--only performance`, which currently has no
 * persistent proof inventory — is a valid, non-failing outcome, not an
 * error.
 * @param commands Full planned command list.
 * @param [onlyType] Resolved `--only` verification type, or `null` for no narrowing.
 * @returns The selected command entries, in their original planned order.
 */
export function selectOnlyCommands(
  commands: readonly CommandEntry[],
  onlyType: VerificationType | null = cliOnlyType,
): CommandEntry[] {
  if (onlyType === null) {
    return [...commands];
  }

  return commands.filter(
    (entry) =>
      entry.verificationType === onlyType || (onlyType === 'e2e' && entry.label === 'e2e-install'),
  );
}

/**
 * Build a supported read-only verify command from the resolved invocation.
 * @param invocation Resolved verify invocation.
 * @param [overrides] Optional profile and type overrides.
 * @returns Canonical shell-safe pnpm verify command.
 */
export function getVerifyRerunCommand(
  invocation: VerifyInvocation,
  overrides: Parameters<typeof formatVerifyInvocationCommand>[1] = {},
): string {
  return formatVerifyInvocationCommand(invocation, {
    ...overrides,
    readOnly: true,
  });
}

/** Options for {@link getActionRequired}. */
export interface GetActionRequiredOptions {
  /** Pending GitHub Actions profile risk details. */
  ciProfileRisk?: CiProfileRisk | null;
  /** Resolved verify invocation. */
  invocation?: VerifyInvocation | null;
}

/**
 * Build the `action required` lines for the verify summary.
 * @param results Collected command results in run order.
 * @param [options] Summary options.
 * @returns Action lines; `['None.']` when nothing failed or warned.
 */
export function getActionRequired(
  results: readonly CommandResult[],
  options: GetActionRequiredOptions = {},
): string[] {
  const { ciProfileRisk = null, invocation = currentVerifyInvocation } = options;

  if (invocation === null) {
    throw new Error('getActionRequired requires a resolved verify invocation.');
  }

  const actions: string[] = [];
  const fullMode = invocation.scope.kind === 'full';
  const failedResults = results.filter(
    (result): result is ExecutedCommandResult | InvalidCommandResult => result.status === 'failed',
  );
  const warningResults = results.filter(
    (result) => result.status !== 'failed' && result.hasWarnings,
  );

  // A full invocation can never be reformatted as `--full --only <type>` (see
  // docs/testing/verify-redesign-pass-b-implementation.md's "Rerun/status
  // behavior"), so a failure/warning during full mode retains the valid
  // full-scope rerun instead of narrowing by verification type.
  const getRerunCommand = (label: string, profileOverride?: 'github-actions') =>
    fullMode
      ? getVerifyRerunCommand(invocation, { profile: profileOverride })
      : getVerifyRerunCommand(invocation, {
          onlyType: resolveVerificationType(label),
          profile: profileOverride,
        });

  for (const result of failedResults) {
    actions.push(
      `Fix failed ${result.label} errors. Rerun through verify: ${getRerunCommand(result.label)}`,
    );

    if (result.blockingLogIssue) {
      actions.push(
        `Reason: ${result.blockingLogIssue.reason} (command exit code: ${result.exitCode}).`,
      );
      actions.push(`Warnings: ${result.blockingLogIssue.warningSummary}`);
    } else if (result.exitCode === null && result.reason) {
      actions.push(`Reason: ${result.reason}`);
    }
  }

  if (failedResults.length > 0) {
    actions.push(
      `After fixes, rerun the original read-only scope: ${getVerifyRerunCommand(invocation)}`,
    );
  }

  for (const result of warningResults) {
    actions.push(
      `Fix ${result.label} warnings. Rerun through verify: ${getRerunCommand(result.label)}`,
    );
    actions.push(`Reason: ${result.warningSummary}`);
  }

  if (ciProfileRisk !== null) {
    const rerunChecks = fullMode
      ? getVerifyRerunCommand(invocation, { profile: 'github-actions' })
      : ciProfileRisk.affectedChecks
          .map((label) => getRerunCommand(label, 'github-actions'))
          .join(' ; ');
    actions.push(
      `CI-profile risk remains for ${ciProfileRisk.affectedChecks.join(', ')} because local Playwright used profile ${ciProfileRisk.activeProfile.name}.`,
    );
    actions.push(`For CI-equivalent Playwright confidence locally, rerun: ${rerunChecks}`);
  }

  if (actions.length === 0) {
    actions.push('None.');
  }

  return actions;
}

/** Options for {@link printSummary}. */
export interface PrintSummaryOptions {
  /** Changed-file base ref used by this run, when known. */
  baseRef?: string | null;
  /** Environment object used for profile resolution. */
  processEnv?: NodeJS.ProcessEnv;
  /** Precomputed GitHub Actions profile risk details. */
  ciProfileRisk?: CiProfileRisk | null;
  /** Precomputed verify profile summary details. */
  profileSummary?: { environment: string; profile: PlaywrightContainerProfile };
  /** Precomputed heavy-check trigger lines. */
  heavyCheckTriggers?: string[];
  /** Resolved verify invocation. */
  invocation?: VerifyInvocation | null;
  /**
   * Total elapsed verifier execution time, in milliseconds, measured with a
   * monotonic clock. Diagnostic only; never influences `status`. Defaults to
   * `0` for callers (typically focused tests) that do not supply a real
   * measurement.
   */
  totalDurationMs?: number;
}

/** Overall verify run outcome returned by {@link printSummary}. */
export interface VerifySummaryOutcome {
  status: 'passed' | 'failed';
  hasFailed: boolean;
  hasCiProfileRisk: boolean;
}

/**
 * Print the agent-facing `VERIFY RESULT` summary for a finished run.
 * Every executed, skipped, or failed command result must flow through this
 * summary instead of an early exit.
 * @param changedFiles Changed files the run was scoped to.
 * @param scope Human-readable changed-file scope description.
 * @param results Collected command results in run order.
 * @param options Summary overrides for tests and caller-provided context.
 * @returns Overall run status derived from the results.
 */
export function printSummary(
  changedFiles: readonly string[],
  scope: string,
  results: readonly CommandResult[],
  options: PrintSummaryOptions = {},
): VerifySummaryOutcome {
  const invocation = options.invocation ?? currentVerifyInvocation;

  if (invocation === null) {
    throw new Error('printSummary requires a resolved verify invocation.');
  }

  const hasFailed = results.some((result) => result.status === 'failed');
  const processEnv = options.processEnv ?? getVerifyProcessEnv(process.env, invocation.profile);
  const ciProfileRisk = options.ciProfileRisk ?? getCiProfileRisk(results, processEnv);
  const { environment, profile } = options.profileSummary ?? getProfileSummary(processEnv);
  const status = hasFailed ? 'failed' : 'passed';
  const displayStatus = hasFailed
    ? 'failed ❌'
    : ciProfileRisk === null
      ? 'passed ✅'
      : 'passed with CI-profile risk ⚠️';
  const actionRequired = getActionRequired(results, { ciProfileRisk, invocation });
  const fullMode = invocation.scope.kind === 'full';
  const mode = invocation.fixMode === 'none' ? 'check' : invocation.fixMode;
  const heavyCheckTriggers = options.heavyCheckTriggers ?? getHeavyCheckTriggerLines(results);
  const baseRef = options.baseRef ?? null;
  const runnableResults = results.filter((result) => result.status !== 'skipped');
  const skippedResults = results.filter((result) => result.status === 'skipped');

  console.log('\nVERIFY RESULT');
  console.log(`mode: ${mode}`);
  console.log(`environment: ${environment}`);
  console.log(`profile: ${profile.name} (source: ${profile.source})`);
  console.log(`release: ${fullMode ? 'full-project (pnpm verify --full)' : 'off'}`);
  console.log(`verbose: ${invocation.verbose ? 'on' : 'off'}`);
  console.log(`only: ${invocation.onlyType ?? 'all'}`);
  console.log(`scope: ${fullMode ? 'full-project (changed-file scope ignored)' : scope}`);
  console.log(`base ref: ${baseRef ?? 'n/a'}`);
  console.log(`changed files: ${changedFiles.length}`);
  console.log(`status: ${displayStatus}`);
  console.log(`logs: ${VERIFY_LOG_DIR}`);
  console.log(`checks run: ${runnableResults.length}`);

  for (const result of runnableResults) {
    const warningSuffix = result.hasWarnings ? ' (warnings found)' : '';
    const durationSuffix =
      result.durationMs === undefined ? '' : ` [${formatDuration(result.durationMs)}]`;
    console.log(
      `- ${result.label}: ${result.status}${warningSuffix}${durationSuffix} (${result.displayCommand})`,
    );

    if (result.triggerReason) {
      console.log(`  trigger: ${result.triggerReason}`);
    }
  }

  console.log(`checks skipped: ${skippedResults.length}`);

  for (const result of skippedResults) {
    console.log(`- ${result.label}: skipped (${result.reason})`);
  }

  console.log('heavy-check triggers:');

  if (heavyCheckTriggers.length === 0) {
    console.log('- none');
  } else {
    for (const triggerLine of heavyCheckTriggers) {
      console.log(`- ${triggerLine}`);
    }
  }

  console.log('ci profile risk:');

  if (ciProfileRisk === null) {
    console.log('- none');
  } else {
    console.log(
      `- Local Playwright checks ran under ${ciProfileRisk.activeProfile.name}; GitHub Actions uses ${ciProfileRisk.githubActionsProfile.name}.`,
    );
    console.log(`- Affected checks: ${ciProfileRisk.affectedChecks.join(', ')}`);
    console.log(`- Differences: ${ciProfileRisk.differences.join('; ')}`);
  }

  console.log('action required:');

  for (const action of actionRequired) {
    console.log(`- ${action}`);
  }

  console.log(`total elapsed: ${formatDuration(options.totalDurationMs ?? 0)}`);

  return {
    status,
    hasFailed,
    hasCiProfileRisk: ciProfileRisk !== null,
  };
}

// Release Playwright checks whose webServer builds the production artifact
// itself (see playwright.release.config.ts). Reused only when a fresh
// artifact was already produced earlier in this same run, by any label in
// ARTIFACT_BUILD_SOURCE_LABELS.
const ARTIFACT_REUSE_LABELS = new Set(['artifact-static', 'artifact', 'release-smoke']);

// Labels whose successful completion proves a fresh production artifact
// already exists on disk: the dedicated `build` check, and `artifact-static`
// (see scripts/release/productionArtifactStaticProof.ts), which also builds
// the artifact itself before validating it.
const ARTIFACT_BUILD_SOURCE_LABELS = new Set(['build', 'artifact-static']);

// Storybook browser lanes whose webServer builds the Storybook static
// artifact itself (see playwright.storybook.config.ts / playwright.visual.config.ts).
// Reused only when the `storybook-build` check already produced a fresh
// static build earlier in this same run.
const STORYBOOK_STATIC_REUSE_LABELS = new Set(['storybook-behavior', 'visual']);

/**
 * Resolve extra env for a command entry, based on prior results in this run.
 * Sets `RELEASE_ARTIFACT_SKIP_BUILD=1` for the `artifact-static`/`artifact`/
 * `release-smoke` release-only checks once an earlier check in
 * ARTIFACT_BUILD_SOURCE_LABELS has already produced a fresh production
 * artifact in this same `pnpm verify` invocation, so a single release gate
 * does not rebuild the artifact once per check that needs it.
 * Sets `STORYBOOK_STATIC_SKIP_BUILD=1` for the `storybook-behavior`/`visual`
 * checks once the `storybook-build` check has already produced a fresh
 * Storybook static build in this same invocation, for the same reason.
 * @param entry Command entry about to run.
 * @param priorResults Results already collected earlier in this run.
 * @returns Extra env to merge into the command's environment.
 */
export function getExtraEnvForEntry(
  entry: { label: string },
  priorResults: readonly { label: string; status: string }[],
): NodeJS.ProcessEnv {
  const extraEnv: NodeJS.ProcessEnv = {};

  if (ARTIFACT_REUSE_LABELS.has(entry.label)) {
    const hasFreshArtifact = priorResults.some(
      (result) => ARTIFACT_BUILD_SOURCE_LABELS.has(result.label) && result.status === 'passed',
    );

    if (hasFreshArtifact) {
      extraEnv.RELEASE_ARTIFACT_SKIP_BUILD = '1';
    }
  }

  if (STORYBOOK_STATIC_REUSE_LABELS.has(entry.label)) {
    const storybookBuildResult = priorResults.find((result) => result.label === 'storybook-build');

    if (storybookBuildResult?.status === 'passed') {
      extraEnv.STORYBOOK_STATIC_SKIP_BUILD = '1';
    }
  }

  return extraEnv;
}

/** Environment inputs for a verify child command. */
export interface BuildCommandEnvOptions {
  /** Env inherited from the verify lock. */
  verifyLockEnv?: NodeJS.ProcessEnv;
  /** Env carrying verify-level overrides such as profile selection. */
  verifyProcessEnv?: NodeJS.ProcessEnv;
  /** Env added only for expensive-command lock ownership. */
  expensiveLockEnv?: NodeJS.ProcessEnv;
}

/**
 * Build the child command environment for a verify entry.
 * @param entry Command entry about to run.
 * @param priorResults Results already collected earlier in this run.
 * @param [options] Environment inputs for the child command.
 * @returns Environment passed to the child process.
 */
export function buildCommandEnv(
  entry: { label: string; weight?: CommandWeight },
  priorResults: readonly { label: string; status: string }[],
  options: BuildCommandEnvOptions = {},
): NodeJS.ProcessEnv {
  const { verifyLockEnv = {}, verifyProcessEnv = process.env, expensiveLockEnv = {} } = options;
  const extraEnv = getExtraEnvForEntry(entry, priorResults);

  return entry.weight === 'expensive'
    ? {
        ...verifyLockEnv,
        ...verifyProcessEnv,
        ...expensiveLockEnv,
        ...extraEnv,
      }
    : {
        ...verifyLockEnv,
        ...verifyProcessEnv,
        ...extraEnv,
      };
}

/** Execution context resolved from the invocation's changed-path scope. */
export interface VerifyChangedPathContext {
  changedFiles: string[];
  scope: string;
  baseRef: string | null;
  packageJsonOldRef: string | null;
  /**
   * Resolved changed-path scope input (`git-diff` with per-path status, or
   * `explicit-files`), preserved for the unit planner's status-aware
   * classification (see docs/testing/verify-redesign-pass-e-implementation.md's
   * "Unit planner"). `null` for full mode, which needs no scope input.
   */
  input: ChangedPathsScopeInput | null;
}

/** Test seams for changed-path execution. */
export interface ResolveVerifyChangedPathContextDeps {
  resolveScope?: typeof resolveChangedPathsScope;
  projectChangedFiles?: typeof getChangedFileProjection;
}

/**
 * Resolve changed-path context only for focused invocations. Full mode is an
 * unconditional scope and must not depend on Git refs, a working tree, or file projection.
 * @param invocation Resolved verify invocation.
 * @param [deps] Test seams for changed-path execution.
 * @returns Execution context used by command planning and summary output.
 */
export function resolveVerifyChangedPathContext(
  invocation: VerifyInvocation,
  deps: ResolveVerifyChangedPathContextDeps = {},
): VerifyChangedPathContext {
  if (invocation.scope.kind === 'full') {
    return {
      changedFiles: [],
      scope: 'full-project',
      baseRef: null,
      packageJsonOldRef: null,
      input: null,
    };
  }

  const resolveScope = deps.resolveScope ?? resolveChangedPathsScope;
  const projectChangedFiles = deps.projectChangedFiles ?? getChangedFileProjection;
  const { input, scope, baseRef, packageJsonOldRef } = resolveScope({
    invocationScope: invocation.scope,
  });

  return {
    changedFiles: projectChangedFiles(input),
    scope,
    baseRef,
    packageJsonOldRef,
    input,
  };
}

/** Lock controller passed to the top-level verify `run` callback. */
export interface VerifyLockController {
  updateMetadata: (partialMetadata?: Partial<CommandLockHelpers>) => void;
}

async function main(
  verifyLockEnv: NodeJS.ProcessEnv = {},
  verifyLockController: CommandLockHelpers = { updateMetadata: () => {} },
  invocation: VerifyInvocation | null = currentVerifyInvocation,
): Promise<void> {
  if (invocation === null) {
    throw new Error('verify main() requires a resolved verify invocation.');
  }

  const totalStartedAt = performance.now();
  const onlyType = invocation.onlyType;
  const verifyProcessEnv = getVerifyProcessEnv(process.env, invocation.profile);
  const { changedFiles, scope, baseRef, packageJsonOldRef, input } =
    resolveVerifyChangedPathContext(invocation);
  const commands = selectOnlyCommands(
    buildCommands(changedFiles, {
      fullMode: invocation.scope.kind === 'full',
      packageJsonOldRef,
      changedPathsInput: input,
      fixMode: invocation.fixMode,
      // Internal GitHub-focused-static Storybook build fallback (see
      // `storybookBuildCiFallback` on BuildCommandsOptions): derived from the
      // resolved invocation, not a public flag. `onlyType` is already null
      // whenever `scope.kind === 'full'` (full mode rejects `--only`), so
      // this is naturally false in full mode without a separate check.
      storybookBuildCiFallback: invocation.profile === 'github-actions' && onlyType === 'static',
      repeat: invocation.repeat,
    }),
    onlyType,
  );
  const results: CommandResult[] = [];
  let hasFailed = false;
  const runnableCommands = commands.filter((entry) => entry.kind === 'run');
  const totalRunnableChecks = runnableCommands.length;
  let completedRunnableChecks = 0;
  ensureLogsDirectory(onlyType === null ? null : commands.map((entry) => entry.label));

  for (const entry of commands) {
    if (entry.kind === 'skipped') {
      results.push(createSkippedResult(entry));
      continue;
    }

    if (entry.kind === 'failed') {
      results.push(createFailedResult(entry));
      hasFailed = true;
      continue;
    }

    if (hasFailed && entry.weight === 'expensive') {
      results.push(createSkippedResult(entry, EXPENSIVE_SKIP_REASON));
      continue;
    }

    if (onlyType === null) {
      console.log(
        `[verify] check ${completedRunnableChecks + 1}/${totalRunnableChecks}: ${entry.label}`,
      );
    } else {
      console.log(`[verify] focused check: ${entry.label}`);
    }
    verifyLockController.updateMetadata({
      activeCommand: summarizeCommandForDisplay(entry.command, entry.args),
      activeLabel: entry.label,
    });

    // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
    let result: ExecutedCommandResult;

    if (entry.weight === 'expensive') {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      // eslint-disable-next-line no-await-in-loop -- Verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      result = await withExpensiveCommandLock(
        {
          label: entry.label,
          command: formatCommand(entry.command, entry.args),
        },
        async (lockEnv) =>
          runCommand(
            entry.label,
            entry.command,
            entry.args,
            buildCommandEnv(entry, results, {
              expensiveLockEnv: lockEnv,
              verifyLockEnv,
              verifyProcessEnv,
            }),
            invocation.verbose,
          ),
      );

      // Signal propagation must happen after withExpensiveCommandLock cleanup,
      // not inside the child close handler, so lock release completes before
      // the process receives the termination signal.
      if (result.terminatedBySignal) {
        applyProcessResult({ signal: result.terminatedBySignal, status: null });
      }
    } else {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      // eslint-disable-next-line no-await-in-loop -- Verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      result = await runCommand(
        entry.label,
        entry.command,
        entry.args,
        buildCommandEnv(entry, results, {
          verifyLockEnv,
          verifyProcessEnv,
        }),
        invocation.verbose,
      );

      if (result.terminatedBySignal) {
        applyProcessResult({ signal: result.terminatedBySignal, status: null });
      }
    }
    if (entry.note) {
      result.note = entry.note;
    }
    result.triggerReason = entry.triggerReason ?? null;

    results.push(result);
    completedRunnableChecks += 1;

    if (result.status === 'failed') {
      hasFailed = true;
    }
  }

  const totalDurationMs = performance.now() - totalStartedAt;
  const summary = printSummary(changedFiles, scope, results, {
    baseRef,
    processEnv: verifyProcessEnv,
    invocation,
    totalDurationMs,
  });
  process.exitCode = summary.hasFailed ? 1 : 0;
}

/**
 * Build persisted metadata for the top-level verify lock.
 * The structured invocation is the retry source of truth; command is display-only.
 * @param invocation Resolved verify invocation.
 * @returns Lock metadata with structured scope and a shell-safe display command.
 */
export function getVerifyLockMetadata(invocation: VerifyInvocation): CommandLockInput {
  return {
    command: formatVerifyInvocationCommand(invocation),
    verifyInvocation: invocation,
    label: 'verify',
    logPath: VERIFY_LOG_DIR,
  };
}

/** Test seams for top-level verify execution. */
export interface RunVerifyCliDeps {
  invocation?: VerifyInvocation | null;
  runMain?: typeof main;
  /**
   * Verify-lock runner, narrowed to the single `T = void` instantiation
   * `runVerifyCli` actually uses (the real `withVerifyCommandLock` is
   * generic and satisfies this narrower shape).
   */
  withVerifyLock?: (
    input: CommandLockInput,
    run: (lockEnv: Record<string, string>, helpers?: CommandLockHelpers) => Promise<void>,
    options?: Parameters<typeof withVerifyCommandLock>[2],
  ) => Promise<void>;
}

/**
 * Run the verify CLI when the module is executed directly.
 * @param [deps] Test seams for top-level verify execution.
 * @returns Process exit code that should be reported to the shell.
 */
export async function runVerifyCli(deps: RunVerifyCliDeps = {}): Promise<number> {
  const {
    invocation = currentVerifyInvocation,
    runMain = main,
    withVerifyLock = withVerifyCommandLock,
  } = deps;

  if (isHelpMode) {
    printHelp();
    return 0;
  }

  if (!directoryExists('.git')) {
    throw new Error('Repository root is required to run verify.');
  }

  if (invocation === null) {
    throw new Error('runVerifyCli requires a resolved verify invocation.');
  }

  await withVerifyLock(getVerifyLockMetadata(invocation), (verifyLockEnv, verifyLockController) =>
    runMain(verifyLockEnv, verifyLockController, invocation),
  );
  return typeof process.exitCode === 'number' ? process.exitCode : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const exitCode = await runVerifyCli();

    if (isHelpMode) {
      process.exit(exitCode);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
