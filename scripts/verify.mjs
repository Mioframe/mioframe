import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

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

function getChangedFiles() {
  const githubBaseRef = process.env.GITHUB_BASE_REF;
  let changedFiles = [];

  if (githubBaseRef) {
    const mergeBase = runGitCommand(['merge-base', 'HEAD', `origin/${githubBaseRef}`], {
      allowFailure: false,
    })[0];

    changedFiles = runGitCommand([
      'diff',
      '--name-only',
      '--diff-filter=ACMR',
      `${mergeBase}...HEAD`,
    ]);
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
    }
  }

  return uniqSorted(changedFiles.map(toPosixPath).filter((filePath) => !isIgnored(filePath)));
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

function getSiblingTestFile(filePath) {
  if (!filePath.startsWith('src/')) {
    return null;
  }

  if (filePath.endsWith('.test.ts')) {
    return fileExists(filePath) ? filePath : null;
  }

  const extension = path.posix.extname(filePath);

  if (!SOURCE_EXTENSIONS.includes(extension)) {
    return null;
  }

  const candidate = `${filePath.slice(0, -extension.length)}.test.ts`;
  return fileExists(candidate) ? candidate : null;
}

function getVitestScope(changedFiles) {
  const scope = [];

  for (const filePath of changedFiles) {
    const testFile = getSiblingTestFile(filePath);

    if (testFile) {
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

  for (const extension of SOURCE_EXTENSIONS) {
    const candidate = `${basePath}${extension}`;

    if (fileExists(candidate)) {
      return candidate;
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

    const siblingTest = getSiblingTestFile(filePath);

    if (siblingTest) {
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

function runCommand(command, args) {
  const formattedCommand = formatCommand(command, args);
  console.log(`\n$ ${formattedCommand}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    encoding: 'utf8',
  });

  if (result.error) {
    throw result.error;
  }

  return {
    command: formattedCommand,
    status: result.status === 0 ? 'passed' : 'failed',
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
    commands.push({ kind: 'run', command: 'pnpm', args: ['exec', 'oxfmt', ...formattableFiles] });
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm exec oxfmt',
      reason: 'no changed formattable existing files',
    });
  }

  if (lintableFiles.length > 0) {
    commands.push({
      kind: 'run',
      command: 'pnpm',
      args: ['exec', 'oxlint', '--fix', ...lintableFiles],
    });
    commands.push({
      kind: 'run',
      command: 'pnpm',
      args: ['exec', 'eslint', '--cache', '--fix', '--concurrency=auto', ...lintableFiles],
    });
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm exec oxlint --fix / pnpm exec eslint --cache --fix --concurrency=auto',
      reason: 'no changed lintable existing files',
    });
  }

  if (changedFiles.some(isTypeCheckTarget)) {
    commands.push({ kind: 'run', command: 'pnpm', args: ['type-check'] });
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm type-check',
      reason: 'no type-check relevant changes',
    });
  }

  if (vitestScope.length > 0) {
    commands.push({
      kind: 'run',
      command: 'pnpm',
      args: ['exec', 'vitest', 'run', ...vitestScope],
    });
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm exec vitest run',
      reason: 'empty focused unit-test scope',
    });
  }

  if (changedFiles.includes('playwright.config.ts')) {
    commands.push({ kind: 'run', command: 'pnpm', args: ['e2e'] });
  } else if (changedE2ESpecs.length > 0) {
    commands.push({
      kind: 'run',
      command: 'pnpm',
      args: ['exec', 'playwright', 'test', ...changedE2ESpecs],
    });
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm exec playwright test',
      reason: 'empty e2e scope',
    });
  }

  if (mutationScope.length > 0) {
    for (const sourceFile of mutationScope) {
      commands.push({
        kind: 'run',
        command: 'pnpm',
        args: ['exec', 'stryker', 'run', '-m', sourceFile],
      });
    }
  } else {
    commands.push({
      kind: 'skipped',
      command: 'pnpm exec stryker run -m <source file>',
      reason: 'empty mutation scope',
    });
  }

  return commands;
}

function printSummary(changedFiles, results) {
  const status = results.some((result) => result.status === 'failed') ? 'failed' : 'passed';

  console.log('\nVERIFY RESULT');
  console.log(`changed files: ${changedFiles.length}`);
  console.log(`status: ${status}`);
  console.log('commands:');

  for (const result of results) {
    if (result.status === 'skipped') {
      console.log(`- ${result.command}: skipped (${result.reason})`);
      continue;
    }

    console.log(`- ${result.command}: ${result.status}`);
  }

  return status;
}

function main() {
  const changedFiles = getChangedFiles();
  const commands = buildCommands(changedFiles);
  const results = [];

  for (const entry of commands) {
    if (entry.kind === 'skipped') {
      results.push({
        command: entry.command,
        status: 'skipped',
        reason: entry.reason,
      });
      continue;
    }

    results.push(runCommand(entry.command, entry.args));
  }

  const status = printSummary(changedFiles, results);
  process.exitCode = status === 'failed' ? 1 : 0;
}

if (!directoryExists('.git')) {
  throw new Error('Repository root is required to run verify.');
}

main();
