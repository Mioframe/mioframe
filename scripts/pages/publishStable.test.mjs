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
  publishManagedRelease: vi.fn(() => ({ releaseNumber: 1 })),
}));
vi.mock('./lib/managedCompatibilityPreflight.mjs', () => ({
  runManagedPublicationPreflight: vi.fn(async () => ({ decision: 'not-applicable' })),
}));
vi.mock('./lib/managedArtifactSemantics.mjs', () => ({
  validateManagedArtifact: vi.fn(),
}));

const { withGhPagesBranch } = await import('./lib/ghPagesBranch.mjs');
const { publishManagedRelease } = await import('./lib/releasePublish.mjs');
const { runManagedPublicationPreflight } = await import('./lib/managedCompatibilityPreflight.mjs');
const { validateManagedArtifact } = await import('./lib/managedArtifactSemantics.mjs');
const { publishStable } = await import('./publishStable.mjs');

let distDir = '';

beforeEach(() => {
  distDir = mkdtempSync(join(tmpdir(), 'pages-dist-'));
  vi.mocked(withGhPagesBranch).mockClear();
  vi.mocked(publishManagedRelease).mockReset().mockReturnValue({ releaseNumber: 1 });
  vi.mocked(runManagedPublicationPreflight)
    .mockReset()
    .mockResolvedValue({ decision: 'not-applicable' });
  vi.mocked(validateManagedArtifact).mockReset();
});

afterEach(() => {
  rmSync(distDir, { recursive: true, force: true });
});

const requiredFlags = (dist) => [
  '--dist',
  dist,
  '--app-version',
  '1.2.3',
  '--build-id',
  'abc123',
  '--build-date',
  '2026-07-24T00:00:00.000Z',
];

describe('publishStable argument validation', () => {
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
      publishStable(
        ['--dist', distDir, '--build-id', 'abc123', '--build-date', '2026-07-24T00:00:00.000Z'],
        {
          GITHUB_TOKEN: 'token',
          PAGES_REPOSITORY: 'owner/pages-repo',
        },
      ),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --build-id is missing', async () => {
    await expect(
      publishStable(
        ['--dist', distDir, '--app-version', '1.2.3', '--build-date', '2026-07-24T00:00:00.000Z'],
        {
          GITHUB_TOKEN: 'token',
          PAGES_REPOSITORY: 'owner/pages-repo',
        },
      ),
    ).rejects.toThrow('Usage:');
  });

  it('throws when --build-date is missing', async () => {
    await expect(
      publishStable(['--dist', distDir, '--app-version', '1.2.3', '--build-id', 'abc123'], {
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
        appVersion: '1.2.3',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    );
  });

  it('runs artifact-semantic validation and the data-compatibility preflight, with the same publication inputs, before the real publication write', async () => {
    const callOrder = [];
    vi.mocked(validateManagedArtifact).mockImplementation(() => {
      callOrder.push('artifact-semantics');
    });
    vi.mocked(runManagedPublicationPreflight).mockImplementation(async () => {
      callOrder.push('preflight');
      return { decision: 'not-applicable' };
    });
    vi.mocked(publishManagedRelease).mockImplementation(() => {
      callOrder.push('publish');
      return { releaseNumber: 1 };
    });

    await publishStable(requiredFlags(distDir), {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'Mioframe/mioframe.github.io',
    });

    expect(validateManagedArtifact).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'stable',
        appVersion: '1.2.3',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    );
    expect(runManagedPublicationPreflight).toHaveBeenCalledWith(
      expect.objectContaining({
        distDir,
        channel: 'stable',
        appVersion: '1.2.3',
        buildId: 'abc123',
        buildDate: '2026-07-24T00:00:00.000Z',
      }),
    );
    expect(callOrder).toEqual(['artifact-semantics', 'preflight', 'publish']);
  });

  it('never reaches the preflight or the real publication write when artifact-semantic validation rejects', async () => {
    vi.mocked(validateManagedArtifact).mockImplementation(() => {
      throw new Error('Managed artifact validation failed: wrong base');
    });

    await expect(
      publishStable(requiredFlags(distDir), {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'Mioframe/mioframe.github.io',
      }),
    ).rejects.toThrow('Managed artifact validation failed');

    expect(runManagedPublicationPreflight).not.toHaveBeenCalled();
    expect(publishManagedRelease).not.toHaveBeenCalled();
  });

  it('never reaches the real publication write when the preflight rejects', async () => {
    vi.mocked(runManagedPublicationPreflight).mockRejectedValue(
      new Error('data-compatibility proof failed'),
    );

    await expect(
      publishStable(requiredFlags(distDir), {
        GITHUB_TOKEN: 'token',
        PAGES_REPOSITORY: 'Mioframe/mioframe.github.io',
      }),
    ).rejects.toThrow('data-compatibility proof failed');

    expect(publishManagedRelease).not.toHaveBeenCalled();
  });

  // publishManagedRelease() resolves a latest-build no-op before ever
  // requiring dist; the real entry point must not duplicate that check up
  // front. publishManagedRelease is mocked to always succeed, so this
  // proves publishStable.mjs itself carries no early distDir existence
  // gate, whatever the retained publication decision turns out to be.
  it('accepts a missing/nonexistent distDir and delegates to publishManagedRelease()', async () => {
    const missingDistDir = '/nonexistent/dist-12345';

    await publishStable(requiredFlags(missingDistDir), {
      GITHUB_TOKEN: 'token',
      PAGES_REPOSITORY: 'owner/pages-repo',
    });

    expect(publishManagedRelease).toHaveBeenCalledWith(
      expect.objectContaining({ distDir: missingDistDir, channel: 'stable' }),
    );
  });
});
