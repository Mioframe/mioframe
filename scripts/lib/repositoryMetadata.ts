// Owner: narrow positive fact only -- see docs/testing/verify-change-classification.md
// and docs/testing/verify-target-architecture.md "Repository metadata
// classification". This predicate exists solely to prevent confirmed
// repository documentation/instruction paths from inheriting browser
// (application E2E / Storybook behavior / visual) proof merely because they
// live inside a broad runtime-owned directory. It is deliberately narrower
// than a Markdown/document classifier: only stable confirmed metadata
// roots/basenames are safe exclusions. Arbitrary source-adjacent Markdown
// (README.md, ARCHITECTURE.md, DESIGN.md, REVIEW.md, etc.) and known runtime
// Markdown (docs/user/**, PRIVACY.md) must remain outside this predicate so
// unknown/real runtime content keeps its existing fail-closed lane behavior.

const METADATA_BASENAMES = new Set(['AGENTS.md']);
const METADATA_DIR_PREFIXES = ['.agents/', 'docs/testing/', 'src/shared/ui/material/docs/'];

/**
 * Determine whether `filePath` is positively confirmed non-runtime
 * repository metadata (instruction/skill/testing-policy documentation), as
 * opposed to application/browser runtime content.
 * @param filePath Repository-relative changed file path.
 * @returns `true` only for a confirmed metadata root/basename; `false` for
 * every other path, including runtime Markdown and unclassified
 * source-adjacent documentation, which must keep existing lane fallback
 * behavior instead of being silently skipped.
 */
export function isNonRuntimeRepositoryMetadataPath(filePath: string): boolean {
  const basename = filePath.slice(filePath.lastIndexOf('/') + 1);

  if (METADATA_BASENAMES.has(basename)) {
    return true;
  }

  return METADATA_DIR_PREFIXES.some((prefix) => filePath.startsWith(prefix));
}
