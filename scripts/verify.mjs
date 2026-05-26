import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const isFixMode = process.argv.includes('--fix');
const isFixOnlyMode = process.argv.includes('--fix-only');
const isVerboseMode = process.argv.includes('--verbose');
const shouldApplyFixers = isFixMode || isFixOnlyMode;
const cliBaseRef = getCliBaseRef(process.argv.slice(2));
const VERIFY_DIR = '.verify';
const VERIFY_LOG_DIR = path.posix.join(VERIFY_DIR, 'logs');
const MAX_RELEVANT_LINES = 20;
const MAX_FILE_ARGS_IN_SUMMARY = 4;
const MAX_ROLLING_BUFFER_CHARS = 128 * 1024;
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
const CI_AUTOFIX_IGNORED_PREFIXES = ['.github/'];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isIgnored(filePath) {
  return IGNORED_PREFIXES.some(
    (prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix),
  );
}

function isCiAutofixIgnored(filePath) {
  return CI_AUTOFIX_IGNORED_PREFIXES.some(
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
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const envBaseRef = process.env.VERIFY_BASE;
  let changedFiles = [];
  let scope = 'local-changes';

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
    scope = `github-base origin/${githubBaseRef}`;
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
    scope = `local-base ${baseRef}`;
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
    }
  }

  return {
    changedFiles: uniqSorted(
      changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)),
    ),
    scope,
  };
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

function getAllSiblingTestFiles(filePath) {
  if (!filePath.startsWith('src/')) {
    return [];
  }

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
    // directory read failure — fall through to empty array
  }

  return uniqSorted(testCandidates);
}

function getVitestScope(changedFiles) {
  const scope = [];

  for (const filePath of changedFiles) {
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

function isVisualRelevantFile(filePath) {
  return (
    filePath === 'config/tooling.json' ||
    filePath === 'playwright.visual.config.ts' ||
    filePath === 'vite.config.ts' ||
    filePath === 'package.json' ||
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

function ensureLogsDirectory() {
  fs.rmSync(VERIFY_LOG_DIR, { recursive: true, force: true });
  fs.mkdirSync(VERIFY_LOG_DIR, { recursive: true });
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

async function runCommand(label, command, args) {
  const formattedCommand = formatCommand(command, args);
  const displayCommand = summarizeCommandForDisplay(command, args);
  const logPath = getLogPath(label);
  const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });
  logStream.write(`# command\n${formattedCommand}\n\n# output\n`);

  console.log(`\n[${label}] running ${displayCommand}`);

  const child = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  let outputBuffer = '';
  let exitCode = 1;
  let spawnError = null;

  const onStdout = (chunk) => {
    const text = chunk.toString();
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);

    if (isVerboseMode) {
      process.stdout.write(chunk);
    }
  };

  const onStderr = (chunk) => {
    const text = chunk.toString();
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);

    if (isVerboseMode) {
      process.stderr.write(chunk);
    }
  };

  child.stdout?.on('data', onStdout);
  child.stderr?.on('data', onStderr);

  await new Promise((resolve) => {
    child.once('error', (error) => {
      spawnError = error;
      logStream.write(`\n[verify] spawn error: ${error.message}\n`);
      resolve();
    });

    child.once('close', (code) => {
      exitCode = code ?? 1;
      resolve();
    });
  });

  await closeLogStream(logStream);

  if (spawnError) {
    throw spawnError;
  }

  const logOutput = fs.readFileSync(logPath, 'utf8');
  const warningSummary = getWarningSummary(label, logOutput);
  const status = exitCode === 0 ? 'passed' : 'failed';

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
  };
}

function buildCommands(changedFiles) {
  const existingChangedFiles = changedFiles.filter(fileExists);
  const fixerChangedFiles = isFixOnlyMode
    ? existingChangedFiles.filter((filePath) => !isCiAutofixIgnored(filePath))
    : existingChangedFiles;
  const formattableFiles = fixerChangedFiles.filter((filePath) =>
    FORMATTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const lintableFiles = fixerChangedFiles.filter((filePath) =>
    LINTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const vitestScope = getVitestScope(changedFiles);
  const changedVisualSpecs = changedFiles.filter(
    (filePath) =>
      filePath.startsWith('tests/e2e/visual/') && filePath.endsWith('.ts') && fileExists(filePath),
  );
  const hasVisualRelevantChanges = changedFiles.some(isVisualRelevantFile);
  const changedE2ESpecs = changedFiles.filter(
    (filePath) =>
      filePath.startsWith('tests/e2e/') &&
      !filePath.startsWith('tests/e2e/visual/') &&
      filePath.endsWith('.ts') &&
      fileExists(filePath),
  );
  const mutationScope = getMutationScope(changedFiles);
  const commands = [];

  if (formattableFiles.length > 0) {
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

  if (lintableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'oxlint',
      command: 'pnpm',
      args: ['exec', 'oxlint', ...(shouldApplyFixers ? ['--fix'] : []), ...lintableFiles],
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
        '--concurrency=auto',
        ...lintableFiles,
      ],
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
      command: `pnpm exec eslint --cache${shouldApplyFixers ? ' --fix' : ''} --concurrency=auto`,
      reason: 'no changed lintable existing files',
    });
  }

  if (isFixOnlyMode) {
    return commands;
  }

  if (changedFiles.some(isTypeCheckTarget)) {
    commands.push({ kind: 'run', label: 'type-check', command: 'pnpm', args: ['type-check'] });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'type-check',
      command: 'pnpm type-check',
      reason: 'no type-check relevant changes',
    });
  }

  if (vitestScope.length > 0) {
    commands.push({
      kind: 'run',
      label: 'unit-tests',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', ...vitestScope],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'unit-tests',
      command: 'pnpm exec vitest run',
      reason: 'empty focused unit-test scope',
    });
  }

  if (changedFiles.includes('playwright.config.ts')) {
    commands.push({ kind: 'run', label: 'e2e', command: 'pnpm', args: ['e2e'] });
  } else if (changedE2ESpecs.length > 0) {
    commands.push({
      kind: 'run',
      label: 'e2e',
      command: 'pnpm',
      args: ['exec', 'playwright', 'test', ...changedE2ESpecs],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'e2e',
      command: 'pnpm exec playwright test',
      reason: 'empty e2e scope',
    });
  }

  if (hasVisualRelevantChanges || changedVisualSpecs.length > 0) {
    commands.push({
      kind: 'run',
      label: 'visual',
      command: 'pnpm',
      args: ['test:visual'],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'visual',
      command: 'pnpm test:visual',
      reason: 'empty visual scope',
    });
  }

  if (mutationScope.length > 0) {
    commands.push({
      kind: 'run',
      label: 'mutation',
      command: 'pnpm',
      args: ['exec', 'stryker', 'run', '-m', mutationScope.join(',')],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'mutation',
      command: 'pnpm exec stryker run -m <source file>',
      reason: 'empty mutation scope',
    });
  }

  return commands;
}

function getActionRequired(results) {
  const actions = [];
  const failedResults = results.filter((result) => result.status === 'failed');
  const warningResults = results.filter(
    (result) => result.status !== 'failed' && result.hasWarnings,
  );

  for (const result of failedResults) {
    actions.push(`Fix failed ${result.label} errors. Run: ${result.command}`);
  }

  if (failedResults.length > 0) {
    actions.push(`After fixes, run: pnpm verify${isFixMode ? ' --fix' : ''}`);
  }

  for (const result of warningResults) {
    actions.push(`Fix ${result.label} warnings. Run: ${result.command}`);
    actions.push(`Reason: ${result.warningSummary}`);
  }

  if (actions.length === 0) {
    actions.push('None.');
  }

  return actions;
}

function printSummary(changedFiles, scope, results) {
  const hasFailed = results.some((result) => result.status === 'failed');
  const status = hasFailed ? 'failed' : 'passed';
  const displayStatus = hasFailed ? 'failed ❌' : 'passed ✅';
  const actionRequired = getActionRequired(results);
  const mode = isFixOnlyMode ? 'fix-only' : isFixMode ? 'fix' : 'check';

  console.log('\nVERIFY RESULT');
  console.log(`mode: ${mode}`);
  console.log(`verbose: ${isVerboseMode ? 'on' : 'off'}`);
  console.log(`scope: ${scope}`);
  console.log(`changed files: ${changedFiles.length}`);
  console.log(`status: ${displayStatus}`);
  console.log(`logs: ${VERIFY_LOG_DIR}`);
  console.log('commands:');

  for (const result of results) {
    if (result.status === 'skipped') {
      console.log(`- ${result.label}: skipped (${result.reason})`);
      continue;
    }

    const warningSuffix = result.hasWarnings ? ' (warnings found)' : '';
    console.log(`- ${result.label}: ${result.status}${warningSuffix} (${result.displayCommand})`);
  }

  console.log('action required:');

  for (const action of actionRequired) {
    console.log(`- ${action}`);
  }

  return {
    status,
    hasFailed,
  };
}

async function main() {
  if (isFixMode && isFixOnlyMode) {
    throw new Error('Use either --fix or --fix-only, not both.');
  }

  const { changedFiles, scope } = getChangedFiles();
  const commands = buildCommands(changedFiles);
  const results = [];
  ensureLogsDirectory();

  for (const entry of commands) {
    if (entry.kind === 'skipped') {
      results.push({
        label: entry.label,
        command: entry.command,
        status: 'skipped',
        reason: entry.reason,
        exitCode: null,
        stdout: '',
        stderr: '',
        hasWarnings: false,
        warningSummary: '',
      });
      continue;
    }

    // oxlint-disable-next-line no-await-in-loop -- verify checks must run sequentially for stable summary/log ordering.
    results.push(await runCommand(entry.label, entry.command, entry.args));
  }

  const summary = printSummary(changedFiles, scope, results);
  process.exitCode = summary.hasFailed ? 1 : 0;
}

if (!directoryExists('.git')) {
  throw new Error('Repository root is required to run verify.');
}

await main();
