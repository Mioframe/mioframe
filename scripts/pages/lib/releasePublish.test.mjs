import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
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
