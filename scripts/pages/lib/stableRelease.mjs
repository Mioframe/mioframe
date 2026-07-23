/* eslint-disable jsdoc/require-jsdoc -- Internal publication helpers are documented by their exported contracts and release guide. */
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative } from 'node:path';
import { buildSpaFallbackHtml } from './spaFallback.mjs';

export const STABLE_PAGES_SIZE_LIMIT_BYTES = 900 * 1024 * 1024;

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const walkFiles = (root, current = root) =>
  readdirSync(current, { withFileTypes: true }).flatMap((entry) => {
    const path = join(current, entry.name);
    return entry.isDirectory() ? walkFiles(root, path) : [relative(root, path)];
  });

const readDeploymentMetadata = (distDir) => {
  const metadata = JSON.parse(readFileSync(join(distDir, 'deployment.json'), 'utf8'));
  if (
    metadata.channel !== 'stable' ||
    metadata.channelId !== 'main' ||
    !/^[0-9a-f]{40}$/.test(metadata.sha ?? '') ||
    typeof metadata.appVersion !== 'string' ||
    typeof metadata.buildDate !== 'string'
  ) {
    throw new Error('Stable deployment metadata must contain canonical main release facts.');
  }
  return metadata;
};

export const buildStableReleasePublication = (distDir) => {
  const metadata = readDeploymentMetadata(distDir);
  const releaseId = metadata.sha;
  const identity = {
    releaseId,
    appVersion: metadata.appVersion,
    buildId: releaseId.slice(0, 7),
    buildDate: metadata.buildDate,
  };
  const indexBytes = readFileSync(join(distDir, 'index.html'));
  const files = [
    {
      url: `/updates/releases/${releaseId}/index.html`,
      byteSize: indexBytes.byteLength,
      sha256: sha256(indexBytes),
    },
    ...walkFiles(join(distDir, 'assets')).map((file) => {
      const bytes = readFileSync(join(distDir, 'assets', file));
      return {
        url: `/assets/${file.replaceAll('\\', '/')}`,
        byteSize: bytes.byteLength,
        sha256: sha256(bytes),
      };
    }),
  ].sort((left, right) => left.url.localeCompare(right.url));
  const descriptor = {
    schemaVersion: 1,
    ...identity,
    indexUrl: `/updates/releases/${releaseId}/index.html`,
    files,
  };
  return {
    releaseId,
    identity,
    descriptor,
    descriptorText: `${JSON.stringify(descriptor, null, 2)}\n`,
    latestText: `${JSON.stringify(
      {
        schemaVersion: 1,
        release: identity,
        descriptorUrl: `/updates/releases/${releaseId}.json`,
      },
      null,
      2,
    )}\n`,
  };
};

export const writeStableReleaseArtifact = (distDir) => {
  const publication = buildStableReleasePublication(distDir);
  const releaseDir = join(distDir, 'updates', 'releases', publication.releaseId);
  mkdirSync(releaseDir, { recursive: true });
  writeFileSync(join(releaseDir, 'index.html'), readFileSync(join(distDir, 'index.html')));
  writeFileSync(
    join(distDir, 'updates', 'releases', `${publication.releaseId}.json`),
    publication.descriptorText,
  );
  writeFileSync(join(distDir, 'updates', 'latest.json'), publication.latestText);
  return publication;
};

const assertIdenticalOrMissing = (path, expected) => {
  if (existsSync(path) && !readFileSync(path).equals(expected)) {
    throw new Error('Stable release collision: existing release content differs.');
  }
};

const currentTreeSize = (root) =>
  existsSync(root)
    ? walkFiles(root).reduce((total, file) => total + statSync(join(root, file)).size, 0)
    : 0;

export const applyManagedStablePublish = (
  workDir,
  distDir,
  { sizeLimitBytes = STABLE_PAGES_SIZE_LIMIT_BYTES } = {},
) => {
  const publication = buildStableReleasePublication(distDir);
  const releaseDir = join(workDir, 'updates', 'releases', publication.releaseId);
  const descriptorPath = join(workDir, 'updates', 'releases', `${publication.releaseId}.json`);
  const archivedIndexPath = join(releaseDir, 'index.html');
  const descriptorBytes = Buffer.from(publication.descriptorText);
  const indexBytes = readFileSync(join(distDir, 'index.html'));

  assertIdenticalOrMissing(descriptorPath, descriptorBytes);
  assertIdenticalOrMissing(archivedIndexPath, indexBytes);
  for (const file of publication.descriptor.files.filter(({ url }) => url.startsWith('/assets/'))) {
    const relativePath = file.url.slice('/assets/'.length);
    assertIdenticalOrMissing(
      join(workDir, 'assets', relativePath),
      readFileSync(join(distDir, 'assets', relativePath)),
    );
  }

  const existingSize = currentTreeSize(workDir);
  const additions = publication.descriptor.files.reduce(
    (total, file) => {
      const target = join(workDir, file.url.slice(1));
      return total + (existsSync(target) ? 0 : file.byteSize);
    },
    existsSync(descriptorPath) ? 0 : descriptorBytes.byteLength,
  );
  const preservedRootEntries = new Set(['.git', 'assets', 'updates', 'branch', 'pr']);
  const replaceableRootBytes = readdirSync(workDir, { withFileTypes: true })
    .filter(({ name }) => !preservedRootEntries.has(name))
    .reduce((total, entry) => {
      const path = join(workDir, entry.name);
      return total + (entry.isDirectory() ? currentTreeSize(path) : statSync(path).size);
    }, 0);
  const newRootBytes = readdirSync(distDir, { withFileTypes: true })
    .filter(({ name }) => !['assets', 'updates'].includes(name))
    .reduce((total, entry) => {
      const path = join(distDir, entry.name);
      return total + (entry.isDirectory() ? currentTreeSize(path) : statSync(path).size);
    }, 0);
  const latestBytes = Buffer.byteLength(publication.latestText);
  const distFallbackBytes = existsSync(join(distDir, '404.html'))
    ? statSync(join(distDir, '404.html')).size
    : 0;
  const publishedFallback = buildSpaFallbackHtml();
  const publishedFallbackBytes = Buffer.byteLength(publishedFallback);
  const oldLatestBytes = existsSync(join(workDir, 'updates', 'latest.json'))
    ? statSync(join(workDir, 'updates', 'latest.json')).size
    : 0;
  const projectedSize =
    existingSize +
    additions -
    replaceableRootBytes +
    newRootBytes -
    distFallbackBytes +
    publishedFallbackBytes -
    oldLatestBytes +
    latestBytes;
  if (projectedSize > sizeLimitBytes) {
    throw new Error(
      `Pages artifact size ${projectedSize} exceeds the ${sizeLimitBytes} byte limit.`,
    );
  }

  mkdirSync(releaseDir, { recursive: true });
  mkdirSync(join(workDir, 'assets'), { recursive: true });
  cpSync(join(distDir, 'assets'), join(workDir, 'assets'), { recursive: true, force: false });
  writeFileSync(archivedIndexPath, indexBytes);
  writeFileSync(descriptorPath, descriptorBytes);

  for (const entry of readdirSync(workDir, { withFileTypes: true })) {
    if (entry.name === '.git' || ['assets', 'updates', 'branch', 'pr'].includes(entry.name))
      continue;
    rmSync(join(workDir, entry.name), { recursive: true, force: true });
  }
  for (const entry of readdirSync(distDir, { withFileTypes: true })) {
    if (['assets', 'updates'].includes(entry.name)) continue;
    cpSync(join(distDir, entry.name), join(workDir, entry.name), { recursive: true });
  }
  writeFileSync(join(workDir, '404.html'), publishedFallback);
  mkdirSync(join(workDir, 'updates'), { recursive: true });
  writeFileSync(join(workDir, 'updates', 'latest.json'), publication.latestText);
  return { ...publication, projectedSize };
};
/* eslint-enable jsdoc/require-jsdoc -- End stable publication helpers. */
