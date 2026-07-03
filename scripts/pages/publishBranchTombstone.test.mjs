import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async ({ fn }) => {
    await fn(workDir);
  }),
}));

const { withGhPagesBranch } = await import('./lib/ghPagesBranch.mjs');
const { publishBranchTombstone } = await import('./publishBranchTombstone.mjs');

let workDir = '';
let outputFile = '';

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), 'pages-work-'));
  outputFile = join(mkdtempSync(join(tmpdir(), 'pages-output-')), 'github-output.txt');
  vi.mocked(withGhPagesBranch).mockClear();
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
  rmSync(outputFile, { force: true });
});

describe('publishBranchTombstone argument validation', () => {
  it('throws when --slug argument is missing', async () => {
    await expect(
      publishBranchTombstone([], { GITHUB_TOKEN: 'token', PAGES_REPOSITORY: 'owner/pages-repo' }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when the slug is invalid', async () => {
    await expect(
      publishBranchTombstone(['--slug', '../etc'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Invalid branch slug');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      publishBranchTombstone(['--slug', 'develop'], { PAGES_REPOSITORY: 'owner/pages-repo' }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });

  it('throws when PAGES_REPOSITORY is missing', async () => {
    await expect(
      publishBranchTombstone(['--slug', 'develop'], { GITHUB_TOKEN: 'token' }),
    ).rejects.toThrow('PAGES_REPOSITORY is required');
  });
});

describe('publishBranchTombstone target repository', () => {
  it('tombstones on PAGES_REPOSITORY and ignores GITHUB_REPOSITORY', async () => {
    await publishBranchTombstone(['--slug', 'develop'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'Mioframe/mioframe.github.io',
      // The reserved Actions default env var; must never be used as the
      // target Pages repository even when set to the source repository.
      GITHUB_REPOSITORY: 'Mioframe/mioframe',
    });

    expect(withGhPagesBranch).toHaveBeenCalledWith(
      expect.objectContaining({ repository: 'Mioframe/mioframe.github.io' }),
    );
  });
});

describe('publishBranchTombstone behavior', () => {
  it('is a no-op when the branch slot does not exist', async () => {
    const tombstoned = await publishBranchTombstone(['--slug', 'develop'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(tombstoned).toBe(false);
    expect(readFileSync(outputFile, 'utf8')).toBe('tombstoned=false\n');
  });

  it('replaces an existing branch slot with tombstone content', async () => {
    mkdirSync(join(workDir, 'branch', 'develop'), { recursive: true });
    writeFileSync(join(workDir, 'branch', 'develop', 'index.html'), '<old develop app/>');
    writeFileSync(join(workDir, 'branch', 'develop', 'sw.js'), '// old sw');

    const tombstoned = await publishBranchTombstone(['--slug', 'develop'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
      GITHUB_OUTPUT: outputFile,
    });

    expect(tombstoned).toBe(true);
    expect(readFileSync(outputFile, 'utf8')).toBe('tombstoned=true\n');

    const html = readFileSync(join(workDir, 'branch', 'develop', 'index.html'), 'utf8');
    expect(html).toContain('removed');
    expect(html).not.toContain('old develop app');

    const sw = readFileSync(join(workDir, 'branch', 'develop', 'sw.js'), 'utf8');
    expect(sw).toContain('branch-develop-');

    const manifest = JSON.parse(
      readFileSync(join(workDir, 'branch', 'develop', 'manifest.webmanifest'), 'utf8'),
    );
    expect(manifest.scope).toBe('/branch/develop/');

    const deployment = JSON.parse(
      readFileSync(join(workDir, 'branch', 'develop', 'deployment.json'), 'utf8'),
    );
    expect(deployment.tombstone).toBe(true);
    expect(deployment.channelId).toBe('develop');
  });

  it('does not modify other branch slots or stable root', async () => {
    mkdirSync(join(workDir, 'branch', 'develop'), { recursive: true });
    writeFileSync(join(workDir, 'branch', 'develop', 'index.html'), '<app/>');
    mkdirSync(join(workDir, 'branch', 'other'), { recursive: true });
    writeFileSync(join(workDir, 'branch', 'other', 'index.html'), '<other/>');
    writeFileSync(join(workDir, 'index.html'), '<stable/>');

    await publishBranchTombstone(['--slug', 'develop'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
    });

    expect(readFileSync(join(workDir, 'branch', 'other', 'index.html'), 'utf8')).toBe('<other/>');
    expect(readFileSync(join(workDir, 'index.html'), 'utf8')).toBe('<stable/>');
  });

  it('does not leave a temporary tombstone build directory behind', async () => {
    mkdirSync(join(workDir, 'branch', 'develop'), { recursive: true });
    writeFileSync(join(workDir, 'branch', 'develop', 'index.html'), '<app/>');

    const tmpEntriesBefore = new Set(
      readdirSync(tmpdir()).filter((name) => name.startsWith('branch-tombstone-')),
    );

    await publishBranchTombstone(['--slug', 'develop'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
    });

    const tmpEntriesAfter = readdirSync(tmpdir()).filter((name) =>
      name.startsWith('branch-tombstone-'),
    );

    expect(tmpEntriesAfter.filter((name) => !tmpEntriesBefore.has(name))).toEqual([]);
  });

  it('removes the temporary tombstone dist directory even when publish fails after it is created', async () => {
    mkdirSync(join(workDir, 'branch', 'develop'), { recursive: true });
    writeFileSync(join(workDir, 'branch', 'develop', 'index.html'), '<app/>');

    const tmpEntriesBefore = new Set(
      readdirSync(tmpdir()).filter((name) => name.startsWith('branch-tombstone-')),
    );

    vi.mocked(withGhPagesBranch).mockImplementationOnce(async ({ fn }) => {
      // Simulate applyBranchPublish having already created the temp dist dir
      // (via fn) before a later publish step (e.g. git push) fails.
      await fn(workDir);
      throw new Error('simulated publish failure after temp dir creation');
    });

    await expect(
      publishBranchTombstone(['--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('simulated publish failure after temp dir creation');

    const tmpEntriesAfter = readdirSync(tmpdir()).filter((name) =>
      name.startsWith('branch-tombstone-'),
    );

    expect(tmpEntriesAfter.filter((name) => !tmpEntriesBefore.has(name))).toEqual([]);
  });
});
