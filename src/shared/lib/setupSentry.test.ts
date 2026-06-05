import { createApp } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TestAppRoot = {
  template: '<div />',
};

const setupSentryMocks = (options?: { importErrorOnce?: unknown }) => {
  let importAttempts = 0;
  const shouldRejectImportOnce = options ? 'importErrorOnce' in options : false;
  const importErrorOnce = options?.importErrorOnce;
  const initMock = vi.fn();
  const captureExceptionMock = vi.fn(() => 'exception-id');
  const captureMessageMock = vi.fn(() => 'message-id');
  const captureEventMock = vi.fn(() => 'event-id');
  const withScopeMock = vi.fn((callback: (scope: object) => void) => {
    callback({});
  });
  const addBreadcrumbMock = vi.fn();
  const setUserMock = vi.fn();
  const setTagMock = vi.fn();
  const setContextMock = vi.fn();
  const setExtraMock = vi.fn();
  const setExtrasMock = vi.fn();
  const flushMock = vi.fn(() => Promise.resolve(true));
  const startSpanMock = vi.fn((_options, callback: (span: object) => string) => callback({}));
  const startSpanManualMock = vi.fn(
    (_options, callback: (span: object, finish: () => void) => string) => callback({}, vi.fn()),
  );
  const startInactiveSpanMock = vi.fn(() => ({ span: true }));

  const sentryModule = {
    init: initMock,
    captureException: captureExceptionMock,
    captureMessage: captureMessageMock,
    captureEvent: captureEventMock,
    withScope: withScopeMock,
    addBreadcrumb: addBreadcrumbMock,
    setUser: setUserMock,
    setTag: setTagMock,
    setContext: setContextMock,
    setExtra: setExtraMock,
    setExtras: setExtrasMock,
    flush: flushMock,
    startSpan: startSpanMock,
    startSpanManual: startSpanManualMock,
    startInactiveSpan: startInactiveSpanMock,
  };

  vi.doMock('@sentry/vue', () => {
    importAttempts += 1;

    if (importAttempts === 1 && shouldRejectImportOnce) {
      throw importErrorOnce;
    }

    return sentryModule;
  });

  return {
    initMock,
    captureMessageMock,
    setUserMock,
    flushMock,
    withScopeMock,
    startSpanManualMock,
    startInactiveSpanMock,
    getImportAttempts: () => importAttempts,
  };
};

describe('setupSentry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.doUnmock('@sentry/vue');
  });

  it('returns a safe no-op proxy facade before config is registered', async () => {
    const withScopeSpy = vi.fn((_scope: unknown) => undefined);

    const { useSentry, ensureSentry } = await import('./setupSentry');

    expect(() => {
      useSentry().captureException(new Error('boom'));
      useSentry().withScope(withScopeSpy);
    }).not.toThrow();

    expect(useSentry().captureMessage('hello')).toBeUndefined();
    expect(useSentry().captureEvent({ message: 'event' })).toBeUndefined();
    expect(useSentry().startInactiveSpan({ name: 'noop' })).toBeUndefined();
    expect(useSentry().startSpan({ name: 'noop' }, () => 'done')).toBe('done');
    expect(
      useSentry().startSpanManual({ name: 'noop-manual' }, (_span, finish) => {
        expect(finish).toEqual(expect.any(Function));
        finish();
        return 'manual-done';
      }),
    ).toBe('manual-done');
    expect(withScopeSpy).not.toHaveBeenCalled();

    await expect(ensureSentry()).resolves.toBe(useSentry());
  });

  it('keeps plugin installs without DSN as no-op', async () => {
    const { sentryPlugin, useSentry, ensureSentry } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      enabled: true,
    });

    expect(useSentry().captureMessage('hello')).toBeUndefined();
    await expect(ensureSentry()).resolves.toBe(useSentry());
  });

  it('does not import @sentry/vue during plugin install even with valid config', async () => {
    const { getImportAttempts } = setupSentryMocks();
    const { sentryPlugin } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    expect(getImportAttempts()).toBe(0);
  });

  it('warns only once in dev when Sentry is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { useSentry } = await import('./setupSentry');

    useSentry().captureException(new Error('first'));
    useSentry().captureMessage('second');
    useSentry().setTag('scope', 'value');

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[sentry] Sentry is not configured. Calls will be ignored.',
    );
  });

  it('initializes the SDK only once across repeated ensureSentry calls', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');
    const app = createApp(TestAppRoot);

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setSentryReportingEnabled(true);

    const [firstFacade, secondFacade] = await Promise.all([ensureSentry(app), ensureSentry(app)]);

    expect(firstFacade).toBe(secondFacade);
    expect(initMock).toHaveBeenCalledTimes(1);

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions).toMatchObject({
      app,
      dsn: 'https://example@sentry.io/123',
      tracesSampleRate: 0,
    });
    expect(initOptions).not.toHaveProperty('integrations');
    expect(initOptions).not.toHaveProperty('replaysSessionSampleRate');
    expect(initOptions).not.toHaveProperty('replaysOnErrorSampleRate');
    expect(initOptions.beforeSend).toEqual(expect.any(Function));
  });

  it('delegates proxied SDK calls after initialization, including non-curated methods', async () => {
    const { captureMessageMock, setUserMock, flushMock, startInactiveSpanMock } =
      setupSentryMocks();
    const { sentryPlugin, ensureSentry, setSentryReportingEnabled, useSentry } =
      await import('./setupSentry');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setSentryReportingEnabled(true);
    await ensureSentry();

    expect(useSentry().captureMessage('hello')).toBe('message-id');
    useSentry().setUser({
      id: 'user-1',
    });
    expect(useSentry().startInactiveSpan({ name: 'fetch-data' })).toEqual({ span: true });
    await expect(useSentry().flush()).resolves.toBe(true);

    expect(captureMessageMock).toHaveBeenCalledWith('hello');
    expect(setUserMock).toHaveBeenCalledWith({
      id: 'user-1',
    });
    expect(startInactiveSpanMock).toHaveBeenCalledWith({
      name: 'fetch-data',
    });
    expect(flushMock).toHaveBeenCalledOnce();
  });

  it('ensureSentry imports SDK only for valid runtime config', async () => {
    const { getImportAttempts } = setupSentryMocks();
    const { ensureSentry, isSentryConfigured, registerSentryConfig } =
      await import('./setupSentry');

    await ensureSentry();
    registerSentryConfig({
      enabled: true,
    });
    await ensureSentry();
    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: false,
    });
    await ensureSentry();

    expect(isSentryConfigured()).toBe(false);
    expect(getImportAttempts()).toBe(0);

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    await ensureSentry();

    expect(isSentryConfigured()).toBe(true);
    expect(getImportAttempts()).toBe(1);
  });

  it('setSentryReportingEnabled does not import the SDK by itself', async () => {
    const { getImportAttempts } = setupSentryMocks();
    const { isSentryReportingEnabled, setSentryReportingEnabled } = await import('./setupSentry');

    setSentryReportingEnabled(true);

    expect(isSentryReportingEnabled()).toBe(true);
    expect(getImportAttempts()).toBe(0);
  });

  it('recovers after a failed Sentry module import', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const importError = new Error('chunk failed');
    const { initMock, captureMessageMock, getImportAttempts } = setupSentryMocks({
      importErrorOnce: importError,
    });
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled, useSentry } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await expect(ensureSentry()).resolves.toBe(useSentry());
    expect(initMock).not.toHaveBeenCalled();
    expect(getImportAttempts()).toBe(1);
    expect(useSentry().captureMessage('during-failure')).toBeUndefined();

    await expect(ensureSentry()).resolves.toBe(useSentry());

    expect(getImportAttempts()).toBe(2);
    expect(initMock).toHaveBeenCalledOnce();
    expect(useSentry().captureMessage('after-retry')).toBe('message-id');
    expect(captureMessageMock).toHaveBeenCalledWith('after-retry');
    expect(warnSpy).toHaveBeenCalledWith(
      '[sentry] Sentry failed to initialize. Calls will remain no-op until a retry succeeds.',
      expect.objectContaining({
        cause: importError,
      }),
    );
  });

  it('recovers after Sentry init throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const initError = new Error('init failed');
    const { initMock, captureMessageMock, getImportAttempts } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled, useSentry } =
      await import('./setupSentry');

    initMock.mockImplementationOnce(() => {
      throw initError;
    });
    initMock.mockImplementationOnce(() => {
      throw initError;
    });

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await expect(ensureSentry()).resolves.toBe(useSentry());
    await expect(ensureSentry()).resolves.toBe(useSentry());
    expect(warnSpy).toHaveBeenCalledTimes(1);

    await expect(ensureSentry()).resolves.toBe(useSentry());

    expect(getImportAttempts()).toBe(1);
    expect(initMock).toHaveBeenCalledTimes(3);
    expect(useSentry().captureMessage('after-retry')).toBe('message-id');
    expect(captureMessageMock).toHaveBeenCalledWith('after-retry');
    expect(warnSpy).toHaveBeenCalledWith(
      '[sentry] Sentry failed to initialize. Calls will remain no-op until a retry succeeds.',
      initError,
    );
  });

  it('keeps facade calls as safe no-op until ensureSentry is called explicitly', async () => {
    const { getImportAttempts, captureMessageMock } = setupSentryMocks();
    const { registerSentryConfig, useSentry } = await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    expect(useSentry().captureMessage('not-initialized')).toBeUndefined();
    expect(getImportAttempts()).toBe(0);
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it('delegates callback-based methods after initialization', async () => {
    const { withScopeMock, startSpanManualMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, useSentry } = await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    await ensureSentry();

    const scopeCallback = vi.fn((_scope: unknown) => undefined);
    useSentry().withScope(scopeCallback);

    expect(
      useSentry().startSpanManual({ name: 'loaded-manual' }, (_span, finish) => {
        expect(finish).toEqual(expect.any(Function));
        finish();
        return 'loaded-manual-result';
      }),
    ).toBe('loaded-manual-result');

    expect(withScopeMock).toHaveBeenCalledOnce();
    expect(scopeCallback).toHaveBeenCalledOnce();
    expect(startSpanManualMock).toHaveBeenCalledOnce();
  });

  it('beforeSend drops events while reporting is disabled', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry } = await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = { message: 'test-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBeNull();
    }
  });

  it('beforeSend keeps events while reporting is enabled', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      breadcrumbs: [{ message: 'user breadcrumb' }],
      extra: {
        domainErrorCode: 'document-export-failed',
        originalThrownType: 'string',
        path: '/docs/private',
        userMessage: 'Could not export the document',
      },
      message: 'test-event',
      request: {
        url: 'https://app.example/doc/secret-id',
      },
      tags: {
        action: 'exportDocumentJson',
        feature: 'documentExport',
        handled: 'true',
        path: '/docs/private',
      },
      user: {
        id: 'user-1',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        extra: {
          domainErrorCode: 'document-export-failed',
          originalThrownType: 'string',
          userMessage: 'Could not export the document',
        },
        message: 'test-event',
        tags: {
          action: 'exportDocumentJson',
          feature: 'documentExport',
          handled: 'true',
        },
      });
    }
  });

  it('beforeSend drops unsafe-only extra payloads', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      extra: {
        documentId: 'secret',
        path: '/private',
      },
      message: 'test-event',
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'test-event',
      });
    }
  });

  it('beforeSend keeps only allowlisted extra keys from mixed payloads', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      extra: {
        domainErrorCode: 'document-export-failed',
        originalThrownType: 'string',
        path: '/private',
        userMessage: 'Could not export the document',
      },
      message: 'test-event',
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        extra: {
          domainErrorCode: 'document-export-failed',
          originalThrownType: 'string',
          userMessage: 'Could not export the document',
        },
        message: 'test-event',
      });
    }
  });

  it('beforeSend drops unsafe-only tags', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      message: 'test-event',
      tags: {
        path: '/private',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'test-event',
      });
    }
  });

  it('beforeSend keeps only allowlisted tags from mixed payloads', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      message: 'test-event',
      tags: {
        action: 'exportDocumentJson',
        feature: 'documentExport',
        handled: 'true',
        path: '/private',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'test-event',
        tags: {
          action: 'exportDocumentJson',
          feature: 'documentExport',
          handled: 'true',
        },
      });
    }
  });

  it('beforeSend removes request, contexts, unsafe breadcrumbs, and user entirely', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      breadcrumbs: [{ message: 'user breadcrumb' }],
      contexts: {
        browser: {
          name: 'Chrome',
        },
      },
      message: 'test-event',
      request: {
        method: 'POST',
        url: 'https://app.example/doc/secret-id',
      },
      user: {
        id: 'user-1',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'test-event',
      });
    }
  });

  it('beforeSend preserves core error event fields', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      environment: 'production',
      exception: {
        values: [
          {
            stacktrace: {
              frames: [
                {
                  filename: 'src/shared/lib/reportHandledError.ts',
                  function: 'reportHandledError',
                },
              ],
            },
            type: 'Error',
            value: 'boom',
          },
        ],
      },
      message: 'test-event',
      release: '1.2.3',
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual(event);
    }
  });

  it('setupSentry enables reporting and keeps beforeSend open', async () => {
    const { initMock } = setupSentryMocks();
    const { isSentryReportingEnabled, setupSentry } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    await setupSentry(app, 'https://example@sentry.io/123');

    expect(isSentryReportingEnabled()).toBe(true);

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      extra: { userMessage: 'Could not save', path: '/docs/private' },
      message: 'setup-event',
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        extra: {
          userMessage: 'Could not save',
        },
        message: 'setup-event',
      });
    }
  });

  it('default state is unknown and isSentryReportingEnabled returns false', async () => {
    const { getSentryReportingState, isSentryReportingEnabled } = await import('./setupSentry');
    expect(getSentryReportingState()).toBe('unknown');
    expect(isSentryReportingEnabled()).toBe(false);
  });

  it('setSentryReportingState updates state and isSentryReportingEnabled', async () => {
    const { getSentryReportingState, setSentryReportingState, isSentryReportingEnabled } =
      await import('./setupSentry');

    setSentryReportingState('enabled');
    expect(getSentryReportingState()).toBe('enabled');
    expect(isSentryReportingEnabled()).toBe(true);

    setSentryReportingState('disabled');
    expect(getSentryReportingState()).toBe('disabled');
    expect(isSentryReportingEnabled()).toBe(false);

    setSentryReportingState('unknown');
    expect(getSentryReportingState()).toBe('unknown');
    expect(isSentryReportingEnabled()).toBe(false);
  });

  it('setSentryReportingEnabled compatibility sets correct state', async () => {
    const { getSentryReportingState, setSentryReportingEnabled } = await import('./setupSentry');

    setSentryReportingEnabled(true);
    expect(getSentryReportingState()).toBe('enabled');

    setSentryReportingEnabled(false);
    expect(getSentryReportingState()).toBe('disabled');
  });

  it('beforeSend drops events when state is unknown', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingState } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setSentryReportingState('unknown');

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = { message: 'test-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBeNull();
    }
  });

  it('beforeSend drops events when state is disabled', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingState } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setSentryReportingState('disabled');

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = { message: 'test-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBeNull();
    }
  });

  it('setupSentry compatibility sets state to enabled', async () => {
    const { getSentryReportingState, setupSentry } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    await setupSentry(app, 'https://example@sentry.io/123');

    expect(getSentryReportingState()).toBe('enabled');
  });

  describe('beforeSend diagnostic tag filtering', () => {
    const setupBeforeSend = async () => {
      const { initMock } = setupSentryMocks();
      const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
        await import('./setupSentry');

      registerSentryConfig({
        dsn: 'https://example@sentry.io/123',
        enabled: true,
      });
      setSentryReportingEnabled(true);
      await ensureSentry();

      const initOptions = initMock.mock.calls[0]?.[0];
      return initOptions?.beforeSend;
    };

    it('provider tag survives beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: '[diagnostic] writeAccessRecovery.permissionDenied',
        tags: { provider: 'webFileSystem', eventKind: 'diagnostic' },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: '[diagnostic] writeAccessRecovery.permissionDenied',
          tags: { provider: 'webFileSystem', eventKind: 'diagnostic' },
        });
      }
    });

    it('operation tag survives beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: '[diagnostic] writeAccessRecovery.requestAccess',
        tags: { operation: 'requestAccess', result: 'failed' },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: '[diagnostic] writeAccessRecovery.requestAccess',
          tags: { operation: 'requestAccess', result: 'failed' },
        });
      }
    });

    it('all expected diagnostic tags survive beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: '[diagnostic] test.event',
        tags: {
          eventKind: 'diagnostic',
          severity: 'error',
          result: 'failed',
          classification: 'access',
          provider: 'webFileSystem',
          operation: 'flushPendingSaves',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: '[diagnostic] test.event',
          tags: {
            eventKind: 'diagnostic',
            severity: 'error',
            result: 'failed',
            classification: 'access',
            provider: 'webFileSystem',
            operation: 'flushPendingSaves',
          },
        });
      }
    });

    it('unknown tags are removed by beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        tags: {
          eventKind: 'diagnostic',
          customMetadata: 'some-value',
          internalFlag: 'true',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          tags: { eventKind: 'diagnostic' },
        });
      }
    });

    it('private-looking tags are removed by beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        tags: {
          path: '/user/private/doc',
          fileName: 'secret.md',
          documentId: 'abc-123',
          storageKey: 'opfs://key',
          url: 'https://app/doc/id',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({ message: 'test' });
      }
    });

    it('stage and providerKind tags are removed by beforeSend', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        tags: {
          stage: 'flush',
          providerKind: 'webFileSystem',
          result: 'failed',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          tags: { result: 'failed' },
        });
      }
    });

    it('raw paths, file names, document ids, and storage keys do not survive as extras', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: {
          filePath: '/user/documents/secret.md',
          documentId: 'doc-abc-123',
          storageKey: 'opfs://repo/key',
          userMessage: 'Could not save',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { userMessage: 'Could not save' },
        });
      }
    });
  });

  it('beforeSend keeps failureClassification tag when present', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      message: 'diagnostic-event',
      tags: {
        provider: 'webFileSystem',
        operation: 'repositorySave',
        failureClassification: 'accessRequired',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'diagnostic-event',
        tags: {
          provider: 'webFileSystem',
          operation: 'repositorySave',
          failureClassification: 'accessRequired',
        },
      });
    }
  });

  it('beforeSend keeps storageFailure and unknown failureClassification values', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({ message: 'e', tags: { failureClassification: 'storageFailure' } }),
      ).toEqual({ message: 'e', tags: { failureClassification: 'storageFailure' } });

      expect(beforeSend({ message: 'e', tags: { failureClassification: 'unknown' } })).toEqual({
        message: 'e',
        tags: { failureClassification: 'unknown' },
      });
    }
  });

  it('beforeSend strips unknown private tags even when failureClassification is present', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
      await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setSentryReportingEnabled(true);

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      message: 'diagnostic-event',
      tags: {
        failureClassification: 'storageFailure',
        spaceName: 'My Workspace',
        documentPath: '/private/doc',
      },
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toEqual({
        message: 'diagnostic-event',
        tags: { failureClassification: 'storageFailure' },
      });
    }
  });

  describe('breadcrumb sanitization', () => {
    const setupHooks = async () => {
      const { initMock } = setupSentryMocks();
      const { registerSentryConfig, ensureSentry, setSentryReportingEnabled } =
        await import('./setupSentry');

      registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
      setSentryReportingEnabled(true);
      await ensureSentry();

      const initOptions = initMock.mock.calls[0]?.[0];
      return {
        beforeBreadcrumb: initOptions?.beforeBreadcrumb,
        beforeSend: initOptions?.beforeSend,
      };
    };

    it('registers beforeBreadcrumb during Sentry init', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      expect(beforeBreadcrumb).toEqual(expect.any(Function));
    });

    it('safe technical breadcrumb with allowed category survives beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = {
        category: 'repository.storage',
        message: 'repository save failed',
        level: 'error',
        data: { provider: 'webFileSystem', operation: 'repositorySave', pendingCount: 1 },
      };

      if (beforeBreadcrumb instanceof Function) {
        const result = beforeBreadcrumb(breadcrumb);
        expect(result).not.toBeNull();
        expect(result?.category).toBe('repository.storage');
        expect(result?.message).toBe('repository save failed');
      }
    });

    it('writeAccessRecovery category survives beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = {
        category: 'writeAccessRecovery',
        message: 'write access recovery resolved — replay still blocked',
        level: 'error',
        data: { operation: 'resolveAccessRequest', failureClassification: 'accessRequired' },
      };

      if (beforeBreadcrumb instanceof Function) {
        expect(beforeBreadcrumb(breadcrumb)).not.toBeNull();
      }
    });

    it('diagnostics.forwarding category survives beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = {
        category: 'diagnostics.forwarding',
        message: 'diagnostic event forwarded',
        level: 'debug',
      };

      if (beforeBreadcrumb instanceof Function) {
        expect(beforeBreadcrumb(breadcrumb)).not.toBeNull();
      }
    });

    it('unknown category is stripped by beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = { category: 'ui.click', message: 'button clicked' };

      if (beforeBreadcrumb instanceof Function) {
        expect(beforeBreadcrumb(breadcrumb)).toBeNull();
      }
    });

    it('automatic Sentry navigation category is stripped by beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = { category: 'navigation', message: 'from /home to /dashboard' };

      if (beforeBreadcrumb instanceof Function) {
        expect(beforeBreadcrumb(breadcrumb)).toBeNull();
      }
    });

    it('breadcrumb without category is stripped by beforeBreadcrumb', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = { message: 'user breadcrumb', level: 'info' };

      if (beforeBreadcrumb instanceof Function) {
        expect(beforeBreadcrumb(breadcrumb)).toBeNull();
      }
    });

    it('beforeBreadcrumb strips private data keys from safe category breadcrumbs', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = {
        category: 'repository.storage',
        message: 'repository save failed',
        data: {
          provider: 'webFileSystem',
          operation: 'repositorySave',
          path: '/private/doc.md',
          fileName: 'secret.md',
          documentId: 'doc-abc',
          storageKey: 'opfs://key',
        },
      };

      if (beforeBreadcrumb instanceof Function) {
        const result = beforeBreadcrumb(breadcrumb);
        expect(result).not.toBeNull();
        // result is any — property access is safe without assertions
        expect(result?.data?.provider).toBe('webFileSystem');
        expect(result?.data?.operation).toBe('repositorySave');
        expect(result?.data?.path).toBeUndefined();
        expect(result?.data?.fileName).toBeUndefined();
        expect(result?.data?.documentId).toBeUndefined();
        expect(result?.data?.storageKey).toBeUndefined();
      }
    });

    it('beforeBreadcrumb strips data values that are not strings or numbers', async () => {
      const { beforeBreadcrumb } = await setupHooks();
      const breadcrumb = {
        category: 'repository.storage',
        message: 'test',
        data: {
          provider: 'webFileSystem',
          operation: { nested: 'object' },
          pendingCount: null,
        },
      };

      if (beforeBreadcrumb instanceof Function) {
        const result = beforeBreadcrumb(breadcrumb);
        // result is any — property access is safe without assertions
        expect(result?.data?.provider).toBe('webFileSystem');
        expect(result?.data?.operation).toBeUndefined();
        expect(result?.data?.pendingCount).toBeUndefined();
      }
    });

    it('beforeSend defense-in-depth keeps safe technical breadcrumbs', async () => {
      const { beforeSend } = await setupHooks();
      const event = {
        message: '[diagnostic] repositoryStorage.saveFailed',
        breadcrumbs: [
          {
            category: 'repository.storage',
            message: 'repository save failed',
            level: 'error',
            data: { provider: 'webFileSystem', operation: 'repositorySave', pendingCount: 1 },
          },
        ],
      };

      if (beforeSend instanceof Function) {
        const result = beforeSend(event);
        expect(result).not.toBeNull();
        // result is any — property access is safe without assertions
        expect(Array.isArray(result?.breadcrumbs)).toBe(true);
        expect(result?.breadcrumbs).toHaveLength(1);
      }
    });

    it('beforeSend defense-in-depth strips unknown category breadcrumbs', async () => {
      const { beforeSend } = await setupHooks();
      const event = {
        message: 'test',
        breadcrumbs: [
          { category: 'ui.click', message: 'button pressed' },
          { category: 'navigation', message: 'page changed' },
          { message: 'no category' },
        ],
      };

      if (beforeSend instanceof Function) {
        const result = beforeSend(event);
        expect(result?.breadcrumbs).toBeUndefined();
      }
    });

    it('beforeSend defense-in-depth strips private data from surviving breadcrumbs', async () => {
      const { beforeSend } = await setupHooks();
      const event = {
        message: 'test',
        breadcrumbs: [
          {
            category: 'repository.storage',
            message: 'repository save failed',
            data: {
              provider: 'webFileSystem',
              documentId: 'private-id',
              fileName: 'secret.md',
              pendingCount: 2,
            },
          },
        ],
      };

      if (beforeSend instanceof Function) {
        const result = beforeSend(event);
        // result is any — property access is safe without assertions
        expect(result?.breadcrumbs[0]?.data?.provider).toBe('webFileSystem');
        expect(result?.breadcrumbs[0]?.data?.pendingCount).toBe(2);
        expect(result?.breadcrumbs[0]?.data?.documentId).toBeUndefined();
        expect(result?.breadcrumbs[0]?.data?.fileName).toBeUndefined();
      }
    });
  });
});
