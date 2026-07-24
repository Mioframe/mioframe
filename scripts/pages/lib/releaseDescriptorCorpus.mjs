// Shared valid/invalid release-descriptor corpus executed against both the runtime validator
// (`src/shared/service/appUpdate/releaseCache.ts`'s `isSemanticallyValidReleaseDescriptor`,
// combined with its `releaseDescriptorSchema`) and the publisher's retained-descriptor validator
// (`stableRelease.mjs`'s `isValidReleaseDescriptor`), so the two implementations cannot drift into
// accepting or rejecting different descriptors. Plain data only — no imports — so it loads
// identically from a Node `.test.mjs` file and a browser-facing `.test.ts` file.

const releaseId = 'a'.repeat(40);
const indexUrl = `/updates/releases/${releaseId}/index.html`;

const baseDescriptor = () => ({
  schemaVersion: 2,
  releaseId,
  releaseSequence: 1,
  appVersion: '1.0.0',
  buildId: releaseId.slice(0, 7),
  buildDate: '2026-07-23T00:00:00.000Z',
  indexUrl,
  files: [
    { url: indexUrl, byteSize: 10, sha256: 'a'.repeat(64) },
    { url: '/assets/app.js', byteSize: 20, sha256: 'b'.repeat(64) },
  ],
});

export const validReleaseDescriptors = [
  { name: 'minimal valid descriptor', value: baseDescriptor() },
  {
    name: 'descriptor with multiple asset files',
    value: {
      ...baseDescriptor(),
      files: [
        ...baseDescriptor().files,
        { url: '/assets/app.css', byteSize: 5, sha256: 'c'.repeat(64) },
      ],
    },
  },
  {
    name: 'descriptor with a nested asset path',
    value: {
      ...baseDescriptor(),
      files: [
        ...baseDescriptor().files,
        { url: '/assets/vendor/lib.js', byteSize: 3, sha256: 'd'.repeat(64) },
      ],
    },
  },
];

export const invalidReleaseDescriptors = [
  { name: 'missing files array', value: { ...baseDescriptor(), files: undefined } },
  { name: 'empty files array', value: { ...baseDescriptor(), files: [] } },
  {
    name: 'non-canonical indexUrl naming another release id',
    value: { ...baseDescriptor(), indexUrl: '/updates/releases/wrong/index.html' },
  },
  {
    name: 'index url with a query string',
    value: { ...baseDescriptor(), indexUrl: `${indexUrl}?x=1` },
  },
  {
    name: 'index url with a hash fragment',
    value: { ...baseDescriptor(), indexUrl: `${indexUrl}#frag` },
  },
  {
    name: 'index url with a literal traversal segment',
    value: { ...baseDescriptor(), indexUrl: `/updates/releases/${releaseId}/../index.html` },
  },
  {
    name: 'index url with a percent-encoded traversal segment',
    value: { ...baseDescriptor(), indexUrl: `/updates/releases/${releaseId}/%2e%2e/index.html` },
  },
  {
    name: 'index url with a percent-encoded path separator',
    value: { ...baseDescriptor(), indexUrl: `/updates/releases/${releaseId}%2findex.html` },
  },
  {
    name: 'file url outside /assets/',
    value: {
      ...baseDescriptor(),
      files: [
        baseDescriptor().files[0],
        { url: '/evil/app.js', byteSize: 1, sha256: 'e'.repeat(64) },
      ],
    },
  },
  {
    name: 'duplicate file urls',
    value: {
      ...baseDescriptor(),
      files: [baseDescriptor().files[0], baseDescriptor().files[1], baseDescriptor().files[1]],
    },
  },
  {
    name: 'no file matches the canonical index',
    value: {
      ...baseDescriptor(),
      files: [{ url: '/assets/app.js', byteSize: 1, sha256: 'f'.repeat(64) }],
    },
  },
  {
    name: 'two files both claim the canonical index',
    value: {
      ...baseDescriptor(),
      files: [baseDescriptor().files[0], { ...baseDescriptor().files[0] }],
    },
  },
  {
    name: 'file with an invalid sha256',
    value: {
      ...baseDescriptor(),
      files: [baseDescriptor().files[0], { url: '/assets/app.js', byteSize: 1, sha256: 'not-hex' }],
    },
  },
  {
    name: 'file with a negative byteSize',
    value: {
      ...baseDescriptor(),
      files: [
        baseDescriptor().files[0],
        { url: '/assets/app.js', byteSize: -1, sha256: 'a'.repeat(64) },
      ],
    },
  },
  { name: 'wrong schemaVersion', value: { ...baseDescriptor(), schemaVersion: 1 } },
  { name: 'zero release sequence', value: { ...baseDescriptor(), releaseSequence: 0 } },
  { name: 'empty appVersion', value: { ...baseDescriptor(), appVersion: '' } },
  { name: 'invalid buildDate', value: { ...baseDescriptor(), buildDate: 'not-a-date' } },
  { name: 'empty buildId', value: { ...baseDescriptor(), buildId: '' } },
];
