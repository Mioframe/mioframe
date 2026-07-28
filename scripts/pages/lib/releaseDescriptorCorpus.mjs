/**
 * Shared valid/invalid `ReleaseDescriptor` fixture corpus.
 *
 * Imported by both the Node publisher's structural validator
 * (`releaseDescriptor.test.mjs`) and the runtime zod schema
 * (`src/shared/service/appUpdate/contracts.test.ts`), so the two independent
 * validators are proven to accept and reject the exact same descriptors.
 * Kept dependency-free so both Vitest projects can import it directly.
 */

const SHA256_OF_EMPTY_STRING = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/** A structurally valid `ReleaseDescriptor`. */
export const validReleaseDescriptor = {
  schemaVersion: 1,
  releaseId: '018f5b3a-6b7a-7c9e-9c1a-0f2b3c4d5e6f',
  releaseSequence: 1,
  appVersion: '1.2.3',
  buildId: 'abcdef0123456789',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexUrl: '/updates/releases/018f5b3a-6b7a-7c9e-9c1a-0f2b3c4d5e6f/index.html',
  files: [{ path: 'assets/app-3f2a1c.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1024 }],
};

/** Named structurally invalid `ReleaseDescriptor` variants, each violating exactly one rule. */
export const invalidReleaseDescriptors = [
  {
    name: 'empty files list',
    descriptor: { ...validReleaseDescriptor, files: [] },
  },
  {
    name: 'unsupported schemaVersion',
    descriptor: { ...validReleaseDescriptor, schemaVersion: 999 },
  },
  {
    name: 'non-integer releaseSequence',
    descriptor: { ...validReleaseDescriptor, releaseSequence: 1.5 },
  },
  {
    name: 'non-positive releaseSequence',
    descriptor: { ...validReleaseDescriptor, releaseSequence: 0 },
  },
  {
    name: 'empty releaseId',
    descriptor: { ...validReleaseDescriptor, releaseId: '' },
  },
  {
    name: 'non-ISO buildDate',
    descriptor: { ...validReleaseDescriptor, buildDate: '2026-07-24' },
  },
  {
    name: 'malformed sha256',
    descriptor: {
      ...validReleaseDescriptor,
      files: [{ path: 'assets/app.js', sha256: 'not-a-hash', byteSize: 1 }],
    },
  },
  {
    name: 'negative byteSize',
    descriptor: {
      ...validReleaseDescriptor,
      files: [{ path: 'assets/app.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: -1 }],
    },
  },
  {
    name: 'path traversal',
    descriptor: {
      ...validReleaseDescriptor,
      files: [{ path: '../assets/app.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1 }],
    },
  },
  {
    name: 'absolute path',
    descriptor: {
      ...validReleaseDescriptor,
      files: [{ path: '/assets/app.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1 }],
    },
  },
  {
    name: 'query string in path',
    descriptor: {
      ...validReleaseDescriptor,
      files: [{ path: 'assets/app.js?x=1', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1 }],
    },
  },
];
