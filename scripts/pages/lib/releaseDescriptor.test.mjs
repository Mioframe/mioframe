import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { invalidReleaseDescriptors, validReleaseDescriptor } from './releaseDescriptorCorpus.mjs';
import {
  allocateNextReleaseNumber,
  assertReleaseNumberNotRetained,
  buildReleaseDescriptor,
  collectReleaseFiles,
  computeFileSha256,
  isPositiveSafeInteger,
  isValidReleaseDescriptor,
  readLatestPointer,
  readRetainedReleaseDescriptors,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
} from './releaseDescriptor.mjs';

describe('isPositiveSafeInteger', () => {
  it('accepts a positive safe integer', () => {
    expect(isPositiveSafeInteger(1)).toBe(true);
    expect(isPositiveSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('rejects zero, negative, non-integer, unsafe, and non-number values', () => {
    expect(isPositiveSafeInteger(0)).toBe(false);
    expect(isPositiveSafeInteger(-1)).toBe(false);
    expect(isPositiveSafeInteger(1.5)).toBe(false);
    expect(isPositiveSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
    expect(isPositiveSafeInteger('1')).toBe(false);
  });
});

describe('isValidReleaseDescriptor', () => {
  it('accepts the shared valid fixture', () => {
    expect(isValidReleaseDescriptor(validReleaseDescriptor)).toBe(true);
  });

  it.each(invalidReleaseDescriptors)('rejects: $name', ({ descriptor }) => {
    expect(isValidReleaseDescriptor(descriptor)).toBe(false);
  });
});

describe('buildReleaseDescriptor', () => {
  it('builds a valid descriptor from its parts', () => {
    const descriptor = buildReleaseDescriptor({
      releaseNumber: 1,
      appVersion: '1.0.0',
      buildId: 'abc123',
      buildDate: '2026-07-24T00:00:00.000Z',
      indexSha256: '0'.repeat(64),
      indexByteSize: 100,
      files: [{ path: 'assets/a.js', sha256: '0'.repeat(64), byteSize: 10 }],
    });

    expect(isValidReleaseDescriptor(descriptor)).toBe(true);
  });

  it('throws when the assembled descriptor is invalid', () => {
    expect(() =>
      buildReleaseDescriptor({
        releaseNumber: 0,
        appVersion: '1.0.0',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
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

  function writeRetainedRelease(descriptor) {
    writeFileSync(
      join(releasesDir, `${descriptor.releaseNumber}.json`),
      JSON.stringify(descriptor),
    );
    mkdirSync(join(releasesDir, String(descriptor.releaseNumber)), { recursive: true });
    writeFileSync(
      join(releasesDir, String(descriptor.releaseNumber), 'index.html'),
      '<html></html>',
    );
  }

  it('reads and validates every retained descriptor', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);

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

  it('fails closed when the descriptor filename does not match its releaseNumber', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(join(releasesDir, 'r1.json'), JSON.stringify(validReleaseDescriptor));
    mkdirSync(join(releasesDir, String(validReleaseDescriptor.releaseNumber)), { recursive: true });
    writeFileSync(
      join(releasesDir, String(validReleaseDescriptor.releaseNumber), 'index.html'),
      '<html></html>',
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow(
      'does not match its releaseNumber',
    );
  });

  it('fails closed on a duplicate release number under a different (padded) filename', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    writeFileSync(
      join(releasesDir, '01.json'),
      JSON.stringify({ ...validReleaseDescriptor, releaseNumber: 1 }),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow(
      'does not match its releaseNumber',
    );
  });

  it('fails closed when the archived index directory is missing', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(
      join(releasesDir, `${String(validReleaseDescriptor.releaseNumber)}.json`),
      JSON.stringify(validReleaseDescriptor),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow(
      'missing its archived index directory',
    );
  });
});

describe('readLatestPointer', () => {
  let updatesDir = '';

  beforeEach(() => {
    updatesDir = mkdtempSync(join(tmpdir(), 'release-updates-'));
  });

  afterEach(() => {
    rmSync(updatesDir, { recursive: true, force: true });
  });

  it('returns undefined when latest.json does not exist yet', () => {
    expect(readLatestPointer(updatesDir)).toBeUndefined();
  });

  it('reads a valid latest.json', () => {
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 3 }));
    expect(readLatestPointer(updatesDir)).toEqual({ releaseNumber: 3 });
  });

  it('fails closed on unparseable JSON', () => {
    writeFileSync(join(updatesDir, 'latest.json'), '{not json');
    expect(() => readLatestPointer(updatesDir)).toThrow('not valid JSON');
  });

  it('fails closed on a structurally invalid pointer', () => {
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 0 }));
    expect(() => readLatestPointer(updatesDir)).toThrow('structurally invalid');
  });
});

describe('allocateNextReleaseNumber', () => {
  let updatesDir = '';
  let releasesDir = '';

  beforeEach(() => {
    updatesDir = mkdtempSync(join(tmpdir(), 'release-updates-'));
    releasesDir = join(updatesDir, 'releases');
  });

  afterEach(() => {
    rmSync(updatesDir, { recursive: true, force: true });
  });

  function writeRetainedRelease(releaseNumber) {
    mkdirSync(releasesDir, { recursive: true });
    const descriptor = { ...validReleaseDescriptor, releaseNumber };
    writeFileSync(join(releasesDir, `${releaseNumber}.json`), JSON.stringify(descriptor));
    mkdirSync(join(releasesDir, String(releaseNumber)), { recursive: true });
    writeFileSync(join(releasesDir, String(releaseNumber), 'index.html'), '<html></html>');
  }

  it('allocates 1 when no retained managed tree exists', () => {
    expect(allocateNextReleaseNumber(releasesDir, updatesDir)).toEqual({
      nextReleaseNumber: 1,
      descriptors: [],
    });
  });

  it('allocates one past the highest retained release when latest.json agrees', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    const { nextReleaseNumber } = allocateNextReleaseNumber(releasesDir, updatesDir);
    expect(nextReleaseNumber).toBe(3);
  });

  it('rejects retained releases without a latest.json', () => {
    writeRetainedRelease(1);

    expect(() => allocateNextReleaseNumber(releasesDir, updatesDir)).toThrow(
      'updates/latest.json is missing',
    );
  });

  it('rejects a latest.json without any retained release', () => {
    mkdirSync(updatesDir, { recursive: true });
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 1 }));

    expect(() => allocateNextReleaseNumber(releasesDir, updatesDir)).toThrow(
      'no release is retained',
    );
  });

  it('rejects a latest.json that does not point at the highest retained release', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 1 }));

    expect(() => allocateNextReleaseNumber(releasesDir, updatesDir)).toThrow(
      'does not point to the highest retained release',
    );
  });

  it('rejects allocation that would overflow Number.MAX_SAFE_INTEGER', () => {
    writeRetainedRelease(Number.MAX_SAFE_INTEGER);
    writeFileSync(
      join(updatesDir, 'latest.json'),
      JSON.stringify({ releaseNumber: Number.MAX_SAFE_INTEGER }),
    );

    expect(() => allocateNextReleaseNumber(releasesDir, updatesDir)).toThrow(
      'exceed Number.MAX_SAFE_INTEGER',
    );
  });
});

describe('assertReleaseNumberNotRetained', () => {
  let releasesDir = '';

  beforeEach(() => {
    releasesDir = join(mkdtempSync(join(tmpdir(), 'release-updates-')), 'releases');
  });

  afterEach(() => {
    rmSync(releasesDir, { recursive: true, force: true });
  });

  it('does not throw when the number is unused', () => {
    expect(() => assertReleaseNumberNotRetained(releasesDir, 1)).not.toThrow();
  });

  it('throws when a descriptor for the number already exists', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(join(releasesDir, '1.json'), '{}');

    expect(() => assertReleaseNumberNotRetained(releasesDir, 1)).toThrow('already retained');
  });

  it('throws when an archive directory for the number already exists', () => {
    mkdirSync(join(releasesDir, '1'), { recursive: true });

    expect(() => assertReleaseNumberNotRetained(releasesDir, 1)).toThrow('already retained');
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
