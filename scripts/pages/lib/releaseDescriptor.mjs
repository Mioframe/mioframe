/**
 * Build and validate immutable release descriptors for the managed pinned
 * application updates feature (stable and develop channels only).
 *
 * This module intentionally re-implements structural validation already
 * expressed as a zod schema in `src/shared/service/appUpdate/contracts.ts`,
 * rather than importing it: Node publish scripts run as plain ESM `.mjs`
 * with no TypeScript loader, so the two validators are kept independently
 * correct and proven equivalent against the shared fixture corpus in
 * `releaseDescriptorCorpus.mjs` (see `releaseDescriptor.test.mjs` and
 * `contracts.test.ts`).
 */

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/** Channel-root-relative path prefix reserved for controller metadata — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * A fixed, arbitrary base URL used only to resolve a candidate path through
 * the platform `URL` parser for the canonicalization round-trip check in
 * {@link isCanonicalReleasePath}. Never a real network origin.
 */
const CANONICAL_PATH_BASE = 'https://mioframe.internal/';

export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/**
 * Returns `true` when `value` is a positive safe integer, the sole identity
 * and ordering value for a release. Mirrors `isPositiveSafeInteger` in
 * `src/shared/service/appUpdate/contracts.ts`.
 * @param value Candidate value.
 * @returns Whether `value` is a positive safe integer.
 */
export function isPositiveSafeInteger(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Returns `true` when `path` is the single canonical channel-root-relative
 * representation of a release file — never merely a path that *resolves* to
 * one. Rejects: an empty path; a leading or trailing `/`; any `\`; any `%`
 * (no percent-encoding at all, valid or not); a query (`?`) or fragment
 * (`#`); an empty, `.`, or `..` path segment (which also rejects a doubled
 * `//` separator); and the reserved `updates/` metadata prefix (which also
 * excludes a release's own archived index from ever being listed as one of
 * its own ordinary release files). As a final catch-all, resolves `path`
 * against a fixed base through the platform `URL` parser and requires its
 * resulting pathname (with the leading `/` stripped) to equal `path`
 * exactly — this is what additionally rejects a URL-normalizable alias such
 * as a raw space, which would otherwise pass every explicit character check
 * above. Mirrors `isCanonicalReleasePath` in
 * `src/shared/service/appUpdate/contracts.ts`, proven equivalent against the
 * shared corpus in `releaseDescriptorCorpus.mjs`.
 * @param path Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export function isCanonicalReleasePath(path) {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (path.startsWith('/') || path.endsWith('/')) return false;
  if (path.includes('\\')) return false;
  if (path.includes('%')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (path === 'updates' || path.startsWith(RESERVED_UPDATES_PREFIX)) return false;
  if (
    path.split('/').some((segment) => segment.length === 0 || segment === '.' || segment === '..')
  ) {
    return false;
  }
  let normalizedPathname;
  try {
    normalizedPathname = new URL(path, CANONICAL_PATH_BASE).pathname;
  } catch {
    return false;
  }
  return normalizedPathname.slice(1) === path;
}

/**
 * Structurally validates one `ReleaseFile` record.
 * @param candidate Value to validate.
 * @returns Whether `candidate` is a valid `ReleaseFile`.
 */
export function isValidReleaseFile(candidate) {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const { path, sha256, byteSize } = candidate;
  return (
    isCanonicalReleasePath(path) &&
    typeof sha256 === 'string' &&
    SHA256_HEX_PATTERN.test(sha256) &&
    typeof byteSize === 'number' &&
    Number.isInteger(byteSize) &&
    byteSize >= 0
  );
}

/**
 * Returns `true` when no two files in `files` share the same `path`.
 * @param files Candidate release file list.
 * @returns Whether every file path is unique.
 */
function hasUniqueFilePaths(files) {
  return new Set(files.map((file) => file.path)).size === files.length;
}

/**
 * Structurally validates one `ReleaseDescriptor` record.
 * @param candidate Value to validate.
 * @returns Whether `candidate` is a valid `ReleaseDescriptor`.
 */
export function isValidReleaseDescriptor(candidate) {
  if (typeof candidate !== 'object' || candidate === null) return false;
  const {
    schemaVersion,
    releaseNumber,
    appVersion,
    buildId,
    buildDate,
    indexSha256,
    indexByteSize,
    files,
  } = candidate;
  return (
    schemaVersion === RELEASE_DESCRIPTOR_SCHEMA_VERSION &&
    isPositiveSafeInteger(releaseNumber) &&
    typeof appVersion === 'string' &&
    appVersion.length > 0 &&
    typeof buildId === 'string' &&
    buildId.length > 0 &&
    typeof buildDate === 'string' &&
    !Number.isNaN(Date.parse(buildDate)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(buildDate) &&
    typeof indexSha256 === 'string' &&
    SHA256_HEX_PATTERN.test(indexSha256) &&
    typeof indexByteSize === 'number' &&
    Number.isInteger(indexByteSize) &&
    indexByteSize >= 0 &&
    Array.isArray(files) &&
    files.length > 0 &&
    files.every(isValidReleaseFile) &&
    hasUniqueFilePaths(files)
  );
}

/**
 * Builds and validates a new `ReleaseDescriptor`.
 * @param params Descriptor fields.
 * @param params.releaseNumber Allocated release identity and ordering value, from {@link resolvePublicationPlan} in `retainedReleaseTree.mjs`.
 * @param params.appVersion `package.json` version this release was built from.
 * @param params.buildId CI build identity (e.g. commit SHA).
 * @param params.buildDate ISO 8601 UTC build timestamp.
 * @param params.indexSha256 Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection.
 * @param params.indexByteSize Exact byte size of the final archived `index.html`, computed after boot-watchdog injection.
 * @param params.files This release's file list, from `collectReleaseFiles` in `releaseArtifact.mjs`.
 * @returns The validated `ReleaseDescriptor`.
 */
export function buildReleaseDescriptor({
  releaseNumber,
  appVersion,
  buildId,
  buildDate,
  indexSha256,
  indexByteSize,
  files,
}) {
  const descriptor = {
    schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
    releaseNumber,
    appVersion,
    buildId,
    buildDate,
    indexSha256,
    indexByteSize,
    files,
  };
  if (!isValidReleaseDescriptor(descriptor)) {
    throw new Error(`Built an invalid release descriptor for release ${String(releaseNumber)}`);
  }
  return descriptor;
}
