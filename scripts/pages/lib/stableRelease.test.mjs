import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import toolingConfig from '../../../config/tooling.json' with { type: 'json' };
import { applyManagedStablePublish, buildStableReleasePublication } from './stableRelease.mjs';

let workDir;
let distDir;
const sha = 'a'.repeat(40);
const placeholderToken = JSON.stringify(toolingConfig.release.releaseSequencePlaceholder);

const write = (root, path, value) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), value);
};

const makeDist = (asset = 'asset') => {
  write(distDir, 'index.html', '<script src="/assets/app.js"></script>');
  write(distDir, 'assets/app.js', asset);
  write(distDir, 'sw.js', `const __RELEASE_SEQUENCE__=${placeholderToken};`);
  write(distDir, 'manifest.webmanifest', '{}');
  write(
    distDir,
    'deployment.json',
    JSON.stringify({
      channel: 'stable',
      channelId: 'main',
      sha,
      appVersion: '1.2.3',
      buildDate: '2026-07-23T00:00:00.000Z',
    }),
  );
};

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'stable-work-'));
  distDir = mkdtempSync(join(tmpdir(), 'stable-dist-'));
  makeDist();
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(distDir, { recursive: true, force: true });
});

describe('stable release publication', () => {
  it('allocates monotonically increasing sequences and preserves an idempotent release sequence', () => {
    applyManagedStablePublish(workDir, distDir);
    expect(
      JSON.parse(readFileSync(join(workDir, 'updates/latest.json'), 'utf8')).release
        .releaseSequence,
    ).toBe(1);

    expect(applyManagedStablePublish(workDir, distDir).identity.releaseSequence).toBe(1);

    write(
      distDir,
      'deployment.json',
      JSON.stringify({
        channel: 'stable',
        channelId: 'main',
        sha: 'b'.repeat(40),
        appVersion: '1.2.3',
        buildDate: '2026-07-23T01:00:00.000Z',
      }),
    );
    expect(applyManagedStablePublish(workDir, distDir).identity.releaseSequence).toBe(2);
  });

  it('builds a full-SHA descriptor covering immutable index and hashed assets', () => {
    const publication = buildStableReleasePublication(distDir);
    expect(publication.releaseId).toBe(sha);
    expect(publication.descriptor.files.map(({ url }) => url)).toEqual([
      '/assets/app.js',
      `/updates/releases/${sha}/index.html`,
    ]);
  });

  it('preserves prior releases and publishes latest only after immutable content exists', () => {
    const previousId = 'e'.repeat(40);
    write(
      workDir,
      `updates/releases/${previousId}.json`,
      JSON.stringify({
        schemaVersion: 2,
        releaseId: previousId,
        releaseSequence: 9,
        appVersion: '0.9.0',
        buildId: previousId.slice(0, 7),
        buildDate: '2026-07-20T00:00:00.000Z',
        indexUrl: `/updates/releases/${previousId}/index.html`,
        files: [
          {
            url: `/updates/releases/${previousId}/index.html`,
            byteSize: 3,
            sha256: 'a'.repeat(64),
          },
        ],
      }),
    );
    write(workDir, `updates/releases/${previousId}/index.html`, 'old');
    applyManagedStablePublish(workDir, distDir);
    expect(readFileSync(join(workDir, `updates/releases/${previousId}/index.html`), 'utf8')).toBe(
      'old',
    );
    const latest = JSON.parse(readFileSync(join(workDir, 'updates/latest.json'), 'utf8'));
    expect(readFileSync(join(workDir, latest.descriptorUrl), 'utf8')).toContain(sha);
    expect(readFileSync(join(workDir, `updates/releases/${sha}/index.html`), 'utf8')).toContain(
      'app.js',
    );
  });

  it('is idempotent for identical content and rejects an existing release with different content', () => {
    applyManagedStablePublish(workDir, distDir);
    expect(() => applyManagedStablePublish(workDir, distDir)).not.toThrow();
    write(workDir, `updates/releases/${sha}/index.html`, 'different');
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('collision');
  });

  it('remains forward after latest.json is rolled back to an older retained release', () => {
    applyManagedStablePublish(workDir, distDir); // 'a', sequence 1

    write(
      distDir,
      'deployment.json',
      JSON.stringify({
        channel: 'stable',
        channelId: 'main',
        sha: 'b'.repeat(40),
        appVersion: '1.2.3',
        buildDate: '2026-07-23T01:00:00.000Z',
      }),
    );
    applyManagedStablePublish(workDir, distDir); // 'b', sequence 2

    // Roll the pointer back to 'a' while 'b' remains fully retained on disk.
    const rolledBack = JSON.stringify({
      schemaVersion: 2,
      release: {
        releaseId: sha,
        releaseSequence: 1,
        appVersion: '1.2.3',
        buildId: sha.slice(0, 7),
        buildDate: '2026-07-23T00:00:00.000Z',
      },
      descriptorUrl: `/updates/releases/${sha}.json`,
    });
    write(workDir, 'updates/latest.json', rolledBack);

    write(
      distDir,
      'deployment.json',
      JSON.stringify({
        channel: 'stable',
        channelId: 'main',
        sha: 'd'.repeat(40),
        appVersion: '1.3.0',
        buildDate: '2026-07-23T02:00:00.000Z',
      }),
    );
    const published = applyManagedStablePublish(workDir, distDir);
    expect(published.identity.releaseSequence).toBe(3);
    expect(
      JSON.parse(readFileSync(join(workDir, 'updates/latest.json'), 'utf8')).release
        .releaseSequence,
    ).toBe(3);
  });

  it('republishes a retained non-latest release idempotently at its original sequence', () => {
    applyManagedStablePublish(workDir, distDir); // 'a', sequence 1
    write(
      distDir,
      'deployment.json',
      JSON.stringify({
        channel: 'stable',
        channelId: 'main',
        sha: 'b'.repeat(40),
        appVersion: '1.2.3',
        buildDate: '2026-07-23T01:00:00.000Z',
      }),
    );
    applyManagedStablePublish(workDir, distDir); // 'b', sequence 2, now latest

    write(
      distDir,
      'deployment.json',
      JSON.stringify({
        channel: 'stable',
        channelId: 'main',
        sha,
        appVersion: '1.2.3',
        buildDate: '2026-07-23T00:00:00.000Z',
      }),
    );
    const republished = applyManagedStablePublish(workDir, distDir);
    expect(republished.identity.releaseSequence).toBe(1);
  });

  it('rejects a duplicate sequence already owned by a different retained release id', () => {
    write(
      workDir,
      `updates/releases/${'a'.repeat(40)}.json`,
      JSON.stringify({
        schemaVersion: 2,
        releaseId: 'a'.repeat(40),
        releaseSequence: 5,
        appVersion: '1.0.0',
        buildId: 'aaaaaaa',
        buildDate: '2026-07-23T00:00:00.000Z',
        indexUrl: `/updates/releases/${'a'.repeat(40)}/index.html`,
        files: [
          {
            url: `/updates/releases/${'a'.repeat(40)}/index.html`,
            byteSize: 3,
            sha256: 'a'.repeat(64),
          },
        ],
      }),
    );
    write(
      workDir,
      `updates/releases/${'b'.repeat(40)}.json`,
      JSON.stringify({
        schemaVersion: 2,
        releaseId: 'b'.repeat(40),
        releaseSequence: 5,
        appVersion: '1.0.0',
        buildId: 'bbbbbbb',
        buildDate: '2026-07-23T01:00:00.000Z',
        indexUrl: `/updates/releases/${'b'.repeat(40)}/index.html`,
        files: [
          {
            url: `/updates/releases/${'b'.repeat(40)}/index.html`,
            byteSize: 3,
            sha256: 'b'.repeat(64),
          },
        ],
      }),
    );
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('collision');
  });

  it('fails publication on a malformed retained descriptor instead of silently skipping it', () => {
    write(workDir, `updates/releases/${'e'.repeat(40)}.json`, 'not json');
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('not valid JSON');
  });

  it('fails publication on a retained descriptor with an invalid schema instead of silently skipping it', () => {
    write(workDir, `updates/releases/${'e'.repeat(40)}.json`, '{}');
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('invalid schema');
  });

  it('fails publication when a retained descriptor filename does not match its own release id', () => {
    write(
      workDir,
      'updates/releases/mismatched.json',
      JSON.stringify({
        schemaVersion: 2,
        releaseId: 'e'.repeat(40),
        releaseSequence: 9,
        appVersion: '0.9.0',
        buildId: 'eeeeeee',
        buildDate: '2026-07-20T00:00:00.000Z',
        indexUrl: `/updates/releases/${'e'.repeat(40)}/index.html`,
        files: [
          {
            url: `/updates/releases/${'e'.repeat(40)}/index.html`,
            byteSize: 3,
            sha256: 'e'.repeat(64),
          },
        ],
      }),
    );
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('does not match');
  });

  it('fails publication when two retained descriptor files claim the same release id', () => {
    const duplicateId = 'e'.repeat(40);
    const descriptorFor = (buildDate) =>
      JSON.stringify({
        schemaVersion: 2,
        releaseId: duplicateId,
        releaseSequence: 9,
        appVersion: '0.9.0',
        buildId: duplicateId.slice(0, 7),
        buildDate,
        indexUrl: `/updates/releases/${duplicateId}/index.html`,
        files: [],
      });
    write(
      workDir,
      `updates/releases/${duplicateId}.json`,
      descriptorFor('2026-07-20T00:00:00.000Z'),
    );
    write(workDir, 'updates/releases/duplicate.json', descriptorFor('2026-07-21T00:00:00.000Z'));
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow();
  });

  it('patches the compiled worker with the real allocated sequence instead of the build placeholder', () => {
    applyManagedStablePublish(workDir, distDir);
    const workerSource = readFileSync(join(workDir, 'sw.js'), 'utf8');
    expect(workerSource).toContain('__RELEASE_SEQUENCE__="1"');
    expect(workerSource).not.toContain(placeholderToken);
  });

  it('leaves an already-patched or placeholder-free compiled worker untouched', () => {
    write(distDir, 'sw.js', 'const __RELEASE_SEQUENCE__="already-patched";');
    expect(() => applyManagedStablePublish(workDir, distDir)).not.toThrow();
    expect(readFileSync(join(workDir, 'sw.js'), 'utf8')).toContain('already-patched');
  });

  it('leaves a dist directory with no compiled worker untouched', () => {
    rmSync(join(distDir, 'sw.js'));
    expect(() => applyManagedStablePublish(workDir, distDir)).not.toThrow();
  });

  it.each([
    ['missing files array', { files: undefined }],
    ['empty files array', { files: [] }],
    ['non-canonical indexUrl', { indexUrl: '/updates/releases/wrong/index.html' }],
    ['a file with an invalid sha256', { files: [{ url: 'a', byteSize: 1, sha256: 'nothex' }] }],
    [
      'a file with a negative byteSize',
      { files: [{ url: 'a', byteSize: -1, sha256: 'a'.repeat(64) }] },
    ],
    ['a non-string appVersion', { appVersion: 1 }],
    ['an invalid buildDate', { buildDate: 'not-a-date' }],
    ['two files claiming the canonical index', {}],
  ])('fails publication when a retained descriptor has %s', (_label, overrides) => {
    const releaseId = 'e'.repeat(40);
    const canonicalIndex = `/updates/releases/${releaseId}/index.html`;
    const base = {
      schemaVersion: 2,
      releaseId,
      releaseSequence: 9,
      appVersion: '0.9.0',
      buildId: releaseId.slice(0, 7),
      buildDate: '2026-07-20T00:00:00.000Z',
      indexUrl: canonicalIndex,
      files: [{ url: canonicalIndex, byteSize: 1, sha256: 'a'.repeat(64) }],
      ...overrides,
    };
    if (_label === 'two files claiming the canonical index') {
      base.files = [
        { url: canonicalIndex, byteSize: 1, sha256: 'a'.repeat(64) },
        { url: canonicalIndex, byteSize: 1, sha256: 'b'.repeat(64) },
      ];
    }
    write(workDir, `updates/releases/${releaseId}.json`, JSON.stringify(base));
    expect(() => applyManagedStablePublish(workDir, distDir)).toThrow('invalid schema');
  });

  it('fails the complete artifact size guard before changing the latest pointer', () => {
    const oldLatest = JSON.stringify({
      schemaVersion: 2,
      release: {
        releaseId: 'c'.repeat(40),
        releaseSequence: 7,
        appVersion: '1.0.0',
        buildId: 'ccccccc',
        buildDate: '2026-07-22T00:00:00.000Z',
      },
      descriptorUrl: `/updates/releases/${'c'.repeat(40)}.json`,
    });
    write(workDir, 'updates/latest.json', oldLatest);
    expect(() => applyManagedStablePublish(workDir, distDir, { sizeLimitBytes: 1 })).toThrow(
      'exceeds',
    );
    expect(readFileSync(join(workDir, 'updates/latest.json'), 'utf8')).toBe(oldLatest);
  });
});
