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
    const event = { message: 'test-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBe(event);
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
    const event = { message: 'setup-event' };

    expect(beforeSend).toEqual(expect.any(Function));
    if (beforeSend instanceof Function) {
      expect(beforeSend(event)).toBe(event);
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
});
