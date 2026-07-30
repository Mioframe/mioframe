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
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const RELEASE_DESCRIPTOR_SCHEMA_VERSION = 1;

/** Sanity cap on the total byte size of one release's new (not-yet-retained) files. */
export const MAX_RELEASE_ARTIFACT_BYTES = 200_000_000;

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Matches the canonical lowercase-hyphenated UUID shape produced by
 * `crypto.randomUUID()`. Mirrors `contracts.ts`'s `CANONICAL_UUID_PATTERN`.
 */
const CANONICAL_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Channel-root-relative path prefix reserved for controller metadata — never a valid ordinary release file. */
const RESERVED_UPDATES_PREFIX = 'updates/';

/**
 * Returns `true` when `path` is a canonical channel-root-relative release
 * file path: no leading slash, no `..` traversal segment, no query/hash
 * suffix, no percent-encoded path separator, and not under the reserved
 * `updates/` metadata prefix (which also excludes a release's own archived
 * index from ever being listed as one of its own ordinary release files).
 * Mirrors `isCanonicalReleasePath` in
 * `src/shared/service/appUpdate/contracts.ts`.
 * @param path Candidate release file path.
 * @returns Whether `path` is canonical.
 */
export function isCanonicalReleasePath(path) {
  if (typeof path !== 'string' || path.length === 0 || path.startsWith('/')) return false;
  if (path.includes('?') || path.includes('#')) return false;
  if (/%2e|%2f/i.test(path)) return false;
  if (path === 'updates' || path.startsWith(RESERVED_UPDATES_PREFIX)) return false;
  return !path.split('/').includes('..');
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
    releaseId,
    releaseSequence,
    appVersion,
    buildId,
    buildDate,
    indexUrl,
    indexSha256,
    indexByteSize,
    files,
  } = candidate;
  return (
    schemaVersion === RELEASE_DESCRIPTOR_SCHEMA_VERSION &&
    typeof releaseId === 'string' &&
    CANONICAL_UUID_PATTERN.test(releaseId) &&
    typeof releaseSequence === 'number' &&
    Number.isInteger(releaseSequence) &&
    releaseSequence > 0 &&
    typeof appVersion === 'string' &&
    appVersion.length > 0 &&
    typeof buildId === 'string' &&
    buildId.length > 0 &&
    typeof buildDate === 'string' &&
    !Number.isNaN(Date.parse(buildDate)) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(buildDate) &&
    typeof indexUrl === 'string' &&
    indexUrl.length > 0 &&
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

/**
 * Allocates the next forward release sequence from every currently retained
 * sequence number.
 * @param existingSequences Every `releaseSequence` already retained for this channel.
 * @returns The next sequence, starting at `1` when none are retained yet.
 */
export function allocateReleaseSequence(existingSequences) {
  return existingSequences.reduce((max, sequence) => Math.max(max, sequence), 0) + 1;
}

/**
 * Builds and validates a new `ReleaseDescriptor`.
 * @param params Descriptor fields.
 * @param params.releaseId Immutable release identifier.
 * @param params.releaseSequence Forward-ordering sequence, from {@link allocateReleaseSequence}.
 * @param params.appVersion `package.json` version this release was built from.
 * @param params.buildId CI build identity (e.g. commit SHA).
 * @param params.buildDate ISO 8601 UTC build timestamp.
 * @param params.indexUrl Channel-root-relative URL of this release's archived index.
 * @param params.indexSha256 Lowercase hex SHA-256 digest of the final archived `index.html` bytes, computed after boot-watchdog injection.
 * @param params.indexByteSize Exact byte size of the final archived `index.html`, computed after boot-watchdog injection.
 * @param params.files This release's file list, from {@link collectReleaseFiles}.
 * @returns The validated `ReleaseDescriptor`.
 */
export function buildReleaseDescriptor({
  releaseId,
  releaseSequence,
  appVersion,
  buildId,
  buildDate,
  indexUrl,
  indexSha256,
  indexByteSize,
  files,
}) {
  const descriptor = {
    schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
    releaseId,
    releaseSequence,
    appVersion,
    buildId,
    buildDate,
    indexUrl,
    indexSha256,
    indexByteSize,
    files,
  };
  if (!isValidReleaseDescriptor(descriptor)) {
    throw new Error(`Built an invalid release descriptor for release ${String(releaseId)}`);
  }
  return descriptor;
}

/**
 * Reads and validates every retained release descriptor for a channel.
 * Fails closed: any unreadable, structurally invalid, misplaced, or
 * conflicting descriptor aborts the whole read rather than silently
 * skipping it, since publishing on top of a corrupt retained tree is
 * unsafe. Validates that:
 * - the descriptor filename (`<releaseId>.json`) matches its own `releaseId`
 *   (which also makes two retained descriptors sharing a `releaseId` with a
 *   different `releaseSequence` structurally impossible: two files cannot
 *   both be named after the same `releaseId`);
 * - the release's archived index directory (`<releaseId>/index.html`) exists;
 * - no two retained descriptors share a `releaseSequence` with a different `releaseId`.
 * @param releasesDir Channel's `updates/releases` directory.
 * @returns Every retained `ReleaseDescriptor`, or `[]` when the directory does not exist yet.
 */
export function readRetainedReleaseDescriptors(releasesDir) {
  if (!existsSync(releasesDir)) return [];

  const descriptors = readdirSync(releasesDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => {
      const filePath = join(releasesDir, entry.name);
      let parsed;
      try {
        parsed = JSON.parse(readFileSync(filePath, 'utf8'));
      } catch (error) {
        throw new Error(`Retained release descriptor is not valid JSON: ${entry.name}`, {
          cause: error,
        });
      }
      if (!isValidReleaseDescriptor(parsed)) {
        throw new Error(`Retained release descriptor is structurally invalid: ${entry.name}`);
      }
      const expectedFilename = `${parsed.releaseId}.json`;
      if (entry.name !== expectedFilename) {
        throw new Error(
          `Retained release descriptor filename "${entry.name}" does not match its releaseId (expected "${expectedFilename}")`,
        );
      }
      if (!existsSync(join(releasesDir, parsed.releaseId, 'index.html'))) {
        throw new Error(
          `Retained release "${parsed.releaseId}" is missing its archived index directory`,
        );
      }
      return parsed;
    });

  const releaseIdBySequence = new Map();
  for (const descriptor of descriptors) {
    const conflictingId = releaseIdBySequence.get(descriptor.releaseSequence);
    if (conflictingId !== undefined && conflictingId !== descriptor.releaseId) {
      throw new Error(
        `Retained releaseSequence ${descriptor.releaseSequence} is used by both "${conflictingId}" and "${descriptor.releaseId}"`,
      );
    }
    releaseIdBySequence.set(descriptor.releaseSequence, descriptor.releaseId);
  }

  return descriptors;
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
