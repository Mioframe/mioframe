import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async (options) => {
    await options.fn('/fake-work-dir');
  }),
}));
vi.mock('./lib/pagesFs.mjs', () => ({
  applyBranchPublish: vi.fn(),
}));
vi.mock('./lib/releasePublish.mjs', () => ({
  publishManagedRelease: vi.fn(() => ({ releaseNumber: 1 })),
}));

const { withGhPagesBranch } = await import('./lib/ghPagesBranch.mjs');
const { applyBranchPublish } = await import('./lib/pagesFs.mjs');
const { publishManagedRelease } = await import('./lib/releasePublish.mjs');
const { publishBranch } = await import('./publishBranch.mjs');

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
  vi.mocked(withGhPagesBranch).mockClear();
  vi.mocked(applyBranchPublish).mockClear();
  vi.mocked(publishManagedRelease).mockClear();
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

describe('publishBranch validation (ordinary, non-managed slug)', () => {
  it('throws before git operations when distDir does not exist', async () => {
    await expect(
      publishBranch(['--dist', '/nonexistent/dist-12345', '--slug', 'my-branch'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('dist directory does not exist');
  });

  it('throws when --dist argument is missing', async () => {
    await expect(
      publishBranch(['--slug', 'my-branch'], {
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
      publishBranch(['--dist', distDir, '--slug', 'my-branch'], {
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });

  it('throws when PAGES_REPOSITORY is missing', async () => {
    await expect(
      publishBranch(['--dist', distDir, '--slug', 'my-branch'], {
        GITHUB_TOKEN: 'token',
      }),
    ).rejects.toThrow('PAGES_REPOSITORY is required');
  });

  it('publishes to PAGES_REPOSITORY and ignores GITHUB_REPOSITORY', async () => {
    await publishBranch(['--dist', distDir, '--slug', 'my-branch'], {
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

  it('uses the ordinary unmanaged publish path, not the managed release publisher', async () => {
    await publishBranch(['--dist', distDir, '--slug', 'my-branch'], {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
    });

    expect(applyBranchPublish).toHaveBeenCalledWith('/fake-work-dir', distDir, 'my-branch');
    expect(publishManagedRelease).not.toHaveBeenCalled();
  });
});

describe('publishBranch validation (managed "develop" slug)', () => {
  it('throws when --app-version is missing', async () => {
    await expect(
      publishBranch(
        [
          '--dist',
          distDir,
          '--slug',
          'develop',
          '--build-id',
          'abc123',
          '--build-date',
          '2026-07-24T00:00:00.000Z',
        ],
        {
          GITHUB_TOKEN: 'token',
          PAGES_REPOSITORY: 'owner/pages-repo',
        },
      ),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --build-id is missing', async () => {
    await expect(
      publishBranch(
        [
          '--dist',
          distDir,
          '--slug',
          'develop',
          '--app-version',
          '1.2.3',
          '--build-date',
          '2026-07-24T00:00:00.000Z',
        ],
        {
          GITHUB_TOKEN: 'token',
          PAGES_REPOSITORY: 'owner/pages-repo',
        },
      ),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --build-date is missing', async () => {
    await expect(
      publishBranch(
        ['--dist', distDir, '--slug', 'develop', '--app-version', '1.2.3', '--build-id', 'abc123'],
        {
          GITHUB_TOKEN: 'token',
          PAGES_REPOSITORY: 'owner/pages-repo',
        },
      ),
    ).rejects.toThrow('Usage:');
  });

  it('publishes a managed develop release with the given app version, build id, and build date', async () => {
    await publishBranch(
      [
        '--dist',
        distDir,
        '--slug',
        'develop',
        '--app-version',
        '1.2.3',
        '--build-id',
        'abc123',
        '--build-date',
        '2026-07-24T00:00:00.000Z',
      ],
      { GITHUB_TOKEN: 'token', PAGES_REPOSITORY: 'owner/pages-repo' },
    );

    expect(publishManagedRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'develop',
        appVersion: '1.2.3',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    );
    expect(applyBranchPublish).not.toHaveBeenCalled();
  });
});
