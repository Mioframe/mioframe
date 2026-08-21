import { MUTATION_TARGETS, validateMutationRegistry } from './scripts/lib/mutationTargets.ts';

// `mutate` is derived from the explicit MUTATION_TARGETS registry only --
// never from source/test adjacency -- so verifier planning
// (scripts/lib/mutationTargets.ts's resolveMutationPlan) and Stryker's own
// mutate surface cannot diverge. See docs/testing/verify-target-architecture.md
// "# Mutation architecture".
const registryValidation = validateMutationRegistry();

if (!registryValidation.valid) {
  throw new Error(
    `Invalid mutation registry (scripts/lib/mutationTargets.ts): ${registryValidation.errors.join('; ')}`,
  );
}

const mutate = MUTATION_TARGETS.map((target) => target.source)
  .slice()
  .sort((left, right) => left.localeCompare(right));

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
