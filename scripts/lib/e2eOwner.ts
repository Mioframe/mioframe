import fs from 'node:fs';

/**
 * Structural primary-owner parsing/validation for target application E2E
 * specs. A target E2E spec's owner comes only from
 * its path: `tests/e2e/pages/<Owner>/**\/*.e2e.spec.ts` or
 * `tests/e2e/widgets/<Owner>/**\/*.e2e.spec.ts`. There is no second list of
 * legal owner names; validity is checked directly against the current
 * `src/pages/<Owner>/` or `src/widgets/<Owner>/` production directory.
 */

const TARGET_PATH_PATTERN = /^tests\/e2e\/(pages|widgets)\/([^/]+)\/(.+)\.e2e\.spec\.ts$/;
const OWNER_ID_PATTERN = /^(page|widget)\/([^/]+)$/;
const PRODUCTION_ARTIFACT_SEGMENT = 'productionArtifact';

/** One structural E2E owner reference: an owner kind plus its concrete name. */
export interface E2EOwnerRef {
  kind: 'page' | 'widget';
  name: string;
}

/** Result of successfully parsing a target E2E path's shape. */
export interface ParsedE2ETargetPath {
  owner: E2EOwnerRef;
  /** Whether the spec lives under the owner-local `productionArtifact/` subdirectory. */
  isProductionArtifact: boolean;
}

/**
 * Format an {@link E2EOwnerRef} as its canonical owner id, e.g. `page/HomePane`.
 * @param owner Owner reference.
 * @returns Canonical owner id string.
 */
export function formatOwnerId(owner: E2EOwnerRef): string {
  return `${owner.kind}/${owner.name}`;
}

/**
 * Parse an owner id string (e.g. `page/HomePane` or `widget/DocumentView`)
 * into a structured {@link E2EOwnerRef}. Owner ids are case-sensitive.
 * @param ownerId Candidate owner id string.
 * @returns The parsed owner reference, or `null` when malformed.
 */
export function parseOwnerId(ownerId: string): E2EOwnerRef | null {
  const match = OWNER_ID_PATTERN.exec(ownerId);

  if (!match) {
    return null;
  }

  const [, kindToken, name] = match;
  const kind: E2EOwnerRef['kind'] = kindToken === 'page' ? 'page' : 'widget';

  return { kind, name };
}

/**
 * Parse a repository-relative path's structural shape as a target E2E spec.
 * Does not touch the filesystem; use {@link ownerDirectoryExists} to validate
 * the owner against current production source.
 * @param filePath Repository-relative path.
 * @returns The parsed owner/production-artifact shape, or `null` when the
 * path is not a structurally valid target E2E spec path.
 */
export function parseE2ETargetPath(filePath: string): ParsedE2ETargetPath | null {
  const match = TARGET_PATH_PATTERN.exec(filePath);

  if (!match) {
    return null;
  }

  const [, ownerKindDir, ownerName, rest] = match;
  const restSegments = rest.split('/');
  const isProductionArtifact = restSegments[0] === PRODUCTION_ARTIFACT_SEGMENT;
  const kind: E2EOwnerRef['kind'] = ownerKindDir === 'pages' ? 'page' : 'widget';

  return {
    owner: { kind, name: ownerName },
    isProductionArtifact,
  };
}

/** Test-only filesystem seam for {@link ownerDirectoryExists}. */
export interface OwnerDirectoryExistsDeps {
  isDirectory?: (dirPath: string) => boolean;
}

function defaultIsDirectory(dirPath: string): boolean {
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Check whether an owner's current production directory exists:
 * `src/pages/<Owner>/` for `page`, `src/widgets/<Owner>/` for `widget`. This
 * is the only legal-owner-name check; there is no separate registry.
 * @param owner Owner reference to validate.
 * @param [deps] Test-only filesystem seam.
 * @returns True when the owner's production directory exists.
 */
export function ownerDirectoryExists(
  owner: E2EOwnerRef,
  { isDirectory = defaultIsDirectory }: OwnerDirectoryExistsDeps = {},
): boolean {
  const root = owner.kind === 'page' ? 'src/pages' : 'src/widgets';

  return isDirectory(`${root}/${owner.name}`);
}

/** Structural validation result for one target E2E path. */
export interface E2ETargetPathValidation {
  valid: boolean;
  parsed: ParsedE2ETargetPath | null;
  ownerId: string | null;
  errors: string[];
}

/** Test-only dependencies for {@link validateE2ETargetPath}. */
export interface ValidateE2ETargetPathDeps {
  ownerDirectoryExists?: (owner: E2EOwnerRef) => boolean;
}

/**
 * Validate one target E2E path: correct structural shape under
 * `tests/e2e/pages/<Owner>/` or `tests/e2e/widgets/<Owner>/`, and an owner
 * directory that currently exists in production source.
 * @param filePath Repository-relative path.
 * @param [deps] Test-only dependencies.
 * @returns Validation result with the parsed shape (when structurally
 * parseable) and human-readable errors.
 */
export function validateE2ETargetPath(
  filePath: string,
  { ownerDirectoryExists: checkOwnerExists = ownerDirectoryExists }: ValidateE2ETargetPathDeps = {},
): E2ETargetPathValidation {
  const parsed = parseE2ETargetPath(filePath);

  if (!parsed) {
    return {
      valid: false,
      parsed: null,
      ownerId: null,
      errors: [
        `target E2E spec ${filePath} is outside the valid pages/widgets owner structure (tests/e2e/pages/<Owner>/**/*.e2e.spec.ts or tests/e2e/widgets/<Owner>/**/*.e2e.spec.ts)`,
      ],
    };
  }

  const ownerId = formatOwnerId(parsed.owner);

  if (!checkOwnerExists(parsed.owner)) {
    return {
      valid: false,
      parsed,
      ownerId,
      errors: [
        `target E2E spec ${filePath} references owner ${ownerId} with no matching production directory`,
      ],
    };
  }

  return { valid: true, parsed, ownerId, errors: [] };
}

/**
 * Check whether a repository-relative path is under `src/pages/<Owner>/` and
 * resolve that owner id.
 * @param filePath Repository-relative path.
 * @returns The owning `page/<Owner>` id, or `null` when not under a page owner.
 */
export function getPageOwnerIdForSourcePath(filePath: string): string | null {
  const match = /^src\/pages\/([^/]+)\//.exec(filePath);

  return match ? formatOwnerId({ kind: 'page', name: match[1] }) : null;
}

/**
 * Check whether a repository-relative path is under `src/widgets/<Owner>/`
 * and resolve that owner id.
 * @param filePath Repository-relative path.
 * @returns The owning `widget/<Owner>` id, or `null` when not under a widget owner.
 */
export function getWidgetOwnerIdForSourcePath(filePath: string): string | null {
  const match = /^src\/widgets\/([^/]+)\//.exec(filePath);

  return match ? formatOwnerId({ kind: 'widget', name: match[1] }) : null;
}
