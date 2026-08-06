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
  releaseNumber: 1,
  appVersion: '1.2.3',
  buildId: 'abcdef0123456789',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexSha256: SHA256_OF_EMPTY_STRING,
  indexByteSize: 2048,
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
    name: 'non-integer releaseNumber',
    descriptor: { ...validReleaseDescriptor, releaseNumber: 1.5 },
  },
  {
    name: 'non-positive releaseNumber',
    descriptor: { ...validReleaseDescriptor, releaseNumber: 0 },
  },
  {
    name: 'unsafe releaseNumber (exceeds Number.MAX_SAFE_INTEGER)',
    descriptor: { ...validReleaseDescriptor, releaseNumber: Number.MAX_SAFE_INTEGER + 1 },
  },
  {
    name: 'string releaseNumber',
    descriptor: { ...validReleaseDescriptor, releaseNumber: '1' },
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
  {
    name: 'file path under the reserved updates/ prefix',
    descriptor: {
      ...validReleaseDescriptor,
      files: [
        {
          path: 'updates/releases/1/index.html',
          sha256: SHA256_OF_EMPTY_STRING,
          byteSize: 1,
        },
      ],
    },
  },
  {
    name: 'uppercase sha256 (must be lowercase, not merely valid hex)',
    descriptor: {
      ...validReleaseDescriptor,
      files: [
        {
          path: 'assets/app.js',
          sha256: SHA256_OF_EMPTY_STRING.toUpperCase(),
          byteSize: 1,
        },
      ],
    },
  },
  {
    name: 'malformed indexSha256',
    descriptor: { ...validReleaseDescriptor, indexSha256: 'not-a-hash' },
  },
  {
    name: 'uppercase indexSha256 (must be lowercase, not merely valid hex)',
    descriptor: { ...validReleaseDescriptor, indexSha256: SHA256_OF_EMPTY_STRING.toUpperCase() },
  },
  {
    name: 'non-integer indexByteSize',
    descriptor: { ...validReleaseDescriptor, indexByteSize: 1.5 },
  },
  {
    name: 'negative indexByteSize',
    descriptor: { ...validReleaseDescriptor, indexByteSize: -1 },
  },
  {
    name: 'duplicate file paths (even with identical content)',
    descriptor: {
      ...validReleaseDescriptor,
      files: [
        { path: 'assets/app-3f2a1c.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1024 },
        { path: 'assets/app-3f2a1c.js', sha256: SHA256_OF_EMPTY_STRING, byteSize: 1024 },
      ],
    },
  },
];

/**
 * Shared canonical-release-path acceptance/rejection corpus.
 *
 * Imported by both the Node publisher's structural validator
 * (`releaseDescriptor.test.mjs`) and the runtime zod schema
 * (`src/shared/service/appUpdate/contracts.test.ts`), so
 * `isCanonicalReleasePath` in each independent implementation is proven to
 * accept and reject the exact same paths — see the managed pinned
 * application updates feature's canonical release-path correction.
 */
export const canonicalReleasePathCases = [
  { name: 'empty path', path: '', valid: false },
  { name: 'leading slash', path: '/assets/app.js', valid: false },
  { name: 'trailing slash', path: 'assets/app.js/', valid: false },
  { name: 'duplicate separator', path: 'assets//app.js', valid: false },
  { name: 'current-directory segment', path: 'assets/./app.js', valid: false },
  { name: 'parent-directory segment', path: 'assets/../app.js', valid: false },
  { name: 'backslash', path: 'assets\\app.js', valid: false },
  { name: 'percent-encoded lowercase letter', path: 'assets/%61pp.js', valid: false },
  { name: 'percent-encoded dot segment', path: 'assets/%2e%2e/app.js', valid: false },
  { name: 'raw space (a URL-normalizable alias)', path: 'assets/a b.js', valid: false },
  { name: 'query string', path: 'assets/app.js?x=1', valid: false },
  { name: 'fragment', path: 'assets/app.js#section', valid: false },
  {
    name: 'reserved updates/ tree (descriptor path)',
    path: 'updates/releases/1.json',
    valid: false,
  },
  {
    name: "reserved updates/ tree (a release's own archived index)",
    path: 'updates/releases/1/index.html',
    valid: false,
  },
  { name: 'bare "updates" segment', path: 'updates', valid: false },
  { name: 'canonical Vite hashed asset', path: 'assets/app-a1b2c3.js', valid: true },
  {
    name: 'canonical Vite asset with underscore and hyphen',
    path: 'assets/icon_test-42.svg',
    valid: true,
  },
  { name: 'canonical nested asset', path: 'assets/nested/file.css', valid: true },
];
