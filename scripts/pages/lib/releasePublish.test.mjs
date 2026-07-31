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
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
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
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    ).toThrow('dist/updates is a reserved managed-publication namespace');

    expect(existsSync(join(workDir, 'branch', 'develop'))).toBe(false);
  });

  it('rejects a missing buildId before touching the retained tree', () => {
    writeBasicDist();

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: '',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    ).toThrow('buildId is required');
  });

  it('rejects a missing buildDate before touching the retained tree', () => {
    writeBasicDist();

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
      }),
    ).toThrow('buildDate is required');
  });

  it('leaves an already-retained tree byte-for-byte unchanged when a later publish attempt has a reserved dist/updates directory', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    const first = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    const descriptorPath = join(workDir, 'updates', 'releases', `${first.releaseNumber}.json`);
    const archivedIndexPath = join(
      workDir,
      'updates',
      'releases',
      String(first.releaseNumber),
      'index.html',
    );
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
        appVersion: '1.1.0',
        buildId: 'sha2',
        buildDate: '2026-07-25T00:00:00.000Z',
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
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    expect(descriptor.releaseNumber).toBe(1);
    expect(
      existsSync(join(workDir, 'updates', 'releases', `${descriptor.releaseNumber}.json`)),
    ).toBe(true);
    expect(
      existsSync(
        join(workDir, 'updates', 'releases', String(descriptor.releaseNumber), 'index.html'),
      ),
    ).toBe(true);
    expect(existsSync(join(workDir, 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'index.html'))).toBe(true);

    const archivedIndexHtml = readFileSync(
      join(workDir, 'updates', 'releases', String(descriptor.releaseNumber), 'index.html'),
      'utf8',
    );
    expect(archivedIndexHtml).toContain(`var RELEASE_NUMBER = ${descriptor.releaseNumber};`);
    expect(archivedIndexHtml.indexOf('<script>(function ()')).toBeLessThan(
      archivedIndexHtml.indexOf('<script type="module"'),
    );

    const latest = JSON.parse(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8'));
    expect(latest).toEqual({ releaseNumber: 1 });
  });

  it('computes indexSha256 and indexByteSize from the final archived index bytes, after watchdog injection', () => {
    writeBasicDist(buildIndexHtml('<stable/>'));

    const descriptor = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    const archivedIndexBytes = readFileSync(
      join(workDir, 'updates', 'releases', String(descriptor.releaseNumber), 'index.html'),
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
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    expect(
      existsSync(
        join(
          workDir,
          'branch',
          'develop',
          'updates',
          'releases',
          `${descriptor.releaseNumber}.json`,
        ),
      ),
    ).toBe(true);
    expect(existsSync(join(workDir, 'branch', 'develop', 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'branch', 'develop', 'index.html'))).toBe(true);
  });

  it('allocates increasing release numbers across successive publishes and retains prior releases', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    const first = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
    writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');
    const second = publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.1.0',
      buildId: 'sha2',
      buildDate: '2026-07-25T00:00:00.000Z',
    });

    expect(second.releaseNumber).toBe(first.releaseNumber + 1);
    expect(existsSync(join(workDir, 'updates', 'releases', `${first.releaseNumber}.json`))).toBe(
      true,
    );
    expect(existsSync(join(workDir, 'assets', 'app-1.js'))).toBe(true);
    expect(existsSync(join(workDir, 'assets', 'app-2.js'))).toBe(true);
  });

  it('throws when the allocated release number already has a stray archive directory, without modifying the retained tree', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });

    // Simulate a stray leftover archive directory for the number about to be
    // allocated (e.g. a prior publish attempt that wrote the archive but
    // crashed before writing the descriptor). It has no descriptor, so it is
    // invisible to readRetainedReleaseDescriptors/allocateNextReleaseNumber,
    // but must still be caught before any new write for that number begins.
    mkdirSync(join(workDir, 'updates', 'releases', '2'), { recursive: true });
    writeFileSync(join(workDir, 'updates', 'releases', '2', 'index.html'), '<stray/>');

    const descriptorPath = join(workDir, 'updates', 'releases', '1.json');
    const latestPath = join(workDir, 'updates', 'latest.json');
    const descriptorBefore = readFileSync(descriptorPath, 'utf8');
    const latestBefore = readFileSync(latestPath, 'utf8');

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
    writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha2',
        buildDate: '2026-07-25T00:00:00.000Z',
      }),
    ).toThrow('Release number 2 is already retained for this channel');

    expect(readFileSync(descriptorPath, 'utf8')).toBe(descriptorBefore);
    expect(readFileSync(latestPath, 'utf8')).toBe(latestBefore);
    expect(existsSync(join(workDir, 'updates', 'releases', '2.json'))).toBe(false);
    expect(existsSync(join(workDir, 'assets', 'app-2.js'))).toBe(false);
    const sortAsc = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    expect(readdirSync(join(workDir, 'updates', 'releases')).sort(sortAsc)).toEqual(
      ['1', '1.json', '2'].sort(sortAsc),
    );
  });

  it('throws on a corrupt retained tree (latest.json not pointing at the highest release), without writing any new state', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
    });
    // Corrupt latest.json so it no longer points at the highest retained release.
    writeFileSync(join(workDir, 'updates', 'latest.json'), JSON.stringify({ releaseNumber: 999 }));
    const latestBefore = readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8');

    writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));

    expect(() =>
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha2',
        buildDate: '2026-07-25T00:00:00.000Z',
      }),
    ).toThrow('does not point to the highest retained release');
    expect(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8')).toBe(latestBefore);
  });

  it('throws on an immutable collision without writing any new state', () => {
    writeBasicDist(buildIndexHtml('<v1/>'));
    publishManagedRelease({
      workDir,
      distDir,
      channel: 'stable',
      appVersion: '1.0.0',
      buildId: 'sha1',
      buildDate: '2026-07-24T00:00:00.000Z',
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
        appVersion: '1.0.1',
        buildId: 'sha2',
        buildDate: '2026-07-25T00:00:00.000Z',
      }),
    ).toThrow('Immutable file collision');
    expect(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8')).toBe(latestBefore);
  });

  describe('buildId idempotency', () => {
    it('republishing the retained latest buildId is a zero-write no-op that returns the retained descriptor unchanged', () => {
      writeBasicDist(buildIndexHtml('<v1/>'));
      const first = publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      });

      const descriptorPath = join(workDir, 'updates', 'releases', `${first.releaseNumber}.json`);
      const archivedIndexPath = join(
        workDir,
        'updates',
        'releases',
        String(first.releaseNumber),
        'index.html',
      );
      const assetPath = join(workDir, 'assets', 'app-1.js');
      const rootIndexPath = join(workDir, 'index.html');
      const latestPath = join(workDir, 'updates', 'latest.json');

      const descriptorBefore = readFileSync(descriptorPath, 'utf8');
      const archivedIndexBefore = readFileSync(archivedIndexPath, 'utf8');
      const assetBefore = readFileSync(assetPath, 'utf8');
      const rootIndexBefore = readFileSync(rootIndexPath, 'utf8');
      const latestBefore = readFileSync(latestPath, 'utf8');

      const second = publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      });

      expect(second).toEqual(first);
      expect(readFileSync(descriptorPath, 'utf8')).toBe(descriptorBefore);
      expect(readFileSync(archivedIndexPath, 'utf8')).toBe(archivedIndexBefore);
      expect(readFileSync(assetPath, 'utf8')).toBe(assetBefore);
      expect(readFileSync(rootIndexPath, 'utf8')).toBe(rootIndexBefore);
      expect(readFileSync(latestPath, 'utf8')).toBe(latestBefore);
    });

    it('resolves the retained-latest no-op without requiring or inspecting a current dist artifact', () => {
      writeBasicDist(buildIndexHtml('<v1/>'));
      const first = publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      });

      // A distDir that does not even exist: the no-op path must never read it.
      const missingDistDir = join(distDir, 'does-not-exist');

      const second = publishManagedRelease({
        workDir,
        distDir: missingDistDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      });

      expect(second).toEqual(first);
    });

    it('rejects a buildId retained on a non-latest release, before any write', () => {
      writeBasicDist(buildIndexHtml('<v1/>'));
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.0.0',
        buildId: 'sha1',
        buildDate: '2026-07-24T00:00:00.000Z',
      });

      writeFileSync(join(distDir, 'index.html'), buildIndexHtml('<v2/>'));
      writeFileSync(join(distDir, 'assets', 'app-2.js'), 'content-2');
      publishManagedRelease({
        workDir,
        distDir,
        channel: 'stable',
        appVersion: '1.1.0',
        buildId: 'sha2',
        buildDate: '2026-07-25T00:00:00.000Z',
      });

      const latestBefore = readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8');

      expect(() =>
        publishManagedRelease({
          workDir,
          distDir,
          channel: 'stable',
          appVersion: '1.2.0',
          buildId: 'sha1',
          buildDate: '2026-07-26T00:00:00.000Z',
        }),
      ).toThrow('is already retained on release 1, which is not the latest release (2)');
      expect(readFileSync(join(workDir, 'updates', 'latest.json'), 'utf8')).toBe(latestBefore);
      expect(existsSync(join(workDir, 'updates', 'releases', '3.json'))).toBe(false);
    });

    it('rejects publication against a retained tree with a duplicate buildId, before any write', () => {
      writeBasicDist(buildIndexHtml('<v1/>'));
      mkdirSync(join(workDir, 'updates', 'releases'), { recursive: true });
      for (const releaseNumber of [1, 2]) {
        writeFileSync(
          join(workDir, 'updates', 'releases', `${releaseNumber}.json`),
          JSON.stringify({
            schemaVersion: 1,
            releaseNumber,
            appVersion: '1.0.0',
            buildId: 'dup-sha',
            buildDate: '2026-07-24T00:00:00.000Z',
            indexSha256: 'a'.repeat(64),
            indexByteSize: 10,
            files: [{ path: 'assets/app-1.js', sha256: 'a'.repeat(64), byteSize: 1 }],
          }),
        );
        mkdirSync(join(workDir, 'updates', 'releases', String(releaseNumber)), { recursive: true });
        writeFileSync(
          join(workDir, 'updates', 'releases', String(releaseNumber), 'index.html'),
          '<html></html>',
        );
      }
      writeFileSync(join(workDir, 'updates', 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

      expect(() =>
        publishManagedRelease({
          workDir,
          distDir,
          channel: 'stable',
          appVersion: '1.1.0',
          buildId: 'sha-new',
          buildDate: '2026-07-25T00:00:00.000Z',
        }),
      ).toThrow('share the same buildId');
      expect(existsSync(join(workDir, 'updates', 'releases', '3.json'))).toBe(false);
    });
  });
});
