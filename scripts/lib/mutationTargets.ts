import fs from 'node:fs';

/**
 * One explicit high-risk mutation target: mutation testing is opt-in per
 * `docs/testing/verify-target-architecture.md` "# Mutation architecture",
 * never inferred from source/test adjacency.
 */
export interface MutationTarget {
  /** Unique target name. */
  name: string;
  /** Exact mutable production source path. */
  source: string;
  /** Exact owning focused unit test file path(s) that justify keeping mutation coverage. */
  tests: readonly string[];
  /** Concrete high-risk reason -- not "has tests" or "important file". */
  reason: string;
}

/**
 * Explicit high-risk mutation registry, populated by one bounded audit of
 * the previously adjacency-derived Stryker candidate pool (240 test files).
 * Retained only targets with a concrete risk reason and a truthful focused
 * unit owner; historical adjacency-derived count is not preserved.
 */
export const MUTATION_TARGETS: readonly MutationTarget[] = [
  {
    name: 'reorder-array',
    source: 'src/shared/lib/reorder/reorderArray.ts',
    tests: ['src/shared/lib/reorder/reorderArray.test.ts'],
    reason:
      'Index-arithmetic array-move (moveItem) and positional-equality (isSameOrder) primitives shared by every reorder surface; an off-by-one or boundary flip silently drops/duplicates items without a visible error.',
  },
  {
    name: 'zip-archive-path-safety',
    source: 'src/shared/lib/zipArchive/zipArchivePathSafety.ts',
    tests: ['src/shared/lib/zipArchive/zipArchivePathSafety.test.ts'],
    reason:
      'Security boundary rejecting absolute paths, .. traversal, backslashes, drive letters, and control chars before writing an imported ZIP entry to disk; a weakened check is a path-traversal/write-outside-target vulnerability.',
  },
  {
    name: 'zip-archive-codec',
    source: 'src/shared/lib/zipArchive/zipArchiveCodec.ts',
    tests: ['src/shared/lib/zipArchive/zipArchiveCodec.test.ts'],
    reason:
      'Archive encode/decode correctness; a broken codec corrupts or silently mis-restores exported/imported repository data.',
  },
  {
    name: 'automerge-filename-codec-v3',
    source: 'src/shared/lib/automergeAdapter/filenameCodecV3.ts',
    tests: ['src/shared/lib/automergeAdapter/filenameCodecV3.test.ts'],
    reason:
      'Encodes/decodes CRDT storage filenames; a mutation can misattribute or lose persisted document data with no immediate symptom until read-back fails.',
  },
  {
    name: 'automerge-storage-key-helpers',
    source: 'src/shared/lib/automergeAdapter/storageKeyHelpers.ts',
    tests: ['src/shared/lib/automergeAdapter/storageKeyHelpers.test.ts'],
    reason:
      'Derives/parses the storage key namespace addressing persisted CRDT files; wrong derivation risks cross-document key collisions or unreadable storage.',
  },
  {
    name: 'change-object-deep-patch',
    source: 'src/shared/lib/changeObject/deepPatchJsonObject.ts',
    tests: ['src/shared/lib/changeObject/deepPatchJsonObject.test.ts'],
    reason:
      'Recursive CRDT deep-patch algorithm; wrong traversal/merge logic silently drops or misapplies a user edit inside a live Automerge doc.',
  },
  {
    name: 'database-document-effective-value',
    source: 'src/shared/lib/databaseDocument/effectiveValue.ts',
    tests: ['src/shared/lib/databaseDocument/effectiveValue.test.ts'],
    reason:
      "Domain precedence/fallback resolution for a database cell's displayed value; a wrong precedence boundary shows/stores the wrong value without any error.",
  },
];

// Registry/config paths whose own semantics changing must re-validate every
// registered target rather than silently skip (see "registry/Stryker config
// change... -> all registered targets or invalid, never silent skip").
const REGISTRY_SEMANTIC_CHANGE_PATHS = new Set([
  'stryker.config.mjs',
  'scripts/lib/mutationTargets.ts',
]);

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function isTestShapedPath(filePath: string): boolean {
  return filePath.endsWith('.test.ts');
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

/** Options for {@link validateMutationRegistry}. */
export interface ValidateMutationRegistryOptions {
  /** Test-only override for file-existence checks. Production callers should omit this. */
  fileExists?: (filePath: string) => boolean;
}

/** Result of {@link validateMutationRegistry}. */
export type MutationRegistryValidation =
  | { valid: true; targets: readonly MutationTarget[] }
  | { valid: false; errors: string[] };

/**
 * Validate the explicit mutation registry: every source/owning test must
 * exist and be Vitest-owned, and every source/name must be unique.
 * @param [targets] Registry to validate. Defaults to {@link MUTATION_TARGETS}.
 * @param [options] Validation options.
 * @returns `{ valid: true, targets }` or `{ valid: false, errors }`.
 */
export function validateMutationRegistry(
  targets: readonly MutationTarget[] = MUTATION_TARGETS,
  { fileExists = isExistingFile }: ValidateMutationRegistryOptions = {},
): MutationRegistryValidation {
  const errors: string[] = [];
  const seenSources = new Set<string>();
  const seenNames = new Set<string>();

  for (const target of targets) {
    if (target.name.length === 0) {
      errors.push('a mutation target has an empty name');
    } else if (seenNames.has(target.name)) {
      errors.push(`mutation target name ${target.name} is registered more than once`);
    }

    seenNames.add(target.name);

    if (target.source.length === 0) {
      errors.push(`mutation target ${target.name} has an empty source`);
    } else {
      if (seenSources.has(target.source)) {
        errors.push(`mutation target source ${target.source} is registered more than once`);
      }

      seenSources.add(target.source);

      if (!fileExists(target.source)) {
        errors.push(`mutation target ${target.name} references missing source ${target.source}`);
      }
    }

    if (target.tests.length === 0) {
      errors.push(`mutation target ${target.name} has no owning tests`);
    }

    for (const test of target.tests) {
      if (!isTestShapedPath(test)) {
        errors.push(`mutation target ${target.name} references non-Vitest-owned test path ${test}`);
        continue;
      }

      if (!fileExists(test)) {
        errors.push(`mutation target ${target.name} references missing test ${test}`);
      }
    }

    if (target.reason.length === 0) {
      errors.push(`mutation target ${target.name} has an empty reason`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors: uniqSorted(errors) };
  }

  return { valid: true, targets };
}

/** Resolved mutation-impact plan, discriminated by `mode`. */
export type MutationPlan =
  | { mode: 'skip'; sources: string[]; reasons: string[] }
  | { mode: 'focused'; sources: string[]; reasons: string[] }
  | { mode: 'full'; sources: string[]; reasons: string[] }
  | { mode: 'invalid'; sources: string[]; reasons: string[] };

/** Options for {@link resolveMutationPlan}. */
export interface ResolveMutationPlanOptions {
  /** Test-only override for the mutation registry. Production callers should omit this. */
  targets?: readonly MutationTarget[];
  /** Test-only override for file-existence checks. Production callers should omit this. */
  fileExists?: (filePath: string) => boolean;
}

/**
 * Resolve the mutation-impact mode for the given changed files, in priority
 * order: invalid (registry failed self-validation), full (a registry/Stryker
 * config semantic-change path changed -- every registered target is
 * re-validated), focused (a changed file exactly matches a registered
 * target's source or one of its owning tests), or skip (no registered target
 * matched; adjacency/proximity never selects mutation).
 * @param changedFiles Changed file paths.
 * @param [options] Resolution options.
 * @returns Plan with `mode`, candidate `sources`, and human-readable `reasons`.
 */
export function resolveMutationPlan(
  changedFiles: readonly string[],
  { targets = MUTATION_TARGETS, fileExists = isExistingFile }: ResolveMutationPlanOptions = {},
): MutationPlan {
  const registryValidation = validateMutationRegistry(targets, { fileExists });

  if (!registryValidation.valid) {
    return { mode: 'invalid', sources: [], reasons: registryValidation.errors };
  }

  const semanticChangeHit = changedFiles.find((filePath) =>
    REGISTRY_SEMANTIC_CHANGE_PATHS.has(filePath),
  );

  if (semanticChangeHit) {
    return {
      mode: 'full',
      sources: uniqSorted(targets.map((target) => target.source)),
      reasons: [
        `mutation registry/config semantic change ${semanticChangeHit} -> re-validate all registered targets`,
      ],
    };
  }

  const matchedSources = new Set<string>();
  const reasons: string[] = [];

  for (const target of targets) {
    for (const filePath of changedFiles) {
      if (filePath === target.source) {
        matchedSources.add(target.source);
        reasons.push(`registered source ${target.source} changed -> mutate ${target.source}`);
      } else if (target.tests.includes(filePath)) {
        matchedSources.add(target.source);
        reasons.push(`registered owning test ${filePath} changed -> mutate ${target.source}`);
      }
    }
  }

  if (matchedSources.size > 0) {
    return {
      mode: 'focused',
      sources: uniqSorted([...matchedSources]),
      reasons: uniqSorted(reasons),
    };
  }

  return { mode: 'skip', sources: [], reasons: ['no registered mutation target changed'] };
}
