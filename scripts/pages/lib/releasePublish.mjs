/**
 * Publish one immutable application release for a managed channel (stable
 * or develop) into a Pages staging work directory, then apply the channel's
 * ordinary deployment files on top.
 *
 * Publication order (see the managed pinned application updates feature):
 * inspect/validate the retained tree, allocate the sequence, inject the boot
 * watchdog into the archived index and hash its final bytes, build the
 * descriptor and archived index in memory, validate collisions and size,
 * copy immutable assets, write the archived index, write the descriptor,
 * update the channel's deployment files, and write `latest.json` last.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import {
  allocateReleaseSequence,
  assertReleaseIdNotRetained,
  buildReleaseDescriptor,
  collectReleaseFiles,
  computeContentSha256,
  readRetainedReleaseDescriptors,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
} from './releaseDescriptor.mjs';
import { applyManagedBranchPublish, applyManagedStablePublish } from './pagesFs.mjs';
import { injectWatchdogScript } from './watchdogInject.mjs';

const MANAGED_CHANNELS = new Set(['stable', 'develop']);

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
 * @param options.basePath Vite `base` this build was produced with, e.g. `/` or `/branch/develop/`.
 * @param options.appVersion `package.json` version this release was built from.
 * @param options.buildId CI build identity (e.g. commit SHA).
 * @param [options.buildDate] ISO 8601 UTC build timestamp; defaults to now.
 * @param [options.generateReleaseId] Generates the new release's immutable id; defaults to `crypto.randomUUID`. Overridable only so a test can deterministically inject an already-retained id.
 * @returns The published `ReleaseDescriptor`.
 */
export function publishManagedRelease({
  workDir,
  distDir,
  channel,
  basePath,
  appVersion,
  buildId,
  buildDate = new Date().toISOString(),
  generateReleaseId = randomUUID,
}) {
  if (!MANAGED_CHANNELS.has(channel)) {
    throw new Error(`Unsupported managed channel: ${String(channel)}`);
  }

  const channelBase = resolveChannelBase(workDir, channel);
  const updatesDir = join(channelBase, 'updates');
  const releasesDir = join(updatesDir, 'releases');

  // 1. inspect and validate the retained release tree
  const existingDescriptors = readRetainedReleaseDescriptors(releasesDir);

  // 2. allocate the release sequence
  const releaseSequence = allocateReleaseSequence(
    existingDescriptors.map((descriptor) => descriptor.releaseSequence),
  );

  // 3. generate the new release id and reject it outright if it collides
  // with an already-retained release, before any write for it begins
  const releaseId = generateReleaseId();
  assertReleaseIdNotRetained(existingDescriptors, releaseId);

  // 4. inject the boot watchdog into the archived index (before the main
  // module entry, so it can detect a fatal failure even in the main
  // application bundle itself) and hash its final bytes
  const indexUrl = `${basePath}updates/releases/${releaseId}/index.html`;
  const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
  const archivedIndexHtml = injectWatchdogScript(indexHtml, releaseId);
  const indexBytes = Buffer.from(archivedIndexHtml, 'utf8');
  const indexSha256 = computeContentSha256(indexBytes);
  const indexByteSize = indexBytes.byteLength;

  // 5. build the descriptor in memory
  const files = collectReleaseFiles(distDir);
  const descriptor = buildReleaseDescriptor({
    releaseId,
    releaseSequence,
    appVersion,
    buildId,
    buildDate,
    indexUrl,
    indexSha256,
    indexByteSize,
    files,
  });

  // 6. validate every immutable collision
  validateNoImmutableCollision(existingDescriptors, files);

  // 7. validate the projected artifact size
  validateProjectedArtifactSize(files);

  // 8. copy immutable assets
  const distAssetsDir = join(distDir, 'assets');
  if (existsSync(distAssetsDir)) {
    const assetsDir = join(channelBase, 'assets');
    mkdirSync(assetsDir, { recursive: true });
    cpSync(distAssetsDir, assetsDir, { recursive: true });
  }

  // 9. write the archived index
  const archivedReleaseDir = join(releasesDir, releaseId);
  mkdirSync(archivedReleaseDir, { recursive: true });
  writeFileSync(join(archivedReleaseDir, 'index.html'), archivedIndexHtml, 'utf8');

  // 10. write descriptor
  writeFileSync(
    join(releasesDir, `${releaseId}.json`),
    JSON.stringify(descriptor, null, 2) + '\n',
    'utf8',
  );

  // 11. update root/channel deployment files
  if (channel === 'stable') {
    applyManagedStablePublish(workDir, distDir);
  } else {
    applyManagedBranchPublish(workDir, distDir, 'develop');
  }

  // 12. write latest.json last
  const latest = { releaseId: descriptor.releaseId, releaseSequence: descriptor.releaseSequence };
  writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify(latest, null, 2) + '\n', 'utf8');

  return descriptor;
}
