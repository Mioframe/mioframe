import { describe, expect, it } from 'vitest';

import { findExpiredTombstoneSlugs, isTombstoneExpired } from './tombstoneRetention.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-07-03T00:00:00.000Z');

describe('isTombstoneExpired', () => {
  it('returns false for a non-tombstone (live) record', () => {
    const metadata = {
      channel: 'branch',
      channelId: 'develop',
      buildDate: '2026-01-01T00:00:00.000Z',
    };
    expect(isTombstoneExpired(metadata, NOW, 14)).toBe(false);
  });

  it('returns false for a tombstone still within the retention window', () => {
    const buildDate = new Date(NOW - 5 * DAY_MS).toISOString();
    const metadata = { tombstone: true, buildDate };
    expect(isTombstoneExpired(metadata, NOW, 14)).toBe(false);
  });

  it('returns true for a tombstone past the retention window', () => {
    const buildDate = new Date(NOW - 15 * DAY_MS).toISOString();
    const metadata = { tombstone: true, buildDate };
    expect(isTombstoneExpired(metadata, NOW, 14)).toBe(true);
  });

  it('returns true exactly at the retention boundary', () => {
    const buildDate = new Date(NOW - 14 * DAY_MS).toISOString();
    const metadata = { tombstone: true, buildDate };
    expect(isTombstoneExpired(metadata, NOW, 14)).toBe(true);
  });

  it('returns false when metadata is missing', () => {
    expect(isTombstoneExpired(undefined, NOW, 14)).toBe(false);
  });

  it('returns false when buildDate is unparseable', () => {
    const metadata = { tombstone: true, buildDate: 'not-a-date' };
    expect(isTombstoneExpired(metadata, NOW, 14)).toBe(false);
  });
});

describe('findExpiredTombstoneSlugs', () => {
  function makeDeps(files) {
    return {
      existsSync: (path) => path in files || path.endsWith('/branch'),
      readdirSync: () =>
        Object.keys(files).map((name) => ({
          name: name.split('/').at(-2),
          isDirectory: () => true,
        })),
      readFileSync: (path) => {
        if (!(path in files)) throw new Error(`ENOENT: ${path}`);
        return files[path];
      },
    };
  }

  it('returns branch slugs whose tombstone has expired', () => {
    const expiredDate = new Date(NOW - 20 * DAY_MS).toISOString();
    const freshDate = new Date(NOW - 1 * DAY_MS).toISOString();
    const deps = makeDeps({
      '/work/branch/old-feature/deployment.json': JSON.stringify({
        tombstone: true,
        buildDate: expiredDate,
      }),
      '/work/branch/develop/deployment.json': JSON.stringify({
        channel: 'branch',
        channelId: 'develop',
        buildDate: freshDate,
      }),
      '/work/branch/recent-tombstone/deployment.json': JSON.stringify({
        tombstone: true,
        buildDate: freshDate,
      }),
    });

    const expired = findExpiredTombstoneSlugs({
      workDir: '/work',
      now: NOW,
      retentionDays: 14,
      deps,
    });

    expect(expired).toEqual(['old-feature']);
  });

  it('returns an empty array when the branch directory does not exist', () => {
    const deps = {
      existsSync: () => false,
      readdirSync: () => {
        throw new Error('should not be called');
      },
      readFileSync: () => {
        throw new Error('should not be called');
      },
    };

    expect(
      findExpiredTombstoneSlugs({ workDir: '/work', now: NOW, retentionDays: 14, deps }),
    ).toEqual([]);
  });

  it('skips entries without a deployment.json', () => {
    const deps = {
      existsSync: (path) => path === '/work/branch',
      readdirSync: () => [{ name: 'no-metadata', isDirectory: () => true }],
      readFileSync: () => {
        throw new Error('should not be called');
      },
    };

    expect(
      findExpiredTombstoneSlugs({ workDir: '/work', now: NOW, retentionDays: 14, deps }),
    ).toEqual([]);
  });

  it('skips entries with unparseable deployment.json', () => {
    const deps = {
      existsSync: (path) => path === '/work/branch' || path.endsWith('deployment.json'),
      readdirSync: () => [{ name: 'broken', isDirectory: () => true }],
      readFileSync: () => 'not json',
    };

    expect(
      findExpiredTombstoneSlugs({ workDir: '/work', now: NOW, retentionDays: 14, deps }),
    ).toEqual([]);
  });
});
