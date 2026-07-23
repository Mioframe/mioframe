import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { applyManagedStablePublish, buildStableReleasePublication } from './stableRelease.mjs';

let workDir;
let distDir;
const sha = 'a'.repeat(40);

const write = (root, path, value) => {
  mkdirSync(join(root, path, '..'), { recursive: true });
  writeFileSync(join(root, path), value);
};

const makeDist = (asset = 'asset') => {
  write(distDir, 'index.html', '<script src="/assets/app.js"></script>');
  write(distDir, 'assets/app.js', asset);
  write(distDir, 'sw.js', 'controller');
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
    write(workDir, 'updates/releases/previous.json', '{}');
    write(workDir, 'updates/releases/previous/index.html', 'old');
    applyManagedStablePublish(workDir, distDir);
    expect(readFileSync(join(workDir, 'updates/releases/previous/index.html'), 'utf8')).toBe('old');
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
