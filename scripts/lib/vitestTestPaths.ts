/**
 * The single shared Vitest test-path owner. This module owns only the shape
 * of Vitest test-file discovery -- the include/exclude glob contract
 * `vitest.config.ts` itself declares -- so `vitest.config.ts`,
 * `scripts/lib/unitRisk.ts`, and `scripts/lib/mutationTargets.ts` consult one
 * local rule definition instead of three separately duplicated/diverging
 * heuristics (see `docs/testing/verify-mutation-impact-correction.md` "One
 * Vitest test-path owner").
 *
 * `VITEST_TEST_INCLUDE`, `VITEST_TEST_EXCLUDE`, and
 * {@link isVitestOwnedTestPath} are all mechanically derived from
 * {@link VITEST_INCLUDE_RULES} / {@link VITEST_EXCLUDE_RULES} below, the one
 * local declarative population of Vitest discovery semantics.
 */

/**
 * A closed set of discovery-rule shapes, each carrying only the semantic
 * data (a root, prefix, suffix, or exact path) that both a glob string and a
 * path-matching predicate can be derived from -- never a glob string paired
 * with an independently written matcher.
 */
type DiscoveryRule =
  | { readonly kind: 'recursiveRootSuffix'; readonly root: string; readonly suffix: string }
  | { readonly kind: 'rootPrefixSuffix'; readonly prefix: string; readonly suffix: string }
  | { readonly kind: 'exactRootFile'; readonly path: string }
  | { readonly kind: 'recursiveRootExclusion'; readonly root: string }
  | { readonly kind: 'rootDotDirExclusion' };

/**
 * The one local declarative population of current Vitest `include` rule
 * semantics, in the exact order `vitest.config.ts`'s `include` array uses.
 */
const VITEST_INCLUDE_RULES: readonly DiscoveryRule[] = [
  { kind: 'recursiveRootSuffix', root: 'src/', suffix: '.test.ts' },
  { kind: 'recursiveRootSuffix', root: 'config/', suffix: '.test.ts' },
  { kind: 'recursiveRootSuffix', root: 'scripts/', suffix: '.test.ts' },
  { kind: 'recursiveRootSuffix', root: 'scripts/', suffix: '.test.mjs' },
  { kind: 'recursiveRootSuffix', root: 'tests/e2e/', suffix: '.test.mjs' },
  { kind: 'rootPrefixSuffix', prefix: 'playwright.', suffix: '.test.ts' },
  { kind: 'exactRootFile', path: 'eslint.config.test.ts' },
];

/**
 * The one local declarative population of current Vitest `exclude` rule
 * semantics, in the exact order `vitest.config.ts`'s `exclude` array uses.
 */
const VITEST_EXCLUDE_RULES: readonly DiscoveryRule[] = [
  { kind: 'recursiveRootSuffix', root: 'tests/e2e/', suffix: '.spec.ts' },
  { kind: 'recursiveRootExclusion', root: 'node_modules/' },
  { kind: 'rootDotDirExclusion' },
];

/** Renders one {@link DiscoveryRule} as the Vitest glob string it represents. */
function ruleToGlob(rule: DiscoveryRule): string {
  switch (rule.kind) {
    case 'recursiveRootSuffix':
      return `${rule.root}**/*${rule.suffix}`;
    case 'rootPrefixSuffix':
      return `${rule.prefix}*${rule.suffix}`;
    case 'exactRootFile':
      return rule.path;
    case 'recursiveRootExclusion':
      return `${rule.root}**`;
    case 'rootDotDirExclusion':
      return '.*/**';
  }
}

/** Whether `filePath` satisfies one {@link DiscoveryRule}'s matching semantics. */
function ruleMatches(rule: DiscoveryRule, filePath: string): boolean {
  switch (rule.kind) {
    case 'recursiveRootSuffix':
      return filePath.startsWith(rule.root) && filePath.endsWith(rule.suffix);
    case 'rootPrefixSuffix': {
      if (!filePath.startsWith(rule.prefix) || !filePath.endsWith(rule.suffix)) {
        return false;
      }
      const middle = filePath.slice(rule.prefix.length, filePath.length - rule.suffix.length);
      // A glob `*` segment does not cross `/`, so the middle portion must be
      // non-empty and slash-free to stay root-level (e.g. `playwright.lanes.test.ts`).
      return middle.length > 0 && !middle.includes('/');
    }
    case 'exactRootFile':
      return filePath === rule.path;
    case 'recursiveRootExclusion':
      return filePath.startsWith(rule.root);
    case 'rootDotDirExclusion': {
      const firstSlash = filePath.indexOf('/');
      return firstSlash !== -1 && filePath.slice(0, firstSlash).startsWith('.');
    }
  }
}

/**
 * Exact Vitest `test.include` glob patterns, matching `vitest.config.ts`'s
 * real `include` array. Consumed directly by `vitest.config.ts`; mechanically
 * derived from {@link VITEST_INCLUDE_RULES}, the same rule population
 * {@link isVitestOwnedTestPath} evaluates.
 */
export const VITEST_TEST_INCLUDE: readonly string[] = VITEST_INCLUDE_RULES.map(ruleToGlob);

/**
 * Exact Vitest `test.exclude` glob patterns, matching `vitest.config.ts`'s
 * real `exclude` array. Consumed directly by `vitest.config.ts`; mechanically
 * derived from {@link VITEST_EXCLUDE_RULES}, the same rule population
 * {@link isVitestOwnedTestPath} evaluates.
 */
export const VITEST_TEST_EXCLUDE: readonly string[] = VITEST_EXCLUDE_RULES.map(ruleToGlob);

/**
 * Whether `filePath` is a real Vitest-discovered test path, matching
 * `vitest.config.ts`'s actual `include`/`exclude` contract by evaluating the
 * same {@link VITEST_INCLUDE_RULES} / {@link VITEST_EXCLUDE_RULES} population
 * that derives {@link VITEST_TEST_INCLUDE} / {@link VITEST_TEST_EXCLUDE},
 * rather than an independently written suffix heuristic. This is the single
 * predicate consumed by `scripts/lib/unitRisk.ts` and
 * `scripts/lib/mutationTargets.ts` in place of their previously duplicated
 * private Vitest test-shape logic.
 * @param filePath Repository-relative path.
 * @returns True when Vitest would discover `filePath` as a test file.
 */
export function isVitestOwnedTestPath(filePath: string): boolean {
  const included = VITEST_INCLUDE_RULES.some((rule) => ruleMatches(rule, filePath));
  if (!included) {
    return false;
  }

  return !VITEST_EXCLUDE_RULES.some((rule) => ruleMatches(rule, filePath));
}
