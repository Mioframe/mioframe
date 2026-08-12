import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { validReleaseDescriptor } from '../../../src/shared/service/appUpdate/releaseWireContract.testUtils.ts';
import {
  collectReleaseFiles,
  computeDirectoryFingerprint,
  computeFileSha256,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
} from './releaseArtifact.mjs';

describe('computeDirectoryFingerprint', () => {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'fingerprint-dir-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns [] when the directory does not exist', () => {
    expect(computeDirectoryFingerprint(join(dir, 'missing'))).toEqual([]);
  });

  it('fingerprints every file in the complete tree, not only assets/', () => {
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    mkdirSync(join(dir, 'assets'), { recursive: true });
    writeFileSync(join(dir, 'assets', 'app-abc.js'), 'content-a');

    expect(computeDirectoryFingerprint(dir)).toEqual([
      {
        path: 'assets/app-abc.js',
        sha256: computeFileSha256(join(dir, 'assets', 'app-abc.js')),
        byteSize: Buffer.byteLength('content-a'),
      },
      {
        path: 'index.html',
        sha256: computeFileSha256(join(dir, 'index.html')),
        byteSize: Buffer.byteLength('<html></html>'),
      },
    ]);
  });
});

describe('collectReleaseFiles', () => {
  let distDir = '';

  beforeEach(() => {
    distDir = mkdtempSync(join(tmpdir(), 'release-dist-'));
  });

  afterEach(() => {
    rmSync(distDir, { recursive: true, force: true });
  });

  it('returns [] when no assets directory exists', () => {
    expect(collectReleaseFiles(distDir)).toEqual([]);
  });

  it('collects every file under assets/ with canonical paths and hashes', () => {
    mkdirSync(join(distDir, 'assets', 'nested'), { recursive: true });
    writeFileSync(join(distDir, 'assets', 'app-abc.js'), 'content-a');
    writeFileSync(join(distDir, 'assets', 'nested', 'chunk-def.js'), 'content-b');

    const files = collectReleaseFiles(distDir);

    expect(files).toEqual([
      {
        path: 'assets/app-abc.js',
        sha256: computeFileSha256(join(distDir, 'assets', 'app-abc.js')),
        byteSize: Buffer.byteLength('content-a'),
      },
      {
        path: 'assets/nested/chunk-def.js',
        sha256: computeFileSha256(join(distDir, 'assets', 'nested', 'chunk-def.js')),
        byteSize: Buffer.byteLength('content-b'),
      },
    ]);
  });
});

describe('validateNoImmutableCollision', () => {
  it('does not throw when there is no retained history', () => {
    expect(() =>
      validateNoImmutableCollision(
        [],
        [{ path: 'assets/a.js', sha256: '0'.repeat(64), byteSize: 1 }],
      ),
    ).not.toThrow();
  });

  it('does not throw when the same path has the same content', () => {
    const existing = [
      {
        ...validReleaseDescriptor,
        files: [{ path: 'assets/a.js', sha256: 'a'.repeat(64), byteSize: 1 }],
      },
    ];
    expect(() =>
      validateNoImmutableCollision(existing, [
        { path: 'assets/a.js', sha256: 'a'.repeat(64), byteSize: 1 },
      ]),
    ).not.toThrow();
  });

  it('throws when the same path has different content', () => {
    const existing = [
      {
        ...validReleaseDescriptor,
        files: [{ path: 'assets/a.js', sha256: 'a'.repeat(64), byteSize: 1 }],
      },
    ];
    expect(() =>
      validateNoImmutableCollision(existing, [
        { path: 'assets/a.js', sha256: 'b'.repeat(64), byteSize: 1 },
      ]),
    ).toThrow('Immutable file collision');
  });
});

describe('validateProjectedArtifactSize', () => {
  it('does not throw under the cap', () => {
    expect(() =>
      validateProjectedArtifactSize([{ path: 'a', sha256: '0'.repeat(64), byteSize: 100 }], 1000),
    ).not.toThrow();
  });

  it('throws over the cap', () => {
    expect(() =>
      validateProjectedArtifactSize([{ path: 'a', sha256: '0'.repeat(64), byteSize: 1001 }], 1000),
    ).toThrow('exceeds the 1000 byte cap');
  });
});
