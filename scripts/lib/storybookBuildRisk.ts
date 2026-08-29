import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';
import { isSharedLocalCommandExecutionPath } from './localCommandExecutionRisk.ts';
import { isSharedViteBuildInputPath } from './viteBuildRisk.ts';

const PACKAGE_JSON_PATH = 'package.json';

// Storybook-specific configuration/runtime infrastructure not already owned
// by the shared local-command execution or Vite build capabilities: a
// change here can affect whether the Storybook static build succeeds at
// all, so it always selects a full storybook-build run instead of relying
// on per-story impact. Root/global Vite build inputs (`vite.config.ts`,
// `postcss.config.js`, `.browserslistrc`, root `tsconfig*.json`,
// non-test/proof `config/**`, `public/**`) and the shared local-command
// execution boundary are owned by their dedicated capability modules rather
// than duplicated here, since they widen relevance across every build type
// that consumes them, not only storybook-build.
const STORYBOOK_BUILD_EXACT_FILES = new Set([
  'pnpm-lock.yaml',
  'scripts/storybook.mjs',
  'src/app/styles/base.css',
]);

const STORYBOOK_BUILD_PREFIXES = ['.storybook/'];

function isStoryFile(filePath: string): boolean {
  return /\.stories\.(ts|tsx|js|jsx|mjs|vue)$/.test(filePath);
}

/**
 * Check whether a changed file can affect whether the Storybook static build succeeds.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is Storybook configuration/runtime or a story file.
 */
export function isStorybookBuildRelevantFile(filePath: string): boolean {
  if (
    STORYBOOK_BUILD_EXACT_FILES.has(filePath) ||
    isSharedLocalCommandExecutionPath(filePath) ||
    isSharedViteBuildInputPath(filePath)
  ) {
    return true;
  }

  if (STORYBOOK_BUILD_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return true;
  }

  return isStoryFile(filePath);
}

/** Resolved `storybook-build` lane plan: full or skip, with human-readable reasons. */
export interface StorybookBuildPlan {
  mode: 'full' | 'skip';
  reasons: string[];
}

/** Resolution options for {@link resolveStorybookBuildPlan}. */
export interface ResolveStorybookBuildPlanOptions {
  /**
   * Git ref to compare the current `package.json` against, for the
   * version-only impact refinement. Pass `null` when no reliable base ref is
   * known; that fails closed to runtime-relevant (full lane).
   */
  packageJsonOldRef?: string | null;
}

/**
 * Resolve the `storybook-build` lane mode for the given changed files: `full` when a
 * Storybook-relevant path or a runtime-relevant `package.json` change is present, `skip`
 * otherwise. There is no `focused` variant because a Storybook static build has no partial
 * mode; it either builds or it does not.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode` and human-readable `reasons`.
 */
export function resolveStorybookBuildPlan(
  changedFiles: readonly string[],
  { packageJsonOldRef = null }: ResolveStorybookBuildPlanOptions = {},
): StorybookBuildPlan {
  const relevantHit = changedFiles.find(isStorybookBuildRelevantFile);
  const isPackageJsonRelevant =
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef });
  const reasons: string[] = [];

  if (relevantHit) {
    reasons.push(`Storybook-relevant path ${relevantHit} -> storybook build`);
  }

  if (isPackageJsonRelevant) {
    reasons.push('runtime-relevant package.json change -> storybook build');
  }

  if (reasons.length > 0) {
    return { mode: 'full', reasons };
  }

  return { mode: 'skip', reasons: ['no storybook-relevant changes'] };
}
