/**
 * Own retained publication state for the managed pinned application updates
 * feature (stable and develop channels only): reading and structurally
 * validating retained release descriptors and the `updates/latest.json`
 * pointer, contiguous release-number and retained-`buildId` invariants,
 * retained archived-index/asset integrity, and resolving the channel-local
 * idempotent publication decision against an already-validated retained
 * tree.
 */

import { existsSync, lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { isPositiveSafeInteger, isValidReleaseDescriptor } from './releaseDescriptor.mjs';
import { computeFileSha256 } from './releaseArtifact.mjs';
import { zodLatestReleasePointer } from '../../../src/shared/service/appUpdate/releaseWireContract.ts';

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
  const result = zodLatestReleasePointer.safeParse(parsed);
  if (!result.success) {
    throw new Error('Retained updates/latest.json is structurally invalid');
  }
  return result.data;
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
