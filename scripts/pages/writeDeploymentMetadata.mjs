/**
 * Write a `deployment.json` file into a build output directory, describing
 * the channel, source, and build facts for that deployment
 * (see `docs/release.md#organization-pages-deployment-model`).
 *
 * Usage:
 *   node scripts/pages/writeDeploymentMetadata.mjs \
 *     --dist ./dist --channel stable --channel-id main --base-url / \
 *     [--ref refs/heads/main] [--branch main] [--slug develop] \
 *     [--sha abc123] [--app-version 0.1.0] [--build-date 2026-07-03T00:00:00.000Z] \
 *     [--tombstone]
 */

import { pathToFileURL } from 'node:url';

import { buildDeploymentMetadata, writeDeploymentMetadataFile } from './lib/deploymentMetadata.mjs';

function readFlag(argv, flag) {
  const index = argv.indexOf(flag);
  return index !== -1 ? argv[index + 1] : undefined;
}

/**
 * @param argv Process arguments (`process.argv.slice(2)`).
 */
export function writeDeploymentMetadata(argv = process.argv.slice(2)) {
  const distDir = readFlag(argv, '--dist');
  if (!distDir) {
    throw new Error(
      'Usage: writeDeploymentMetadata.mjs --dist <dir> --channel <channel> --channel-id <id> --base-url <base>',
    );
  }

  const metadata = buildDeploymentMetadata({
    channel: readFlag(argv, '--channel'),
    channelId: readFlag(argv, '--channel-id'),
    baseUrl: readFlag(argv, '--base-url'),
    ref: readFlag(argv, '--ref'),
    branch: readFlag(argv, '--branch'),
    slug: readFlag(argv, '--slug'),
    sha: readFlag(argv, '--sha'),
    appVersion: readFlag(argv, '--app-version'),
    buildDate: readFlag(argv, '--build-date'),
    tombstone: argv.includes('--tombstone'),
  });

  writeDeploymentMetadataFile(distDir, metadata);
  console.log(
    `Wrote deployment.json to ${distDir}/deployment.json (channel: ${metadata.channel}/${metadata.channelId}).`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    writeDeploymentMetadata();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
