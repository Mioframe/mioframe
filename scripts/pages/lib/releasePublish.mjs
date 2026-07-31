/**
 * Publish one immutable application release for a managed channel (stable
 * or develop) into a Pages staging work directory, then apply the channel's
 * ordinary deployment files on top.
 *
 * Publication order (see the managed pinned application updates feature):
 * reject a build whose `dist/updates` exists (a reserved managed-publication
 * namespace), validate the retained tree and allocate the next release
 * number, inject the boot watchdog into the archived index and hash its
 * final bytes, build the descriptor and archived index in memory, validate
 * collisions and size, copy immutable assets, write the archived index,
 * write the descriptor, update the channel's deployment files, and write
 * `latest.json` last.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  allocateNextReleaseNumber,
  assertReleaseNumberNotRetained,
  buildReleaseDescriptor,
  collectReleaseFiles,
  computeContentSha256,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
} from './releaseDescriptor.mjs';
import { applyManagedBranchPublish, applyManagedStablePublish } from './pagesFs.mjs';
import { injectWatchdogScript } from './watchdogInject.mjs';

const MANAGED_CHANNELS = new Set(['stable', 'develop']);

/**
 * Rejects a build whose `dist/updates` exists, before any publication write
 * begins. `updates/**` (the `latest.json` pointer, retained release
 * descriptors, and archived indexes) is a namespace reserved exclusively for
 * managed release publication itself; a build artifact that already
 * contains one is invalid and must never be merged into, or silently
 * excluded from, the retained tree — that could otherwise overwrite
 * retained immutable release data with build output.
 * @param distDir Built `dist` directory for this build.
 * @throws {Error} When `<distDir>/updates` exists.
 */
function assertDistHasNoReservedUpdatesDir(distDir) {
  if (existsSync(join(distDir, 'updates'))) {
    throw new Error(
      'dist/updates is a reserved managed-publication namespace and must not be present in a build artifact',
    );
  }
}

/**
 * @param workDir Pages staging working directory root.
 * @param channel Managed channel: `'stable'` or `'develop'`.
 * @returns The channel's base directory, containing its `assets/` and `updates/`.
 */
function resolveChannelBase(workDir, channel) {
  return channel === 'stable' ? workDir : join(workDir, 'branch', 'develop');
}

/**
 * Publishes one new immutable release for a managed channel and applies the
 * channel's ordinary deployment files, in the order required for safe
 * `latest.json`-last publication.
 * @param options Publish inputs.
 * @param options.workDir Pages staging working directory root.
 * @param options.distDir Built `dist` directory for this build.
 * @param options.channel Managed channel: `'stable'` or `'develop'`.
 * @param options.appVersion `package.json` version this release was built from.
 * @param options.buildId CI build identity (e.g. commit SHA).
 * @param [options.buildDate] ISO 8601 UTC build timestamp; defaults to now.
 * @returns The published `ReleaseDescriptor`.
 */
export function publishManagedRelease({
  workDir,
  distDir,
  channel,
  appVersion,
  buildId,
  buildDate = new Date().toISOString(),
}) {
  if (!MANAGED_CHANNELS.has(channel)) {
    throw new Error(`Unsupported managed channel: ${String(channel)}`);
  }
  assertDistHasNoReservedUpdatesDir(distDir);

  const channelBase = resolveChannelBase(workDir, channel);
  const updatesDir = join(channelBase, 'updates');
  const releasesDir = join(updatesDir, 'releases');

  // 1. validate the retained release tree and allocate the next release number
  const { nextReleaseNumber: releaseNumber, descriptors: existingDescriptors } =
    allocateNextReleaseNumber(releasesDir, updatesDir);

  // 2. defensive invariant: the allocated number must not already be retained
  assertReleaseNumberNotRetained(releasesDir, releaseNumber);

  // 3. inject the boot watchdog into the archived index (before the main
  // module entry, so it can detect a fatal failure even in the main
  // application bundle itself) and hash its final bytes
  const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  const archivedIndexHtml = injectWatchdogScript(indexHtml, releaseNumber);
  const indexBytes = Buffer.from(archivedIndexHtml, 'utf8');
  const indexSha256 = computeContentSha256(indexBytes);
  const indexByteSize = indexBytes.byteLength;

  // 4. build the descriptor in memory
  const files = collectReleaseFiles(distDir);
  const descriptor = buildReleaseDescriptor({
    releaseNumber,
    appVersion,
    buildId,
    buildDate,
    indexSha256,
    indexByteSize,
    files,
  });

  // 5. validate every immutable collision
  validateNoImmutableCollision(existingDescriptors, files);

  // 6. validate the projected artifact size
  validateProjectedArtifactSize(files);

  // 7. copy immutable assets
  const distAssetsDir = join(distDir, 'assets');
  if (existsSync(distAssetsDir)) {
    const assetsDir = join(channelBase, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    cpSync(distAssetsDir, assetsDir, { recursive: true });
  }

  // 8. write the archived index
  const archivedReleaseDir = join(releasesDir, String(releaseNumber));
  mkdirSync(archivedReleaseDir, { recursive: true });
  writeFileSync(join(archivedReleaseDir, 'index.html'), archivedIndexHtml, 'utf8');

  // 9. write descriptor
  writeFileSync(
    join(releasesDir, `${releaseNumber}.json`),
    JSON.stringify(descriptor, null, 2) + '\n',
    'utf8',
  );

  // 10. update root/channel deployment files
  if (channel === 'stable') {
    applyManagedStablePublish(workDir, distDir);
  } else {
    applyManagedBranchPublish(workDir, distDir, 'develop');
  }

  // 11. write latest.json last
  const latest = { releaseNumber: descriptor.releaseNumber };
  writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify(latest, null, 2) + '\n', 'utf8');

  return descriptor;
}
