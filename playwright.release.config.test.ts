// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalCi = process.env.CI;
const originalManagedCompatWorkDir = process.env.MANAGED_COMPAT_WORK_DIR;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (originalCi === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = originalCi;
  }
  if (originalManagedCompatWorkDir === undefined) {
    delete process.env.MANAGED_COMPAT_WORK_DIR;
  } else {
    process.env.MANAGED_COMPAT_WORK_DIR = originalManagedCompatWorkDir;
  }
});

describe('Release Playwright strict flaky gating', () => {
  it('fails the release gate on any flaky classification in CI', async () => {
    process.env.CI = '1';

    const { default: releaseConfig } = await import('./playwright.release.config');

    expect(releaseConfig.retries).toBe(2);
    expect(releaseConfig.failOnFlakyTests).toBe(true);
    expect(releaseConfig.workers).toBe(1);
  });

  it('does not enable retries or the flaky gate outside CI', async () => {
    delete process.env.CI;

    const { default: releaseConfig } = await import('./playwright.release.config');

    expect(releaseConfig.retries).toBe(0);
    expect(releaseConfig.failOnFlakyTests).toBe(false);
  });
});

describe('managed compatibility staged run must not start the release webServer', () => {
  it('omits webServer when MANAGED_COMPAT_WORK_DIR is set, so no build touches the candidate dist', async () => {
    process.env.MANAGED_COMPAT_WORK_DIR = 'some/staged/work/dir';

    const { default: releaseConfig } = await import('./playwright.release.config');

    expect(releaseConfig.webServer).toBeUndefined();
  });

  it('keeps building and serving its own artifact when MANAGED_COMPAT_WORK_DIR is not set', async () => {
    delete process.env.MANAGED_COMPAT_WORK_DIR;

    const { default: releaseConfig } = await import('./playwright.release.config');

    expect(releaseConfig.webServer).toBeDefined();
  });
});
