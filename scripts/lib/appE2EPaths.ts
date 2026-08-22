/** Root directory containing the directly collected application E2E specs. */
export const APP_E2E_SPEC_DIR = 'tests/e2e';

/** Playwright glob that collects only direct application E2E specs. */
export const APP_E2E_TEST_MATCH = '**/tests/e2e/*.spec.ts';

const APP_E2E_SPEC_PREFIX = `${APP_E2E_SPEC_DIR}/`;

/**
 * Check whether a repository-relative path is a direct root application E2E
 * spec.
 * @param filePath Repository-relative path to classify.
 * @returns True when the path is directly under {@link APP_E2E_SPEC_DIR} and
 * has the `.spec.ts` suffix.
 */
export function isRootAppE2ESpecPath(filePath: string): boolean {
  return (
    filePath.startsWith(APP_E2E_SPEC_PREFIX) &&
    filePath.endsWith('.spec.ts') &&
    !filePath.slice(APP_E2E_SPEC_PREFIX.length).includes('/')
  );
}
