/**
 * Additional-owner annotation validation, and filesystem/Playwright
 * completeness validation, over a collected target E2E inventory (see
 * docs/testing/verify-redesign-pass-d-implementation.md's "Exceptional
 * additional owners" and docs/testing/verify-redesign-pass-d-correction.md's
 * "Remaining blocker — ownership inventory completeness"). This module is
 * pure: it consumes an already-collected inventory (real collection goes
 * through the synchronous `scripts/lib/e2eOwnerInventoryCollector.ts`
 * adapter, which runs Playwright's list/reporter inside the containerized
 * `scripts/lib/e2eOwnerInventoryContainer.ts` child, never TypeScript
 * source parsing) so unit tests can use small fixture inventories without
 * executing Playwright.
 */

import {
  formatOwnerId,
  ownerDirectoryExists as defaultOwnerDirectoryExists,
  parseE2ETargetPath,
  parseOwnerId,
  type E2EOwnerRef,
} from './e2eOwner.ts';

const ADDITIONAL_OWNER_ANNOTATION_TYPE = '_mioframe-owner';

/** One raw Playwright test annotation, as collected from the suite/reporter API. */
export interface RawE2ETestAnnotation {
  type: string;
  description?: string | undefined;
}

/** One raw collected target E2E spec entry, before validation. */
export interface RawE2ESpecInventoryEntry {
  /** Repository-relative target E2E spec path. */
  specPath: string;
  /** Union of every test annotation collected anywhere in this spec file. */
  annotations: RawE2ETestAnnotation[];
}

/** One validated target E2E spec entry with its resolved owner set. */
export interface ResolvedE2ESpecEntry {
  specPath: string;
  primaryOwnerId: string;
  additionalOwnerIds: string[];
  /** Primary owner id plus every additional owner id, deduplicated. */
  ownerIds: string[];
  isProductionArtifact: boolean;
}

/** Validation result for a collected target E2E inventory. */
export interface E2EOwnerInventoryValidation {
  valid: boolean;
  errors: string[];
  entries: ResolvedE2ESpecEntry[];
}

/** Test-only dependencies for {@link validateE2EOwnerInventory}. */
export interface ValidateE2EOwnerInventoryDeps {
  ownerDirectoryExists?: (owner: E2EOwnerRef) => boolean;
}

function validateAdditionalOwnerDescription(
  description: string | undefined,
  specPath: string,
  primaryOwnerId: string,
  checkOwnerExists: (owner: E2EOwnerRef) => boolean,
  errors: string[],
): string | null {
  if (description === undefined || description.length === 0) {
    errors.push(
      `spec ${specPath} has a malformed ${ADDITIONAL_OWNER_ANNOTATION_TYPE} annotation with no description`,
    );
    return null;
  }

  const parsedOwner = parseOwnerId(description);

  if (!parsedOwner) {
    errors.push(
      `spec ${specPath} has a malformed ${ADDITIONAL_OWNER_ANNOTATION_TYPE} annotation description ${JSON.stringify(description)}; expected "page/<Owner>" or "widget/<Owner>"`,
    );
    return null;
  }

  const ownerId = formatOwnerId(parsedOwner);

  if (ownerId === primaryOwnerId) {
    errors.push(
      `spec ${specPath} declares ${ADDITIONAL_OWNER_ANNOTATION_TYPE} annotation ${ownerId} that repeats its own primary owner`,
    );
    return null;
  }

  if (!checkOwnerExists(parsedOwner)) {
    errors.push(
      `spec ${specPath} declares ${ADDITIONAL_OWNER_ANNOTATION_TYPE} annotation ${ownerId} with no matching production directory`,
    );
    return null;
  }

  return ownerId;
}

/**
 * Validate a collected target E2E inventory: every spec path must be
 * structurally valid with an existing primary owner; every
 * `_mioframe-owner` annotation must be well-formed, reference an existing
 * owner distinct from the primary owner, and not repeat within the same
 * spec. A structurally invalid or malformed inventory fails validation
 * entirely rather than silently dropping the offending entry.
 * @param rawEntries Raw collected inventory entries.
 * @param [deps] Test-only dependencies.
 * @returns Validation result with resolved per-spec owner sets.
 */
export function validateE2EOwnerInventory(
  rawEntries: readonly RawE2ESpecInventoryEntry[],
  {
    ownerDirectoryExists: checkOwnerExists = defaultOwnerDirectoryExists,
  }: ValidateE2EOwnerInventoryDeps = {},
): E2EOwnerInventoryValidation {
  const errors: string[] = [];
  const entries: ResolvedE2ESpecEntry[] = [];
  const seenSpecPaths = new Set<string>();

  for (const rawEntry of rawEntries) {
    if (seenSpecPaths.has(rawEntry.specPath)) {
      errors.push(`duplicate target E2E ownership inventory entry for spec ${rawEntry.specPath}`);
      continue;
    }

    seenSpecPaths.add(rawEntry.specPath);

    const parsed = parseE2ETargetPath(rawEntry.specPath);

    if (!parsed) {
      errors.push(
        `target E2E spec ${rawEntry.specPath} is outside the valid pages/widgets owner structure`,
      );
      continue;
    }

    const primaryOwnerId = formatOwnerId(parsed.owner);

    if (!checkOwnerExists(parsed.owner)) {
      errors.push(
        `target E2E spec ${rawEntry.specPath} references owner ${primaryOwnerId} with no matching production directory`,
      );
      continue;
    }

    const additionalOwnerIds: string[] = [];
    const seenAdditionalOwnerIds = new Set<string>();

    for (const annotation of rawEntry.annotations) {
      if (annotation.type !== ADDITIONAL_OWNER_ANNOTATION_TYPE) {
        continue;
      }

      const ownerId = validateAdditionalOwnerDescription(
        annotation.description,
        rawEntry.specPath,
        primaryOwnerId,
        checkOwnerExists,
        errors,
      );

      if (ownerId === null) {
        continue;
      }

      if (seenAdditionalOwnerIds.has(ownerId)) {
        // The same describe-level annotation naturally repeats once per
        // enclosed test when Playwright collects it; that is the same
        // ownership fact restated, not a conflicting second declaration.
        continue;
      }

      seenAdditionalOwnerIds.add(ownerId);
      additionalOwnerIds.push(ownerId);
    }

    entries.push({
      specPath: rawEntry.specPath,
      primaryOwnerId,
      additionalOwnerIds,
      ownerIds: [primaryOwnerId, ...additionalOwnerIds],
      isProductionArtifact: parsed.isProductionArtifact,
    });
  }

  return { valid: errors.length === 0, errors, entries };
}

/** Validation result for filesystem/Playwright target E2E inventory completeness. */
export interface E2EOwnerInventoryCompletenessValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validate that the collected Playwright target E2E inventory and the
 * structurally valid filesystem target E2E tree represent the exact same
 * spec set (see docs/testing/verify-redesign-pass-d-correction.md's
 * "Fail-closed filesystem / Playwright inventory equality"). A filesystem
 * target missing from the collected inventory, or a collected entry that is
 * not a current filesystem target, is structural invalidity: an empty or
 * partial Playwright inventory must never be accepted as complete merely
 * because every entry it does contain is individually well-formed.
 * @param collectedSpecPaths Spec paths from the collected (already
 * structurally validated) Playwright target E2E inventory.
 * @param targetPaths Every structurally valid target E2E path currently on
 * disk, from {@link validateE2ETargetTree}'s `targetPaths`.
 * @returns Validation result; `errors` lists every set-difference in both
 * directions.
 */
export function validateE2EOwnerInventoryCompleteness(
  collectedSpecPaths: readonly string[],
  targetPaths: readonly string[],
): E2EOwnerInventoryCompletenessValidation {
  const errors: string[] = [];
  const collectedSet = new Set(collectedSpecPaths);
  const targetSet = new Set(targetPaths);

  for (const targetPath of targetSet) {
    if (!collectedSet.has(targetPath)) {
      errors.push(
        `target E2E spec ${targetPath} exists on disk but was not collected by the Playwright ownership inventory (playwright.config.ts / playwright.release.config.ts)`,
      );
    }
  }

  for (const collectedPath of collectedSet) {
    if (!targetSet.has(collectedPath)) {
      errors.push(
        `Playwright ownership inventory collected target E2E spec ${collectedPath}, which is not part of the current filesystem target E2E tree`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
