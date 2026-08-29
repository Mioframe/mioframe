import { MUTATION_TARGETS } from './scripts/lib/mutationTargets.ts';

const mutate = MUTATION_TARGETS.map((target) => target.source);

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
