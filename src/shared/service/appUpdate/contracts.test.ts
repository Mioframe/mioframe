import { describe, expect, it } from 'vitest';
import { latestReleaseSchema, releaseDescriptorSchema } from './contracts';

const releaseId = 'a'.repeat(40);
const identity = {
  releaseId,
  appVersion: '1.2.3',
  buildId: 'abcdef0',
  buildDate: '2026-07-23T00:00:00.000Z',
};

describe('managed release metadata', () => {
  it('accepts a latest pointer and complete descriptor with SHA-256 file facts', () => {
    expect(
      latestReleaseSchema.parse({
        schemaVersion: 1,
        release: identity,
        descriptorUrl: `/updates/releases/${releaseId}.json`,
      }),
    ).toBeTruthy();
    expect(
      releaseDescriptorSchema.parse({
        schemaVersion: 1,
        ...identity,
        indexUrl: `/updates/releases/${releaseId}/index.html`,
        files: [{ url: '/assets/app.js', byteSize: 12, sha256: 'b'.repeat(64) }],
      }),
    ).toBeTruthy();
  });

  it('rejects truncated release identities and hashes', () => {
    expect(() => latestReleaseSchema.parse({ schemaVersion: 1, release: identity })).toThrow();
    expect(() =>
      releaseDescriptorSchema.parse({
        schemaVersion: 1,
        ...identity,
        indexUrl: '/updates/releases/a/index.html',
        files: [{ url: '/assets/app.js', byteSize: 12, sha256: 'short' }],
      }),
    ).toThrow();
  });
});
