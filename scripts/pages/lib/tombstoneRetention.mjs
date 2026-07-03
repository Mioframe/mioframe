import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Decide whether a branch's `deployment.json` record is an expired
 * tombstone that the scheduled cleanup should remove.
 *
 * For tombstone records, `buildDate` is the moment the tombstone was
 * published (see `deploymentMetadata.mjs`), so it doubles as the retention
 * clock start.
 * @param deploymentMetadata Parsed `deployment.json` contents, or `undefined`.
 * @param now Current time in epoch milliseconds.
 * @param retentionDays Retention period in days (see `config/tooling.json` `pages.tombstoneRetentionDays`).
 * @returns `true` when this is a tombstone whose retention period has elapsed.
 */
export function isTombstoneExpired(deploymentMetadata, now, retentionDays) {
  if (!deploymentMetadata || deploymentMetadata.tombstone !== true) {
    return false;
  }

  const tombstonedAt = Date.parse(deploymentMetadata.buildDate ?? '');
  if (Number.isNaN(tombstonedAt)) {
    return false;
  }

  return now - tombstonedAt >= retentionDays * DAY_MS;
}

/**
 * Scan a Pages work directory's `branch/*` slots for expired tombstones.
 *
 * Slots with no `deployment.json`, an unparseable one, or a non-tombstone
 * (live) deployment are left untouched — this never removes a live branch
 * deployment, only tombstones past their retention period.
 * @param options Scan options.
 * @param options.workDir Path to the Pages staging working directory.
 * @param [options.now] Current time in epoch milliseconds; defaults to `Date.now()`.
 * @param options.retentionDays Retention period in days.
 * @param [options.deps] Test seams for filesystem access.
 * @returns Branch slugs whose tombstone has expired and should be removed.
 */
export function findExpiredTombstoneSlugs({ workDir, now = Date.now(), retentionDays, deps = {} }) {
  const {
    readdirSync: listDir = readdirSync,
    readFileSync: readFile = readFileSync,
    existsSync: exists = existsSync,
  } = deps;

  const branchDir = join(workDir, 'branch');
  if (!exists(branchDir)) {
    return [];
  }

  const expired = [];

  for (const entry of listDir(branchDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const metadataPath = join(branchDir, entry.name, 'deployment.json');
    if (!exists(metadataPath)) continue;

    let metadata;
    try {
      metadata = JSON.parse(readFile(metadataPath, 'utf8'));
    } catch {
      continue;
    }

    if (isTombstoneExpired(metadata, now, retentionDays)) {
      expired.push(entry.name);
    }
  }

  return expired;
}
