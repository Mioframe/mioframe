import { describe, expect, it } from 'vitest';
import { isSemanticallyValidReleaseDescriptor, validateReleaseMetadata } from './releaseCache';
import { releaseDescriptorSchema } from './contracts';
import {
  invalidReleaseDescriptors,
  validReleaseDescriptors,
} from '../../../../scripts/pages/lib/releaseDescriptorCorpus.mjs';

const release = {
  releaseId: 'a'.repeat(40),
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: 'aaaaaaa',
  buildDate: '2026-07-23T00:00:00.000Z',
};
const latest = {
  schemaVersion: 2 as const,
  release,
  descriptorUrl: `/updates/releases/${release.releaseId}.json`,
};
const descriptor = {
  schemaVersion: 2 as const,
  ...release,
  indexUrl: `/updates/releases/${release.releaseId}/index.html`,
  files: [
    {
      url: `/updates/releases/${release.releaseId}/index.html`,
      byteSize: 1,
      sha256: 'b'.repeat(64),
    },
    { url: '/assets/app.js', byteSize: 1, sha256: 'c'.repeat(64) },
  ],
};

describe('stable release metadata relationship', () => {
  it('accepts one canonical index and unique stable asset paths', () => {
    expect(validateReleaseMetadata(latest, descriptor, 'https://example.test').descriptor).toEqual(
      descriptor,
    );
  });

  it.each([
    ['sequence mismatch', { ...descriptor, releaseSequence: 2 }],
    ['duplicate file URL', { ...descriptor, files: [...descriptor.files, descriptor.files[1]] }],
    [
      'query alias',
      { ...descriptor, files: [{ ...descriptor.files[0], url: `${descriptor.indexUrl}?x=1` }] },
    ],
    [
      'foreign channel',
      { ...descriptor, files: [{ ...descriptor.files[0], url: '/pr/161/index.html' }] },
    ],
  ])('rejects %s', (_name, invalid) => {
    expect(() => validateReleaseMetadata(latest, invalid, 'https://example.test')).toThrow();
  });
});

describe('publisher/runtime release-descriptor validation parity', () => {
  const runtimeAccepts = (value: unknown): boolean => {
    const parsed = releaseDescriptorSchema.safeParse(value);
    return (
      parsed.success && isSemanticallyValidReleaseDescriptor(parsed.data, 'https://example.test')
    );
  };

  it.each(validReleaseDescriptors)('accepts: $name', ({ value }) => {
    expect(runtimeAccepts(value)).toBe(true);
  });

  it.each(invalidReleaseDescriptors)('rejects: $name', ({ value }) => {
    expect(runtimeAccepts(value)).toBe(false);
  });
});
