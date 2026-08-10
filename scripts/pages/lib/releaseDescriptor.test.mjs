import { describe, expect, it } from 'vitest';

import { buildReleaseDescriptor, isValidReleaseDescriptor } from './releaseDescriptor.mjs';

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
