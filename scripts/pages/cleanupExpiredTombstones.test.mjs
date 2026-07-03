import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async ({ fn }) => {
    await fn(workDir);
  }),
}));

const { cleanupExpiredTombstones } = await import('./cleanupExpiredTombstones.mjs');

let workDir = '';
let outputFile = '';

const DAY_MS = 24 * 60 * 60 * 1000;

function writeDeploymentJson(slug, metadata) {
  mkdirSync(join(workDir, 'branch', slug), { recursive: true });
  writeFileSync(join(workDir, 'branch', slug, 'deployment.json'), JSON.stringify(metadata));
  writeFileSync(join(workDir, 'branch', slug, 'index.html'), '<content/>');
}

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'pages-work-'));
  outputFile = join(mkdtempSync(join(tmpdir(), 'pages-output-')), 'github-output.txt');
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(outputFile, { force: true });
});

describe('cleanupExpiredTombstones argument validation', () => {
  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(cleanupExpiredTombstones([], { GITHUB_REPOSITORY: 'owner/repo' })).rejects.toThrow(
      'GITHUB_TOKEN is required',
    );
  });

  it('throws when GITHUB_REPOSITORY is missing', async () => {
    await expect(cleanupExpiredTombstones([], { GITHUB_TOKEN: 'token' })).rejects.toThrow(
      'GITHUB_REPOSITORY is required',
    );
  });
});

describe('cleanupExpiredTombstones behavior', () => {
  it('removes only expired tombstones, keeping live branches and fresh tombstones', async () => {
    writeDeploymentJson('expired-feature', {
      tombstone: true,
      buildDate: new Date(Date.now() - 20 * DAY_MS).toISOString(),
    });
    writeDeploymentJson('fresh-tombstone', {
      tombstone: true,
      buildDate: new Date(Date.now() - 1 * DAY_MS).toISOString(),
    });
    writeDeploymentJson('develop', {
      channel: 'branch',
      channelId: 'develop',
      buildDate: new Date(Date.now() - 100 * DAY_MS).toISOString(),
    });

    const removed = await cleanupExpiredTombstones(['--retention-days', '14'], {
      GITHUB_TOKEN: 'token',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(removed).toEqual(['expired-feature']);
    expect(readFileSync(outputFile, 'utf8')).toBe('removed-count=1\n');

    let expiredExists = true;
    try {
      readFileSync(join(workDir, 'branch', 'expired-feature', 'deployment.json'));
    } catch {
      expiredExists = false;
    }
    expect(expiredExists).toBe(false);

    expect(readFileSync(join(workDir, 'branch', 'fresh-tombstone', 'index.html'), 'utf8')).toBe(
      '<content/>',
    );
    expect(readFileSync(join(workDir, 'branch', 'develop', 'index.html'), 'utf8')).toBe(
      '<content/>',
    );
  });

  it('is a no-op and reports removed-count=0 when there is nothing expired', async () => {
    writeDeploymentJson('develop', {
      channel: 'branch',
      channelId: 'develop',
      buildDate: new Date().toISOString(),
    });

    const removed = await cleanupExpiredTombstones(['--retention-days', '14'], {
      GITHUB_TOKEN: 'token',
      GITHUB_REPOSITORY: 'owner/repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(removed).toEqual([]);
    expect(readFileSync(outputFile, 'utf8')).toBe('removed-count=0\n');
  });

  it('falls back to config/tooling.json retention days when --retention-days is not passed', async () => {
    writeDeploymentJson('just-under-default', {
      tombstone: true,
      buildDate: new Date(Date.now() - 13 * DAY_MS).toISOString(),
    });

    const removed = await cleanupExpiredTombstones([], {
      GITHUB_TOKEN: 'token',
      GITHUB_REPOSITORY: 'owner/repo',
    });

    expect(removed).toEqual([]);
  });
});
