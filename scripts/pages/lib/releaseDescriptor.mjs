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

import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/** Sanity cap on the total byte size of one release's new (not-yet-retained) files. */
export const MAX_RELEASE_ARTIFACT_BYTES = 200_000_000;

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/** Channel-root-relative path prefix reserved for controller metadata — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * A fixed, arbitrary base URL used only to resolve a candidate path through
 * the platform `URL` parser for the canonicalization round-trip check in
 * {@link isCanonicalReleasePath}. Never a real network origin.
 */
const CANONICAL_PATH_BASE = 'https://mioframe.internal/';

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
 * Structurally validates the published `updates/latest.json` pointer.
 * @param candidate Value to validate.
 * @returns Whether `candidate` is a valid latest-release pointer.
 */
export function isValidLatestPointer(candidate) {
  return (
    typeof candidate === 'object' &&
    candidate !== null &&
    isPositiveSafeInteger(candidate.releaseNumber)
  );
}

/**
 * Computes the lowercase hex SHA-256 digest of a file's contents.
 * @param filePath Absolute path to the file.
 * @returns Lowercase hex SHA-256 digest.
 */
export function computeFileSha256(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

/**
 * Computes the lowercase hex SHA-256 digest of in-memory content, e.g. the
 * final archived `index.html` bytes after boot-watchdog injection.
 * @param content Content to hash (a UTF-8 string or a `Buffer`).
 * @returns Lowercase hex SHA-256 digest.
 */
export function computeContentSha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

function walkFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Collects every content-hashed asset under `<distDir>/assets` as
 * `ReleaseFile` records with a canonical `assets/<relPath>` path.
 * @param distDir Built `dist` directory for this build.
 * @returns The release's file list, sorted by path for deterministic output.
 */
export function collectReleaseFiles(distDir) {
  const assetsDir = join(distDir, 'assets');
  if (!existsSync(assetsDir)) return [];

  return walkFiles(assetsDir)
    .map((absolutePath) => {
      const relPath = relative(assetsDir, absolutePath).split(sep).join('/');
      return {
        path: `assets/${relPath}`,
        sha256: computeFileSha256(absolutePath),
        byteSize: statSync(absolutePath).size,
      };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

/** Canonical retained descriptor filename: `<releaseNumber>.json`, no leading zeros. */
const RELEASE_DESCRIPTOR_FILENAME_PATTERN = /^([1-9]\d*)\.json$/;
/** Canonical retained archive directory name: `<releaseNumber>`, no leading zeros. */
const RELEASE_ARCHIVE_DIRECTORY_NAME_PATTERN = /^[1-9]\d*$/;

/**
 * Reads and validates every retained release descriptor for a channel, and
 * that `releasesDir` forms an exact retained tree: only canonical
 * `<releaseNumber>.json` / `<releaseNumber>/index.html` pairs, nothing else.
 * Fails closed: any unreadable, structurally invalid, misplaced, orphaned,
 * unexpected, or symlink/special entry aborts the whole read rather than
 * silently skipping it, since publishing on top of a corrupt retained tree
 * is unsafe.
 *
 * Structural gate, before any content is read: every top-level entry must be
 * either a canonical `<releaseNumber>.json` file or a canonical
 * `<releaseNumber>` directory (no leading zeros) — a symlink, another
 * special entry, or any other file or directory name fails closed here.
 * Every retained directory must have a matching `.json` file present (an
 * orphan directory fails); every retained archive directory's own contents
 * must be exactly one `index.html` file (an unexpected entry inside it
 * fails).
 *
 * Per-descriptor validation then parses and validates each `.json` file,
 * confirms its filename matches its own `releaseNumber` (which also makes
 * two retained descriptors sharing a `releaseNumber` structurally
 * impossible: two files cannot both be named after the same number), and
 * confirms its release's archived index directory exists.
 * @param releasesDir Channel's `updates/releases` directory.
 * @returns Every retained `ReleaseDescriptor`, or `[]` when the directory does not exist yet.
 */
export function readRetainedReleaseDescriptors(releasesDir) {
  if (!existsSync(releasesDir)) return [];

  const entries = readdirSync(releasesDir, { withFileTypes: true });
  const descriptorFilenames = new Set();
  const archiveDirectoryNames = new Set();

  for (const entry of entries) {
    if (entry.isSymbolicLink()) {
      throw new Error(
        `Retained updates/releases contains a symlink entry, which is not allowed: ${entry.name}`,
      );
    }
    if (entry.isFile()) {
      if (!RELEASE_DESCRIPTOR_FILENAME_PATTERN.test(entry.name)) {
        throw new Error(`Retained updates/releases contains an unexpected file: ${entry.name}`);
      }
      descriptorFilenames.add(entry.name);
      continue;
    }
    if (entry.isDirectory()) {
      if (!RELEASE_ARCHIVE_DIRECTORY_NAME_PATTERN.test(entry.name)) {
        throw new Error(
          `Retained updates/releases contains an unexpected directory: ${entry.name}`,
        );
      }
      archiveDirectoryNames.add(entry.name);
      continue;
    }
    throw new Error(
      `Retained updates/releases contains an unexpected entry, neither a regular file nor a directory: ${entry.name}`,
    );
  }

  // Per-descriptor content validation runs before the orphan-directory and
  // archive-content checks below, so a content/filename identity mismatch on
  // an otherwise-canonically-named descriptor is reported as exactly that,
  // rather than as an unrelated directory-pairing failure.
  const descriptors = [...descriptorFilenames].map((filename) => {
    const filePath = join(releasesDir, filename);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    } catch (error) {
      throw new Error(`Retained release descriptor is not valid JSON: ${filename}`, {
        cause: error,
      });
    }
    if (!isValidReleaseDescriptor(parsed)) {
      throw new Error(`Retained release descriptor is structurally invalid: ${filename}`);
    }
    const expectedFilename = `${parsed.releaseNumber}.json`;
    if (filename !== expectedFilename) {
      throw new Error(
        `Retained release descriptor filename "${filename}" does not match its releaseNumber (expected "${expectedFilename}")`,
      );
    }
    if (!existsSync(join(releasesDir, String(parsed.releaseNumber), 'index.html'))) {
      throw new Error(
        `Retained release "${parsed.releaseNumber}" is missing its archived index directory`,
      );
    }
    return parsed;
  });

  for (const directoryName of archiveDirectoryNames) {
    if (!descriptorFilenames.has(`${directoryName}.json`)) {
      throw new Error(
        `Retained release archive directory "${directoryName}" has no matching descriptor`,
      );
    }
    const archiveEntries = readdirSync(join(releasesDir, directoryName), { withFileTypes: true });
    if (
      archiveEntries.length !== 1 ||
      !archiveEntries[0].isFile() ||
      archiveEntries[0].isSymbolicLink() ||
      archiveEntries[0].name !== 'index.html'
    ) {
      throw new Error(
        `Retained release archive directory "${directoryName}" must contain exactly one file, index.html`,
      );
    }
  }

  return descriptors;
}

/**
 * Reads and validates the published `updates/latest.json` pointer.
 * Fails closed on unreadable, unparseable, or structurally invalid content.
 * @param updatesDir Channel's `updates` directory.
 * @returns The parsed latest pointer, or `undefined` when it does not exist yet.
 */
export function readLatestPointer(updatesDir) {
  const path = join(updatesDir, 'latest.json');
  if (!existsSync(path)) return undefined;

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    throw new Error('Retained updates/latest.json is not valid JSON', { cause: error });
  }
  if (!isValidLatestPointer(parsed)) {
    throw new Error('Retained updates/latest.json is structurally invalid');
  }
  return parsed;
}

/**
 * Reads and validates the complete retained managed tree for one channel,
 * without allocating a next release number. Must be called, and must
 * succeed, before resolving a publication decision.
 *
 * - no retained tree (no descriptors and no `latest.json`) is valid and empty;
 * - retained descriptors without a valid `latest.json`, or a `latest.json`
 *   without any retained descriptor, is rejected;
 * - retained release numbers must form the exact contiguous sequence
 *   `1, 2, ..., N`: a sequence starting above `1`, or containing a gap, is
 *   rejected;
 * - `latest.json` must point at the final contiguous descriptor (`N`).
 * @param releasesDir Channel's `updates/releases` directory.
 * @param updatesDir Channel's `updates` directory.
 * @returns Every retained descriptor (sorted by `releaseNumber`) and the
 * highest retained release number (`undefined` for an empty tree).
 * @throws {Error} When the retained tree is malformed, missing, conflicting, or non-contiguous.
 */
export function readRetainedTree(releasesDir, updatesDir) {
  const descriptors = readRetainedReleaseDescriptors(releasesDir);
  const latest = readLatestPointer(updatesDir);

  if (descriptors.length === 0 && latest === undefined) {
    return { descriptors: [], latestReleaseNumber: undefined };
  }
  if (latest === undefined) {
    throw new Error('Retained releases exist but updates/latest.json is missing');
  }
  if (descriptors.length === 0) {
    throw new Error('updates/latest.json exists but no release is retained');
  }

  const sorted = [...descriptors].sort((a, b) => a.releaseNumber - b.releaseNumber);
  if (sorted[0].releaseNumber !== 1) {
    throw new Error(
      `Retained release sequence must start at release 1, but starts at release ${sorted[0].releaseNumber}`,
    );
  }
  for (let index = 1; index < sorted.length; index += 1) {
    const expected = sorted[index - 1].releaseNumber + 1;
    if (sorted[index].releaseNumber !== expected) {
      throw new Error(
        `Retained release sequence has a gap: release ${sorted[index - 1].releaseNumber} is followed by release ${sorted[index].releaseNumber}, expected release ${expected}`,
      );
    }
  }

  const highest = sorted[sorted.length - 1].releaseNumber;
  if (latest.releaseNumber !== highest) {
    throw new Error(
      `updates/latest.json (${latest.releaseNumber}) does not point to the highest retained release (${highest})`,
    );
  }

  return { descriptors: sorted, latestReleaseNumber: highest };
}

/**
 * Validates that the allocated `releaseNumber` is not already retained for
 * this channel — a defensive invariant check, since {@link resolvePublicationPlan}
 * already computes a number one past every retained descriptor. Must be
 * checked before any retained-tree write for the new release begins.
 * @param releasesDir Channel's `updates/releases` directory.
 * @param releaseNumber The allocated candidate release number.
 * @throws {Error} When a descriptor or archive path for `releaseNumber` already exists.
 */
export function assertReleaseNumberNotRetained(releasesDir, releaseNumber) {
  if (
    existsSync(join(releasesDir, `${releaseNumber}.json`)) ||
    existsSync(join(releasesDir, String(releaseNumber)))
  ) {
    throw new Error(`Release number ${releaseNumber} is already retained for this channel`);
  }
}

/**
 * Validates that no two retained descriptors share the same `buildId`. Part
 * of the complete retained-tree validation required before allocation or
 * writes.
 * @param descriptors Every retained `ReleaseDescriptor` for this channel.
 * @throws {Error} When two retained descriptors share the same `buildId`.
 */
export function assertUniqueRetainedBuildIds(descriptors) {
  const releaseNumberByBuildId = new Map();
  for (const descriptor of descriptors) {
    const owner = releaseNumberByBuildId.get(descriptor.buildId);
    if (owner !== undefined) {
      throw new Error(
        `Retained releases ${owner} and ${descriptor.releaseNumber} share the same buildId "${descriptor.buildId}"`,
      );
    }
    releaseNumberByBuildId.set(descriptor.buildId, descriptor.releaseNumber);
  }
}

/**
 * Validates that `filePath` physically exists, is a regular file (not a
 * directory or symlink), and has exactly `expectedByteSize` bytes and
 * `expectedSha256` content. Part of {@link validateRetainedContent}.
 * @param filePath Absolute path to the retained file to validate.
 * @param expectedSha256 The descriptor's recorded lowercase hex SHA-256 digest.
 * @param expectedByteSize The descriptor's recorded exact byte size.
 * @param label Human-readable label for this file, used in thrown error messages.
 * @throws {Error} When `filePath` is missing, not a regular file, or its size or content does not match.
 */
function validateRetainedFile(filePath, expectedSha256, expectedByteSize, label) {
  if (!existsSync(filePath)) {
    throw new Error(`Retained ${label} is missing: ${filePath}`);
  }
  const stats = lstatSync(filePath);
  if (stats.isSymbolicLink() || !stats.isFile()) {
    throw new Error(
      `Retained ${label} must be a regular file, not a directory or symlink: ${filePath}`,
    );
  }
  if (stats.size !== expectedByteSize) {
    throw new Error(
      `Retained ${label} byte size mismatch: ${filePath} (expected ${expectedByteSize}, found ${stats.size})`,
    );
  }
  const actualSha256 = computeFileSha256(filePath);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Retained ${label} SHA-256 mismatch: ${filePath}`);
  }
}

/**
 * Validates that every retained release's archived index and immutable
 * asset files are physically present and byte-for-byte correct against
 * `channelBaseDir` and `releasesDir`, before allocation, dist inspection, any
 * write, or an idempotent latest-build no-op resolves (see
 * {@link resolvePublicationPlan}). A retained descriptor merely being
 * structurally valid (see {@link readRetainedTree}) never proves its
 * referenced bytes are still physically restorable — this proves that.
 *
 * A physical path referenced by multiple retained descriptors must satisfy
 * every descriptor reference: since a real file has exactly one actual
 * content, two descriptors recording conflicting metadata for the same path
 * can never both validate, so a conflict fails closed here without a
 * separate cross-descriptor check.
 * @param descriptors Every retained `ReleaseDescriptor` for this channel, from {@link readRetainedTree}.
 * @param channelBaseDir Channel's base directory, containing its published `assets/` files.
 * @param releasesDir Channel's `updates/releases` directory.
 * @throws {Error} When any retained archived index or asset is missing, is not a regular file, or has a byte size or SHA-256 mismatch.
 */
export function validateRetainedContent(descriptors, channelBaseDir, releasesDir) {
  for (const descriptor of descriptors) {
    validateRetainedFile(
      join(releasesDir, String(descriptor.releaseNumber), 'index.html'),
      descriptor.indexSha256,
      descriptor.indexByteSize,
      `archived index for release ${descriptor.releaseNumber}`,
    );
    for (const file of descriptor.files) {
      validateRetainedFile(
        join(channelBaseDir, file.path),
        file.sha256,
        file.byteSize,
        `file "${file.path}" for release ${descriptor.releaseNumber}`,
      );
    }
  }
}

/**
 * Resolves the channel-local idempotent publication decision for `buildId`
 * against an already-validated retained tree (see {@link readRetainedTree}
 * and the managed pinned application updates architecture, "Release
 * identity and publication"). Pure: performs no I/O, so a next-release-number
 * overflow at `Number.MAX_SAFE_INTEGER` can be exercised directly without
 * constructing an infeasible retained tree.
 *
 * - `descriptors` is empty -> `{ kind: 'publish', nextReleaseNumber: 1, descriptors: [] }`;
 * - no retained descriptor has this `buildId` -> `{ kind: 'publish', nextReleaseNumber, descriptors }`, where `nextReleaseNumber` is `latestReleaseNumber + 1`;
 * - this `buildId` equals the unique latest descriptor's `buildId` -> `{ kind: 'no-op', descriptor }`; the caller must perform zero writes;
 * - this `buildId` exists on a non-latest retained descriptor -> throws before any write;
 * - `latestReleaseNumber + 1` would exceed `Number.MAX_SAFE_INTEGER` for a genuinely new `buildId` -> throws before any write.
 * @param descriptors Every retained `ReleaseDescriptor` for this channel, from {@link readRetainedTree}.
 * @param latestReleaseNumber The highest retained release number, from {@link readRetainedTree} (`undefined` for an empty tree).
 * @param buildId The exact source commit SHA for the build being published.
 * @returns The resolved publication decision.
 * @throws {Error} When `buildId` is retained on a non-latest release, or a new release's number would overflow.
 */
export function resolvePublicationDecision(descriptors, latestReleaseNumber, buildId) {
  if (descriptors.length === 0) {
    return { kind: 'publish', nextReleaseNumber: 1, descriptors };
  }

  const latestDescriptor = descriptors.find((d) => d.releaseNumber === latestReleaseNumber);
  const matching = descriptors.find((d) => d.buildId === buildId);

  if (matching !== undefined) {
    if (matching.releaseNumber === latestReleaseNumber) {
      return { kind: 'no-op', descriptor: latestDescriptor };
    }
    throw new Error(
      `buildId "${buildId}" is already retained on release ${matching.releaseNumber}, which is not the latest release (${latestReleaseNumber})`,
    );
  }

  const nextReleaseNumber = latestReleaseNumber + 1;
  if (!isPositiveSafeInteger(nextReleaseNumber)) {
    throw new Error('Next release number would exceed Number.MAX_SAFE_INTEGER');
  }
  return { kind: 'publish', nextReleaseNumber, descriptors };
}

/**
 * Reads, validates, and resolves the channel-local idempotent publication
 * decision for `buildId` against the complete retained release tree (see
 * the managed pinned application updates architecture, "Release identity
 * and publication"). Validates the complete retained tree — via
 * {@link readRetainedTree}, unique retained `buildId` values via
 * {@link assertUniqueRetainedBuildIds}, and every retained release's
 * physical archived index and asset bytes via
 * {@link validateRetainedContent} — and resolves whether `buildId` is
 * absent, latest, or non-latest before ever allocating a next release
 * number or requiring any write. A corrupt retained tree is rejected here
 * even when `buildId` would otherwise resolve to a zero-write no-op.
 * Callers must not inspect `dist`, or perform any publication write, before
 * this resolves.
 * @param releasesDir Channel's `updates/releases` directory.
 * @param updatesDir Channel's `updates` directory.
 * @param buildId The exact source commit SHA for the build being published.
 * @param channelBaseDir Channel's base directory, containing its published `assets/` files.
 * @returns The resolved publication decision. See {@link resolvePublicationDecision}.
 * @throws {Error} When the retained tree is malformed, its content is not physically restorable, or `buildId` is retained on a non-latest release or duplicated.
 */
export function resolvePublicationPlan(releasesDir, updatesDir, buildId, channelBaseDir) {
  const { descriptors, latestReleaseNumber } = readRetainedTree(releasesDir, updatesDir);
  assertUniqueRetainedBuildIds(descriptors);
  validateRetainedContent(descriptors, channelBaseDir, releasesDir);
  return resolvePublicationDecision(descriptors, latestReleaseNumber, buildId);
}

/**
 * Builds and validates a new `ReleaseDescriptor`.
 * @param params Descriptor fields.
 * @param params.releaseNumber Allocated release identity and ordering value, from {@link resolvePublicationPlan}.
 * @param params.appVersion `package.json` version this release was built from.
 * @param params.buildId CI build identity (e.g. commit SHA).
 * @param params.buildDate ISO 8601 UTC build timestamp.
 * @param params.indexSha256 Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection.
 * @param params.indexByteSize Exact byte size of the final archived `index.html`, computed after boot-watchdog injection.
 * @param params.files This release's file list, from {@link collectReleaseFiles}.
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

/**
 * Validates that none of `newFiles` collides with an already-retained file
 * at the same path but with different content.
 * @param existingDescriptors Every retained `ReleaseDescriptor` for this channel.
 * @param newFiles The new release's file list.
 * @throws {Error} When a path collision with different content is found.
 */
export function validateNoImmutableCollision(existingDescriptors, newFiles) {
  const retainedShaByPath = new Map();
  for (const descriptor of existingDescriptors) {
    for (const file of descriptor.files) {
      retainedShaByPath.set(file.path, file.sha256);
    }
  }
  for (const file of newFiles) {
    const retainedSha = retainedShaByPath.get(file.path);
    if (retainedSha !== undefined && retainedSha !== file.sha256) {
      throw new Error(
        `Immutable file collision at "${file.path}": content differs from a retained release`,
      );
    }
  }
}

/**
 * Validates that the new release's total file size does not exceed
 * {@link MAX_RELEASE_ARTIFACT_BYTES}, guarding against a broken build
 * publishing an unexpectedly large artifact.
 * @param files The new release's file list.
 * @param maxBytes Byte size cap; defaults to {@link MAX_RELEASE_ARTIFACT_BYTES}.
 * @throws {Error} When the projected size exceeds `maxBytes`.
 */
export function validateProjectedArtifactSize(files, maxBytes = MAX_RELEASE_ARTIFACT_BYTES) {
  const totalBytes = files.reduce((sum, file) => sum + file.byteSize, 0);
  if (totalBytes > maxBytes) {
    throw new Error(
      `Projected release artifact size ${totalBytes} bytes exceeds the ${maxBytes} byte cap`,
    );
  }
}
