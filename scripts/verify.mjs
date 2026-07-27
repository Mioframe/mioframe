import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { applyProjectEnv } from './lib/projectEnv.mjs';
import { withExpensiveCommandLock, withVerifyCommandLock } from './lib/commandLock.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.mjs';
import { createChildSignalForwarder } from './lib/signalForward.mjs';
import { resolveAppE2EPlan } from './lib/e2eRisk.mjs';
import { resolveStorybookBehaviorPlan } from './lib/storybookBehaviorRisk.mjs';
import { isVisualRelevantPackageJsonChange } from './lib/packageJsonImpact.mjs';
import { getChangedFileProjection, resolveChangedPathsScope } from './lib/changedPaths.mjs';
import {
  FIX_ONLY_LABELS,
  formatShellCommand,
  formatVerifyInvocationCommand,
  FULL_ONLY_LABELS,
  getCliFilesOverride,
  resolveVerifyInvocation,
  VERIFY_LABELS,
} from './lib/verifyInvocation.mjs';
import {
  comparePlaywrightContainerProfiles,
  resolvePlaywrightContainerProfile,
  VERIFY_PROFILE_ENV,
} from './playwrightContainer.mjs';

applyProjectEnv();

const rawCliArgs = process.argv.slice(2);
const isHelpMode = process.argv.includes('--help') || rawCliArgs.includes('help');
const currentVerifyInvocation = isHelpMode
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
// shutdown, and process-result propagation back to verify.mjs.
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
  containerTimeoutSeconds = toolingConfig.verification.playwrightContainer.timeoutSeconds,
) {
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
export const COMMAND_TIMEOUT_MS_BY_LABEL = {
  'e2e-install': 10 * 60 * 1000,
  e2e: PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  'storybook-behavior': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  visual: PLAYWRIGHT_COMMAND_TIMEOUT_MS,
  mutation: 20 * 60 * 1000,
  build: 10 * 60 * 1000,
  artifact: 8 * 60 * 1000,
  'release-smoke': PLAYWRIGHT_COMMAND_TIMEOUT_MS,
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

function isFormatLintIgnored(filePath) {
  return FORMAT_LINT_IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

function uniqSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function fileExists(filePath) {
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function directoryExists(directoryPath) {
  return fs.existsSync(directoryPath) && fs.statSync(directoryPath).isDirectory();
}

export { getCliFilesOverride };

function isTypeCheckTarget(filePath) {
  const baseName = path.posix.basename(filePath);

  return (
    filePath === 'package.json' ||
    filePath === 'config/tooling.json' ||
    filePath === 'pnpm-lock.yaml' ||
    filePath === 'env.d.ts' ||
    filePath === 'vite-env.d.ts' ||
    (filePath.startsWith('src/') && (filePath.endsWith('.ts') || filePath.endsWith('.vue'))) ||
    (filePath.startsWith('tests/') && filePath.endsWith('.ts')) ||
    (baseName.startsWith('tsconfig') && baseName.endsWith('.json')) ||
    baseName.includes('.config.')
  );
}

/**
 * Find sibling test files for a production file path.
 *
 * For `src/` paths, maps `.ts` and `.vue` production files to colocated
 * `.test.ts` files using exact basename matching and directory scan.
 * For `scripts/` paths, maps `.mjs` production files to colocated
 * `.test.mjs` and `.spec.mjs` files using exact name match.
 * @param filePath Production file path relative to the repository root.
 * @returns Sorted unique list of existing sibling test file paths, or an
 * empty array when no tests are found.
 */
export function getAllSiblingTestFiles(filePath) {
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

    const testCandidates = [];

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

  if (filePath.startsWith('scripts/')) {
    if (filePath.endsWith('.test.mjs') || filePath.endsWith('.spec.mjs')) {
      return fileExists(filePath) ? [filePath] : [];
    }

    if (!filePath.endsWith('.mjs')) {
      return [];
    }

    const nameWithoutExt = filePath.slice(0, -'.mjs'.length);
    const testCandidates = [];

    const exactTestMatch = `${nameWithoutExt}.test.mjs`;

    if (fileExists(exactTestMatch)) {
      testCandidates.push(exactTestMatch);
    }

    const exactSpecMatch = `${nameWithoutExt}.spec.mjs`;

    if (fileExists(exactSpecMatch)) {
      testCandidates.push(exactSpecMatch);
    }

    return uniqSorted(testCandidates);
  }

  return [];
}

function getVitestScope(changedFiles) {
  const scope = [];

  for (const filePath of changedFiles) {
    if (filePath.startsWith('tests/e2e/')) {
      // vitest.config.ts excludes tests/e2e/** entirely; Playwright specs there are not vitest scope.
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

function isSharedUiFile(filePath) {
  return filePath.startsWith('src/shared/ui/');
}

// `package.json` is deliberately excluded here: its visual relevance
// depends on which fields changed, so it is classified separately by
// isVisualRelevantPackageJsonChange (see buildCommands).
function isVisualRelevantFile(filePath) {
  return (
    filePath === 'config/tooling.json' ||
    filePath === 'playwright.visual.config.ts' ||
    filePath === 'vite.config.ts' ||
    filePath === 'tsconfig.storybook.json' ||
    filePath === 'scripts/storybook.mjs' ||
    filePath === 'src/app/styles/styles.css' ||
    filePath === 'src/app/styles/fonts.css' ||
    filePath.startsWith('.storybook/') ||
    filePath.startsWith('tests/e2e/visual/') ||
    filePath.startsWith('src/shared/ui/') ||
    filePath.startsWith('src/shared/lib/md/') ||
    /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/.test(filePath)
  );
}

function getMutationSourceCandidate(testFilePath) {
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

function getMutationScope(changedFiles) {
  const scope = [];

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

function formatCommand(command, args) {
  return formatShellCommand(command, args);
}

function getLogPath(label) {
  return path.posix.join(VERIFY_LOG_DIR, `${label}.log`);
}

function ensureLogsDirectory(labelsToReset = null) {
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

function appendToRollingBuffer(buffer, chunk) {
  const nextBuffer = `${buffer}${chunk}`;

  if (nextBuffer.length <= MAX_ROLLING_BUFFER_CHARS) {
    return nextBuffer;
  }

  return nextBuffer.slice(-MAX_ROLLING_BUFFER_CHARS);
}

function closeLogStream(stream) {
  return new Promise((resolve, reject) => {
    stream.once('error', reject);
    stream.end(() => resolve());
  });
}

function summarizeCommandForDisplay(command, args) {
  const groupedFileArgs = [];
  const otherArgs = [];

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

function trimWarningLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function isZeroWarningLine(line) {
  return /\b0 warnings?\b/i.test(line) && !/\b[1-9]\d* warnings?\b/i.test(line);
}

function getWarningSummary(label, output) {
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
const BLOCKING_LOG_SIGNALS = [
  {
    label: 'unit-tests',
    marker: '[Vue warn]',
    reason: 'Vue runtime warnings were emitted during unit tests',
  },
];

// oxlint-disable-next-line no-control-regex -- ANSI color escapes start with the ESC control character by definition.
const ANSI_ESCAPE_PATTERN = /\u001B\[[0-9;]*m/g;

/**
 * Find a blocking log signal in a completed command's captured log.
 * Matching is anchored to the start of a log line, so test names, fixture
 * strings, or summaries that merely mention a marker mid-line never match.
 * @param label Verify command label the log belongs to.
 * @param logOutput Full captured log output of the command.
 * @returns Blocking issue with `reason` and `warningSummary`, or `null`.
 */
export function getBlockingLogIssue(label, logOutput) {
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
export function resolveCommandStatus(label, exitCode, logOutput) {
  const blockingLogIssue = getBlockingLogIssue(label, logOutput);

  return {
    status: exitCode === 0 && blockingLogIssue === null ? 'passed' : 'failed',
    blockingLogIssue,
  };
}

function getOutputTail(output) {
  const lines = output
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);

  if (lines.length === 0) {
    return ['(no output captured)'];
  }

  return lines.slice(-MAX_RELEVANT_LINES);
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
}

function formatHelpTimeout(milliseconds) {
  const minutes = Math.floor(milliseconds / 60_000);

  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

function getLastMeaningfulLine(text) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.at(-1) ?? null;
}

function printHelp() {
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
  console.log('  --files <paths...>  Override changed-file detection with an explicit file list.');
  console.log('                      Cannot be combined with --full.');
  console.log(
    '  --full              Unconditional full-project release scope: do not resolve changed paths,',
  );
  console.log('                      run full proof plus release-version/release-config/build/');
  console.log('                      artifact/release-smoke. Equivalent to `pnpm verify:release`.');
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
export function getVerifyProcessEnv(baseEnv = process.env, profileOverride = cliProfile) {
  if (profileOverride === null) {
    return baseEnv;
  }

  return {
    ...baseEnv,
    [VERIFY_PROFILE_ENV]: profileOverride,
  };
}

function getProfileSummary(processEnv) {
  const profile = resolvePlaywrightContainerProfile(processEnv);

  return {
    environment: processEnv.GITHUB_ACTIONS === 'true' ? 'github-actions' : 'local',
    profile,
  };
}

function getHeavyCheckTriggerLines(results) {
  return results
    .filter((result) => result.status !== 'skipped' && result.triggerReason)
    .map((result) => `${result.label}: ${result.triggerReason}`);
}

/**
 * Detect unresolved GitHub Actions Playwright profile risk after a local pass.
 * @param results Collected command results in run order.
 * @param [processEnv] Environment object used for profile resolution.
 * @returns Risk details when local Playwright settings differ from GitHub Actions.
 */
export function getCiProfileRisk(results, processEnv = process.env) {
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

async function runCommand(label, command, args, extraEnv = {}, verboseMode = isVerboseMode) {
  const formattedCommand = formatCommand(command, args);
  const displayCommand = summarizeCommandForDisplay(command, args);
  const logPath = getLogPath(label);
  const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });
  logStream.write(`# command\n${formattedCommand}\n\n# output\n`);

  console.log(`\n[${label}] running ${displayCommand}`);

  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, ...extraEnv },
  });

  let outputBuffer = '';
  let exitCode = 1;
  let spawnError = null;
  let timedOut = false;
  let killGraceTimer = null;
  const startedAt = Date.now();
  let lastOutputAt = startedAt;
  let lastOutputLine = null;
  let incompleteOutputLine = '';
  const commandTimeoutMs = COMMAND_TIMEOUT_MS_BY_LABEL[label] ?? null;
  const forwarder = createChildSignalForwarder(child);

  const writeStatusLine = (line, destination = 'stdout') => {
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

  const onStdout = (chunk) => {
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

  const onStderr = (chunk) => {
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

  await new Promise((resolve) => {
    child.once('error', (error) => {
      forwarder.cleanup();
      spawnError = error;
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

  if (spawnError) {
    throw spawnError;
  }

  const logOutput = fs.readFileSync(logPath, 'utf8');
  const warningSummary = getWarningSummary(label, logOutput);
  const { status, blockingLogIssue } = resolveCommandStatus(label, exitCode, logOutput);

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
    terminatedBySignal: forwarder.terminatedBySignal,
    // Populated for expensive commands to support applyProcessResult.
    signal: forwarder.terminatedBySignal,
  };
}

function createSkippedResult(entry, reason = entry.reason) {
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

function createFailedResult(entry, reason = entry.reason) {
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

function addE2ECommands(commands, e2eCommand) {
  commands.push(createE2EInstallCommand());
  commands.push(e2eCommand);
}

function createE2EInstallCommand(reason) {
  return {
    kind: 'skipped',
    label: 'e2e-install',
    command: 'pnpm e2e:host:install',
    reason: reason ?? 'browser install is not required; Playwright container provides browsers',
  };
}

function createE2ECommand(extraArgs = [], note = null) {
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

function createStorybookBehaviorCommand(extraArgs = [], note = null) {
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

function addReleaseOnlyCommands(commands) {
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
}

/**
 * Build the verify command list for a given changed-file set.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Build options.
 * @param [options.fullMode] Full-project release mode; defaults to the `--full` CLI flag.
 * @param [options.packageJsonOldRef] Git ref to compare the current
 * `package.json` against, for the version-only visual impact refinement.
 * Pass `null` when no reliable base ref is known; that fails closed to
 * visual-relevant.
 * @returns Command entries in run order.
 */
export function buildCommands(
  changedFiles,
  {
    fullMode = isFullMode,
    packageJsonOldRef = null,
    fixMode = currentVerifyInvocation?.fixMode ?? 'none',
    appE2EPlan: appE2EPlanOverride = null,
    storybookBehaviorPlan: storybookBehaviorPlanOverride = null,
  } = {},
) {
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
  const changedVisualSpecs = changedFiles.filter(
    (filePath) =>
      filePath.startsWith('tests/e2e/visual/') && filePath.endsWith('.ts') && fileExists(filePath),
  );
  const isPackageJsonVisualRelevant =
    !fullMode &&
    changedFiles.includes('package.json') &&
    isVisualRelevantPackageJsonChange({ oldRef: packageJsonOldRef });
  const hasVisualRelevantChanges =
    changedFiles.some(isVisualRelevantFile) || isPackageJsonVisualRelevant;
  const appE2EPlan = appE2EPlanOverride ?? resolveAppE2EPlan(changedFiles, { packageJsonOldRef });
  const storybookBehaviorPlan =
    storybookBehaviorPlanOverride ??
    resolveStorybookBehaviorPlan(changedFiles, { packageJsonOldRef });
  const mutationScope = getMutationScope(existingChangedFiles);
  const commands = [];
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

  if (appE2EPlan.mode === 'invalid') {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: `invalid app e2e scenario registry state: ${appE2EPlan.reasons.join('; ')}`,
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

  if (storybookBehaviorPlan.mode === 'invalid') {
    commands.push({
      kind: 'failed',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: `invalid Storybook behavior scenario registry state: ${storybookBehaviorPlan.reasons.join('; ')}`,
    });
  } else if (fullMode) {
    commands.push(createStorybookBehaviorCommand([], 'full-project release verification'));
  } else if (storybookBehaviorPlan.mode === 'full') {
    commands.push(createStorybookBehaviorCommand([], storybookBehaviorPlan.reasons.join('; ')));
  } else if (storybookBehaviorPlan.mode === 'focused') {
    commands.push(
      createStorybookBehaviorCommand(
        storybookBehaviorPlan.specs,
        storybookBehaviorPlan.reasons.join('; '),
      ),
    );
  } else {
    commands.push({
      kind: 'skipped',
      label: 'storybook-behavior',
      command: 'pnpm test:storybook-behavior',
      reason: 'empty storybook behavior scope',
    });
  }

  if (fullMode || hasVisualRelevantChanges || changedVisualSpecs.length > 0) {
    const triggerReason = fullMode
      ? 'full-project release verification'
      : changedVisualSpecs.length > 0
        ? `changed visual specs: ${changedVisualSpecs.join(', ')}`
        : 'visual-relevant files changed';
    commands.push({
      kind: 'run',
      label: 'visual',
      command: 'pnpm',
      args: ['test:visual'],
      weight: classifyCommandWeight({ label: 'visual' }),
      triggerReason,
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

function selectOnlyCommands(commands, onlyLabel = cliOnlyLabel) {
  if (onlyLabel === null) {
    return commands;
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
export function getVerifyRerunCommand(invocation, overrides = {}) {
  return formatVerifyInvocationCommand(invocation, {
    ...overrides,
    readOnly: true,
  });
}

/**
 * Build the `action required` lines for the verify summary.
 * @param results Collected command results in run order.
 * @param [options] Summary options.
 * @param [options.ciProfileRisk] Pending GitHub Actions profile risk details.
 * @param [options.invocation] Resolved verify invocation.
 * @returns Action lines; `['None.']` when nothing failed or warned.
 */
export function getActionRequired(results, options = {}) {
  const { ciProfileRisk = null, invocation = currentVerifyInvocation } = options;
  const actions = [];
  const failedResults = results.filter((result) => result.status === 'failed');
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

/**
 * Print the agent-facing `VERIFY RESULT` summary for a finished run.
 * Every executed, skipped, or failed command result must flow through this
 * summary instead of an early exit.
 * @param changedFiles Changed files the run was scoped to.
 * @param scope Human-readable changed-file scope description.
 * @param results Collected command results in run order.
 * @param [options] Summary overrides for tests and caller-provided context.
 * @param [options.baseRef] Changed-file base ref used by this run, when known.
 * @param [options.processEnv] Environment object used for profile resolution.
 * @param [options.ciProfileRisk] Precomputed GitHub Actions profile risk details.
 * @param [options.profileSummary] Precomputed verify profile summary details.
 * @param [options.heavyCheckTriggers] Precomputed heavy-check trigger lines.
 * @param [options.invocation] Resolved verify invocation.
 * @returns Overall run status derived from the results.
 */
export function printSummary(changedFiles, scope, results, options = {}) {
  const invocation = options.invocation ?? currentVerifyInvocation;
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
    console.log(`- ${result.label}: ${result.status}${warningSuffix} (${result.displayCommand})`);

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

/**
 * Resolve extra env for a command entry, based on prior results in this run.
 * Sets `RELEASE_ARTIFACT_SKIP_BUILD=1` for the `artifact`/`release-smoke`
 * release-only checks once the `build` check has already produced a fresh
 * production artifact in this same `pnpm verify` invocation, so a single
 * release gate does not rebuild the artifact once per check that needs it.
 * @param entry Command entry about to run.
 * @param priorResults Results already collected earlier in this run.
 * @returns Extra env to merge into the command's environment.
 */
export function getExtraEnvForEntry(entry, priorResults) {
  if (!ARTIFACT_REUSE_LABELS.has(entry.label)) {
    return {};
  }

  const buildResult = priorResults.find((result) => result.label === 'build');

  return buildResult?.status === 'passed' ? { RELEASE_ARTIFACT_SKIP_BUILD: '1' } : {};
}

/**
 * Build the child command environment for a verify entry.
 * @param entry Command entry about to run.
 * @param priorResults Results already collected earlier in this run.
 * @param [options] Environment inputs for the child command.
 * @param [options.verifyLockEnv] Env inherited from the verify lock.
 * @param [options.verifyProcessEnv] Env carrying verify-level overrides such as profile selection.
 * @param [options.expensiveLockEnv] Env added only for expensive-command lock ownership.
 * @returns Environment passed to the child process.
 */
export function buildCommandEnv(entry, priorResults, options = {}) {
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

/**
 * Resolve changed-path context only for focused invocations. Full mode is an
 * unconditional scope and must not depend on Git refs, a working tree, or file projection.
 * @param invocation Resolved verify invocation.
 * @param [deps] Test seams for changed-path execution.
 * @param [deps.resolveScope] Changed-path scope resolver.
 * @param [deps.projectChangedFiles] Changed-file projection.
 * @returns Execution context used by command planning and summary output.
 */
export function resolveVerifyChangedPathContext(invocation, deps = {}) {
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

async function main(
  verifyLockEnv = {},
  verifyLockController = { updateMetadata: () => {} },
  invocation = currentVerifyInvocation,
) {
  const onlyLabel = invocation.onlyLabel;
  const verifyProcessEnv = getVerifyProcessEnv(process.env, invocation.profile);
  const { changedFiles, scope, baseRef, packageJsonOldRef } =
    resolveVerifyChangedPathContext(invocation);
  const commands = selectOnlyCommands(
    buildCommands(changedFiles, {
      fullMode: invocation.scope.kind === 'full',
      packageJsonOldRef,
      fixMode: invocation.fixMode,
    }),
    onlyLabel,
  );
  const results = [];
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
      activeCommand:
        entry.kind === 'run'
          ? summarizeCommandForDisplay(entry.command, entry.args)
          : entry.command,
      activeLabel: entry.label,
    });

    // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
    let result;

    if (entry.weight === 'expensive') {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
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
        applyProcessResult({ signal: result.terminatedBySignal });
      }
    } else {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
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
        applyProcessResult({ signal: result.terminatedBySignal });
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

  const summary = printSummary(changedFiles, scope, results, {
    baseRef,
    processEnv: verifyProcessEnv,
    invocation,
  });
  process.exitCode = summary.hasFailed ? 1 : 0;
}

/**
 * Build persisted metadata for the top-level verify lock.
 * The structured invocation is the retry source of truth; command is display-only.
 * @param invocation Resolved verify invocation.
 * @returns Lock metadata with structured scope and a shell-safe display command.
 */
export function getVerifyLockMetadata(invocation) {
  return {
    command: formatVerifyInvocationCommand(invocation),
    verifyInvocation: invocation,
    label: 'verify',
    logPath: VERIFY_LOG_DIR,
  };
}

/**
 * Run the verify CLI when the module is executed directly.
 * @param [deps] Test seams for top-level verify execution.
 * @param [deps.runMain] Override for the main verify implementation.
 * @param [deps.withVerifyLock] Override for top-level verify locking.
 * @returns Process exit code that should be reported to the shell.
 */
export async function runVerifyCli(deps = {}) {
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

  await withVerifyLock(getVerifyLockMetadata(invocation), (verifyLockEnv, verifyLockController) =>
    runMain(verifyLockEnv, verifyLockController, invocation),
  );
  return process.exitCode ?? 0;
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
