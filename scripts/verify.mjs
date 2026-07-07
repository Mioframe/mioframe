import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import toolingConfig from '../config/tooling.json' with { type: 'json' };
import { applyProjectEnv } from './lib/projectEnv.mjs';
import { withExpensiveCommandLock, withVerifyCommandLock } from './lib/commandLock.mjs';
import { applyProcessResult } from './lib/processResult.mjs';
import { classifyCommandWeight, resolveEslintConcurrency } from './lib/commandWeight.mjs';
import { createChildSignalForwarder } from './lib/signalForward.mjs';
import { resolveAppE2EPlan } from './lib/e2eRisk.mjs';
import { isVisualRelevantPackageJsonChange } from './lib/packageJsonImpact.mjs';
import { resolvePlaywrightContainerProfile, VERIFY_PROFILE_ENV } from './playwrightContainer.mjs';

applyProjectEnv();

const cliArgs = process.argv.slice(2);
const isHelpMode = process.argv.includes('--help') || cliArgs.includes('help');
const isFixMode = process.argv.includes('--fix');
const isFixOnlyMode = process.argv.includes('--fix-only');
const isVerboseMode = process.argv.includes('--verbose');
const isFullMode = process.argv.includes('--full');
const shouldApplyFixers = isFixMode || isFixOnlyMode;
const cliFilesOverride = isHelpMode ? null : getCliFilesOverride(cliArgs);
const VERIFY_LABELS = [
  'agent-environment',
  'format',
  'oxlint',
  'eslint',
  'type-check',
  'unit-tests',
  'e2e-install',
  'e2e',
  'visual',
  'mutation',
  'release-version',
  'release-config',
  'build',
  'artifact',
  'release-smoke',
];
// Release-only labels only run in full/release mode (pnpm verify --full).
// Focused `pnpm verify` never builds these into its command list.
const FULL_ONLY_LABELS = new Set([
  'release-version',
  'release-config',
  'build',
  'artifact',
  'release-smoke',
]);
const VERIFY_DIR = '.verify';
const VERIFY_LOG_DIR = path.posix.join(VERIFY_DIR, 'logs');
const MAX_RELEVANT_LINES = 20;
const MAX_FILE_ARGS_IN_SUMMARY = 4;
const MAX_ROLLING_BUFFER_CHARS = 128 * 1024;
const HEARTBEAT_INTERVAL_MS = 60_000;
const KILL_GRACE_MS = 10_000;
const COMMAND_TIMEOUT_MS_BY_LABEL = {
  'e2e-install': 10 * 60 * 1000,
  e2e: 12 * 60 * 1000,
  visual: 15 * 60 * 1000,
  mutation: 20 * 60 * 1000,
  build: 10 * 60 * 1000,
  artifact: 8 * 60 * 1000,
  'release-smoke': 10 * 60 * 1000,
};
const cliBaseRef = isHelpMode ? null : getCliBaseRef(cliArgs);
const cliOnlyLabel = isHelpMode ? null : getCliOnlyLabel(cliArgs);
const cliProfile = isHelpMode ? null : getCliProfile(cliArgs);

if (cliOnlyLabel !== null && FULL_ONLY_LABELS.has(cliOnlyLabel) && !isFullMode) {
  throw new Error(
    `--only ${cliOnlyLabel} requires --full. Run: pnpm verify --full --only ${cliOnlyLabel}`,
  );
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
const SOURCE_EXTENSIONS = ['.ts', '.vue'];
const storybookStaticDirPrefix = `${toolingConfig.storybook.staticDir}/`;
const IGNORED_PREFIXES = [
  'node_modules/',
  'dist/',
  storybookStaticDirPrefix,
  'coverage/',
  'reports/',
  'playwright-report/',
  'test-results/',
  '.stryker-tmp/',
];
const FORMAT_LINT_IGNORED_PREFIXES = ['.github/'];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isIgnored(filePath) {
  return IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

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

function hasHeadParent() {
  const result = spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD~1'], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  return result.status === 0;
}

function runGitCommand(args, options = {}) {
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.status !== 0 && options.allowFailure !== true) {
    const command = ['git', ...args].join(' ');
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`Command failed: ${command}`);
  }

  return (result.stdout ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function getCliBaseRef(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--base') {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --base. Example: pnpm verify --base origin/develop');
      }

      return value;
    }

    if (argument.startsWith('--base=')) {
      const value = argument.slice('--base='.length);

      if (value.length === 0) {
        throw new Error('Missing value for --base. Example: pnpm verify --base origin/develop');
      }

      return value;
    }
  }

  return null;
}

function getCliOnlyLabel(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--only') {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error(`Missing value for --only. Accepted labels: ${VERIFY_LABELS.join(', ')}`);
      }

      validateOnlyLabel(value);
      return value;
    }

    if (argument.startsWith('--only=')) {
      const value = argument.slice('--only='.length);

      if (value.length === 0) {
        throw new Error(`Missing value for --only. Accepted labels: ${VERIFY_LABELS.join(', ')}`);
      }

      validateOnlyLabel(value);
      return value;
    }
  }

  return null;
}

function getCliProfile(argv) {
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--profile') {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --profile. Accepted profiles: local, github-actions');
      }

      validateProfile(value);
      return value;
    }

    if (argument.startsWith('--profile=')) {
      const value = argument.slice('--profile='.length);

      if (value.length === 0) {
        throw new Error('Missing value for --profile. Accepted profiles: local, github-actions');
      }

      validateProfile(value);
      return value;
    }
  }

  return null;
}

function validateProfile(profile) {
  if (profile === 'local' || profile === 'github-actions') {
    return;
  }

  throw new Error(
    [`Invalid value for --profile: ${profile}`, 'Accepted profiles: local, github-actions'].join(
      '\n',
    ),
  );
}

/**
 * Parse explicit file overrides from the verify CLI.
 * @param argv Raw CLI arguments after the script name.
 * @returns Explicit file list, or null when `--files` was not provided.
 */
export function getCliFilesOverride(argv) {
  const explicitFiles = [];
  let hasExplicitFilesFlag = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--files') {
      hasExplicitFilesFlag = true;
      let cursor = index + 1;

      if (cursor >= argv.length || argv[cursor].startsWith('--')) {
        throw new Error(
          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
        );
      }

      while (cursor < argv.length && !argv[cursor].startsWith('--')) {
        explicitFiles.push(argv[cursor]);
        cursor += 1;
      }

      index = cursor - 1;
      continue;
    }

    if (argument.startsWith('--files=')) {
      hasExplicitFilesFlag = true;
      const value = argument.slice('--files='.length);

      if (value.length === 0) {
        throw new Error(
          'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
        );
      }

      explicitFiles.push(
        ...value
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      );
    }
  }

  if (hasExplicitFilesFlag && explicitFiles.length === 0) {
    throw new Error(
      'Missing value for --files. Example: pnpm verify --only eslint --files src/foo.ts',
    );
  }

  if (explicitFiles.length === 0) {
    return null;
  }

  return uniqSorted(explicitFiles.map(toPosixPath));
}

function validateOnlyLabel(label) {
  if (VERIFY_LABELS.includes(label)) {
    return;
  }

  throw new Error(
    [`Invalid value for --only: ${label}`, `Accepted labels: ${VERIFY_LABELS.join(', ')}`].join(
      '\n',
    ),
  );
}

function ensureBaseRefExists(baseRef) {
  const result = spawnSync('git', ['rev-parse', '--verify', baseRef], {
    encoding: 'utf8',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  if (result.status === 0) {
    return;
  }

  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  throw new Error(
    [
      `Base ref does not exist: ${baseRef}`,
      'Fetch the branch and try again:',
      'git fetch origin',
      `pnpm verify --base ${baseRef}`,
    ].join('\n'),
  );
}

function getForkPoint(baseRef) {
  const forkPoint = runGitCommand(['merge-base', '--fork-point', baseRef, 'HEAD'], {
    allowFailure: true,
  })[0];

  if (forkPoint) {
    return forkPoint;
  }

  const mergeBase = runGitCommand(['merge-base', baseRef, 'HEAD'], {
    allowFailure: true,
  })[0];

  if (mergeBase) {
    return mergeBase;
  }

  throw new Error(
    [
      `Cannot determine fork point for base ref: ${baseRef}`,
      'Both commands failed:',
      `git merge-base --fork-point ${baseRef} HEAD`,
      `git merge-base ${baseRef} HEAD`,
    ].join('\n'),
  );
}

function getChangedFiles() {
  if (cliFilesOverride !== null) {
    return {
      changedFiles: uniqSorted(cliFilesOverride),
      scope: 'explicit-files',
      baseRef: null,
      // No reliable single base ref for an explicit --files list.
      packageJsonOldRef: null,
    };
  }

  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const envBaseRef = getVerifyBaseRef();
  let changedFiles = [];
  let scope = 'local-changes';
  let packageJsonOldRef = 'HEAD';

  if (githubBaseRef) {
    const mergeBase = runGitCommand(['merge-base', 'HEAD', `origin/${githubBaseRef}`], {
      allowFailure: false,
    })[0];

    changedFiles = runGitCommand([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${mergeBase}...HEAD`,
      '--',
    ]);
    return {
      changedFiles: uniqSorted(
        changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)),
      ),
      scope: `github-base origin/${githubBaseRef}`,
      baseRef: `origin/${githubBaseRef}`,
      packageJsonOldRef: mergeBase,
    };
  } else if (cliBaseRef || envBaseRef) {
    const baseRef = cliBaseRef ?? envBaseRef;
    ensureBaseRefExists(baseRef);

    const forkPoint = getForkPoint(baseRef);

    changedFiles = [
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', `${forkPoint}...HEAD`, '--']),
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--']),
      ...runGitCommand(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--']),
      ...runGitCommand(['ls-files', '--others', '--exclude-standard']),
    ];
    return {
      changedFiles: uniqSorted(
        changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)),
      ),
      scope: `local-base ${baseRef}`,
      baseRef,
      packageJsonOldRef: forkPoint,
    };
  } else {
    changedFiles = [
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD', '--']),
      ...runGitCommand(['diff', '--cached', '--name-only', '--diff-filter=ACMR', '--']),
      ...runGitCommand(['ls-files', '--others', '--exclude-standard']),
    ];

    if (changedFiles.length === 0 && hasHeadParent()) {
      changedFiles = runGitCommand([
        'diff',
        '--name-only',
        '--diff-filter=ACMR',
        'HEAD~1..HEAD',
        '--',
      ]);
      scope = 'local-last-commit';
      packageJsonOldRef = 'HEAD~1';
    }
  }

  return {
    changedFiles: uniqSorted(
      changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)),
    ),
    scope,
    baseRef: null,
    packageJsonOldRef,
  };
}

/**
 * Read the verify base ref from the current process environment.
 * @param processEnv Environment object to read from.
 * @returns Base ref value, or null when VERIFY_BASE is unset.
 */
export function getVerifyBaseRef(processEnv = process.env) {
  return processEnv.VERIFY_BASE ?? null;
}

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

function quoteArg(value) {
  return /^[A-Za-z0-9_./:-]+$/.test(value) ? value : JSON.stringify(value);
}

function formatCommand(command, args) {
  return [command, ...args].map(quoteArg).join(' ');
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
  console.log('  --base <ref>        Verify changes against a local base ref.');
  console.log('                      Local-only default: set VERIFY_BASE in .env.local.');
  console.log('  --profile <name>    Override the verify runtime profile.');
  console.log(`                      Env alternative: ${VERIFY_PROFILE_ENV}=local|github-actions.`);
  console.log('  --only <label>      Run one focused verification check.');
  console.log('  --files <paths...>  Override changed-file detection with an explicit file list.');
  console.log(
    '  --full              Full-project release mode: ignore changed-file scope, run every',
  );
  console.log(
    '                      check unconditionally, plus release-version/release-config/build/',
  );
  console.log('                      artifact/release-smoke. Equivalent to `pnpm verify:release`.');
  console.log('');
  console.log('Labels for --only:');

  for (const label of VERIFY_LABELS) {
    console.log(`  ${label}${FULL_ONLY_LABELS.has(label) ? ' (requires --full)' : ''}`);
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
  console.log('  - In GitHub Actions, verify scope is based on GITHUB_BASE_REF.');
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

function getVerifyProcessEnv(baseEnv = process.env) {
  if (cliProfile === null) {
    return baseEnv;
  }

  return {
    ...baseEnv,
    [VERIFY_PROFILE_ENV]: cliProfile,
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

const PLAYWRIGHT_RISK_KEYS = [
  'cpus',
  'memory',
  'memorySwap',
  'pidsLimit',
  'workers',
  'timeoutSeconds',
];

/**
 * Detect unresolved GitHub Actions Playwright profile risk after a local pass.
 * @param results Collected command results in run order.
 * @param [processEnv] Environment object used for profile resolution.
 * @returns Risk details when local Playwright settings differ from GitHub Actions.
 */
export function getCiProfileRisk(results, processEnv = process.env) {
  const relevantLabels = new Set(['e2e', 'visual']);
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
  const differences = [];

  for (const key of PLAYWRIGHT_RISK_KEYS) {
    if (activeProfile[key] === githubActionsProfile[key]) {
      continue;
    }

    const label =
      key === 'memorySwap'
        ? 'memory-swap'
        : key === 'pidsLimit'
          ? 'pids-limit'
          : key === 'timeoutSeconds'
            ? 'timeout'
            : key;
    differences.push(`${label}: ${activeProfile[key]} -> ${githubActionsProfile[key]}`);
  }

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

async function runCommand(label, command, args, extraEnv = {}) {
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

    if (isVerboseMode) {
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

    if (isVerboseMode) {
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
  { fullMode = isFullMode, packageJsonOldRef = null } = {},
) {
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
  const appE2EPlan = resolveAppE2EPlan(changedFiles);
  const mutationScope = getMutationScope(changedFiles);
  const commands = [];
  const eslintConcurrency = resolveEslintConcurrency();

  commands.push({
    kind: 'run',
    label: 'agent-environment',
    command: 'node',
    args: ['scripts/agentEnvironment.mjs', shouldApplyFixers ? '--fix' : '--check'],
  });

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', ...(shouldApplyFixers ? [] : ['--check']), '.'],
    });
  } else if (formattableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', ...(shouldApplyFixers ? [] : ['--check']), ...formattableFiles],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'format',
      command: `pnpm exec oxfmt${shouldApplyFixers ? '' : ' --check'}`,
      reason: 'no changed formattable existing files',
    });
  }

  if (fullMode) {
    commands.push({
      kind: 'run',
      label: 'oxlint',
      command: 'pnpm',
      args: ['exec', 'oxlint', ...(shouldApplyFixers ? ['--fix'] : []), '.'],
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
        ...(shouldApplyFixers ? ['--fix'] : []),
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
      args: ['exec', 'oxlint', ...(shouldApplyFixers ? ['--fix'] : []), ...lintableFiles],
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
        ...(shouldApplyFixers ? ['--fix'] : []),
        `--concurrency=${eslintConcurrency}`,
        ...lintableFiles,
      ],
      weight: classifyCommandWeight({ label: 'eslint', fileCount: lintableFiles.length }),
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'oxlint',
      command: `pnpm exec oxlint${shouldApplyFixers ? ' --fix' : ''}`,
      reason: 'no changed lintable existing files',
    });
    commands.push({
      kind: 'skipped',
      label: 'eslint',
      command: `pnpm exec eslint --cache${shouldApplyFixers ? ' --fix' : ''} --concurrency=${eslintConcurrency}`,
      reason: 'no changed lintable existing files',
    });
  }

  if (isFixOnlyMode) {
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

  if (fullMode) {
    addE2ECommands(commands, createE2ECommand([], 'full-project release verification'));
  } else if (appE2EPlan.mode === 'invalid') {
    commands.push(createE2EInstallCommand('app e2e scope is invalid; e2e check fails closed'));
    commands.push({
      kind: 'failed',
      label: 'e2e',
      command: 'pnpm e2e:container',
      reason: `invalid app e2e scenario registry state: ${appE2EPlan.reasons.join('; ')}`,
    });
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

function selectOnlyCommands(commands) {
  if (cliOnlyLabel === null) {
    return commands;
  }

  const selectedCommands = commands.filter((entry) => entry.label === cliOnlyLabel);

  if (selectedCommands.length > 0) {
    return selectedCommands;
  }

  if (cliOnlyLabel === 'e2e-install') {
    return [createE2EInstallCommand('empty e2e scope')];
  }

  throw new Error(`Verify command list is missing required label: ${cliOnlyLabel}`);
}

/**
 * Build the `action required` lines for the verify summary.
 * @param results Collected command results in run order.
 * @param [options] Summary options.
 * @param [options.ciProfileRisk] Pending GitHub Actions profile risk details.
 * @returns Action lines; `['None.']` when nothing failed or warned.
 */
export function getActionRequired(results, options = {}) {
  const { ciProfileRisk = null } = options;
  const actions = [];
  const failedResults = results.filter((result) => result.status === 'failed');
  const warningResults = results.filter(
    (result) => result.status !== 'failed' && result.hasWarnings,
  );

  for (const result of failedResults) {
    actions.push(`Fix failed ${result.label} errors. Run: ${result.command}`);

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
    actions.push(`After fixes, run: pnpm verify${isFixMode ? ' --fix' : ''}`);
  }

  for (const result of warningResults) {
    actions.push(`Fix ${result.label} warnings. Run: ${result.command}`);
    actions.push(`Reason: ${result.warningSummary}`);
  }

  if (ciProfileRisk !== null) {
    const rerunChecks = ciProfileRisk.affectedChecks
      .map((label) => `pnpm verify --profile github-actions --only ${label}`)
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
 * @returns Overall run status derived from the results.
 */
export function printSummary(changedFiles, scope, results, options = {}) {
  const hasFailed = results.some((result) => result.status === 'failed');
  const processEnv = options.processEnv ?? getVerifyProcessEnv(process.env);
  const ciProfileRisk = options.ciProfileRisk ?? getCiProfileRisk(results, processEnv);
  const { environment, profile } = options.profileSummary ?? getProfileSummary(processEnv);
  const status = hasFailed ? 'failed' : 'passed';
  const displayStatus = hasFailed
    ? 'failed ❌'
    : ciProfileRisk === null
      ? 'passed ✅'
      : 'passed with CI-profile risk ⚠️';
  const actionRequired = getActionRequired(results, { ciProfileRisk });
  const mode = isFixOnlyMode ? 'fix-only' : isFixMode ? 'fix' : 'check';
  const heavyCheckTriggers = options.heavyCheckTriggers ?? getHeavyCheckTriggerLines(results);
  const baseRef = options.baseRef ?? null;
  const runnableResults = results.filter((result) => result.status !== 'skipped');
  const skippedResults = results.filter((result) => result.status === 'skipped');

  console.log('\nVERIFY RESULT');
  console.log(`mode: ${mode}`);
  console.log(`environment: ${environment}`);
  console.log(`profile: ${profile.name} (source: ${profile.source})`);
  console.log(`release: ${isFullMode ? 'full-project (pnpm verify --full)' : 'off'}`);
  console.log(`verbose: ${isVerboseMode ? 'on' : 'off'}`);
  console.log(`only: ${cliOnlyLabel ?? 'all'}`);
  console.log(`scope: ${isFullMode ? 'full-project (changed-file scope ignored)' : scope}`);
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

async function main(verifyLockEnv = {}, verifyLockController = { updateMetadata: () => {} }) {
  if (isFixMode && isFixOnlyMode) {
    throw new Error('Use either --fix or --fix-only, not both.');
  }

  const verifyProcessEnv = getVerifyProcessEnv(process.env);
  const { changedFiles, scope, baseRef, packageJsonOldRef } = getChangedFiles();
  const commands = selectOnlyCommands(buildCommands(changedFiles, { packageJsonOldRef }));
  const results = [];
  let hasFailed = false;
  const runnableCommands = commands.filter((entry) => entry.kind === 'run');
  const totalRunnableChecks = runnableCommands.length;
  let completedRunnableChecks = 0;
  ensureLogsDirectory(cliOnlyLabel === null ? null : commands.map((entry) => entry.label));

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

    if (cliOnlyLabel === null) {
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
    const extraEnv = getExtraEnvForEntry(entry, results);

    if (entry.weight === 'expensive') {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      result = await withExpensiveCommandLock(
        {
          label: entry.label,
          command: formatCommand(entry.command, entry.args),
        },
        async (lockEnv) =>
          runCommand(entry.label, entry.command, entry.args, {
            ...verifyLockEnv,
            ...verifyProcessEnv,
            ...lockEnv,
            ...extraEnv,
          }),
      );

      // Signal propagation must happen after withExpensiveCommandLock cleanup,
      // not inside the child close handler, so lock release completes before
      // the process receives the termination signal.
      if (result.terminatedBySignal) {
        applyProcessResult({ signal: result.terminatedBySignal });
      }
    } else {
      // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
      result = await runCommand(entry.label, entry.command, entry.args, {
        ...verifyLockEnv,
        ...verifyProcessEnv,
        ...extraEnv,
      });

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
  });
  process.exitCode = summary.hasFailed ? 1 : 0;
}

/**
 * Run the verify CLI when the module is executed directly.
 * @param [deps] Test seams for top-level verify execution.
 * @param [deps.runMain] Override for the main verify implementation.
 * @param [deps.withVerifyLock] Override for top-level verify locking.
 * @returns Process exit code that should be reported to the shell.
 */
export async function runVerifyCli(deps = {}) {
  const { runMain = main, withVerifyLock = withVerifyCommandLock } = deps;

  if (isHelpMode) {
    printHelp();
    return 0;
  }

  if (!directoryExists('.git')) {
    throw new Error('Repository root is required to run verify.');
  }

  await withVerifyLock(
    {
      command: ['pnpm', 'verify', ...cliArgs].join(' ').trim(),
      label: 'verify',
      logPath: VERIFY_LOG_DIR,
    },
    (verifyLockEnv, verifyLockController) => runMain(verifyLockEnv, verifyLockController),
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
