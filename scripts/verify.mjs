import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const isFixMode = process.argv.includes('--fix');
const cliBaseRef = getCliBaseRef(process.argv.slice(2));
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
const IGNORED_PREFIXES = [
  'node_modules/',
  'dist/',
  'coverage/',
  'reports/',
  'playwright-report/',
  'test-results/',
  '.stryker-tmp/',
];

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

function isIgnored(filePath) {
  return IGNORED_PREFIXES.some(
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

function trimWarningLine(line) {
  return line.trim().replace(/\s+/g, ' ');
}

function isZeroWarningLine(line) {
  return /\b0 warnings?\b/i.test(line) && !/\b[1-9]\d* warnings?\b/i.test(line);
}

function getWarningSummary(output) {
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

function runCommand(label, command, args) {
  const formattedCommand = formatCommand(command, args);
  const shouldCaptureOutput = ['eslint', 'oxlint'].includes(label);

  console.log(`\n[${label}] $ ${formattedCommand}`);

  const result = spawnSync(command, args, {
    stdio: shouldCaptureOutput ? ['inherit', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });

  const stdout = shouldCaptureOutput ? (result.stdout ?? '') : '';
  const stderr = shouldCaptureOutput ? (result.stderr ?? '') : '';

  if (shouldCaptureOutput) {
    process.stdout.write(stdout);
    process.stderr.write(stderr);
  }

  if (result.error) {
    throw result.error;
  }

  const warningSummary = shouldCaptureOutput ? getWarningSummary(`${stdout}\n${stderr}`) : '';

  return {
    label,
    command: formattedCommand,
    exitCode: result.status ?? 1,
    status: result.status === 0 ? 'passed' : 'failed',
    stdout,
    stderr,
    hasWarnings: warningSummary.length > 0,
    warningSummary,
  };
}

function buildCommands(changedFiles) {
  const existingChangedFiles = changedFiles.filter(fileExists);
  const formattableFiles = existingChangedFiles.filter((filePath) =>
    FORMATTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const lintableFiles = existingChangedFiles.filter((filePath) =>
    LINTABLE_EXTENSIONS.has(path.posix.extname(filePath)),
  );
  const vitestScope = getVitestScope(changedFiles);
  const changedE2ESpecs = changedFiles.filter(
    (filePath) =>
      filePath.startsWith('tests/e2e/') && filePath.endsWith('.ts') && fileExists(filePath),
  );
  const mutationScope = getMutationScope(changedFiles);
  const commands = [];

  if (formattableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'format',
      command: 'pnpm',
      args: ['exec', 'oxfmt', ...(isFixMode ? [] : ['--check']), ...formattableFiles],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'format',
      command: `pnpm exec oxfmt${isFixMode ? '' : ' --check'}`,
      reason: 'no changed formattable existing files',
    });
  }

  if (lintableFiles.length > 0) {
    commands.push({
      kind: 'run',
      label: 'oxlint',
      command: 'pnpm',
      args: ['exec', 'oxlint', ...(isFixMode ? ['--fix'] : []), ...lintableFiles],
    });
    commands.push({
      kind: 'run',
      label: 'eslint',
      command: 'pnpm',
      args: [
        'exec',
        'eslint',
        '--cache',
        ...(isFixMode ? ['--fix'] : []),
        '--concurrency=auto',
        ...lintableFiles,
      ],
    });
  } else {
    commands.push({
      kind: 'skipped',
      label: 'oxlint',
      command: `pnpm exec oxlint${isFixMode ? ' --fix' : ''}`,
      reason: 'no changed lintable existing files',
    });
    commands.push({
      kind: 'skipped',
      label: 'eslint',
      command: `pnpm exec eslint --cache${isFixMode ? ' --fix' : ''} --concurrency=auto`,
      reason: 'no changed lintable existing files',
    });
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
  const status = results.some((result) => result.status === 'failed') ? 'failed ❌' : 'passed ✅';
  const actionRequired = getActionRequired(results);

  console.log('\nVERIFY RESULT');
  console.log(`mode: ${isFixMode ? 'fix' : 'check'}`);
  console.log(`scope: ${scope}`);
  console.log(`changed files: ${changedFiles.length}`);
  console.log(`status: ${status}`);
  console.log('commands:');

  for (const result of results) {
    if (result.status === 'skipped') {
      console.log(`- ${result.label}: skipped (${result.reason})`);
      continue;
    }

    const warningSuffix = result.hasWarnings ? ' (warnings found)' : '';
    console.log(`- ${result.label}: ${result.status}${warningSuffix} (${result.command})`);
  }

  console.log('action required:');

  for (const action of actionRequired) {
    console.log(`- ${action}`);
  }

  return status;
}

function main() {
  const { changedFiles, scope } = getChangedFiles();
  const commands = buildCommands(changedFiles);
  const results = [];

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

    results.push(runCommand(entry.label, entry.command, entry.args));
  }

  const status = printSummary(changedFiles, scope, results);
  process.exitCode = status === 'failed' ? 1 : 0;
}

if (!directoryExists('.git')) {
  throw new Error('Repository root is required to run verify.');
}

main();
