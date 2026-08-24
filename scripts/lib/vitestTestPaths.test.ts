import { describe, expect, it } from 'vitest';

import {
  VITEST_TEST_INCLUDE,
  VITEST_TEST_EXCLUDE,
  isVitestOwnedTestPath,
} from './vitestTestPaths.ts';

// Oracle: vitest.config.ts's real `test.include`/`test.exclude` arrays
// (quoted verbatim below and in
// docs/testing/verify-mutation-impact-correction.md "One Vitest test-path
// owner"), which this file is read-only evidence for and must not change.
// `scripts/lib/vitestTestPaths.ts` does not exist yet -- the whole suite
// failing at import time is valid new-API red per test-first
// (docs/testing/verify-mutation-impact-correction.md "RED required. Missing
// vitestTestPaths.ts is an acceptable new-API red for its focused test
// file").
//
// Once implemented, `scripts/lib/vitestTestPaths.ts` is the single owner
// consumed by vitest.config.ts (VITEST_TEST_INCLUDE/VITEST_TEST_EXCLUDE) and
// by scripts/lib/unitRisk.ts and scripts/lib/mutationTargets.ts
// (isVitestOwnedTestPath), replacing three previously duplicated/diverging
// private heuristics.
//
// Real vitest.config.ts contract (confirmed by direct read):
//   include: [
//     'src/**/*.test.ts',
//     'config/**/*.test.ts',
//     'scripts/**/*.test.ts',
//     'scripts/**/*.test.mjs',
//     'tests/e2e/**/*.test.mjs',
//     'playwright.*.test.ts',
//     'eslint.config.test.ts',
//   ],
//   exclude: ['tests/e2e/**/*.spec.ts', 'node_modules/**', '.*/**'],

describe('VITEST_TEST_INCLUDE / VITEST_TEST_EXCLUDE', () => {
  it('exposes exactly the real vitest.config.ts include globs, in order', () => {
    expect(VITEST_TEST_INCLUDE).toEqual([
      'src/**/*.test.ts',
      'config/**/*.test.ts',
      'scripts/**/*.test.ts',
      'scripts/**/*.test.mjs',
      'tests/e2e/**/*.test.mjs',
      'playwright.*.test.ts',
      'eslint.config.test.ts',
    ]);
  });

  it('exposes exactly the real vitest.config.ts exclude globs, in order', () => {
    expect(VITEST_TEST_EXCLUDE).toEqual(['tests/e2e/**/*.spec.ts', 'node_modules/**', '.*/**']);
  });
});

describe('isVitestOwnedTestPath positive cases (real Vitest-discovered paths)', () => {
  it('accepts a real src/**/*.test.ts file (src/shared/lib/reorder/reorderArray.test.ts)', () => {
    expect(isVitestOwnedTestPath('src/shared/lib/reorder/reorderArray.test.ts')).toBe(true);
  });

  it('accepts a real config/**/*.test.ts file (config/postcss.config.test.ts)', () => {
    expect(isVitestOwnedTestPath('config/postcss.config.test.ts')).toBe(true);
  });

  it('accepts a real scripts/**/*.test.ts file (scripts/lib/mutationTargets.test.ts)', () => {
    expect(isVitestOwnedTestPath('scripts/lib/mutationTargets.test.ts')).toBe(true);
  });

  it('accepts a real scripts/**/*.test.mjs file (scripts/agentEnvironment.test.mjs)', () => {
    expect(isVitestOwnedTestPath('scripts/agentEnvironment.test.mjs')).toBe(true);
  });

  it('accepts a real tests/e2e/**/*.test.mjs file (tests/e2e/release/fixtures/managedReleaseFixture.test.mjs)', () => {
    expect(isVitestOwnedTestPath('tests/e2e/release/fixtures/managedReleaseFixture.test.mjs')).toBe(
      true,
    );
  });

  it('accepts a real root playwright.*.test.ts file (playwright.lanes.test.ts)', () => {
    expect(isVitestOwnedTestPath('playwright.lanes.test.ts')).toBe(true);
  });

  it('accepts the real root eslint.config.test.ts', () => {
    expect(isVitestOwnedTestPath('eslint.config.test.ts')).toBe(true);
  });
});

describe('isVitestOwnedTestPath negative cases (explicitly excluded or outside every include root)', () => {
  it('rejects a real tests/e2e/**/*.spec.ts file (tests/e2e/appSmoke.spec.ts; explicit exclude, even though it looks test-file-shaped)', () => {
    expect(isVitestOwnedTestPath('tests/e2e/appSmoke.spec.ts')).toBe(false);
  });

  it('rejects a .test.ts path outside every configured include root', () => {
    expect(isVitestOwnedTestPath('some/path/outside/configured/roots/example.test.ts')).toBe(false);
  });

  it('rejects a node_modules/** path (explicit exclude) even when it is .test.ts-shaped', () => {
    expect(isVitestOwnedTestPath('node_modules/some-pkg/index.test.ts')).toBe(false);
  });

  it('rejects a dotdir path matching .*/** (explicit exclude) even when it is .test.ts-shaped', () => {
    expect(isVitestOwnedTestPath('.storybook/example.test.ts')).toBe(false);
  });
});
