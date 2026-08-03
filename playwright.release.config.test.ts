// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalCi = process.env.CI;

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  if (originalCi === undefined) {
    delete process.env.CI;
  } else {
    process.env.CI = originalCi;
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
