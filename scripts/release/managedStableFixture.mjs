import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { runBuildArtifact } from './buildArtifact.mjs';

const RELEASES = [
  { label: 'A', releaseId: 'a'.repeat(40), releaseSequence: 1, appVersion: '1.0.0' },
  { label: 'B', releaseId: 'b'.repeat(40), releaseSequence: 2, appVersion: '1.0.0' },
  { label: 'C', releaseId: 'c'.repeat(40), releaseSequence: 3, appVersion: '1.1.0' },
];

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * Build one real stable controller artifact and three immutable application releases.
 * @param [distDir] - Fixture output directory.
 * @returns Completion after fixture metadata and archives are written.
 */
export async function buildManagedStableFixture(distDir = 'dist') {
  const releaseA = RELEASES[0];
  await runBuildArtifact(['--base', '/', '--dist', distDir], undefined, {
    ...process.env,
    RELEASE_ARTIFACT_SKIP_BUILD: '0',
    GITHUB_SHA: releaseA.releaseId,
  });
  if (process.exitCode) return;

  const descriptorAPath = join(distDir, 'updates', 'releases', `${releaseA.releaseId}.json`);
  const builtDescriptor = JSON.parse(readFileSync(descriptorAPath, 'utf8'));
  const builtIndex = readFileSync(join(distDir, 'index.html'), 'utf8');
  const assetFiles = builtDescriptor.files.filter(({ url }) => url.startsWith('/assets/'));
  const fixture = { schemaVersion: 1, releases: {} };

  for (const release of RELEASES) {
    let index = builtIndex.replace(
      '<head>',
      `<head><meta name="mioframe-release-id" content="${release.releaseId}"><script>globalThis.__MIOFRAME_EXECUTED_RELEASE__=${JSON.stringify(release.label)}</script>`,
    );
    if (release.label === 'C') {
      index = index.replace(
        /<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/,
        '<script type="module" src="/assets/first-boot-missing.js"></script>',
      );
    }
    const indexBytes = Buffer.from(index);
    const identity = {
      releaseId: release.releaseId,
      releaseSequence: release.releaseSequence,
      appVersion: release.appVersion,
      buildId: release.releaseId.slice(0, 7),
      buildDate: `2026-07-2${release.releaseSequence}T00:00:00.000Z`,
    };
    const indexUrl = `/updates/releases/${release.releaseId}/index.html`;
    const descriptor = {
      schemaVersion: 2,
      ...identity,
      indexUrl,
      files: [
        ...assetFiles,
        { url: indexUrl, byteSize: indexBytes.byteLength, sha256: sha256(indexBytes) },
      ].sort((left, right) => left.url.localeCompare(right.url)),
    };
    const latest = {
      schemaVersion: 2,
      release: identity,
      descriptorUrl: `/updates/releases/${release.releaseId}.json`,
    };
    mkdirSync(join(distDir, 'updates', 'releases', release.releaseId), { recursive: true });
    writeFileSync(join(distDir, indexUrl), indexBytes);
    writeFileSync(
      join(distDir, 'updates', 'releases', `${release.releaseId}.json`),
      `${JSON.stringify(descriptor, null, 2)}\n`,
    );
    fixture.releases[release.label] = { latest, descriptor };
  }

  writeFileSync(
    join(distDir, 'updates', 'latest.json'),
    `${JSON.stringify(fixture.releases.A.latest, null, 2)}\n`,
  );
  writeFileSync(
    join(distDir, 'managed-stable-fixture.json'),
    `${JSON.stringify(fixture, null, 2)}\n`,
  );
  mkdirSync(join(distDir, 'branch', 'fixture'), { recursive: true });
  mkdirSync(join(distDir, 'external'), { recursive: true });
  mkdirSync(join(distDir, 'pr', '161'), { recursive: true });
  writeFileSync(
    join(distDir, 'branch', 'fixture', 'index.html'),
    '<!doctype html><title>Branch fixture</title>',
  );
  writeFileSync(
    join(distDir, 'pr', '161', 'index.html'),
    '<!doctype html><title>PR fixture</title>',
  );
  writeFileSync(
    join(distDir, 'external', 'unresponsive.html'),
    '<!doctype html><title>Unresponsive stable fixture</title>',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await buildManagedStableFixture();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
