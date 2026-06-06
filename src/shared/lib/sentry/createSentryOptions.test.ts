import { describe, expect, it } from 'vitest';
import { createSentryOptions } from './createSentryOptions';

describe('createSentryOptions', () => {
  it('uses conservative production breadcrumb limits without tracing or replay options', () => {
    const options = createSentryOptions({
      diagnosticsMode: 'production',
      dsn: 'https://example@sentry.io/123',
      getReportingState: () => 'enabled',
      release: 'build-1',
    });

    expect(options.maxBreadcrumbs).toBe(25);
    expect(options.tracesSampleRate).toBe(0);
    expect(options.beforeBreadcrumb).toEqual(expect.any(Function));
    expect(options.beforeSend).toEqual(expect.any(Function));
    expect(options).not.toHaveProperty('attachStacktrace');
    expect(options).not.toHaveProperty('replaysSessionSampleRate');
    expect(options).not.toHaveProperty('replaysOnErrorSampleRate');
    expect(options).not.toHaveProperty('enableLogs');
    expect(options).not.toHaveProperty('profilesSampleRate');
  });

  it('uses larger preview breadcrumb limits with the same privacy boundaries', () => {
    const options = createSentryOptions({
      diagnosticsMode: 'preview',
      dsn: 'https://example@sentry.io/123',
      getReportingState: () => 'enabled',
      release: 'build-1',
    });

    expect(options.maxBreadcrumbs).toBe(50);
    expect(options.tracesSampleRate).toBe(0);
    expect(options.beforeBreadcrumb).toEqual(expect.any(Function));
    expect(options.beforeSend).toEqual(expect.any(Function));
    expect(options).not.toHaveProperty('attachStacktrace');
  });
});
