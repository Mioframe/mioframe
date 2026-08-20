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
import { resolveAppE2EPlan, type AppE2EPlan } from './lib/e2eRisk.ts';
import {
  validateE2EProjectApplicability,
  type E2EProjectApplicabilityValidation,
} from './lib/e2eProjectApplicability.ts';
import {
  resolveStorybookBehaviorPlan,
  type StorybookBehaviorPlan,
} from './lib/storybookBehaviorRisk.ts';
import { resolveStorybookBuildPlan, type StorybookBuildPlan } from './lib/storybookBuildRisk.ts';
import { resolveVisualPlan, type VisualPlan } from './lib/visualRisk.ts';
import { getChangedFileProjection, resolveChangedPathsScope } from './lib/changedPaths.ts';
import {
  FIX_ONLY_LABELS,
  formatShellCommand,
  formatVerifyInvocationCommand,
  FULL_ONLY_LABELS,
  getCliFilesOverride,
  resolveVerifyInvocation,
  VERIFY_LABELS,
  type FixMode,
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
}

/** Command entry the planner emits when a check is skipped. */
export interface SkippedCommandEntry {
  kind: 'skipped';
  label: string;
  command: string;
  reason: string;
  triggerReason?: string | null;
}

/** Command entry the planner emits when a check fails closed before execution. */
export interface FailedCommandEntry {
  kind: 'failed';
  label: string;
  command: string;
  reason: string;
  triggerReason?: string | null;
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
  'release-smoke': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  // Four sequential fresh-container sessions (see
  // scripts/release/managedUpdatesProof.mjs), each bounded by the same
  // derived Playwright container timeout as every other Playwright-backed
  // lane.
  'managed-updates': 4 * PLAYWRIGHT_COMMAND_TIMEOUT_MS,
};
const cliOnlyLabel = currentVerifyInvocation?.onlyLabel ?? null;
const cliProfile = currentVerifyInvocation?.profile ?? null;

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
const SOURCE_EXTENSIONS = ['.ts', '.vue'];
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

/**
 * Find sibling test files for a production file path.
 *
 * For `src/` paths, maps `.ts` and `.vue` production files to colocated
 * `.test.ts` files using exact basename matching and directory scan.
 * For `scripts/` paths, maps `.mjs`/`.ts` production files to colocated
 * `.test.mjs`/`.test.ts` and `.spec.mjs` files using exact name match.
 * @param filePath Production file path relative to the repository root.
 * @returns Sorted unique list of existing sibling test file paths, or an
 * empty array when no tests are found.
 */
export function getAllSiblingTestFiles(filePath: string): string[] {
  if (filePath.startsWith('src/')) {
    if (filePath.endsWith('.test.ts')) {
      return fileExists(filePath) ? [filePath] : [];
    }

    const extension = path.posix.extname(filePath);

    if (!SOURCE_EXTENSIONS.includes(extension)) {
      return [];
    }

    const baseName = path.posix.basename(filePath, extension);
    const dirPath = path.posix.dirname(filePath);
    const nameWithoutExt = filePath.slice(0, -extension.length);
    const exactMatch = `${nameWithoutExt}.test.ts`;

    if (fileExists(exactMatch)) {
      return [exactMatch];
    }

    const testCandidates: string[] = [];

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile() || !entry.name.endsWith('.test.ts')) {
          continue;
        }

        const candidateBase = entry.name.slice(0, -'.test.ts'.length);
        const parts = candidateBase.split('.');

        if (parts.length < 2) {
          continue;
        }

        if (parts[0] === baseName) {
          testCandidates.push(path.posix.join(dirPath, entry.name));
        }
      }
    } catch {
      // Directory read failure falls through to an empty focused test scope.
    }

    return uniqSorted(testCandidates);
  }

  if (filePath.startsWith('scripts/') || filePath.startsWith('tests/e2e/')) {
    if (
      filePath.endsWith('.test.mjs') ||
      filePath.endsWith('.spec.mjs') ||
      filePath.endsWith('.test.ts')
    ) {
      return fileExists(filePath) ? [filePath] : [];
    }

    if (!filePath.endsWith('.mjs') && !filePath.endsWith('.ts')) {
      return [];
    }

    const extension = filePath.endsWith('.mjs') ? '.mjs' : '.ts';
    const nameWithoutExt = filePath.slice(0, -extension.length);
    const testCandidates: string[] = [];

    const exactTestMatchMjs = `${nameWithoutExt}.test.mjs`;

    if (fileExists(exactTestMatchMjs)) {
      testCandidates.push(exactTestMatchMjs);
    }

    const exactTestMatchTs = `${nameWithoutExt}.test.ts`;

    if (fileExists(exactTestMatchTs)) {
      testCandidates.push(exactTestMatchTs);
    }

    const exactSpecMatch = `${nameWithoutExt}.spec.mjs`;

    if (fileExists(exactSpecMatch)) {
      testCandidates.push(exactSpecMatch);
    }

    return uniqSorted(testCandidates);
  }

  return [];
}

function getVitestScope(changedFiles: readonly string[]): string[] {
  const scope: string[] = [];

  for (const filePath of changedFiles) {
    if (filePath.startsWith('tests/e2e/') && filePath.endsWith('.spec.ts')) {
      // vitest.config.ts excludes Playwright specs under tests/e2e/**; a
      // colocated `.test.mjs` fixture-logic test there is valid vitest
      // scope and falls through to the checks below like any other file.
      continue;
    }

    if (filePath.endsWith('.browser.spec.ts')) {
      // Colocated browser specs belong to the storybook-behavior Playwright lane; vitest.config.ts does not include them.
      continue;
    }

    if (filePath.endsWith('.visual.spec.ts')) {
      // Colocated visual specs belong to the visual Playwright lane; vitest.config.ts does not include them.
      continue;
    }

    if (
      (filePath.endsWith('.test.ts') ||
        filePath.endsWith('.spec.ts') ||
        filePath.endsWith('.test.mjs') ||
        filePath.endsWith('.spec.mjs')) &&
      fileExists(filePath)
    ) {
      scope.push(filePath);
      continue;
    }

    const testFiles = getAllSiblingTestFiles(filePath);

    for (const testFile of testFiles) {
      scope.push(testFile);
    }
  }

  return uniqSorted(scope);
}

function isSharedUiFile(filePath: string): boolean {
  return filePath.startsWith('src/shared/ui/');
}

function getMutationSourceCandidate(testFilePath: string): string | null {
  const basePath = testFilePath.slice(0, -'.test.ts'.length);
  const dirPath = path.posix.dirname(testFilePath);
  const baseName = path.posix.basename(basePath);

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;

    if (fileExists(candidate)) {
      return candidate;
    }
  }

  const parts = baseName.split('.');

  if (parts.length >= 2) {
    const trimmedBaseName = parts.slice(0, -1).join('.');
    const trimmedPath = `${dirPath}/${trimmedBaseName}`;

    for (const extension of SOURCE_EXTENSIONS) {
      const candidate = `${trimmedPath}${extension}`;

      if (fileExists(candidate)) {
        return candidate;
      }
    }
  }

  return null;
}

function getMutationScope(changedFiles: readonly string[]): string[] {
  const scope: string[] = [];

  for (const filePath of changedFiles) {
    if (filePath.startsWith('src/') && filePath.endsWith('.test.ts')) {
      const candidate = getMutationSourceCandidate(filePath);

      if (candidate && !isSharedUiFile(candidate)) {
        scope.push(candidate);
      }

      continue;
    }

    if (!filePath.startsWith('src/') || isSharedUiFile(filePath)) {
      continue;
    }

    if (!SOURCE_EXTENSIONS.includes(path.posix.extname(filePath))) {
      continue;
    }

    const siblingTests = getAllSiblingTestFiles(filePath);

    if (siblingTests.length > 0) {
      scope.push(filePath);
    }
  }

  return uniqSorted(scope);
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
  const signal = BLOCKING_LOG_SIGNALS.find((entry) => entry.label === label);

  if (!signal) {
    return null;
  }

  const matchedLines = logOutput
    .split('\n')
    .map((line) => line.replace(ANSI_ESCAPE_PATTERN, ''))
    .filter((line) => line.startsWith(signal.marker))
    .map(trimWarningLine);

  if (matchedLines.length === 0) {
    return null;
  }

  return {
    reason: signal.reason,
    warningSummary: uniqSorted(matchedLines).slice(0, 3).join(' | '),
  };
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
  console.log(
    `                      With either fix mode and --only, accepted labels: ${[...FIX_ONLY_LABELS].join(', ')}.`,
  );
  console.log('  --base <ref>        Verify changes against a local base ref.');
  console.log('                      Local-only default: set VERIFY_BASE in .env.local.');
  console.log('                      Cannot be combined with --full.');
  console.log('  --profile <name>    Override the verify runtime profile.');
  console.log(`                      Env alternative: ${VERIFY_PROFILE_ENV}=local|github-actions.`);
  console.log('  --only <label>      Run one focused verification check.');
  console.log('  --storybook-build-ci-fallback');
  console.log(
    '                      With `--only storybook-build` (not `--full`): build only when the',
  );
  console.log(
    '                      ordinary storybook-build plan requires it and neither storybook-behavior',
  );
  console.log('                      nor visual will run. See .github/workflows/verify.yml.');
  console.log('  --files <paths...>  Override changed-file detection with an explicit file list.');
  console.log('                      Cannot be combined with --full.');
  console.log(
    '  --repeat <count>    With `--only storybook-behavior` and `--files` (integer 2-20):',
  );
  console.log(
    '                      repeat the selected Storybook behavior tests this many times within',
  );
  console.log('                      one invocation, for deterministic flake diagnosis.');
  console.log(
    '  --full              Unconditional full-project release scope: do not resolve changed paths,',
  );
  console.log('                      run full proof plus release-version/release-config/build/');
  console.log(
    '                      publisher-node-import/artifact/release-smoke/managed-updates. Equivalent to `pnpm verify:release`.',
  );
  console.log('');
  console.log('Labels for --only:');

  for (const label of VERIFY_LABELS) {
    const modeNote = FULL_ONLY_LABELS.has(label)
      ? ' (requires --full)'
      : label === 'mutation'
        ? ' (not available with --full)'
        : '';
    console.log(`  ${label}${modeNote}`);
  }

  console.log('');
  console.log('Examples:');
  console.log('  pnpm verify');
  console.log('  pnpm verify --verbose');
  console.log('  pnpm verify --base origin/develop');
  console.log('  pnpm verify --profile github-actions --only e2e');
  console.log('  .env.local: VERIFY_BASE=origin/develop');
  console.log(`  ${VERIFY_PROFILE_ENV}=github-actions pnpm verify --only visual`);
  console.log('  pnpm verify --verbose --only type-check');
  console.log('  pnpm verify --only eslint --files src/foo.ts src/bar.vue');
  console.log('  pnpm verify --verbose --only storybook-build --storybook-build-ci-fallback');
  console.log(
    '  pnpm verify --only storybook-behavior --files src/foo.browser.spec.ts --repeat 10',
  );
  console.log('  pnpm verify --fix');
  console.log('  pnpm verify --fix-only');
  console.log('  pnpm verify --full');
  console.log('  pnpm verify --full --only artifact');
  console.log('  pnpm verify:release');
  console.log('');
  console.log('Notes:');
  console.log('  - In GitHub Actions, focused verify scope is based on GITHUB_BASE_REF.');
  console.log(
    '  - Full mode ignores GITHUB_BASE_REF and VERIFY_BASE; explicit --base/--files are rejected.',
  );
  console.log('  - Focused --only runs preserve logs from other focused steps.');
  console.log(`  - Logs are written to ${VERIFY_LOG_DIR}/.`);
  console.log('  - Expensive checks have internal heartbeat/timeouts:');

  for (const label of VERIFY_LABELS) {
    const timeoutMs = COMMAND_TIMEOUT_MS_BY_LABEL[label];

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
    label: 'artifact',
    command: 'pnpm',
    args: [
      'e2e:release',
      '--label',
      'artifact',
      'tests/e2e/release/productionArtifactSmoke.spec.ts',
    ],
    weight: classifyCommandWeight({ label: 'artifact' }),
  });

  commands.push({
    kind: 'run',
    label: 'release-smoke',
    command: 'pnpm',
    args: [
      'e2e:release',
      '--label',
      'release-smoke',
      'tests/e2e/release/firstUserAndReturningUserSmoke.spec.ts',
    ],
    weight: classifyCommandWeight({ label: 'release-smoke' }),
  });

  commands.push({
    kind: 'run',
    label: 'managed-updates',
    command: 'node',
    args: ['scripts/release/managedUpdatesProof.mjs'],
    weight: classifyCommandWeight({ label: 'managed-updates' }),
  });
}

type BuildCommandsVisualPlan = VisualPlan | { mode: 'invalid'; specs: string[]; reasons: string[] };

/** Options for {@link buildCommands}. */
export interface BuildCommandsOptions {
  /** Full-project release mode; defaults to the `--full` CLI flag. */
  fullMode?: boolean;
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only visual impact refinement. Pass `null` when no reliable base
   * ref is known; that fails closed to visual-relevant.
   */
  packageJsonOldRef?: string | null;
  fixMode?: FixMode;
  appE2EPlan?: AppE2EPlan | null;
  projectApplicabilityValidation?: E2EProjectApplicabilityValidation | null;
  storybookBehaviorPlan?: StorybookBehaviorPlan | null;
  storybookBuildPlan?: StorybookBuildPlan | null;
  visualPlan?: BuildCommandsVisualPlan | null;
  /**
   * Dedicated GitHub Actions fallback contract for the `storybook-build` label only (see
   * `.github/workflows/verify.yml`): storybook-behavior and visual run as separate
   * self-contained CI jobs that build their own Storybook when selected, so this narrows the
   * `storybook-build` trigger to the ordinary storybook-build plan alone, skipping whenever a
   * self-contained browser lane will already supply the equivalent static-build prerequisite.
   * Has no effect on any other label and does not change `--full` or the ordinary (non-CI)
   * `--only storybook-build` reuse-aware trigger. Sourced from the resolved
   * `VerifyInvocation.storybookBuildCiFallback` (the `--storybook-build-ci-fallback` CLI flag);
   * defaults to `false`.
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
    packageJsonOldRef = null,
    fixMode = currentVerifyInvocation?.fixMode ?? 'none',
    appE2EPlan: appE2EPlanOverride = null,
    projectApplicabilityValidation: projectApplicabilityValidationOverride = null,
    storybookBehaviorPlan: storybookBehaviorPlanOverride = null,
    storybookBuildPlan: storybookBuildPlanOverride = null,
    visualPlan: visualPlanOverride = null,
    storybookBuildCiFallback = false,
    repeat = currentVerifyInvocation?.repeat ?? null,
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
  const vitestScope = getVitestScope(changedFiles);
  const appE2EPlan = appE2EPlanOverride ?? resolveAppE2EPlan(changedFiles, { packageJsonOldRef });
  const projectApplicabilityValidation =
    projectApplicabilityValidationOverride ?? validateE2EProjectApplicability();
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
  const mutationScope = getMutationScope(existingChangedFiles);
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
    return commands;
  }

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
  } else if (vitestScope.length > 0) {
    commands.push({
      kind: 'run',
      label: 'unit-tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', '--reporter=verbose', ...vitestScope],
      weight: classifyCommandWeight({ label: 'unit-tests', fileCount: vitestScope.length }),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'unit-tests',
      command: 'pnpm exec vitest run',
      reason: 'empty focused unit-test scope',
    });
  }

  const e2eInvalidReasons = [
    ...(appE2EPlan.mode === 'invalid' ? appE2EPlan.reasons : []),
    ...(projectApplicabilityValidation.valid ? [] : projectApplicabilityValidation.errors),
  ];

  if (e2eInvalidReasons.length > 0) {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: `invalid app e2e scenario registry state: ${e2eInvalidReasons.join('; ')}`,
    });
  } else if (fullMode) {
    addE2ECommands(commands, createE2ECommand([], 'full-project release verification'));
  } else if (appE2EPlan.mode === 'full') {
    addE2ECommands(commands, createE2ECommand([], appE2EPlan.reasons.join('; ')));
  } else if (appE2EPlan.mode === 'focused') {
    addE2ECommands(commands, createE2ECommand(appE2EPlan.specs, appE2EPlan.reasons.join('; ')));
  } else {
    commands.push(createE2EInstallCommand('empty e2e scope'));
    commands.push({
      kind: 'skipped',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: 'empty e2e scope',
    });
  }

  // Locally, the shared Storybook static build is a prerequisite for both
  // storybook-behavior and visual, not an independent proof owner. Schedule
  // it before either lane so a successful build result is already available
  // in `results` (see `getExtraEnvForEntry`) when they run, and derive the
  // requirement from the three existing plans only: no separate impact
  // registry. `invalid` behavior/visual plans fail closed on their own lane
  // below and must not, by themselves, force an otherwise-unneeded build.
  // In GitHub Actions, storybook-behavior and visual are separate
  // self-contained jobs that never reuse this lane's output (see
  // `storybookBuildCiFallback` below), so this reuse-aware trigger applies
  // only to `--full` and to the ordinary (non-CI-fallback) `--only
  // storybook-build` invocation (i.e. without `--storybook-build-ci-fallback`).
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

  if (storybookBehaviorPlan.mode === 'invalid') {
    storybookBehaviorEntry = {
      kind: 'failed',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: `invalid Storybook behavior scenario registry state: ${storybookBehaviorPlan.reasons.join('; ')}`,
    };
  } else if (fullMode) {
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
  // resolved for `--only storybook-behavior --files ...` (see
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

  // Mutation testing is a test-design/PR-quality tool, not a release-publish
  // blocker: it is expensive/slow and does not validate the production
  // artifact, so it never runs in full/release mode (pnpm verify:release).
  if (!fullMode && mutationScope.length > 0) {
    commands.push({
      kind: 'run',
      label: 'mutation',
      command: 'pnpm',
      args: ['exec', 'stryker', 'run', '-m', mutationScope.join(',')],
      weight: classifyCommandWeight({ label: 'mutation' }),
      triggerReason: `mutation scope: ${mutationScope.join(', ')}`,
    });
  } else if (!fullMode) {
    commands.push({
      kind: 'skipped',
      label: 'mutation',
      command: 'pnpm exec stryker run -m <source file>',
      reason: 'empty mutation scope',
    });
  }

  if (fullMode) {
    addReleaseOnlyCommands(commands);
  }

  return commands;
}

function selectOnlyCommands(
  commands: readonly CommandEntry[],
  onlyLabel: string | null = cliOnlyLabel,
): CommandEntry[] {
  if (onlyLabel === null) {
    return [...commands];
  }

  const selectedCommands = commands.filter((entry) => entry.label === onlyLabel);

  if (selectedCommands.length > 0) {
    return selectedCommands;
  }

  if (onlyLabel === 'e2e-install') {
    return [createE2EInstallCommand('empty e2e scope')];
  }

  throw new Error(`Verify command list is missing required label: ${onlyLabel}`);
}

/**
 * Build a supported read-only verify command from the resolved invocation.
 * @param invocation Resolved verify invocation.
 * @param [overrides] Optional profile and label overrides.
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
  const failedResults = results.filter(
    (result): result is ExecutedCommandResult | InvalidCommandResult => result.status === 'failed',
  );
  const warningResults = results.filter(
    (result) => result.status !== 'failed' && result.hasWarnings,
  );

  for (const result of failedResults) {
    actions.push(
      `Fix failed ${result.label} errors. Rerun through verify: ${getVerifyRerunCommand(invocation, { onlyLabel: result.label })}`,
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
      `Fix ${result.label} warnings. Rerun through verify: ${getVerifyRerunCommand(invocation, { onlyLabel: result.label })}`,
    );
    actions.push(`Reason: ${result.warningSummary}`);
  }

  if (ciProfileRisk !== null) {
    const rerunChecks = ciProfileRisk.affectedChecks
      .map((label) =>
        getVerifyRerunCommand(invocation, {
          onlyLabel: label,
          profile: 'github-actions',
        }),
      )
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
  console.log(`only: ${invocation.onlyLabel ?? 'all'}`);
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
// itself (see playwright.release.config.ts). Reused only when the `build`
// check already produced a fresh artifact earlier in this same run.
const ARTIFACT_REUSE_LABELS = new Set(['artifact', 'release-smoke']);

// Storybook browser lanes whose webServer builds the Storybook static
// artifact itself (see playwright.storybook.config.ts / playwright.visual.config.ts).
// Reused only when the `storybook-build` check already produced a fresh
// static build earlier in this same run.
const STORYBOOK_STATIC_REUSE_LABELS = new Set(['storybook-behavior', 'visual']);

/**
 * Resolve extra env for a command entry, based on prior results in this run.
 * Sets `RELEASE_ARTIFACT_SKIP_BUILD=1` for the `artifact`/`release-smoke`
 * release-only checks once the `build` check has already produced a fresh
 * production artifact in this same `pnpm verify` invocation, so a single
 * release gate does not rebuild the artifact once per check that needs it.
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
    const buildResult = priorResults.find((result) => result.label === 'build');

    if (buildResult?.status === 'passed') {
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
  const onlyLabel = invocation.onlyLabel;
  const verifyProcessEnv = getVerifyProcessEnv(process.env, invocation.profile);
  const { changedFiles, scope, baseRef, packageJsonOldRef } =
    resolveVerifyChangedPathContext(invocation);
  const commands = selectOnlyCommands(
    buildCommands(changedFiles, {
      fullMode: invocation.scope.kind === 'full',
      packageJsonOldRef,
      fixMode: invocation.fixMode,
      // `--storybook-build-ci-fallback` is only ever resolved to true alongside
      // `--only storybook-build` outside `--full` (enforced by
      // `resolveVerifyInvocation`), so this passes straight through (see
      // `storybookBuildCiFallback` on BuildCommandsOptions).
      storybookBuildCiFallback: invocation.storybookBuildCiFallback,
      repeat: invocation.repeat,
    }),
    onlyLabel,
  );
  const results: CommandResult[] = [];
  let hasFailed = false;
  const runnableCommands = commands.filter((entry) => entry.kind === 'run');
  const totalRunnableChecks = runnableCommands.length;
  let completedRunnableChecks = 0;
  ensureLogsDirectory(onlyLabel === null ? null : commands.map((entry) => entry.label));

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

    if (onlyLabel === null) {
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
