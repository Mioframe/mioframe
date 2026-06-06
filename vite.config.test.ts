import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const {
  getBaseVitePluginsMock,
  getBaseWorkerPluginsMock,
  getPwaPluginsMock,
  getSentryPluginsMock,
  getSslPluginsMock,
} = vi.hoisted(() => ({
  getBaseVitePluginsMock: vi.fn(() => [{ name: 'base-vite' }]),
  getBaseWorkerPluginsMock: vi.fn(() => [{ name: 'base-worker' }]),
  getPwaPluginsMock: vi.fn(() => [{ name: 'pwa' }]),
  getSentryPluginsMock: vi.fn(() => [{ name: 'sentry' }]),
  getSslPluginsMock: vi.fn(() => [{ name: 'ssl' }]),
}));

vi.mock('./config/plugins', () => ({
  getBaseVitePlugins: getBaseVitePluginsMock,
  getBaseWorkerPlugins: getBaseWorkerPluginsMock,
  getPwaPlugins: getPwaPluginsMock,
  getSentryPlugins: getSentryPluginsMock,
  getSslPlugins: getSslPluginsMock,
}));

vi.mock('./config/alias', () => ({
  getResolveAlias: () => ({}),
}));

describe('vite sentry config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.VITE_BUILD_ID = 'build-123';
    process.env.GITHUB_SHA = 'sha-ignored-when-build-id-present';
    getBaseVitePluginsMock.mockClear();
    getBaseWorkerPluginsMock.mockClear();
    getPwaPluginsMock.mockClear();
    getSentryPluginsMock.mockClear();
    getSslPluginsMock.mockClear();
    getSentryPluginsMock.mockReturnValue([{ name: 'sentry' }]);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('uses hidden sourcemaps and appends sentry last for sentry-enabled production builds', async () => {
    const viteConfig = (await import('./vite.config')).default;
    const config = viteConfig({ command: 'build', mode: 'production', isPreview: false });

    expect(getSentryPluginsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'production',
        isPreview: false,
        release: 'build-123',
      }),
    );
    expect(config.build?.sourcemap).toBe('hidden');
    expect(config.define?.__BUILD_ID__).toBe(JSON.stringify('build-123'));
    expect(config.plugins?.at(-1)).toEqual({ name: 'sentry' });

    const workerPlugins = config.worker?.plugins?.();
    expect(workerPlugins?.at(-1)).toEqual({ name: 'sentry' });
  });

  it('disables build sourcemaps when sentry plugins are disabled', async () => {
    getSentryPluginsMock.mockReturnValue([]);

    const viteConfig = (await import('./vite.config')).default;
    const config = viteConfig({ command: 'build', mode: 'development', isPreview: false });

    expect(config.build?.sourcemap).toBe(false);
    expect(config.plugins ?? []).not.toContainEqual({ name: 'sentry' });
    expect(config.worker?.plugins?.()).not.toContainEqual({ name: 'sentry' });
  });
});
