import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Build the `deployment.json` metadata record written alongside every
 * published channel (stable, develop, manual branch, PR preview, and branch
 * tombstones). See `docs/release.md#organization-pages-deployment-model`.
 * @param options Deployment facts.
 * @param options.channel Release channel, e.g. `stable` or `branch`.
 * @param options.channelId Channel identifier, e.g. `main`, `develop`, a branch slug, or a PR number.
 * @param options.baseUrl Vite `BASE_URL` this deployment was built with.
 * @param [options.ref] Source ref the build was triggered from.
 * @param [options.branch] Source branch name, when available.
 * @param [options.slug] Branch slug, for branch channel deployments.
 * @param [options.sha] Commit SHA the build was produced from.
 * @param [options.buildDate] ISO build date; defaults to now.
 * @param [options.appVersion] `package.json` version.
 * @param [options.tombstone] `true` when this is a tombstone record for a deleted branch.
 * @returns The deployment metadata record.
 */
export function buildDeploymentMetadata({
  channel,
  channelId,
  baseUrl,
  ref,
  branch,
  slug,
  sha,
  buildDate,
  appVersion,
  tombstone,
} = {}) {
  if (typeof channel !== 'string' || channel.trim() === '') {
    throw new Error('channel is required');
  }
  if (typeof channelId !== 'string' || channelId.trim() === '') {
    throw new Error('channelId is required');
  }
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new Error('baseUrl is required');
  }

  const metadata = {
    channel,
    channelId,
    baseUrl,
    buildDate: buildDate ?? new Date().toISOString(),
  };

  if (ref) metadata.ref = ref;
  if (branch) metadata.branch = branch;
  if (slug) metadata.slug = slug;
  if (sha) metadata.sha = sha;
  if (appVersion) metadata.appVersion = appVersion;
  if (tombstone) metadata.tombstone = true;

  return metadata;
}

/**
 * Write a `deployment.json` file into a build output directory.
 * @param distDir Directory to write into, e.g. `dist`.
 * @param metadata Deployment metadata record from {@link buildDeploymentMetadata}.
 */
export function writeDeploymentMetadataFile(distDir, metadata) {
  writeFileSync(join(distDir, 'deployment.json'), JSON.stringify(metadata, null, 2) + '\n', 'utf8');
}
