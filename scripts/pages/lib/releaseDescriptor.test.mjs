import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { invalidReleaseDescriptors, validReleaseDescriptor } from './releaseDescriptorCorpus.mjs';
import {
  allocateReleaseSequence,
  buildReleaseDescriptor,
  collectReleaseFiles,
  computeFileSha256,
  isValidReleaseDescriptor,
  readRetainedReleaseDescriptors,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
} from './releaseDescriptor.mjs';

describe('isValidReleaseDescriptor', () => {
  it('accepts the shared valid fixture', () => {
    expect(isValidReleaseDescriptor(validReleaseDescriptor)).toBe(true);
  });

  it.each(invalidReleaseDescriptors)('rejects: $name', ({ descriptor }) => {
    expect(isValidReleaseDescriptor(descriptor)).toBe(false);
  });
});

describe('allocateReleaseSequence', () => {
  it('starts at 1 when nothing is retained', () => {
    expect(allocateReleaseSequence([])).toBe(1);
  });

  it('allocates one past the highest retained sequence', () => {
    expect(allocateReleaseSequence([1, 3, 2])).toBe(4);
  });
});

describe('buildReleaseDescriptor', () => {
  it('builds a valid descriptor from its parts', () => {
    const descriptor = buildReleaseDescriptor({
      releaseId: 'release-1',
      releaseSequence: 1,
      appVersion: '1.0.0',
      buildId: 'abc123',
      buildDate: '2026-07-24T00:00:00.000Z',
      indexUrl: '/updates/releases/release-1/index.html',
      files: [{ path: 'assets/a.js', sha256: '0'.repeat(64), byteSize: 10 }],
    });

    expect(isValidReleaseDescriptor(descriptor)).toBe(true);
  });

  it('throws when the assembled descriptor is invalid', () => {
    expect(() =>
      buildReleaseDescriptor({
        releaseId: 'release-1',
        releaseSequence: 1,
        appVersion: '1.0.0',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
        indexUrl: '/updates/releases/release-1/index.html',
        files: [],
      }),
    ).toThrow('invalid release descriptor');
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

describe('readRetainedReleaseDescriptors', () => {
  let releasesDir = '';

  beforeEach(() => {
    releasesDir = join(mkdtempSync(join(tmpdir(), 'release-updates-')), 'releases');
  });

  afterEach(() => {
    rmSync(releasesDir, { recursive: true, force: true });
  });

  it('returns [] when the releases directory does not exist yet', () => {
    expect(readRetainedReleaseDescriptors(releasesDir)).toEqual([]);
  });

  it('reads and validates every retained descriptor', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(join(releasesDir, 'r1.json'), JSON.stringify(validReleaseDescriptor));

    expect(readRetainedReleaseDescriptors(releasesDir)).toEqual([validReleaseDescriptor]);
  });

  it('fails closed on a structurally invalid retained descriptor', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(
      join(releasesDir, 'bad.json'),
      JSON.stringify({ ...validReleaseDescriptor, files: [] }),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('structurally invalid');
  });

  it('fails closed on unparseable JSON', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(join(releasesDir, 'bad.json'), '{not json');

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('not valid JSON');
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
