import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { publishManagedRelease } from './releasePublish.mjs';

let workDir = '';
let distDir = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'release-work-'));
  distDir = mkdtempSync(join(tmpdir(), 'release-dist-'));
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(distDir, { recursive: true, force: true });
});

function buildIndexHtml(marker) {
  return `<html><body>${marker}<script type="module" src="/assets/app-1.js"></script></body></html>`;
}

function writeBasicDist(indexContent = buildIndexHtml('<html/>')) {
  writeFileSync(join(distDir, 'index.html'), indexContent);
  mkdirSync(join(distDir, 'assets'), { recursive: true });
  writeFileSync(join(distDir, 'assets', 'app-1.js'), 'content-1');
}

describe('publishManagedRelease', () => {
  it('rejects an unsupported channel', () => {
    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'preview',
        basePath: '/pr/1/',
        appVersion: '1.0.0',
        buildId: 'sha1',
      }),
    ).toThrow('Unsupported managed channel');
  });

  it('rejects a stable publication whose dist contains a reserved updates directory, before any target-tree write', () => {
    writeBasicDist(buildIndexHtml('<stable/>'));
    mkdirSync(join(distDir, 'updates'), { recursive: true });
    writeFileSync(join(distDir, 'updates', 'latest.json'), '{}');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        basePath: '/',
        appVersion: '1.0.0',
        buildId: 'sha1',
      }),
    ).toThrow('dist/updates is a reserved managed-publication namespace');

    expect(existsSync(join(workDir, 'updates'))).toBe(false);
    expect(existsSync(join(workDir, 'assets'))).toBe(false);
    expect(existsSync(join(workDir, 'index.html'))).toBe(false);
  });

  it('rejects a develop publication whose dist contains a reserved updates directory, before any target-tree write', () => {
    writeBasicDist(buildIndexHtml('<develop/>'));
    mkdirSync(join(distDir, 'updates'), { recursive: true });
    writeFileSync(join(distDir, 'updates', 'latest.json'), '{}');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'develop',
        basePath: '/branch/develop/',
        appVersion: '1.0.0',
        buildId: 'sha1',
      }),
    ).toThrow('dist/updates is a reserved managed-publication namespace');

    expect(existsSync(join(workDir, 'branch', 'develop'))).toBe(false);
  });

  it('leaves an already-retained tree byte-for-byte unchanged when a later publish attempt has a reserved dist/updates directory', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    const first = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    const descriptorPath = join(workDir, 'updates', 'releases', `${first.releaseId}.json`);
    const archivedIndexPath = join(workDir, 'updates', 'releases', first.releaseId, 'index.html');
    const assetPath = join(workDir, 'assets', 'app-1.js');
    const rootIndexPath = join(workDir, 'index.html');
    const latestPath = join(workDir, 'updates', 'latest.json');

    const descriptorBefore = readFileSync(descriptorPath, 'utf8');
    const archivedIndexBefore = readFileSync(archivedIndexPath, 'utf8');
    const assetBefore = readFileSync(assetPath, 'utf8');
    const rootIndexBefore = readFileSync(rootIndexPath, 'utf8');
    const latestBefore = readFileSync(latestPath, 'utf8');

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
    writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');
    mkdirSync(join(distDir, 'updates'), { recursive: true });
    writeFileSync(join(distDir, 'updates', 'latest.json'), '{}');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        basePath: '/',
        appVersion: '1.1.0',
        buildId: 'sha2',
      }),
    ).toThrow('dist/updates is a reserved managed-publication namespace');

    expect(readFileSync(descriptorPath, 'utf8')).toBe(descriptorBefore);
    expect(readFileSync(archivedIndexPath, 'utf8')).toBe(archivedIndexBefore);
    expect(readFileSync(assetPath, 'utf8')).toBe(assetBefore);
    expect(readFileSync(rootIndexPath, 'utf8')).toBe(rootIndexBefore);
    expect(readFileSync(latestPath, 'utf8')).toBe(latestBefore);
    expect(existsSync(join(workDir, 'assets', 'app-2.js'))).toBe(false);
  });

  it('publishes a first stable release: descriptor, archived index, assets, and latest.json', () => {
    writeBasicDist(buildIndexHtml('<stable/>'));

    const descriptor = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    expect(descriptor.releaseSequence).toBe(1);
    expect(existsSync(join(workDir, 'updates', 'releases', `${descriptor.releaseId}.json`))).toBe(
      true,
    );
    expect(
      existsSync(join(workDir, 'updates', 'releases', descriptor.releaseId, 'index.html')),
    ).toBe(true);
    expect(existsSync(join(workDir, 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'index.html'))).toBe(true);

    const archivedIndexHtml = readFileSync(
      join(workDir, 'updates', 'releases', descriptor.releaseId, 'index.html'),
      'utf8',
    );
    expect(archivedIndexHtml).toContain(`var RELEASE_ID = "${descriptor.releaseId}";`);
    expect(archivedIndexHtml.indexOf('<script>(function ()')).toBeLessThan(
      archivedIndexHtml.indexOf('<script type="module"'),
    );

    const latest = JSON.parse(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8'));
    expect(latest).toEqual({ releaseId: descriptor.releaseId, releaseSequence: 1 });
  });

  it('computes indexSha256 and indexByteSize from the final archived index bytes, after watchdog injection', () => {
    writeBasicDist(buildIndexHtml('<stable/>'));

    const descriptor = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    const archivedIndexBytes = readFileSync(
      join(workDir, 'updates', 'releases', descriptor.releaseId, 'index.html'),
    );
    // If the hash/size had been computed before watchdog injection, this
    // would fail: the actual on-disk archived index already contains the
    // injected watchdog script.
    expect(descriptor.indexByteSize).toBe(archivedIndexBytes.byteLength);
    expect(descriptor.indexSha256).toBe(
      createHash('sha256').update(archivedIndexBytes).digest('hex'),
    );
  });

  it('publishes a first develop release under branch/develop/', () => {
    writeBasicDist(buildIndexHtml('<develop/>'));

    const descriptor = publishManagedRelease({
      workDir,
      distDir,
      channel: 'develop',
      basePath: '/branch/develop/',
      appVersion: '1.0.0',
      buildId: 'sha1',
    });

    expect(
      existsSync(
        join(workDir, 'branch', 'develop', 'updates', 'releases', `${descriptor.releaseId}.json`),
      ),
    ).toBe(true);
    expect(existsSync(join(workDir, 'branch', 'develop', 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'branch', 'develop', 'index.html'))).toBe(true);
  });

  it('allocates increasing sequences across successive publishes and retains prior releases', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    const first = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
    });

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
    writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');
    const second = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.1.0',
      buildId: 'sha2',
    });

    expect(second.releaseSequence).toBe(first.releaseSequence + 1);
    expect(existsSync(join(workDir, 'updates', 'releases', `${first.releaseId}.json`))).toBe(true);
    expect(existsSync(join(workDir, 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'assets', 'app-2.js'))).toBe(true);
  });

  it('throws on a generated releaseId that is already retained, without modifying the retained tree', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    const first = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    const descriptorPath = join(workDir, 'updates', 'releases', `${first.releaseId}.json`);
    const archivedIndexPath = join(workDir, 'updates', 'releases', first.releaseId, 'index.html');
    const assetPath = join(workDir, 'assets', 'app-1.js');
    const rootIndexPath = join(workDir, 'index.html');
    const latestPath = join(workDir, 'updates', 'latest.json');

    const descriptorBefore = readFileSync(descriptorPath, 'utf8');
    const archivedIndexBefore = readFileSync(archivedIndexPath, 'utf8');
    const assetBefore = readFileSync(assetPath, 'utf8');
    const rootIndexBefore = readFileSync(rootIndexPath, 'utf8');
    const latestBefore = readFileSync(latestPath, 'utf8');

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
    writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        basePath: '/',
        appVersion: '1.1.0',
        buildId: 'sha2',
        generateReleaseId: () => first.releaseId,
      }),
    ).toThrow(`Generated releaseId "${first.releaseId}" is already retained for this channel`);

    expect(readFileSync(descriptorPath, 'utf8')).toBe(descriptorBefore);
    expect(readFileSync(archivedIndexPath, 'utf8')).toBe(archivedIndexBefore);
    expect(readFileSync(assetPath, 'utf8')).toBe(assetBefore);
    expect(readFileSync(rootIndexPath, 'utf8')).toBe(rootIndexBefore);
    expect(readFileSync(latestPath, 'utf8')).toBe(latestBefore);
    expect(existsSync(join(workDir, 'assets', 'app-2.js'))).toBe(false);
    const sortAsc = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    expect(readdirSync(join(workDir, 'updates', 'releases')).sort(sortAsc)).toEqual(
      [first.releaseId, `${first.releaseId}.json`].sort(sortAsc),
    );
  });

  it('throws on an immutable collision without writing any new state', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      basePath: '/',
      appVersion: '1.0.0',
      buildId: 'sha1',
    });

    // Same asset filename, different content: a real Vite build would never do this
    // (names are content hashes), but the publisher must still refuse to trust it.
    writeFileSync(join(distDir, 'assets', 'app-1.js'), 'DIFFERENT-content');
    const latestBefore = readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        basePath: '/',
        appVersion: '1.0.1',
        buildId: 'sha2',
      }),
    ).toThrow('Immutable file collision');
    expect(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8')).toBe(latestBefore);
  });
});
