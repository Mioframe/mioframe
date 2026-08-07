import { describe, expect, it } from 'vitest';

import {
  canonicalReleasePathCases,
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from './releaseDescriptorCorpus.mjs';
import {
  buildReleaseDescriptor,
  isCanonicalReleasePath,
  isPositiveSafeInteger,
  isValidReleaseDescriptor,
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
