import fs from 'node:fs';

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.ts';
import {
  formatOwnerId,
  ownerDirectoryExists as defaultOwnerDirectoryExists,
  parseE2ETargetPath,
  type E2EOwnerRef,
} from './e2eOwner.ts';
import {
  validateE2EOwnerInventory,
  validateE2EOwnerInventoryCompleteness,
  type RawE2ESpecInventoryEntry,
  type ResolvedE2ESpecEntry,
} from './e2eOwnerInventory.ts';
import { validateE2ETargetTree, type E2ETargetTreeValidation } from './e2eOwnerTree.ts';
import { traverseOwnersForChangedPath, type ReverseDependencyGraph } from './e2eOwnerTraversal.ts';
import { acquireProductionReverseGraph } from './e2eGraph.ts';
import { collectE2EOwnerInventory } from './e2eOwnerInventoryCollector.ts';
import {
  MANAGED_UPDATES_E2E_SPEC_SET,
  RELEASE_SMOKE_SPEC,
  validateProductionArtifactE2EMembership,
  type ReleaseProofInventoryValidation,
} from './releaseProofInventory.ts';

/**
 * Structural, dependency-graph-driven application E2E planner (see
 * docs/testing/verify-redesign-pass-d-implementation.md). Replaces the
 * historical `E2E_SCENARIO_SCOPES` manual production-path -> spec registry:
 * primary E2E ownership comes only from `tests/e2e/pages/<Owner>/**` /
 * `tests/e2e/widgets/<Owner>/**` target paths, and affected-owner discovery
 * uses one `dependency-cruiser` reverse-dependency graph traversal instead of
 * a maintained mapping table.
 */

const WORKFLOWS_PREFIX = '.github/workflows/';
const PACKAGE_JSON_PATH = 'package.json';
const NON_PRODUCTION_PATH_PATTERN = /\.(test|spec|stories|testUtils)\.(ts|tsx|vue|mjs|js|jsx)$/;

// Full-lane E2E infrastructure/config/tooling: a change here can affect
// every target E2E spec's discovery, ownership resolution, or execution,
// regardless of graph/inventory-derived scope. Also carries the shared
// managed-release fixture/publisher/artifact build support the special
// productionArtifact leaves exercise (see
// docs/testing/verify-redesign-final-review-correction.md's "Decision 3");
// widening the complete E2E type is a safe superset of widening only the
// two special leaves.
const FULL_LANE_E2E_INFRASTRUCTURE_EXACT_FILES = new Set([
  'playwright.config.ts',
  'playwright.release.config.ts',
  'scripts/e2eContainer.mjs',
  'scripts/e2eHost.mjs',
  'scripts/e2eReleaseContainer.mjs',
  'scripts/playwrightContainer.ts',
  'scripts/verify.ts',
  'scripts/lib/e2eRisk.ts',
  'scripts/lib/e2eOwner.ts',
  'scripts/lib/e2eOwnerTree.ts',
  'scripts/lib/e2eOwnerInventory.ts',
  'scripts/lib/e2eOwnerTraversal.ts',
  'scripts/lib/e2eGraph.ts',
  'scripts/lib/e2eGraphCollector.ts',
  'scripts/lib/e2eOwnerInventoryCollector.ts',
  'scripts/lib/e2eOwnerInventoryContainer.ts',
  'scripts/lib/e2eOwnerInventoryReporter.ts',
  'scripts/lib/e2eProjectApplicability.ts',
  'scripts/lib/releaseProofInventory.ts',
  'scripts/release/managedUpdatesProof.ts',
  'scripts/release/artifactServer.mjs',
  // Common command/lock/result/signal execution support shared by the
  // release Playwright/group runners above (see
  // docs/testing/verify-redesign-final-review-correction-02-agent-task.md's
  // "Complete explicit shared special-runner support ownership"): a safely
  // broad full-E2E fallback, simpler than adding a special-only dependency
  // mapping for just the two productionArtifact leaves.
  'scripts/lib/localCommandGuard.ts',
  'scripts/lib/commandLock.ts',
  'scripts/lib/runLocalCommand.ts',
  'scripts/lib/processResult.ts',
  'scripts/lib/signalForward.ts',
  'tests/e2e/helpers.ts',
  'tests/e2e/reorderSurface.testUtils.ts',
  'vite.config.ts',
  'pnpm-lock.yaml',
  'tsconfig.src.json',
]);
const FULL_LANE_E2E_INFRASTRUCTURE_PREFIXES = ['tests/e2e/release/fixtures/', 'scripts/pages/lib/'];

function isFullLaneE2EInfrastructurePath(filePath: string): boolean {
  if (FULL_LANE_E2E_INFRASTRUCTURE_EXACT_FILES.has(filePath)) {
    return true;
  }

  if (FULL_LANE_E2E_INFRASTRUCTURE_PREFIXES.some((prefix) => filePath.startsWith(prefix))) {
    return true;
  }

  const baseName = filePath.split('/').pop() ?? filePath;

  if (baseName.startsWith('tsconfig') && baseName.endsWith('.json')) {
    return true;
  }

  return filePath.startsWith(WORKFLOWS_PREFIX);
}

function isAppBootstrapPath(filePath: string): boolean {
  return filePath.startsWith('src/app/') || filePath === 'src/pages/routes.ts';
}

/**
 * Check whether a changed path is production `src/**` source relevant to
 * E2E ownership: TypeScript/Vue source, excluding colocated test/story/
 * behavior/visual/browser-integration/performance specs and helpers.
 * @param filePath Repository-relative changed file path.
 * @returns True when the path is relevant production source.
 */
export function isRelevantProductionSourcePath(filePath: string): boolean {
  if (!filePath.startsWith('src/')) {
    return false;
  }

  if (NON_PRODUCTION_PATH_PATTERN.test(filePath)) {
    return false;
  }

  return filePath.endsWith('.ts') || filePath.endsWith('.vue');
}

function isExistingFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

/** Resolved structural E2E plan, discriminated by `mode`. */
export type StructuralE2EPlan =
  | { mode: 'invalid'; reasons: string[] }
  | { mode: 'full'; reasons: string[] }
  | {
      mode: 'focused';
      ordinarySpecs: string[];
      releaseSmokeSelected: boolean;
      managedUpdatesE2ESelected: boolean;
      reasons: string[];
    }
  | { mode: 'skip'; reasons: string[] };

/** Test-only dependencies for {@link resolveStructuralE2EPlan}. */
export interface ResolveStructuralE2EPlanDeps {
  packageJsonOldRef?: string | null;
  fileExists?: (filePath: string) => boolean;
  ownerDirectoryExists?: (owner: E2EOwnerRef) => boolean;
  acquireGraph?: () => ReturnType<typeof acquireProductionReverseGraph>;
  collectOwnerInventory?: () => RawE2ESpecInventoryEntry[];
  validateTargetTree?: () => E2ETargetTreeValidation;
  validateProductionArtifactMembership?: () => ReleaseProofInventoryValidation;
}

function selectedSpecsToPlan(
  entryBySpecPath: Map<string, ResolvedE2ESpecEntry>,
  selectedSpecPaths: ReadonlySet<string>,
  reasons: string[],
): StructuralE2EPlan {
  const ordinarySpecs: string[] = [];
  let releaseSmokeSelected = false;
  let managedUpdatesE2ESelected = false;

  for (const specPath of selectedSpecPaths) {
    const entry = entryBySpecPath.get(specPath);

    if (!entry) {
      continue;
    }

    if (!entry.isProductionArtifact) {
      ordinarySpecs.push(specPath);
      continue;
    }

    // Routed by exact registered spec membership (see
    // scripts/lib/releaseProofInventory.ts), not an owner-name heuristic:
    // resolveStructuralE2EPlan already validated, before reaching this
    // point, that the current filesystem productionArtifact inventory
    // equals exactly {RELEASE_SMOKE_SPEC} ∪ MANAGED_UPDATES_E2E_SPEC_SET, so
    // every `isProductionArtifact` entry here is necessarily one of the two.
    if (specPath === RELEASE_SMOKE_SPEC) {
      releaseSmokeSelected = true;
    } else if (MANAGED_UPDATES_E2E_SPEC_SET.has(specPath)) {
      managedUpdatesE2ESelected = true;
    }
  }

  if (ordinarySpecs.length === 0 && !releaseSmokeSelected && !managedUpdatesE2ESelected) {
    return { mode: 'skip', reasons: ['empty e2e scope'] };
  }

  return {
    mode: 'focused',
    ordinarySpecs: [...ordinarySpecs].sort((a, b) => a.localeCompare(b)),
    releaseSmokeSelected,
    managedUpdatesE2ESelected,
    reasons,
  };
}

/**
 * Resolve the structural application E2E plan for a changed-file set, in
 * priority order: invalid (a structural/ownership-inventory problem,
 * including filesystem/Playwright inventory incompleteness, that must fail
 * closed instead of silently widening), full (infrastructure,
 * runtime-relevant `package.json`, `src/app`/routes, a removed/moved spec
 * whose owner can no longer be validated, graph acquisition failure, or a
 * relevant production path with no safely reachable owner), focused (a
 * non-empty selected spec set), or skip (no relevant changes).
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [deps] Resolution options and test-only dependencies.
 * @returns The resolved structural E2E plan.
 */
export function resolveStructuralE2EPlan(
  changedFiles: readonly string[],
  {
    packageJsonOldRef = null,
    fileExists = isExistingFile,
    ownerDirectoryExists = defaultOwnerDirectoryExists,
    acquireGraph = acquireProductionReverseGraph,
    collectOwnerInventory = collectE2EOwnerInventory,
    validateTargetTree = validateE2ETargetTree,
    validateProductionArtifactMembership = validateProductionArtifactE2EMembership,
  }: ResolveStructuralE2EPlanDeps = {},
): StructuralE2EPlan {
  let rawInventory: RawE2ESpecInventoryEntry[];

  try {
    rawInventory = collectOwnerInventory();
  } catch (error) {
    return {
      mode: 'invalid',
      reasons: [
        `target E2E ownership inventory could not be collected: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ],
    };
  }

  const inventoryValidation = validateE2EOwnerInventory(rawInventory, { ownerDirectoryExists });

  if (!inventoryValidation.valid) {
    return { mode: 'invalid', reasons: inventoryValidation.errors };
  }

  // The filesystem target E2E tree is the independent ground truth for
  // "what must be proven"; the Playwright-collected inventory must be
  // proven complete against it before any selection happens, so a
  // testMatch/testIgnore/project drift can never silently drop a direct
  // changed/added target E2E from the plan (see
  // docs/testing/verify-redesign-pass-d-correction.md's "Fail-closed
  // filesystem / Playwright inventory equality").
  const targetTreeValidation = validateTargetTree();

  if (!targetTreeValidation.valid) {
    return { mode: 'invalid', reasons: targetTreeValidation.errors };
  }

  const completenessValidation = validateE2EOwnerInventoryCompleteness(
    inventoryValidation.entries.map((entry) => entry.specPath),
    targetTreeValidation.targetPaths,
  );

  if (!completenessValidation.valid) {
    return { mode: 'invalid', reasons: completenessValidation.errors };
  }

  // The registered exceptional productionArtifact E2E inventory (see
  // scripts/lib/releaseProofInventory.ts) must equal, exactly, the current
  // filesystem productionArtifact/ target set before any spec is routed to
  // the `release-smoke`/`managed-updates-e2e` leaves below: an unregistered
  // productionArtifact target is structural invalidity, never a silent skip
  // (see docs/testing/verify-redesign-final-review-correction.md's
  // "Decision 2").
  const productionArtifactMembershipValidation = validateProductionArtifactMembership();

  if (!productionArtifactMembershipValidation.valid) {
    return { mode: 'invalid', reasons: productionArtifactMembershipValidation.errors };
  }

  const entryBySpecPath = new Map(
    inventoryValidation.entries.map((entry) => [entry.specPath, entry] as const),
  );

  const fullReasons: string[] = [];
  const infrastructureHit = changedFiles.find(isFullLaneE2EInfrastructurePath);

  if (infrastructureHit) {
    fullReasons.push(`full-lane E2E infrastructure path ${infrastructureHit} -> full E2E`);
  }

  if (
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })
  ) {
    fullReasons.push('runtime-relevant package.json change -> full E2E');
  }

  const appBootstrapHit = changedFiles.find(isAppBootstrapPath);

  if (appBootstrapHit) {
    fullReasons.push(`app bootstrap/routing path ${appBootstrapHit} -> full E2E`);
  }

  // Direct target E2E spec changes (added/modified/removed-or-moved).
  const invalidReasons: string[] = [];
  const directSelectedSpecPaths = new Set<string>();
  const widenedOwnerIds = new Set<string>();

  for (const filePath of changedFiles) {
    const parsed = parseE2ETargetPath(filePath);

    if (!parsed) {
      continue;
    }

    const ownerId = formatOwnerId(parsed.owner);

    if (fileExists(filePath)) {
      if (!ownerDirectoryExists(parsed.owner)) {
        invalidReasons.push(
          `target E2E spec ${filePath} references owner ${ownerId} with no matching production directory`,
        );
        continue;
      }

      directSelectedSpecPaths.add(filePath);
      continue;
    }

    if (!ownerDirectoryExists(parsed.owner)) {
      fullReasons.push(
        `removed/moved target E2E spec ${filePath} had owner ${ownerId}, which no longer exists in production -> full E2E`,
      );
      continue;
    }

    widenedOwnerIds.add(ownerId);
  }

  if (invalidReasons.length > 0) {
    return { mode: 'invalid', reasons: invalidReasons };
  }

  // Relevant production source impact via the reverse-dependency graph.
  const relevantProductionPaths = changedFiles.filter(
    (filePath) => isRelevantProductionSourcePath(filePath) && !isAppBootstrapPath(filePath),
  );
  const graphReachedOwnerIds = new Set<string>();

  if (relevantProductionPaths.length > 0 && fullReasons.length === 0) {
    const graphResult = acquireGraph();

    if (!graphResult.ok) {
      fullReasons.push(`production dependency graph acquisition failed: ${graphResult.error}`);
    } else {
      for (const filePath of relevantProductionPaths) {
        const owners = traverseOwnersForChangedPath(filePath, graphResult.graph);

        if (owners.size === 0) {
          fullReasons.push(
            `relevant production change ${filePath} has no safely established E2E product owner -> full E2E`,
          );
          continue;
        }

        for (const ownerId of owners) {
          graphReachedOwnerIds.add(ownerId);
        }
      }
    }
  }

  if (fullReasons.length > 0) {
    return { mode: 'full', reasons: fullReasons };
  }

  const reachedOwnerIds = new Set<string>([...widenedOwnerIds, ...graphReachedOwnerIds]);
  const selectedSpecPaths = new Set<string>(directSelectedSpecPaths);
  const reasons: string[] = [];

  for (const entry of entryBySpecPath.values()) {
    if (entry.ownerIds.some((ownerId) => reachedOwnerIds.has(ownerId))) {
      selectedSpecPaths.add(entry.specPath);
    }
  }

  for (const specPath of directSelectedSpecPaths) {
    reasons.push(`changed target E2E spec ${specPath} -> ${specPath}`);
  }

  for (const ownerId of reachedOwnerIds) {
    reasons.push(`affected owner ${ownerId} -> owned target E2E specs`);
  }

  return selectedSpecsToPlan(entryBySpecPath, selectedSpecPaths, reasons.length > 0 ? reasons : []);
}

/** Resolution options for {@link canChangedPathsAffectE2E}. */
export interface CanChangedPathsAffectE2EOptions {
  packageJsonOldRef?: string | null;
}

/**
 * Cheaply classify whether a changed-file set can plausibly affect E2E,
 * without acquiring the expensive containerized Playwright ownership
 * inventory or the dependency-cruiser reverse-dependency graph (see
 * docs/testing/verify-redesign-final-review-correction.md's "Decision 6"):
 * relevance is resolved before {@link resolveStructuralE2EPlan}'s expensive
 * acquisition, not merely inside it. Conservative by design: any path this
 * classifier cannot cheaply rule out returns `true` (acquire), so a false
 * positive is acceptable but a false negative is not.
 * @param changedFiles Sorted unique list of repository-relative changed file paths.
 * @param [options] Resolution options.
 * @returns `true` when {@link resolveStructuralE2EPlan}'s expensive
 * acquisition may still be needed; `false` only when every changed path is
 * cheaply provable E2E-irrelevant.
 */
export function canChangedPathsAffectE2E(
  changedFiles: readonly string[],
  { packageJsonOldRef = null }: CanChangedPathsAffectE2EOptions = {},
): boolean {
  if (changedFiles.length === 0) {
    return false;
  }

  if (changedFiles.some(isFullLaneE2EInfrastructurePath)) {
    return true;
  }

  if (changedFiles.some(isAppBootstrapPath)) {
    return true;
  }

  if (
    changedFiles.includes(PACKAGE_JSON_PATH) &&
    isPackageJsonRuntimeRelevantChange({ oldRef: packageJsonOldRef })
  ) {
    return true;
  }

  if (changedFiles.some((filePath) => parseE2ETargetPath(filePath) !== null)) {
    return true;
  }

  return changedFiles.some(
    (filePath) => isRelevantProductionSourcePath(filePath) && !isAppBootstrapPath(filePath),
  );
}

export type { ReverseDependencyGraph };
