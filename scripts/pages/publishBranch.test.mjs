import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async () => {}),
}));

const { withGhPagesBranch } = await import('./lib/ghPagesBranch.mjs');
const { publishBranch } = await import('./publishBranch.mjs');

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
  vi.mocked(withGhPagesBranch).mockClear();
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('publishBranch validation', () => {
  it('throws before git operations when distDir does not exist', async () => {
    await expect(
      publishBranch(['--dist', '/nonexistent/dist-12345', '--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('dist directory does not exist');
  });

  it('throws when --dist argument is missing', async () => {
    await expect(
      publishBranch(['--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --slug argument is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when the slug is invalid', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', '../etc'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Invalid branch slug');
  });

  it('throws when the slug is a reserved namespace', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'pr'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('is reserved');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'develop'], {
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });

  it('throws when PAGES_REPOSITORY is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'develop'], {
        GITHUB_TOKEN: 'token',
      }),
    ).rejects.toThrow('PAGES_REPOSITORY is required');
  });
});

describe('publishBranch target repository', () => {
  it('publishes to PAGES_REPOSITORY and ignores GITHUB_REPOSITORY', async () => {
    await publishBranch(['--dist', distDir, '--slug', 'develop'], {
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
