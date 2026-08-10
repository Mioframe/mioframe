/**
 * Inspect and validate build/release artifact bytes for the managed pinned
 * application updates feature (stable and develop channels only): filesystem
 * release-file collection, SHA-256 hashing, immutable asset collision
 * validation, and projected artifact-size validation.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Sanity cap on the total byte size of one release's new (not-yet-retained) files. */
export const MAX_RELEASE_ARTIFACT_BYTES = 200_000_000;

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
