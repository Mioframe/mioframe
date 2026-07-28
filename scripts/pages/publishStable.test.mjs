import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lib/ghPagesBranch.mjs', () => ({
  withGhPagesBranch: vi.fn(async (options) => {
    await options.fn('/fake-work-dir');
  }),
}));
vi.mock('./lib/releasePublish.mjs', () => ({
  publishManagedRelease: vi.fn(() => ({ releaseId: 'r1', releaseSequence: 1 })),
}));

const { withGhPagesBranch } = await import('./lib/ghPagesBranch.mjs');
const { publishManagedRelease } = await import('./lib/releasePublish.mjs');
const { publishStable } = await import('./publishStable.mjs');

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
  vi.mocked(withGhPagesBranch).mockClear();
  vi.mocked(publishManagedRelease).mockClear();
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

const requiredFlags = (dist) => ['--dist', dist, '--app-version', '1.2.3', '--build-id', 'abc123'];

describe('publishStable argument validation', () => {
  it('throws before git operations when distDir does not exist', async () => {
    await expect(
      publishStable(requiredFlags('/nonexistent/dist-12345'), {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('dist directory does not exist');
  });

  it('throws when --dist argument is missing', async () => {
    await expect(
      publishStable(['--app-version', '1.2.3', '--build-id', 'abc123'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --app-version is missing', async () => {
    await expect(
      publishStable(['--dist', distDir, '--build-id', 'abc123'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --build-id is missing', async () => {
    await expect(
      publishStable(['--dist', distDir, '--app-version', '1.2.3'], {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('Usage:');
  });

  it('throws when GITHUB_TOKEN is missing', async () => {
    await expect(
      publishStable(requiredFlags(distDir), {
        PAGES_REPOSITORY: 'owner/pages-repo',
      }),
    ).rejects.toThrow('GITHUB_TOKEN is required');
  });

  it('throws when PAGES_REPOSITORY is missing', async () => {
    await expect(
      publishStable(requiredFlags(distDir), {
        GITHUB_TOKEN: 'token',
      }),
    ).rejects.toThrow('PAGES_REPOSITORY is required');
  });
});

describe('publishStable target repository', () => {
  it('publishes to PAGES_REPOSITORY and ignores GITHUB_REPOSITORY', async () => {
    await publishStable(requiredFlags(distDir), {
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

  it('publishes a managed stable release with the given app version and build id', async () => {
    await publishStable(requiredFlags(distDir), {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'Mioframe/mioframe.github.io',
    });

    expect(publishManagedRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'stable',
        basePath: '/',
        appVersion: '1.2.3',
        buildId: 'abc123',
      }),
    );
  });
});
