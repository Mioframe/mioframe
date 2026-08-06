import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  canonicalReleasePathCases,
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from './releaseDescriptorCorpus.mjs';
import {
  assertReleaseNumberNotRetained,
  assertUniqueRetainedBuildIds,
  buildReleaseDescriptor,
  collectReleaseFiles,
  computeContentSha256,
  computeFileSha256,
  isCanonicalReleasePath,
  isPositiveSafeInteger,
  isValidReleaseDescriptor,
  readLatestPointer,
  readRetainedReleaseDescriptors,
  readRetainedTree,
  resolvePublicationDecision,
  resolvePublicationPlan,
  validateNoImmutableCollision,
  validateProjectedArtifactSize,
  validateRetainedContent,
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

describe('isCanonicalReleasePath', () => {
  it.each(canonicalReleasePathCases)('$name: $path -> $valid', ({ path, valid }) => {
    expect(isCanonicalReleasePath(path)).toBe(valid);
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
      join(releasesDir, '2.json'),
      JSON.stringify({ ...validReleaseDescriptor, releaseNumber: 2, files: [] }),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('structurally invalid');
  });

  it('fails closed on unparseable JSON', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeFileSync(join(releasesDir, '2.json'), '{not json');

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('not valid JSON');
  });

  it('fails closed when the descriptor filename does not match its releaseNumber', () => {
    mkdirSync(releasesDir, { recursive: true });
    // "2.json" is itself a canonical filename, but its own content's
    // releaseNumber (1) diverges from it — a content/filename identity
    // mismatch, distinct from a malformed filename.
    writeFileSync(join(releasesDir, '2.json'), JSON.stringify(validReleaseDescriptor));
    mkdirSync(join(releasesDir, String(validReleaseDescriptor.releaseNumber)), { recursive: true });
    writeFileSync(
      join(releasesDir, String(validReleaseDescriptor.releaseNumber), 'index.html'),
      '<html></html>',
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow(
      'does not match its releaseNumber',
    );
  });

  it('fails closed on a malformed (padded) numeric descriptor filename', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    writeFileSync(
      join(releasesDir, '01.json'),
      JSON.stringify({ ...validReleaseDescriptor, releaseNumber: 1 }),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('unexpected file');
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

  it('fails closed on an orphan archive directory with no matching descriptor', () => {
    mkdirSync(join(releasesDir, '1'), { recursive: true });
    writeFileSync(join(releasesDir, '1', 'index.html'), '<html></html>');

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('no matching descriptor');
  });

  it('fails closed on an unexpected top-level file entry', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    writeFileSync(join(releasesDir, 'notes.txt'), 'not a release');

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('unexpected file');
  });

  it('fails closed on an unexpected top-level directory entry', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    mkdirSync(join(releasesDir, 'stray-directory'), { recursive: true });

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('unexpected directory');
  });

  it('fails closed on an unexpected entry inside an archive directory', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    writeFileSync(
      join(releasesDir, String(validReleaseDescriptor.releaseNumber), 'extra.js'),
      'stray',
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow(
      'must contain exactly one file, index.html',
    );
  });

  it('fails closed on a symlink entry in the retained tree', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    symlinkSync(
      join(releasesDir, `${String(validReleaseDescriptor.releaseNumber)}.json`),
      join(releasesDir, 'linked.json'),
    );

    expect(() => readRetainedReleaseDescriptors(releasesDir)).toThrow('symlink entry');
  });

  it('accepts a valid contiguous retained tree unchanged', () => {
    mkdirSync(releasesDir, { recursive: true });
    writeRetainedRelease(validReleaseDescriptor);
    const secondDescriptor = { ...validReleaseDescriptor, releaseNumber: 2 };
    writeRetainedRelease(secondDescriptor);

    const result = readRetainedReleaseDescriptors(releasesDir);

    expect(result).toEqual(expect.arrayContaining([validReleaseDescriptor, secondDescriptor]));
    expect(result).toHaveLength(2);
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

describe('readRetainedTree', () => {
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

  it('returns an empty tree when no retained managed tree exists', () => {
    expect(readRetainedTree(releasesDir, updatesDir)).toEqual({
      descriptors: [],
      latestReleaseNumber: undefined,
    });
  });

  it('reports the highest retained release when latest.json agrees on a contiguous sequence', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    const { latestReleaseNumber } = readRetainedTree(releasesDir, updatesDir);
    expect(latestReleaseNumber).toBe(2);
  });

  it('accepts a longer contiguous sequence [1, 2, 3]', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeRetainedRelease(3);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 3 }));

    expect(readRetainedTree(releasesDir, updatesDir).latestReleaseNumber).toBe(3);
  });

  it('rejects retained releases without a latest.json', () => {
    writeRetainedRelease(1);

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow(
      'updates/latest.json is missing',
    );
  });

  it('rejects a latest.json without any retained release', () => {
    mkdirSync(updatesDir, { recursive: true });
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 1 }));

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow('no release is retained');
  });

  it('rejects a latest.json that does not point at the highest retained release', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 1 }));

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow(
      'does not point to the highest retained release',
    );
  });

  it('rejects a retained sequence beginning above 1: [2]', () => {
    writeRetainedRelease(2);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow(
      'must start at release 1, but starts at release 2',
    );
  });

  it('rejects a retained sequence with a gap: [1, 3]', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(3);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 3 }));

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow(
      'release 1 is followed by release 3, expected release 2',
    );
  });

  it('rejects a retained sequence with a gap: [1, 2, 4]', () => {
    writeRetainedRelease(1);
    writeRetainedRelease(2);
    writeRetainedRelease(4);
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 4 }));

    expect(() => readRetainedTree(releasesDir, updatesDir)).toThrow(
      'release 2 is followed by release 4, expected release 3',
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

describe('assertUniqueRetainedBuildIds', () => {
  it('does not throw for an empty or all-unique retained tree', () => {
    expect(() => assertUniqueRetainedBuildIds([])).not.toThrow();
    expect(() =>
      assertUniqueRetainedBuildIds([
        { ...validReleaseDescriptor, releaseNumber: 1, buildId: 'sha1' },
        { ...validReleaseDescriptor, releaseNumber: 2, buildId: 'sha2' },
      ]),
    ).not.toThrow();
  });

  it('throws when two retained descriptors share the same buildId', () => {
    expect(() =>
      assertUniqueRetainedBuildIds([
        { ...validReleaseDescriptor, releaseNumber: 1, buildId: 'sha1' },
        { ...validReleaseDescriptor, releaseNumber: 2, buildId: 'sha1' },
      ]),
    ).toThrow('share the same buildId');
  });
});

describe('validateRetainedContent', () => {
  let channelBaseDir = '';
  let releasesDir = '';

  beforeEach(() => {
    channelBaseDir = mkdtempSync(join(tmpdir(), 'release-channel-'));
    releasesDir = join(channelBaseDir, 'updates', 'releases');
  });

  afterEach(() => {
    rmSync(channelBaseDir, { recursive: true, force: true });
  });

  function writeRealRetainedRelease(releaseNumber) {
    mkdirSync(releasesDir, { recursive: true });
    mkdirSync(join(channelBaseDir, 'assets'), { recursive: true });

    const assetRelPath = `assets/app-${releaseNumber}.js`;
    const assetPath = join(channelBaseDir, assetRelPath);
    const assetContent = `asset-content-${releaseNumber}`;
    writeFileSync(assetPath, assetContent);

    const indexContent = `<html>${releaseNumber}</html>`;
    mkdirSync(join(releasesDir, String(releaseNumber)), { recursive: true });
    writeFileSync(join(releasesDir, String(releaseNumber), 'index.html'), indexContent);

    return {
      ...validReleaseDescriptor,
      releaseNumber,
      indexSha256: computeContentSha256(Buffer.from(indexContent, 'utf8')),
      indexByteSize: Buffer.byteLength(indexContent),
      files: [
        {
          path: assetRelPath,
          sha256: computeFileSha256(assetPath),
          byteSize: Buffer.byteLength(assetContent),
        },
      ],
    };
  }

  it('does not throw for a fully valid retained tree', () => {
    const descriptor = writeRealRetainedRelease(1);
    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).not.toThrow();
  });

  it('throws when the archived index is missing', () => {
    const descriptor = writeRealRetainedRelease(1);
    rmSync(join(releasesDir, '1', 'index.html'));

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'is missing',
    );
  });

  it('throws when the archived index is replaced by a directory', () => {
    const descriptor = writeRealRetainedRelease(1);
    rmSync(join(releasesDir, '1', 'index.html'));
    mkdirSync(join(releasesDir, '1', 'index.html'));

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'must be a regular file',
    );
  });

  it('throws when the archived index has the wrong byte size', () => {
    const descriptor = writeRealRetainedRelease(1);
    writeFileSync(join(releasesDir, '1', 'index.html'), 'short');

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'byte size mismatch',
    );
  });

  it('throws when the archived index has the wrong SHA-256', () => {
    const descriptor = writeRealRetainedRelease(1);
    writeFileSync(join(releasesDir, '1', 'index.html'), 'X'.repeat(descriptor.indexByteSize));

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'SHA-256 mismatch',
    );
  });

  it('throws when a retained asset is missing', () => {
    const descriptor = writeRealRetainedRelease(1);
    rmSync(join(channelBaseDir, 'assets', 'app-1.js'));

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'is missing',
    );
  });

  it('throws when a retained asset is replaced by a directory', () => {
    const descriptor = writeRealRetainedRelease(1);
    rmSync(join(channelBaseDir, 'assets', 'app-1.js'));
    mkdirSync(join(channelBaseDir, 'assets', 'app-1.js'));

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'must be a regular file',
    );
  });

  it('throws when a retained asset has the wrong byte size', () => {
    const descriptor = writeRealRetainedRelease(1);
    writeFileSync(join(channelBaseDir, 'assets', 'app-1.js'), 'x');

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'byte size mismatch',
    );
  });

  it('throws when a retained asset has the wrong SHA-256', () => {
    const descriptor = writeRealRetainedRelease(1);
    writeFileSync(
      join(channelBaseDir, 'assets', 'app-1.js'),
      'Y'.repeat(descriptor.files[0].byteSize),
    );

    expect(() => validateRetainedContent([descriptor], channelBaseDir, releasesDir)).toThrow(
      'SHA-256 mismatch',
    );
  });

  it('throws when two retained descriptors reference the same path with conflicting metadata', () => {
    const first = writeRealRetainedRelease(1);
    const conflicting = {
      ...first,
      releaseNumber: 2,
      files: [{ ...first.files[0], sha256: '0'.repeat(64) }],
    };
    mkdirSync(join(releasesDir, '2'), { recursive: true });
    writeFileSync(
      join(releasesDir, '2', 'index.html'),
      readFileSync(join(releasesDir, '1', 'index.html')),
    );

    expect(() =>
      validateRetainedContent([first, conflicting], channelBaseDir, releasesDir),
    ).toThrow('SHA-256 mismatch');
  });
});

describe('resolvePublicationDecision', () => {
  it('resolves publish with releaseNumber 1 for an empty retained tree', () => {
    expect(resolvePublicationDecision([], undefined, 'sha1')).toEqual({
      kind: 'publish',
      nextReleaseNumber: 1,
      descriptors: [],
    });
  });

  it('resolves a zero-write no-op when the retained latest release is at Number.MAX_SAFE_INTEGER', () => {
    const descriptors = [
      { ...validReleaseDescriptor, releaseNumber: Number.MAX_SAFE_INTEGER, buildId: 'sha1' },
    ];

    expect(resolvePublicationDecision(descriptors, Number.MAX_SAFE_INTEGER, 'sha1')).toEqual({
      kind: 'no-op',
      descriptor: descriptors[0],
    });
  });

  it('rejects a genuinely new buildId when the next release number would exceed Number.MAX_SAFE_INTEGER', () => {
    const descriptors = [
      { ...validReleaseDescriptor, releaseNumber: Number.MAX_SAFE_INTEGER, buildId: 'sha1' },
    ];

    expect(() =>
      resolvePublicationDecision(descriptors, Number.MAX_SAFE_INTEGER, 'sha-new'),
    ).toThrow('exceed Number.MAX_SAFE_INTEGER');
  });

  it('rejects when buildId is retained on a non-latest release', () => {
    const descriptors = [
      { ...validReleaseDescriptor, releaseNumber: 1, buildId: 'sha1' },
      { ...validReleaseDescriptor, releaseNumber: 2, buildId: 'sha2' },
    ];

    expect(() => resolvePublicationDecision(descriptors, 2, 'sha1')).toThrow(
      'is already retained on release 1, which is not the latest release (2)',
    );
  });
});

describe('resolvePublicationPlan', () => {
  let channelBaseDir = '';
  let updatesDir = '';
  let releasesDir = '';

  beforeEach(() => {
    channelBaseDir = mkdtempSync(join(tmpdir(), 'release-channel-'));
    updatesDir = join(channelBaseDir, 'updates');
    releasesDir = join(updatesDir, 'releases');
  });

  afterEach(() => {
    rmSync(channelBaseDir, { recursive: true, force: true });
  });

  function writeRetainedRelease(releaseNumber, buildId) {
    mkdirSync(releasesDir, { recursive: true });
    mkdirSync(join(channelBaseDir, 'assets'), { recursive: true });

    const assetRelPath = `assets/app-${releaseNumber}.js`;
    const assetPath = join(channelBaseDir, assetRelPath);
    const assetContent = `asset-content-${releaseNumber}`;
    writeFileSync(assetPath, assetContent);

    const indexContent = `<html>${releaseNumber}</html>`;
    mkdirSync(join(releasesDir, String(releaseNumber)), { recursive: true });
    writeFileSync(join(releasesDir, String(releaseNumber), 'index.html'), indexContent);

    const descriptor = {
      ...validReleaseDescriptor,
      releaseNumber,
      buildId,
      indexSha256: computeContentSha256(Buffer.from(indexContent, 'utf8')),
      indexByteSize: Buffer.byteLength(indexContent),
      files: [
        {
          path: assetRelPath,
          sha256: computeFileSha256(assetPath),
          byteSize: Buffer.byteLength(assetContent),
        },
      ],
    };
    writeFileSync(join(releasesDir, `${releaseNumber}.json`), JSON.stringify(descriptor));
    return descriptor;
  }

  it('resolves publish with releaseNumber 1 for an empty retained tree', () => {
    expect(resolvePublicationPlan(releasesDir, updatesDir, 'sha1', channelBaseDir)).toEqual({
      kind: 'publish',
      nextReleaseNumber: 1,
      descriptors: [],
    });
  });

  it('resolves publish when buildId is absent from every retained descriptor', () => {
    writeRetainedRelease(1, 'sha1');
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 1 }));

    const plan = resolvePublicationPlan(releasesDir, updatesDir, 'sha2', channelBaseDir);
    expect(plan.kind).toBe('publish');
    expect(plan.nextReleaseNumber).toBe(2);
  });

  it('resolves a zero-write no-op when buildId equals the unique latest descriptor buildId', () => {
    writeRetainedRelease(1, 'sha1');
    const latest = writeRetainedRelease(2, 'sha2');
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    const plan = resolvePublicationPlan(releasesDir, updatesDir, 'sha2', channelBaseDir);
    expect(plan).toEqual({ kind: 'no-op', descriptor: latest });
  });

  it('rejects a latest-build no-op when retained content is corrupt', () => {
    writeRetainedRelease(1, 'sha1');
    writeRetainedRelease(2, 'sha2');
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));
    writeFileSync(join(channelBaseDir, 'assets', 'app-2.js'), 'tampered-content');

    expect(() => resolvePublicationPlan(releasesDir, updatesDir, 'sha2', channelBaseDir)).toThrow(
      'byte size mismatch',
    );
  });

  it('rejects when buildId is retained on a non-latest release', () => {
    writeRetainedRelease(1, 'sha1');
    writeRetainedRelease(2, 'sha2');
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    expect(() => resolvePublicationPlan(releasesDir, updatesDir, 'sha1', channelBaseDir)).toThrow(
      'is already retained on release 1, which is not the latest release (2)',
    );
  });

  it('rejects when the retained tree has a duplicate buildId, even when the incoming buildId matches neither', () => {
    writeRetainedRelease(1, 'sha1');
    writeRetainedRelease(2, 'sha1');
    writeFileSync(join(updatesDir, 'latest.json'), JSON.stringify({ releaseNumber: 2 }));

    expect(() => resolvePublicationPlan(releasesDir, updatesDir, 'sha3', channelBaseDir)).toThrow(
      'share the same buildId',
    );
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
