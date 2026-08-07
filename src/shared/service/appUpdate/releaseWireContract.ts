import * as z from 'zod/v4-mini';

/**
 * Single canonical implementation of the published release-descriptor wire
 * format: schema version, identity/path/hash validation, and the
 * release-file/release-descriptor/latest-release-pointer schemas.
 *
 * This module must stay importable directly by plain Node (no TypeScript
 * loader): it uses only erasable TypeScript syntax (no `enum`, decorators,
 * parameter properties, or namespaces) and ordinary relative/package
 * imports, so the publisher's `.mjs` scripts
 * (`scripts/pages/lib/releaseDescriptor.mjs`) can import it directly instead
 * of duplicating its validation. `src/shared/service/appUpdate/contracts.ts`
 * re-exports these names unchanged for every existing runtime consumer.
 */

/**
 * Wire-format version for published release descriptors and the `latest.json`
 * pointer. Bump when the on-disk shape of either changes incompatibly.
 */
export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/**
 * Returns `true` when `value` is a positive safe integer — the sole identity
 * and ordering value for a release.
 * @param value - Candidate value.
 * @returns Whether `value` is a positive safe integer.
 */
export const isPositiveSafeInteger = (value: number): boolean =>
  Number.isSafeInteger(value) && value > 0;

/** A release identifier: one positive safe-integer, both identity and ordering value. */
export const zodReleaseNumber = z.number().check(z.refine(isPositiveSafeInteger));

/** Channel-root-relative path prefix reserved for controller metadata (`latest.json`, descriptors, archived indexes) — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * A fixed, arbitrary base URL used only to resolve a candidate path through
 * the platform `URL` parser for the canonicalization round-trip check in
 * {@link isCanonicalReleasePath}. Never a real network origin.
 */
const CANONICAL_PATH_BASE = 'https://mioframe.internal/';

/**
 * Returns `true` when `path` is the single canonical channel-root-relative
 * representation of a release file — never merely a path that *resolves* to
 * one. Rejects: an empty path; a leading or trailing `/`; any `\`; any `%`
 * (no percent-encoding at all, valid or not); a query (`?`) or fragment
 * (`#`); an empty, `.`, or `..` path segment (which also rejects a doubled
 * `//` separator); and the reserved `updates/` metadata prefix (which also
 * excludes every release's own archived index, always published under
 * `updates/releases/<releaseNumber>/`, from ever being listed as one of its
 * own ordinary release files). As a final catch-all, resolves `path` against
 * a fixed base through the platform `URL` parser and requires its resulting
 * pathname (with the leading `/` stripped) to equal `path` exactly — this is
 * what additionally rejects a URL-normalizable alias such as a raw space,
 * which would otherwise pass every explicit character check above.
 * @param path - Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export const isCanonicalReleasePath = (path: string): boolean => {
  if (path.length === 0) return false;
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
  let normalizedPathname: string;
  try {
    normalizedPathname = new URL(path, CANONICAL_PATH_BASE).pathname;
  } catch {
    return false;
  }
  return normalizedPathname.slice(1) === path;
};

/** Matches a lowercase hex SHA-256 digest exactly. */
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/** Returns `true` when `value` is a lowercase hex SHA-256 digest. */
export const isSha256Hex = (value: string): boolean => SHA256_HEX_PATTERN.test(value);

/**
 * One immutable, content-addressed file belonging to a release, as recorded
 * in its {@link ReleaseDescriptor}.
 */
export const zodReleaseFile = z.object({
  /** Canonical channel-root-relative path, e.g. `assets/app-3f2a1c.js`. */
  path: z.string().check(z.minLength(1), z.refine(isCanonicalReleasePath)),
  /** Lowercase hex SHA-256 digest only — an uppercase or mixed-case digest is rejected, not normalized. */
  sha256: z.string().check(z.refine(isSha256Hex)),
  byteSize: z.number().check(z.int(), z.nonnegative()),
});
/** A {@link zodReleaseFile}-validated release file record. */
export type ReleaseFile = z.infer<typeof zodReleaseFile>;

/**
 * Returns `true` when no two files in `files` share the same `path`.
 * @param files
 */
const hasUniqueFilePaths = (files: readonly ReleaseFile[]): boolean =>
  new Set(files.map((file) => file.path)).size === files.length;

/**
 * Published descriptor for one immutable application release: identity,
 * display/diagnostics metadata, and the exact file set required to serve it
 * offline. Validated at both publication and runtime boundaries.
 */
export const zodReleaseDescriptor = z.object({
  schemaVersion: z.literal(RELEASE_DESCRIPTOR_SCHEMA_VERSION),
  releaseNumber: zodReleaseNumber,
  appVersion: z.string().check(z.minLength(1)),
  buildId: z.string().check(z.minLength(1)),
  buildDate: z.iso.datetime(),
  /** Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection. */
  indexSha256: z.string().check(z.refine(isSha256Hex)),
  /** Exact byte size of the final archived `index.html`, computed after boot-watchdog injection. */
  indexByteSize: z.number().check(z.int(), z.nonnegative()),
  files: z.array(zodReleaseFile).check(z.minLength(1), z.refine(hasUniqueFilePaths)),
});
/** A {@link zodReleaseDescriptor}-validated release descriptor. */
export type ReleaseDescriptor = z.infer<typeof zodReleaseDescriptor>;

/**
 * The `latest.json` pointer published last during release publication.
 * Deliberately just the release number: a worker must fetch and validate the
 * exact descriptor separately before trusting this pointer.
 */
export const zodLatestReleasePointer = z.object({ releaseNumber: zodReleaseNumber });
/** A {@link zodLatestReleasePointer}-validated `latest.json` pointer. */
export type LatestReleasePointer = z.infer<typeof zodLatestReleasePointer>;
