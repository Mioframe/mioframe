import { describe, expect, it, vi } from 'vitest';

type SentryPluginOptions = {
  authToken?: string;
  release?: { name?: string };
  sourcemaps?: { filesToDeleteAfterUpload?: string[] };
};

const sentryVitePluginMock = vi.fn<(options: SentryPluginOptions) => { name: string }>(() => ({
  name: 'sentry-vite-plugin',
}));

const getFirstPluginOptions = (): SentryPluginOptions | undefined =>
  sentryVitePluginMock.mock.calls[0]?.[0];

vi.mock('@sentry/vite-plugin', () => ({
  sentryVitePlugin: sentryVitePluginMock,
}));

describe('getSentryPlugins', () => {
  it('returns empty array in development mode without isPreview', async () => {
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({
      authToken: 'token',
      isPreview: false,
      mode: 'development',
    });
    expect(plugins).toHaveLength(0);
    expect(sentryVitePluginMock).not.toHaveBeenCalled();
  });

  it('returns a plugin in production mode', async () => {
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({
      authToken: 'token',
      isPreview: false,
      mode: 'production',
    });
    expect(plugins.length).toBeGreaterThan(0);
    expect(sentryVitePluginMock).toHaveBeenCalled();
  });

  it('returns a plugin when isPreview is true regardless of mode', async () => {
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({
      authToken: 'token',
      isPreview: true,
      mode: 'development',
    });
    expect(plugins.length).toBeGreaterThan(0);
    expect(sentryVitePluginMock).toHaveBeenCalled();
  });

  it('passes filesToDeleteAfterUpload targeting dist map files', async () => {
    sentryVitePluginMock.mockClear();
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({ authToken: 'token', isPreview: false, mode: 'production' });

    expect(plugins).toHaveLength(1);
    const options = getFirstPluginOptions();
    expect(options?.sourcemaps?.filesToDeleteAfterUpload).toEqual(
      expect.arrayContaining(['./dist/**/*.map']),
    );
  });

  it('passes release name when release is provided', async () => {
    sentryVitePluginMock.mockClear();
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({
      authToken: 'token',
      isPreview: false,
      mode: 'production',
      release: 'abc123sha',
    });

    expect(plugins).toHaveLength(1);
    const options = getFirstPluginOptions();
    expect(options?.release?.name).toBe('abc123sha');
  });

  it('omits release when not provided', async () => {
    sentryVitePluginMock.mockClear();
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({ authToken: 'token', isPreview: false, mode: 'production' });

    expect(plugins).toHaveLength(1);
    const options = getFirstPluginOptions();
    expect(options).not.toHaveProperty('release');
  });

  it('sentry plugin is the only item returned (must remain last in plugin list)', async () => {
    sentryVitePluginMock.mockClear();
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({ authToken: 'token', isPreview: false, mode: 'production' });
    // getSentryPlugins returns only the sentry plugin; vite.config.ts appends it last
    expect(plugins).toHaveLength(1);
  });

  it('passes auth token to sentryVitePlugin', async () => {
    sentryVitePluginMock.mockClear();
    const { getSentryPlugins } = await import('./sentry.ts');
    const plugins = getSentryPlugins({
      authToken: 'my-secret-token',
      isPreview: false,
      mode: 'production',
    });

    expect(plugins).toHaveLength(1);
    const options = getFirstPluginOptions();
    expect(options?.authToken).toBe('my-secret-token');
  });
});
