/**
 * The single shared Vitest test-path owner. This module owns only the shape
 * of Vitest test-file discovery -- the include/exclude glob contract
 * `vitest.config.ts` itself declares -- so `vitest.config.ts`,
 * `scripts/lib/unitRisk.ts`, and `scripts/lib/mutationTargets.ts` consult one
 * local rule definition instead of three separately duplicated/diverging
 * heuristics (see `docs/testing/verify-mutation-impact-correction.md` "One
 * Vitest test-path owner").
 */

/**
 * Exact Vitest `test.include` glob patterns, matching `vitest.config.ts`'s
 * real `include` array. Consumed directly by `vitest.config.ts`; mirrored by
 * {@link isVitestOwnedTestPath} for planners that need a predicate rather
 * than a glob list.
 */
export const VITEST_TEST_INCLUDE: readonly string[] = [
  'src/**/*.test.ts',
  'config/**/*.test.ts',
  'scripts/**/*.test.ts',
  'scripts/**/*.test.mjs',
  'tests/e2e/**/*.test.mjs',
  'playwright.*.test.ts',
  'eslint.config.test.ts',
];

/**
 * Exact Vitest `test.exclude` glob patterns, matching `vitest.config.ts`'s
 * real `exclude` array. Consumed directly by `vitest.config.ts`; mirrored by
 * {@link isVitestOwnedTestPath} for planners that need a predicate rather
 * than a glob list.
 */
export const VITEST_TEST_EXCLUDE: readonly string[] = [
  'tests/e2e/**/*.spec.ts',
  'node_modules/**',
  '.*/**',
];

const ROOT_PLAYWRIGHT_TEST_PATTERN = /^playwright\.[^/]+\.test\.ts$/;

/**
 * Whether `filePath` is a real Vitest-discovered test path, matching
 * `vitest.config.ts`'s actual `include`/`exclude` contract
 * ({@link VITEST_TEST_INCLUDE} / {@link VITEST_TEST_EXCLUDE}) rather than a
 * bare `.test.ts` suffix heuristic. This is the single predicate consumed by
 * `scripts/lib/unitRisk.ts` and `scripts/lib/mutationTargets.ts` in place of
 * their previously duplicated private Vitest test-shape logic.
 * @param filePath Repository-relative path.
 * @returns True when Vitest would discover `filePath` as a test file.
 */
export function isVitestOwnedTestPath(filePath: string): boolean {
  if (filePath.startsWith('tests/e2e/')) {
    // `tests/e2e/**/*.spec.ts` is explicitly excluded (Playwright-owned);
    // only `tests/e2e/**/*.test.mjs` is Vitest-owned.
    return filePath.endsWith('.test.mjs');
  }

  if (filePath === 'eslint.config.test.ts' || ROOT_PLAYWRIGHT_TEST_PATTERN.test(filePath)) {
    return true;
  }

  if (filePath.startsWith('scripts/')) {
    return filePath.endsWith('.test.ts') || filePath.endsWith('.test.mjs');
  }

  return (
    (filePath.startsWith('src/') || filePath.startsWith('config/')) && filePath.endsWith('.test.ts')
  );
}
