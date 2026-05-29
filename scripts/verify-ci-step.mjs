import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import toolingConfig from '../config/tooling.json' with { type: 'json' };

const argv = process.argv.slice(2);
const isFixMode = argv.includes('--fix');
const isFixOnlyMode = argv.includes('--fix-only');
const isVerboseMode = argv.includes('--verbose');
const isCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const shouldApplyFixers = isFixMode || isFixOnlyMode;
const VERIFY_LOG_DIR = '.verify/logs';
const MAX_RELEVANT_LINES = 20;
const MAX_FILE_ARGS_IN_SUMMARY = 4;
const MAX_ROLLING_BUFFER_CHARS = 128 * 1024;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const KILL_GRACE_MS = 10 * 1000;
const EXPENSIVE_SKIP_REASON = 'previous check failed; skipped expensive verification to save CI minutes';
const VALID_COMMAND_LABELS = ['format', 'oxlint', 'eslint', 'type-check', 'unit-tests', 'e2e-install', 'e2e', 'visual', 'mutation'];
const COMMAND_TIMEOUT_MS_BY_LABEL = new Map([
  ['e2e-install', 10 * 60 * 1000],
  ['e2e', 12 * 60 * 1000],
  ['visual', 15 * 60 * 1000],
  ['mutation', 12 * 60 * 1000],
]);
const DISPLAY_COMMAND_BY_LABEL = new Map([
  ['format', 'pnpm exec oxfmt --check'],
  ['oxlint', 'pnpm exec oxlint'],
  ['eslint', 'pnpm exec eslint --cache --concurrency=auto'],
  ['type-check', 'pnpm type-check'],
  ['unit-tests', 'pnpm exec vitest run'],
  ['e2e-install', 'pnpm e2e:install'],
  ['e2e', 'pnpm exec playwright test'],
  ['visual', 'pnpm test:visual'],
  ['mutation', 'pnpm exec stryker run -m <source file>'],
]);
const FORMATTABLE_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.jsx', '.md', '.mjs', '.mts', '.scss', '.ts', '.tsx', '.vue', '.yaml', '.yml']);
const LINTABLE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx', '.vue']);
const SOURCE_EXTENSIONS = ['.ts', '.vue'];
const IGNORED_PREFIXES = ['node_modules/', 'dist/', `${toolingConfig.storybook.staticDir}/`, 'coverage/', 'reports/', 'playwright-report/', 'test-results/', '.stryker-tmp/'];
const FORMAT_LINT_IGNORED_PREFIXES = ['.github/'];
const cliBaseRef = getCliValue(argv, '--base', 'Missing value for --base. Example: pnpm verify --base origin/develop');
const onlyLabels = getCliOnlyLabels(argv);

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function hasPrefix(filePath, prefixes) {
  return prefixes.some((prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix));
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

function runGitCommand(args, options = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
  if (result.status !== 0 && options.allowFailure !== true) {
    process.stdout.write(result.stdout ?? '');
    process.stderr.write(result.stderr ?? '');
    throw new Error(`Command failed: ${['git', ...args].join(' ')}`);
  }

  return (result.stdout ?? '').split('\n').map((line) => line.trim()).filter(Boolean);
}

function getCliValue(args, name, errorMessage) {
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === name) {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(errorMessage);
      }
      return value;
    }
    if (argument.startsWith(`${name}=`)) {
      const value = argument.slice(name.length + 1);
      if (!value) {
        throw new Error(errorMessage);
      }
      return value;
    }
  }

  return null;
}

function getCliOnlyLabels(args) {
  const labels = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--only') {
      const value = args[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error('Missing value for --only. Example: pnpm verify --only type-check');
      }
      labels.push(...value.split(','));
      index += 1;
    } else if (argument.startsWith('--only=')) {
      labels.push(...argument.slice('--only='.length).split(','));
    }
  }

  const normalized = labels.map((label) => label.trim()).filter(Boolean);
  for (const label of normalized) {
    if (!VALID_COMMAND_LABELS.includes(label)) {
      throw new Error(`Unknown --only check: ${label}. Expected one of: ${VALID_COMMAND_LABELS.join(', ')}`);
    }
  }

  return VALID_COMMAND_LABELS.filter((label) => normalized.includes(label));
}

function ensureBaseRefExists(baseRef) {
  const result = spawnSync('git', ['rev-parse', '--verify', baseRef], { encoding: 'utf8', stdio: ['inherit', 'pipe', 'pipe'] });
  if (result.status === 0) {
    return;
  }
  process.stdout.write(result.stdout ?? '');
  process.stderr.write(result.stderr ?? '');
  throw new Error([`Base ref does not exist: ${baseRef}`, 'Fetch the branch and try again:', 'git fetch origin', `pnpm verify --base ${baseRef}`].join('\n'));
}

function getForkPoint(baseRef) {
  return runGitCommand(['merge-base', '--fork-point', baseRef, 'HEAD'], { allowFailure: true })[0]
    ?? runGitCommand(['merge-base', baseRef, 'HEAD'], { allowFailure: true })[0]
    ?? (() => { throw new Error(`Cannot determine fork point for base ref: ${baseRef}`); })();
}

function getChangedFiles() {
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  const envBaseRef = process.env.VERIFY_BASE;
  let changedFiles = [];
  let scope = 'local-changes';

  if (githubBaseRef) {
    const mergeBase = runGitCommand(['merge-base', 'HEAD', `origin/${githubBaseRef}`])[0];
    changedFiles = runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', `${mergeBase}...HEAD`, '--']);
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
    if (changedFiles.length === 0 && spawnSync('git', ['rev-parse', '--verify', '--quiet', 'HEAD~1']).status === 0) {
      changedFiles = runGitCommand(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1..HEAD', '--']);
      scope = 'local-last-commit';
    }
  }

  return { changedFiles: uniqSorted(changedFiles.map(toPosixPath).filter((filePath) => !hasPrefix(filePath, IGNORED_PREFIXES))), scope };
}

function isTypeCheckTarget(filePath) {
  const baseName = path.posix.basename(filePath);
  return filePath === 'package.json'
    || filePath === 'config/tooling.json'
    || filePath === 'pnpm-lock.yaml'
    || filePath === 'env.d.ts'
    || filePath === 'vite-env.d.ts'
    || (filePath.startsWith('src/') && SOURCE_EXTENSIONS.some((extension) => filePath.endsWith(extension)))
    || (filePath.startsWith('tests/') && filePath.endsWith('.ts'))
    || (baseName.startsWith('tsconfig') && baseName.endsWith('.json'))
    || baseName.includes('.config.');
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

  const exactMatch = `${filePath.slice(0, -extension.length)}.test.ts`;
  if (fileExists(exactMatch)) {
    return [exactMatch];
  }

  const baseName = path.posix.basename(filePath, extension);
  const dirPath = path.posix.dirname(filePath);
  try {
    return uniqSorted(fs.readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.test.ts') && entry.name.slice(0, -'.test.ts'.length).split('.')[0] === baseName)
      .map((entry) => path.posix.join(dirPath, entry.name)));
  } catch {
    return [];
  }
}

function getVitestScope(changedFiles) {
  return uniqSorted(changedFiles.flatMap(getAllSiblingTestFiles));
}

function isVisualRelevantFile(filePath) {
  return filePath === 'config/tooling.json'
    || filePath === 'playwright.visual.config.ts'
    || filePath === 'vite.config.ts'
    || filePath === 'package.json'
    || filePath === 'tsconfig.storybook.json'
    || filePath === 'scripts/storybook.mjs'
    || filePath === 'src/app/styles/styles.css'
    || filePath === 'src/app/styles/fonts.css'
    || filePath.startsWith('.storybook/')
    || filePath.startsWith('tests/e2e/visual/')
    || filePath.startsWith('src/shared/ui/')
    || filePath.startsWith('src/shared/lib/md/')
    || /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/.test(filePath);
}

function getMutationSourceCandidate(testFilePath) {
  const basePath = testFilePath.slice(0, -'.test.ts'.length);
  const dirPath = path.posix.dirname(testFilePath);
  const baseName = path.posix.basename(basePath);
  for (const candidateBase of [basePath, `${dirPath}/${baseName.split('.').slice(0, -1).join('.')}`]) {
    for (const extension of SOURCE_EXTENSIONS) {
      const candidate = `${candidateBase}${extension}`;
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
      if (candidate && !candidate.startsWith('src/shared/ui/')) {
        scope.push(candidate);
      }
    } else if (filePath.startsWith('src/') && !filePath.startsWith('src/shared/ui/') && SOURCE_EXTENSIONS.includes(path.posix.extname(filePath)) && getAllSiblingTestFiles(filePath).length > 0) {
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

function ensureLogsDirectory(labelsToReset) {
  if (!labelsToReset) {
    fs.rmSync(VERIFY_LOG_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(VERIFY_LOG_DIR, { recursive: true });
  for (const label of labelsToReset ?? []) {
    fs.rmSync(getLogPath(label), { force: true });
  }
}

function appendToRollingBuffer(buffer, chunk) {
  const nextBuffer = `${buffer}${chunk}`;
  return nextBuffer.length <= MAX_ROLLING_BUFFER_CHARS ? nextBuffer : nextBuffer.slice(-MAX_ROLLING_BUFFER_CHARS);
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
    } else {
      otherArgs.push(arg);
    }
  }
  if (groupedFileArgs.length === 0) {
    return formatCommand(command, args);
  }
  const remainingCount = groupedFileArgs.length - MAX_FILE_ARGS_IN_SUMMARY;
  return formatCommand(command, [...otherArgs, ...groupedFileArgs.slice(0, MAX_FILE_ARGS_IN_SUMMARY), ...(remainingCount > 0 ? [`<+${remainingCount} files>`] : [])]);
}

function getOutputTail(output) {
  const lines = output.split('\n').map((line) => line.trimEnd()).filter((line) => line.trim().length > 0);
  return lines.length === 0 ? ['(no output captured)'] : lines.slice(-MAX_RELEVANT_LINES);
}

function getWarningSummary(label, output) {
  if (!['oxlint', 'eslint'].includes(label)) {
    return '';
  }
  const lines = output.split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .filter((line) => /\bwarnings?\b/i.test(line))
    .filter((line) => !( /\b0 warnings?\b/i.test(line) && !/\b[1-9]\d* warnings?\b/i.test(line) ));

  return uniqSorted(lines).slice(0, 3).join(' | ');
}

function formatDuration(milliseconds) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(seconds / 60);
  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds % 60}s`;
}

function terminateChildProcess(child, signal) {
  if (child.exitCode !== null) {
    return;
  }
  child.kill(signal);
}

async function runCommand(label, command, args) {
  const formattedCommand = formatCommand(command, args);
  const displayCommand = summarizeCommandForDisplay(command, args);
  const logPath = getLogPath(label);
  const timeoutMs = COMMAND_TIMEOUT_MS_BY_LABEL.get(label) ?? null;
  const logStream = fs.createWriteStream(logPath, { encoding: 'utf8' });
  logStream.write(`# command\n${formattedCommand}\n\n# output\n`);
  console.log(`\n[${label}] running ${displayCommand}${timeoutMs ? ` (timeout ${formatDuration(timeoutMs)})` : ''}`);

  const child = spawn(command, args, { stdio: ['inherit', 'pipe', 'pipe'] });
  const startedAt = Date.now();
  let lastOutputAt = startedAt;
  let outputBuffer = '';
  let exitCode = 1;
  let spawnError = null;
  let timedOut = false;
  const heartbeatTimer = setInterval(() => {
    const message = `[${label}] still running after ${formatDuration(Date.now() - startedAt)}; last output ${formatDuration(Date.now() - lastOutputAt)} ago`;
    logStream.write(`\n${message}\n`);
    console.log(message);
  }, HEARTBEAT_INTERVAL_MS);
  let killTimer = null;
  const timeoutTimer = timeoutMs ? setTimeout(() => {
    timedOut = true;
    const message = `[${label}] timed out after ${formatDuration(timeoutMs)}`;
    logStream.write(`\n${message}\n`);
    console.error(message);
    terminateChildProcess(child, 'SIGTERM');
    killTimer = setTimeout(() => terminateChildProcess(child, 'SIGKILL'), KILL_GRACE_MS);
  }, timeoutMs) : null;

  const onOutput = (chunk, stream) => {
    lastOutputAt = Date.now();
    const text = chunk.toString();
    logStream.write(text);
    outputBuffer = appendToRollingBuffer(outputBuffer, text);
    if (isVerboseMode) {
      stream.write(chunk);
    }
  };
  child.stdout?.on('data', (chunk) => onOutput(chunk, process.stdout));
  child.stderr?.on('data', (chunk) => onOutput(chunk, process.stderr));

  await new Promise((resolve) => {
    child.once('error', (error) => {
      spawnError = error;
      logStream.write(`\n[verify] spawn error: ${error.message}\n`);
      resolve();
    });
    child.once('close', (code) => {
      exitCode = timedOut ? 1 : (code ?? 1);
      resolve();
    });
  });
  clearInterval(heartbeatTimer);
  if (timeoutTimer) {
    clearTimeout(timeoutTimer);
  }
  if (killTimer) {
    clearTimeout(killTimer);
  }
  await closeLogStream(logStream);
  if (spawnError) {
    throw spawnError;
  }

  const logOutput = fs.readFileSync(logPath, 'utf8');
  const warningSummary = getWarningSummary(label, logOutput);
  const status = exitCode === 0 ? 'passed' : 'failed';
  if (status === 'passed' && !warningSummary) {
    console.log(`[${label}] passed ✅`);
  } else if (status === 'passed') {
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

  return { label, command: formattedCommand, displayCommand, logPath, exitCode, status, stdout: '', stderr: '', hasWarnings: warningSummary.length > 0, warningSummary };
}

function createSkippedResult(entry, reason = entry.reason) {
  return { label: entry.label, command: entry.command, displayCommand: entry.command, status: 'skipped', reason, exitCode: null, stdout: '', stderr: '', hasWarnings: false, warningSummary: '' };
}

function addE2ECommands(commands, e2eCommand) {
  if (isCi) {
    commands.push({ kind: 'run', label: 'e2e-install', command: 'pnpm', args: ['e2e:install'], expensive: true });
  }
  commands.push({ ...e2eCommand, expensive: true });
}

function buildCommands(changedFiles) {
  const existingChangedFiles = changedFiles.filter(fileExists);
  const formatLintFiles = existingChangedFiles.filter((filePath) => !hasPrefix(filePath, FORMAT_LINT_IGNORED_PREFIXES));
  const formattableFiles = formatLintFiles.filter((filePath) => FORMATTABLE_EXTENSIONS.has(path.posix.extname(filePath)));
  const lintableFiles = formatLintFiles.filter((filePath) => LINTABLE_EXTENSIONS.has(path.posix.extname(filePath)));
  const vitestScope = getVitestScope(changedFiles);
  const changedVisualSpecs = changedFiles.filter((filePath) => filePath.startsWith('tests/e2e/visual/') && filePath.endsWith('.ts') && fileExists(filePath));
  const changedE2ESpecs = changedFiles.filter((filePath) => filePath.startsWith('tests/e2e/') && !filePath.startsWith('tests/e2e/visual/') && filePath.endsWith('.ts') && fileExists(filePath));
  const mutationScope = getMutationScope(changedFiles);
  const commands = [];

  commands.push(formattableFiles.length > 0
    ? { kind: 'run', label: 'format', command: 'pnpm', args: ['exec', 'oxfmt', ...(shouldApplyFixers ? [] : ['--check']), ...formattableFiles] }
    : { kind: 'skipped', label: 'format', command: `pnpm exec oxfmt${shouldApplyFixers ? '' : ' --check'}`, reason: 'no changed formattable existing files' });

  if (lintableFiles.length > 0) {
    commands.push({ kind: 'run', label: 'oxlint', command: 'pnpm', args: ['exec', 'oxlint', ...(shouldApplyFixers ? ['--fix'] : []), ...lintableFiles] });
    commands.push({ kind: 'run', label: 'eslint', command: 'pnpm', args: ['exec', 'eslint', '--cache', ...(shouldApplyFixers ? ['--fix'] : []), '--concurrency=auto', ...lintableFiles] });
  } else {
    commands.push({ kind: 'skipped', label: 'oxlint', command: `pnpm exec oxlint${shouldApplyFixers ? ' --fix' : ''}`, reason: 'no changed lintable existing files' });
    commands.push({ kind: 'skipped', label: 'eslint', command: `pnpm exec eslint --cache${shouldApplyFixers ? ' --fix' : ''} --concurrency=auto`, reason: 'no changed lintable existing files' });
  }
  if (isFixOnlyMode) {
    return commands;
  }

  commands.push(changedFiles.some(isTypeCheckTarget)
    ? { kind: 'run', label: 'type-check', command: 'pnpm', args: ['type-check'] }
    : { kind: 'skipped', label: 'type-check', command: 'pnpm type-check', reason: 'no type-check relevant changes' });
  commands.push(vitestScope.length > 0
    ? { kind: 'run', label: 'unit-tests', command: 'pnpm', args: ['exec', 'vitest', 'run', ...vitestScope] }
    : { kind: 'skipped', label: 'unit-tests', command: 'pnpm exec vitest run', reason: 'empty focused unit-test scope' });
  if (changedFiles.includes('playwright.config.ts')) {
    addE2ECommands(commands, { kind: 'run', label: 'e2e', command: 'pnpm', args: ['e2e'] });
  } else if (changedE2ESpecs.length > 0) {
    addE2ECommands(commands, { kind: 'run', label: 'e2e', command: 'pnpm', args: ['exec', 'playwright', 'test', ...changedE2ESpecs] });
  } else {
    commands.push({ kind: 'skipped', label: 'e2e', command: 'pnpm exec playwright test', reason: 'empty e2e scope' });
  }
  commands.push(changedFiles.some(isVisualRelevantFile) || changedVisualSpecs.length > 0
    ? { kind: 'run', label: 'visual', command: 'pnpm', args: ['test:visual'], expensive: true }
    : { kind: 'skipped', label: 'visual', command: 'pnpm test:visual', reason: 'empty visual scope' });
  commands.push(mutationScope.length > 0
    ? { kind: 'run', label: 'mutation', command: 'pnpm', args: ['exec', 'stryker', 'run', '-m', mutationScope.join(',')], expensive: true }
    : { kind: 'skipped', label: 'mutation', command: 'pnpm exec stryker run -m <source file>', reason: 'empty mutation scope' });

  return commands;
}

function selectCommands(commands) {
  if (onlyLabels.length === 0) {
    return commands;
  }
  const commandByLabel = new Map(commands.map((command) => [command.label, command]));
  const e2eCommand = commandByLabel.get('e2e');
  return onlyLabels.map((label) => commandByLabel.get(label) ?? {
    kind: 'skipped',
    label,
    command: DISPLAY_COMMAND_BY_LABEL.get(label) ?? `pnpm verify --only ${label}`,
    reason: label === 'e2e-install' && e2eCommand?.kind === 'skipped' ? e2eCommand.reason : 'check is not part of the current verify mode',
  });
}

function getActionRequired(results) {
  const actions = [];
  for (const result of results.filter((result) => result.status === 'failed')) {
    actions.push(`Fix failed ${result.label} errors. Run: ${result.command}`);
  }
  if (actions.length > 0) {
    actions.push(`After fixes, run: pnpm verify${isFixMode ? ' --fix' : ''}`);
  }
  for (const result of results.filter((result) => result.status !== 'failed' && result.hasWarnings)) {
    actions.push(`Fix ${result.label} warnings. Run: ${result.command}`);
    actions.push(`Reason: ${result.warningSummary}`);
  }

  return actions.length === 0 ? ['None.'] : actions;
}

function printSummary(changedFiles, scope, results) {
  const hasFailed = results.some((result) => result.status === 'failed');
  console.log('\nVERIFY RESULT');
  console.log(`mode: ${isFixOnlyMode ? 'fix-only' : isFixMode ? 'fix' : 'check'}`);
  console.log(`only: ${onlyLabels.length > 0 ? onlyLabels.join(', ') : 'all'}`);
  console.log(`verbose: ${isVerboseMode ? 'on' : 'off'}`);
  console.log(`scope: ${scope}`);
  console.log(`changed files: ${changedFiles.length}`);
  console.log(`status: ${hasFailed ? 'failed ❌' : 'passed ✅'}`);
  console.log(`logs: ${VERIFY_LOG_DIR}`);
  console.log('commands:');
  for (const result of results) {
    console.log(result.status === 'skipped'
      ? `- ${result.label}: skipped (${result.reason})`
      : `- ${result.label}: ${result.status}${result.hasWarnings ? ' (warnings found)' : ''} (${result.displayCommand})`);
  }
  console.log('action required:');
  for (const action of getActionRequired(results)) {
    console.log(`- ${action}`);
  }

  return { hasFailed };
}

async function main() {
  if (isFixMode && isFixOnlyMode) {
    throw new Error('Use either --fix or --fix-only, not both.');
  }
  const { changedFiles, scope } = getChangedFiles();
  const commands = selectCommands(buildCommands(changedFiles));
  const results = [];
  let hasFailed = false;
  ensureLogsDirectory(onlyLabels.length > 0 ? commands.map((entry) => entry.label) : null);

  for (const entry of commands) {
    if (entry.kind === 'skipped') {
      results.push(createSkippedResult(entry));
      continue;
    }
    if (hasFailed && entry.expensive === true) {
      results.push(createSkippedResult(entry, EXPENSIVE_SKIP_REASON));
      continue;
    }
    // oxlint-disable-next-line no-await-in-loop -- verify checks run sequentially for deterministic logs and fail-fast expensive gates.
    const result = await runCommand(entry.label, entry.command, entry.args);
    results.push(result);
    if (result.status === 'failed') {
      hasFailed = true;
    }
  }

  process.exitCode = printSummary(changedFiles, scope, results).hasFailed ? 1 : 0;
}

if (!directoryExists('.git')) {
  throw new Error('Repository root is required to run verify.');
}

await main();
