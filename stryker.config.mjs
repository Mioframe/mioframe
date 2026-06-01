import fs from 'node:fs';
import path from 'node:path';

const SOURCE_ROOT = 'src';
const SHARED_UI_DIR = path.join(SOURCE_ROOT, 'shared', 'ui');
const TEST_FILE_SUFFIX = '.test.ts';
const SOURCE_EXTENSIONS = ['.ts', '.vue'];

function collectTestFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const testFiles = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (fullPath === SHARED_UI_DIR || entry.name === '__tests__') {
        continue;
      }

      testFiles.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(TEST_FILE_SUFFIX)) {
      testFiles.push(fullPath);
    }
  }

  return testFiles;
}

function getSourceCandidates(testFile) {
  const sourceBase = testFile.slice(0, -TEST_FILE_SUFFIX.length);
  const dirPath = path.dirname(testFile);
  const baseName = path.basename(sourceBase);

  let candidates = SOURCE_EXTENSIONS.map((extension) => `${sourceBase}${extension}`);

  const parts = baseName.split('.');

  if (parts.length >= 2) {
    const trimmedBaseName = parts.slice(0, -1).join('.');
    const trimmedPath = path.join(dirPath, trimmedBaseName);

    candidates = [
      ...candidates,
      ...SOURCE_EXTENSIONS.map((extension) => `${trimmedPath}${extension}`),
    ];
  }

  return candidates;
}

const mutate = [
  ...new Set(
    collectTestFiles(SOURCE_ROOT)
      .map((testFile) =>
        getSourceCandidates(testFile).find((candidate) => fs.existsSync(candidate)),
      )
      .filter((candidate) => candidate !== undefined)
      .filter((candidate) => !candidate.startsWith(`${SHARED_UI_DIR}${path.sep}`)),
  ),
].sort((left, right) => left.localeCompare(right));

export default {
  packageManager: 'pnpm',
  plugins: ['@stryker-mutator/vitest-runner'],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
    related: true,
  },
  mutate,
  ignorePatterns: [
    '.agents/**',
    '.claude',
    '.claude/skills',
    '.claude/**',
    '**/AGENTS.md',
    '**/CLAUDE.md',
    'tests/e2e/**',
    'src/**/__mocks__/**',
    'playwright.config.ts',
    'playwright-report/**',
    'test-results/**',
  ],
  coverageAnalysis: 'perTest',
  concurrency: '75%',
  ignoreStatic: true,
  mutator: {
    excludedMutations: ['StringLiteral', 'Regex'],
  },
  disableTypeChecks: 'src/**/*.{ts,vue}',
  reporters: ['progress', 'clear-text', 'html', 'json'],
  htmlReporter: {
    fileName: 'reports/mutation/mutation.html',
  },
  jsonReporter: {
    fileName: 'reports/mutation/mutation.json',
  },
  thresholds: {
    high: 80,
    low: 60,
    break: 60,
  },
  timeoutFactor: 3,
  timeoutMS: 20_000,
  tempDirName: '.stryker-tmp',
};
