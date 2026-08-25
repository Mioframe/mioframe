import fs from 'node:fs';

// Mutation infrastructure: a change here can alter every registered target's
// execution/ownership, so it always selects the complete registered
// inventory instead of the exact affected-source relation below (see
// docs/testing/verify-redesign-pass-e-implementation.md's "Stryker
// execution").
const MUTATION_INFRA_PATHS: ReadonlySet<string> = new Set([
  'scripts/lib/mutationTargets.ts',
  'stryker.config.mjs',
]);

/** One explicit, project-owned mutation ownership entry. */
export interface MutationTarget {
  /** Exact high-risk production source file this target mutates. */
  source: string;
  /** Exact owning focused test file(s) that must kill mutants of `source`. */
  tests: readonly string[];
  /** Concrete risk reason durable regression protection is registered for. */
  reason: string;
}

/**
 * The single explicit source of mutation ownership. `stryker.config.mjs`
 * derives its complete `mutate` list only from this registry; `scripts/verify.ts`
 * selects only from this registry's exact source/test relations. See
 * docs/testing/verify-redesign-pass-e-implementation.md's "Initial accepted
 * registry".
 */
export const MUTATION_TARGETS: readonly MutationTarget[] = [
  {
    source: 'src/shared/lib/changeObject/deepPatchJsonObject.ts',
    tests: ['src/shared/lib/changeObject/deepPatchJsonObject.test.ts'],
    reason:
      'recursive patch/delete/normalization semantics mutate nested JSON/CRDT-compatible state and are broadly reused.',
  },
  {
    source: 'src/shared/lib/changeObject/deepPutJsonObject.ts',
    tests: ['src/shared/lib/changeObject/deepPutJsonObject.test.ts'],
    reason:
      'recursive replacement/deletion semantics mutate nested JSON/CRDT-compatible state and are broadly reused.',
  },
  {
    source: 'src/shared/lib/migrations/defineMigrations.ts',
    tests: ['src/shared/lib/migrations/defineMigrations.test.ts'],
    reason:
      'migration ordering/version application/validation protects persisted-data compatibility.',
  },
  {
    source: 'src/shared/lib/migrations/defineVersion.ts',
    tests: ['src/shared/lib/migrations/defineVersion.test.ts'],
    reason:
      'schema/version transition definition is part of the persisted-data migration boundary.',
  },
];

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function uniqSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Result of validating a mutation target registry. */
export interface MutationRegistryValidation {
  valid: boolean;
  errors: string[];
}

/** Resolution options for {@link validateMutationTargets} and {@link resolveMutationPlan}. */
export interface MutationTargetsOptions {
  /**
   * Test-only override for existence checks, bypassing the real filesystem.
   * Production callers should omit this so registry entries are validated
   * against the real repository state.
   */
  fileExists?: (filePath: string) => boolean;
}

/**
 * Validate a mutation target registry before any Stryker execution: every
 * registered source and owning test must exist, sources must be unique, every
 * target must have at least one owning test, and `reason` must be non-empty.
 * @param [targets] Registry to validate; defaults to {@link MUTATION_TARGETS}.
 * @param [options] Resolution options.
 * @returns `valid` plus every violation found, in registry order.
 */
export function validateMutationTargets(
  targets: readonly unknown[] = MUTATION_TARGETS,
  { fileExists = isExistingFile }: MutationTargetsOptions = {},
): MutationRegistryValidation {
  const errors: string[] = [];
  const seenSources = new Set<string>();

  for (const target of targets) {
    if (
      !isRecord(target) ||
      typeof target.source !== 'string' ||
      target.source.trim() === '' ||
      !Array.isArray(target.tests) ||
      typeof target.reason !== 'string'
    ) {
      errors.push(`malformed mutation target entry: ${JSON.stringify(target)}`);
      continue;
    }

    if (seenSources.has(target.source)) {
      errors.push(`duplicate mutation target source: ${target.source}`);
    }

    seenSources.add(target.source);

    if (!fileExists(target.source)) {
      errors.push(`mutation target source does not exist: ${target.source}`);
    }

    if (target.tests.length === 0) {
      errors.push(`mutation target ${target.source} has zero owning tests`);
    }

    for (const test of target.tests) {
      if (typeof test !== 'string' || test.trim() === '') {
        errors.push(`mutation target ${target.source} has a malformed owning test entry`);
      } else if (!fileExists(test)) {
        errors.push(`mutation target ${target.source} owning test does not exist: ${test}`);
      }
    }

    if (target.reason.trim() === '') {
      errors.push(`mutation target ${target.source} has an empty reason`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Resolved mutation plan, discriminated by `mode`. */
export type MutationPlan =
  | { mode: 'invalid'; sources: string[]; reasons: string[] }
  | { mode: 'skip'; sources: string[]; reasons: string[] }
  | { mode: 'focused'; sources: string[]; reasons: string[] }
  | { mode: 'full'; sources: string[]; reasons: string[] };

/**
 * Resolve the affected mutation plan from a changed-file set and the
 * registered target inventory: invalid registry state fails closed before any
 * selection, a mutation-infrastructure change selects the complete inventory,
 * otherwise only targets whose exact registered source or owning test changed
 * are selected.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns The resolved {@link MutationPlan}.
 */
export function resolveMutationPlan(
  changedFiles: readonly string[],
  { fileExists = isExistingFile }: MutationTargetsOptions = {},
): MutationPlan {
  const validation = validateMutationTargets(MUTATION_TARGETS, { fileExists });

  if (!validation.valid) {
    return { mode: 'invalid', sources: [], reasons: validation.errors };
  }

  const allSources = uniqSorted(MUTATION_TARGETS.map((target) => target.source));
  const infraHit = changedFiles.find((filePath) => MUTATION_INFRA_PATHS.has(filePath));

  if (infraHit) {
    return {
      mode: 'full',
      sources: allSources,
      reasons: [
        `mutation registry/infrastructure change ${infraHit} -> complete registered mutation inventory`,
      ],
    };
  }

  const changedSet = new Set(changedFiles);
  const focusedSources: string[] = [];
  const reasons: string[] = [];

  for (const target of MUTATION_TARGETS) {
    const sourceChanged = changedSet.has(target.source);
    const testChanged = target.tests.some((test) => changedSet.has(test));

    if (!sourceChanged && !testChanged) {
      continue;
    }

    focusedSources.push(target.source);
    reasons.push(
      sourceChanged
        ? `changed registered mutation source ${target.source}`
        : `changed registered owning test for ${target.source}`,
    );
  }

  if (focusedSources.length === 0) {
    return { mode: 'skip', sources: [], reasons: ['no registered mutation target affected'] };
  }

  return { mode: 'focused', sources: uniqSorted(focusedSources), reasons: uniqSorted(reasons) };
}
