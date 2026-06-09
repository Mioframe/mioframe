import { createApp } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TestAppRoot = {
  template: '<div />',
};

const TEST_SESSION_ID = 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb';
const INITIAL_SESSION_ID = 'session:11111111-2222-4333-8444-555555555555';

const { flushDiagnosticsRuntimeEffectsMock, clearDiagnosticsRuntimeEffectsMock } = vi.hoisted(
  () => ({
    flushDiagnosticsRuntimeEffectsMock: vi.fn(),
    clearDiagnosticsRuntimeEffectsMock: vi.fn(),
  }),
);

vi.mock('./runtimeEffects', () => ({
  registerDiagnosticsRuntimeEffects: vi.fn(),
  flushDiagnosticsRuntimeEffects: flushDiagnosticsRuntimeEffectsMock,
  clearDiagnosticsRuntimeEffects: clearDiagnosticsRuntimeEffectsMock,
}));

const setupSentryMocks = (options?: { importErrorOnce?: unknown }) => {
  let importAttempts = 0;
  const shouldRejectImportOnce = options ? 'importErrorOnce' in options : false;
  const importErrorOnce = options?.importErrorOnce;
  const initMock = vi.fn();
  const addBreadcrumbMock = vi.fn();
  const captureExceptionMock = vi.fn(() => 'exception-id');
  const captureMessageMock = vi.fn(() => 'message-id');
  const setUserMock = vi.fn();

  const sentryModule = {
    addBreadcrumb: addBreadcrumbMock,
    init: initMock,
    captureException: captureExceptionMock,
    captureMessage: captureMessageMock,
    setUser: setUserMock,
  };

  vi.doMock('@sentry/vue', () => {
    importAttempts += 1;

    if (importAttempts === 1 && shouldRejectImportOnce) {
      throw importErrorOnce;
    }

    return sentryModule;
  });

  return {
    addBreadcrumbMock,
    initMock,
    captureMessageMock,
    captureExceptionMock,
    setUserMock,
    getImportAttempts: () => importAttempts,
  };
};

describe('setupSentry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    flushDiagnosticsRuntimeEffectsMock.mockReset();
    clearDiagnosticsRuntimeEffectsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.doUnmock('@sentry/vue');
  });

  it('returns a safe no-op facade before config is registered', async () => {
    const { useSentry, ensureSentry } = await import('./sentryRuntime');

    expect(() => {
      useSentry().captureException(new Error('boom'));
      useSentry().captureMessage('hello');
      useSentry().setUser(null);
    }).not.toThrow();

    expect(useSentry().captureException(new Error('boom'))).toBeUndefined();
    expect(useSentry().captureMessage('hello')).toBeUndefined();
    useSentry().setUser(null);

    await expect(ensureSentry()).resolves.toBe(useSentry());
  });

  it('keeps plugin installs without DSN as no-op', async () => {
    const { sentryPlugin, useSentry, ensureSentry } = await import('./sentryRuntime');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      enabled: true,
    });

    expect(useSentry().captureMessage('hello')).toBeUndefined();
    await expect(ensureSentry()).resolves.toBe(useSentry());
  });

  it('does not import @sentry/vue during plugin install even with valid config', async () => {
    const { getImportAttempts } = setupSentryMocks();
    const { sentryPlugin } = await import('./sentryRuntime');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    expect(getImportAttempts()).toBe(0);
  });

  it('warns only once in dev when Sentry is unavailable', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { useSentry } = await import('./sentryRuntime');

    useSentry().captureException(new Error('first'));
    useSentry().captureMessage('second');
    useSentry().captureException(new Error('third'));

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[sentry] Sentry is not configured. Calls will be ignored.',
    );
  });

  it('initializes the SDK only once across repeated ensureSentry calls', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');
    const app = createApp(TestAppRoot);

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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

  it('calls setUser with session-prefixed id after initialization', async () => {
    const { setUserMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');
    const app = createApp(TestAppRoot);

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry(app);

    expect(setUserMock).toHaveBeenCalledOnce();
    const userArg = setUserMock.mock.calls[0]?.[0];
    expect(typeof userArg?.id).toBe('string');
    expect(userArg?.id).toMatch(/^session:/);
  });

  it('passes release from config to Sentry init', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
      release: 'abc123sha',
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions?.release).toBe('abc123sha');
  });

  it('omits release from init when not provided in config', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions).not.toHaveProperty('release');
  });

  it('delegates facade calls to the SDK after initialization', async () => {
    const { addBreadcrumbMock, captureMessageMock, captureExceptionMock, setUserMock } =
      setupSentryMocks();
    const { sentryPlugin, ensureSentry, setDiagnosticsRuntimeState, useSentry } =
      await import('./sentryRuntime');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const messageContext = { tags: { classification: 'unexpected' } };
    const exceptionContext = { tags: { handled: 'true' } };
    expect(useSentry().captureMessage('hello', messageContext)).toBe('message-id');
    expect(useSentry().captureException(new Error('boom'), exceptionContext)).toBe('exception-id');
    useSentry().addBreadcrumb({ category: 'sentry.runtime', message: 'hello', type: 'default' });
    useSentry().setUser(null);

    expect(captureMessageMock).toHaveBeenCalledWith('hello', messageContext);
    expect(captureExceptionMock).toHaveBeenCalledWith(new Error('boom'), exceptionContext);
    expect(addBreadcrumbMock).toHaveBeenCalledWith({
      category: 'sentry.runtime',
      message: 'hello',
      type: 'default',
    });
    expect(setUserMock).toHaveBeenCalledWith(null);
  });

  it('ensureSentry imports SDK only for valid runtime config', async () => {
    const { getImportAttempts } = setupSentryMocks();
    const { ensureSentry, isSentryConfigured, registerSentryConfig } =
      await import('./sentryRuntime');

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

  it('recovers after a failed Sentry module import', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const importError = new Error('chunk failed');
    const { initMock, captureMessageMock, getImportAttempts } = setupSentryMocks({
      importErrorOnce: importError,
    });
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState, useSentry } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    await expect(ensureSentry()).resolves.toBe(useSentry());
    expect(initMock).not.toHaveBeenCalled();
    expect(getImportAttempts()).toBe(1);
    expect(useSentry().captureMessage('during-failure')).toBeUndefined();

    await expect(ensureSentry()).resolves.toBe(useSentry());

    expect(getImportAttempts()).toBe(2);
    expect(initMock).toHaveBeenCalledOnce();
    expect(useSentry().captureMessage('after-retry')).toBe('message-id');
    expect(captureMessageMock).toHaveBeenCalledWith('after-retry', undefined);
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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState, useSentry } =
      await import('./sentryRuntime');

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
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    await expect(ensureSentry()).resolves.toBe(useSentry());
    await expect(ensureSentry()).resolves.toBe(useSentry());
    expect(warnSpy).toHaveBeenCalledTimes(1);

    await expect(ensureSentry()).resolves.toBe(useSentry());

    expect(getImportAttempts()).toBe(1);
    expect(initMock).toHaveBeenCalledTimes(3);
    expect(useSentry().captureMessage('after-retry')).toBe('message-id');
    expect(captureMessageMock).toHaveBeenCalledWith('after-retry', undefined);
    expect(warnSpy).toHaveBeenCalledWith(
      '[sentry] Sentry failed to initialize. Calls will remain no-op until a retry succeeds.',
      initError,
    );
  });

  it('keeps facade calls as safe no-op until ensureSentry is called explicitly', async () => {
    const { getImportAttempts, captureMessageMock } = setupSentryMocks();
    const { registerSentryConfig, useSentry } = await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    expect(useSentry().captureMessage('not-initialized')).toBeUndefined();
    expect(getImportAttempts()).toBe(0);
    expect(captureMessageMock).not.toHaveBeenCalled();
  });

  it('setUser delegates to the SDK after initialization', async () => {
    const { setUserMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, useSentry } = await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    await ensureSentry();

    useSentry().setUser({ id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb' });

    expect(setUserMock).toHaveBeenCalledWith({
      id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });
  });

  it('beforeSend drops events while reporting is disabled', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry } = await import('./sentryRuntime');

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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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
        eventKind: 'handledException',
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
        },
        message: 'test-event',
        tags: {
          action: 'exportDocumentJson',
          feature: 'documentExport',
          eventKind: 'handledException',
        },
      });
    }
  });

  it('beforeSend drops unhandled WebFileSystemAccessRequiredError events from repository save control flow', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      exception: {
        values: [
          {
            mechanism: {
              handled: false,
              type: 'onunhandledrejection',
            },
            type: 'WebFileSystemAccessRequiredError',
            value: 'Permission required to open this remembered local space',
          },
        ],
      },
      message: 'UnhandledRejection: WebFileSystemAccessRequiredError',
    };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBeNull();
    }
  });

  it('beforeSend drops unsafe-only extra payloads', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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
        },
        message: 'test-event',
      });
    }
  });

  it('beforeSend drops unsafe-only tags', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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

  it('beforeSend keeps safe (non-denylist) tags and strips denylist tags', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      message: 'test-event',
      tags: {
        action: 'exportDocumentJson',
        feature: 'documentExport',
        eventKind: 'handledException',
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
          eventKind: 'handledException',
        },
      });
    }
  });

  it('beforeSend removes request, breadcrumbs, unknown contexts, and non-session user', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = {
      breadcrumbs: [{ message: 'user breadcrumb' }],
      contexts: {
        // 'browser' is not a whitelisted context name — stripped
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
        // 'user-1' is not a session-prefixed ID — stripped
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

  it('beforeSend keeps session-prefixed user.id and strips all other user fields', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: 'test',
          user: {
            id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
            email: 'user@example.com',
            username: 'user',
          },
        }),
      ).toEqual({ message: 'test', user: { id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb' } });
    }
  });

  it('beforeSend strips user when id is not session-prefixed', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({ message: 'test', user: { id: 'install-abc', email: 'user@example.com' } }),
      ).toEqual({ message: 'test' });

      expect(beforeSend({ message: 'test', user: { email: 'user@example.com' } })).toEqual({
        message: 'test',
      });
    }
  });

  it('beforeSend accepts all context names and strips only denylist keys within them', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: 'test',
          contexts: {
            diagnostic: {
              operation: 'repositorySave',
              errorClass: 'DOMException',
              // domExceptionName: stripped — contains 'name' (denylist)
              domExceptionName: 'NotAllowedError',
              errorClassification: 'accessDenied',
              // path: stripped — in denylist
              path: '/user/private/doc',
            },
            storage: {
              provider: 'webFileSystem',
              failureClassification: 'storageFailure',
              pendingCount: 3,
            },
          },
        }),
      ).toEqual({
        message: 'test',
        contexts: {
          diagnostic: {
            operation: 'repositorySave',
            errorClass: 'DOMException',
            errorClassification: 'accessDenied',
          },
          storage: {
            provider: 'webFileSystem',
            failureClassification: 'storageFailure',
            pendingCount: 3,
          },
        },
      });
    }
  });

  it('beforeSend strips contexts whose fields are all denylist-blocked', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: 'test',
          contexts: {
            // browser.name is blocked (name is in denylist) — empty context stripped
            browser: { name: 'Chrome' },
            // runtime.name is blocked — empty context stripped
            runtime: { name: 'node' },
            // trace.trace_id survives (trace_id not in denylist)
            trace: { trace_id: 'abc' },
          },
        }),
      ).toEqual({ message: 'test', contexts: { trace: { trace_id: 'abc' } } });
    }
  });

  it('beforeSend strips forbidden fields from whitelisted contexts', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: 'test',
          contexts: {
            diagnostic: {
              // safe fields
              errorClass: 'DOMException',
              // forbidden fields — stripped
              path: '/private/doc',
              documentId: 'abc-123',
              storageKey: 'opfs://key',
              rawMessage: 'some error text',
            },
          },
        }),
      ).toEqual({
        message: 'test',
        contexts: { diagnostic: { errorClass: 'DOMException' } },
      });
    }
  });

  it('beforeSend drops whitelisted context that becomes empty after field sanitization', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: 'test',
          contexts: {
            diagnostic: {
              // all forbidden — context becomes empty → dropped
              path: '/private',
              documentId: 'abc',
            },
          },
        }),
      ).toEqual({ message: 'test' });
    }
  });

  it('beforeSend preserves core error event fields', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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

  it('default state is unknown and isSentryReportingEnabled returns false', async () => {
    const { getSentryReportingState, isSentryReportingEnabled } = await import('./sentryRuntime');
    expect(getSentryReportingState()).toBe('unknown');
    expect(isSentryReportingEnabled()).toBe(false);
  });

  it('beforeSend drops events when state is unknown', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setDiagnosticsRuntimeState({ reportingState: 'unknown', sessionId: TEST_SESSION_ID });

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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    setDiagnosticsRuntimeState({ reportingState: 'disabled', sessionId: TEST_SESSION_ID });

    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;
    const event = { message: 'test-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBeNull();
    }
  });

  describe('beforeSend diagnostic tag filtering', () => {
    const setupBeforeSend = async () => {
      const { initMock } = setupSentryMocks();
      const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
        await import('./sentryRuntime');

      registerSentryConfig({
        dsn: 'https://example@sentry.io/123',
        enabled: true,
      });
      setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
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

    it('non-denylist tags survive; only denylist-matching tags are removed', async () => {
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
          tags: { eventKind: 'diagnostic', customMetadata: 'some-value', internalFlag: 'true' },
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

    it('stage and providerKind tags survive since they are not in the denylist', async () => {
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
          tags: { stage: 'flush', providerKind: 'webFileSystem', result: 'failed' },
        });
      }
    });

    it('raw paths, file names, document ids, storage keys, and user messages do not survive as extras', async () => {
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
        });
      }
    });
  });

  it('beforeSend keeps failureClassification tag when present', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

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

  it('registers beforeBreadcrumb', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions?.beforeBreadcrumb).toEqual(expect.any(Function));
  });

  it('beforeSend keeps sanitized technical breadcrumbs only', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    const beforeSend = initOptions?.beforeSend;

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(
        beforeSend({
          message: '[diagnostic] repositoryStorage.saveQueued',
          breadcrumbs: [
            {
              category: 'repository.storage',
              data: {
                operation: 'repositorySave',
                path: '/secret',
              },
              message: 'repository save retry queued',
            },
            // ui.click with only target data: target is in denylist → data stripped → dropped
            { category: 'ui.click', data: { target: 'button[data-testid="submit"]' } },
          ],
        }),
      ).toEqual({
        message: '[diagnostic] repositoryStorage.saveQueued',
        breadcrumbs: [
          {
            category: 'repository.storage',
            data: {
              operation: 'repositorySave',
            },
            level: 'info',
            message: 'repository save retry queued',
          },
        ],
      });
    }
  });

  describe('beforeSend extra value filtering', () => {
    const setupBeforeSend = async () => {
      const { initMock } = setupSentryMocks();
      const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
        await import('./sentryRuntime');

      registerSentryConfig({
        dsn: 'https://example@sentry.io/123',
        enabled: true,
      });
      setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
      await ensureSentry();

      const initOptions = initMock.mock.calls[0]?.[0];
      return initOptions?.beforeSend;
    };

    it('keeps valid finite numeric counter extras', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: { pendingCount: 3, failedCount: 0, flushedCount: 5 },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { pendingCount: 3, failedCount: 0, flushedCount: 5 },
        });
      }
    });

    it('strips Infinity and NaN from numeric counter extras', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: { pendingCount: Infinity, failedCount: NaN, flushedCount: 3 },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { flushedCount: 3 },
        });
      }
    });

    it('keeps valid string error summary and correlation extras, drops denylist keys', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: {
          errorClass: 'DOMException',
          // domExceptionName: stripped — contains 'name' (denylist)
          domExceptionName: 'NotAllowedError',
          errorClassification: 'access',
          attemptId: 'abc-def-123',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: {
            errorClass: 'DOMException',
            errorClassification: 'access',
            attemptId: 'abc-def-123',
          },
        });
      }
    });

    it('strips object and array values even under allowed extra keys', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: {
          pendingCount: { count: 3 },
          errorClass: ['DOMException'],
          flushedCount: 2,
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { flushedCount: 2 },
        });
      }
    });

    it('strips function values under allowed extra keys', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- intentional bad value for test
        extra: { attemptId: (() => 'uuid') as unknown as string, errorClass: 'DOMException' },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { errorClass: 'DOMException' },
        });
      }
    });

    it('strips string extras exceeding the maximum allowed length', async () => {
      const beforeSend = await setupBeforeSend();
      const longString = 'a'.repeat(201);
      const event = {
        message: 'test',
        extra: { errorClass: longString, attemptId: 'valid-short-id' },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { attemptId: 'valid-short-id' },
        });
      }
    });

    it('strips unknown extra keys regardless of value type', async () => {
      const beforeSend = await setupBeforeSend();
      const event = {
        message: 'test',
        extra: {
          pendingCount: 1,
          secretKey: 'value',
          filePath: '/user/docs/secret.md',
          documentId: 'doc-abc',
        },
      };

      expect(beforeSend).toEqual(expect.any(Function));
      if (beforeSend instanceof Function) {
        expect(beforeSend(event)).toEqual({
          message: 'test',
          extra: { pendingCount: 1 },
        });
      }
    });
  });
});

describe('unified diagnostics runtime', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    flushDiagnosticsRuntimeEffectsMock.mockReset();
    clearDiagnosticsRuntimeEffectsMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.doUnmock('@sentry/vue');
  });

  it('worker-style init uses the shared Sentry options without worker-only overrides', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions?.dsn).toBe('https://example@sentry.io/123');
    expect(initOptions).not.toHaveProperty('defaultIntegrations');
  });

  it('main-thread-style init also uses shared options', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry(createApp(TestAppRoot));

    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions).not.toHaveProperty('defaultIntegrations');
  });

  it('setDiagnosticsRuntimeState enabled sets reporting state and applies session user', async () => {
    const { setUserMock, getImportAttempts } = setupSentryMocks();
    const {
      registerSentryConfig,
      ensureSentry,
      setDiagnosticsRuntimeState,
      getSentryReportingState,
      isSentryReportingEnabled,
    } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'enabled',
    });
    await ensureSentry();

    expect(getSentryReportingState()).toBe('enabled');
    expect(isSentryReportingEnabled()).toBe(true);
    expect(setUserMock).toHaveBeenCalledWith({
      id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });
    expect(flushDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
    expect(getImportAttempts()).toBe(1);
  });

  it('setDiagnosticsRuntimeState enabled applies session id to already-loaded Sentry', async () => {
    const { setUserMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: INITIAL_SESSION_ID });
    await ensureSentry(); // SDK loaded at this point

    setUserMock.mockClear();
    flushDiagnosticsRuntimeEffectsMock.mockClear();

    setDiagnosticsRuntimeState({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'enabled',
    });

    expect(setUserMock).toHaveBeenCalledWith({
      id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });
    expect(flushDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
  });

  it('setDiagnosticsRuntimeState disabled clears Sentry user and sets state', async () => {
    const { setUserMock } = setupSentryMocks();
    const {
      registerSentryConfig,
      ensureSentry,
      setDiagnosticsRuntimeState,
      getSentryReportingState,
    } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: INITIAL_SESSION_ID });
    await ensureSentry();

    setUserMock.mockClear();

    setDiagnosticsRuntimeState({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'disabled',
    });

    expect(getSentryReportingState()).toBe('disabled');
    expect(setUserMock).toHaveBeenCalledWith(null);
    expect(clearDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
  });

  it('setDiagnosticsRuntimeState unknown updates state without touching Sentry user', async () => {
    const { setUserMock } = setupSentryMocks();
    const {
      registerSentryConfig,
      ensureSentry,
      setDiagnosticsRuntimeState,
      getSentryReportingState,
    } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: INITIAL_SESSION_ID });
    await ensureSentry();

    setUserMock.mockClear();
    flushDiagnosticsRuntimeEffectsMock.mockClear();

    setDiagnosticsRuntimeState({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'unknown',
    });

    expect(getSentryReportingState()).toBe('unknown');
    expect(setUserMock).not.toHaveBeenCalled();
    expect(flushDiagnosticsRuntimeEffectsMock).not.toHaveBeenCalled();
    expect(clearDiagnosticsRuntimeEffectsMock).not.toHaveBeenCalled();
  });

  it('setDiagnosticsRuntimeState enabled fails closed for an invalid session id', async () => {
    const { setUserMock, getImportAttempts } = setupSentryMocks();
    const {
      registerSentryConfig,
      ensureSentry,
      setDiagnosticsRuntimeState,
      getSentryReportingState,
      isSentryReportingEnabled,
    } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: 'session:test' });

    expect(getSentryReportingState()).toBe('disabled');
    expect(isSentryReportingEnabled()).toBe(false);
    expect(getImportAttempts()).toBe(0);

    await ensureSentry();

    expect(setUserMock).toHaveBeenCalledWith(null);
    expect(setUserMock).not.toHaveBeenCalledWith({ id: 'session:test' });
    expect(flushDiagnosticsRuntimeEffectsMock).not.toHaveBeenCalled();
    expect(clearDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
  });

  it('setDiagnosticsRuntimeState enabled does not flush or set user for an invalid session after init', async () => {
    const { setUserMock } = setupSentryMocks();
    const {
      registerSentryConfig,
      ensureSentry,
      setDiagnosticsRuntimeState,
      getSentryReportingState,
    } = await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: INITIAL_SESSION_ID });
    await ensureSentry();

    setUserMock.mockClear();
    flushDiagnosticsRuntimeEffectsMock.mockClear();
    clearDiagnosticsRuntimeEffectsMock.mockClear();

    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: 'session:test' });

    expect(getSentryReportingState()).toBe('disabled');
    expect(setUserMock).toHaveBeenCalledWith(null);
    expect(setUserMock).not.toHaveBeenCalledWith({ id: 'session:test' });
    expect(flushDiagnosticsRuntimeEffectsMock).not.toHaveBeenCalled();
    expect(clearDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
  });

  it('setDiagnosticsRuntimeState does not add breadcrumbs for non-enabled transitions', async () => {
    const { addBreadcrumbMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });
    await ensureSentry();

    addBreadcrumbMock.mockClear();

    setDiagnosticsRuntimeState({ reportingState: 'unknown', sessionId: TEST_SESSION_ID });
    setDiagnosticsRuntimeState({ reportingState: 'disabled', sessionId: TEST_SESSION_ID });

    expect(addBreadcrumbMock).not.toHaveBeenCalled();
  });

  it('setDiagnosticsRuntimeState before init: pending session is applied when ensureSentry completes', async () => {
    const { setUserMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    registerSentryConfig({ dsn: 'https://example@sentry.io/123', enabled: true });
    setDiagnosticsRuntimeState({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'enabled',
    });

    // SDK not loaded yet — setUser not called yet
    expect(setUserMock).not.toHaveBeenCalled();

    await ensureSentry();

    // Now pending session is applied
    expect(setUserMock).toHaveBeenCalledWith({
      id: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
    });
    expect(flushDiagnosticsRuntimeEffectsMock).toHaveBeenCalledOnce();
  });

  it('worker init uses same shared runtime as main: same facade, same beforeSend', async () => {
    const { initMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry, useSentry, setDiagnosticsRuntimeState } =
      await import('./sentryRuntime');

    // Simulate worker-style registration
    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });
    setDiagnosticsRuntimeState({ reportingState: 'enabled', sessionId: TEST_SESSION_ID });

    const facade = await ensureSentry();

    // Same facade accessible via useSentry
    expect(facade).toBe(useSentry());

    // beforeSend is registered (same shared sanitizer)
    const initOptions = initMock.mock.calls[0]?.[0];
    expect(initOptions?.beforeSend).toEqual(expect.any(Function));
    expect(initOptions).not.toHaveProperty('defaultIntegrations');
  });
});
