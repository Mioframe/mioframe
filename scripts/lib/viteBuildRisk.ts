/**
 * Single shared capability owner for Vite-backed global/ownerless build and
 * application-harness inputs (see
 * docs/testing/verify-redesign-final-review-architecture-revision-02.md's
 * "Shared Vite-backed inputs"): `vite.config.ts` imports `config/alias.ts`
 * and `config/plugins/**` and derives its build target from
 * `.browserslistrc`; Vite automatically loads root PostCSS configuration and
 * root TypeScript build configuration; Storybook's `@storybook/vue3-vite`
 * builder also loads/merges the same root Vite configuration.
 *
 * This module is only a path predicate, not a dependency/import graph:
 * `config/**` narrowing excludes deterministic test/spec/story/test-helper
 * files by suffix rather than enumerating individual plugin modules or their
 * import graph. Ordinary production `src/**` is deliberately excluded;
 * existing colocated/dependency ownership stays responsible for it.
 */

const NON_PRODUCTION_SUFFIX_PATTERN = /\.(test|spec|stories|testUtils)\.(ts|tsx|vue|mjs|js|jsx)$/;
const ROOT_TSCONFIG_PATTERN = /^tsconfig[^/]*\.json$/;

const SHARED_VITE_BUILD_EXACT_FILES: ReadonlySet<string> = new Set([
  'vite.config.ts',
  'postcss.config.js',
  '.browserslistrc',
]);

const CONFIG_PREFIX = 'config/';
const PUBLIC_PREFIX = 'public/';

function isConfigInputPath(filePath: string): boolean {
  return filePath.startsWith(CONFIG_PREFIX) && !NON_PRODUCTION_SUFFIX_PATTERN.test(filePath);
}

function isPublicInputPath(filePath: string): boolean {
  return filePath.startsWith(PUBLIC_PREFIX);
}

/**
 * Check whether a changed file is a shared/global Vite build input relied on
 * by every truthful Vite-backed proof owner: non-test/proof `config/**`,
 * `vite.config.ts`, `postcss.config.js`, `.browserslistrc`, root
 * `tsconfig*.json`, or `public/**`.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is a shared Vite build input.
 */
export function isSharedViteBuildInputPath(filePath: string): boolean {
  return (
    SHARED_VITE_BUILD_EXACT_FILES.has(filePath) ||
    ROOT_TSCONFIG_PATTERN.test(filePath) ||
    isConfigInputPath(filePath) ||
    isPublicInputPath(filePath)
  );
}

const APPLICATION_VITE_HARNESS_EXACT_FILES: ReadonlySet<string> = new Set([
  'index.html',
  'pwa-assets.config.ts',
]);

/**
 * Check whether a changed file is an application Vite harness input: every
 * shared Vite build input, plus `index.html` and `pwa-assets.config.ts` —
 * real production application/PWA artifact inputs without page/widget or
 * colocated test ownership.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is an application Vite harness input.
 */
export function isApplicationViteHarnessInputPath(filePath: string): boolean {
  return isSharedViteBuildInputPath(filePath) || APPLICATION_VITE_HARNESS_EXACT_FILES.has(filePath);
}
