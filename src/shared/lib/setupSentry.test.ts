import { createApp } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

const TestAppRoot = {
  template: '<div />',
};

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    resolve,
    reject,
  } satisfies Deferred<T>;
};

const setupSentryMocks = (options?: {
  moduleGate?: Deferred<undefined>;
}) => {
  const initMock = vi.fn();
  const replayIntegrationMock = vi.fn(() => ({ name: 'replay' }));
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
    replayIntegration: replayIntegrationMock,
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

  vi.doMock('@sentry/vue', async () => {
    if (options?.moduleGate) {
      await options.moduleGate.promise;
    }

    return sentryModule;
  });

  return {
    initMock,
    replayIntegrationMock,
    captureMessageMock,
    setUserMock,
    flushMock,
    withScopeMock,
    startSpanManualMock,
    startInactiveSpanMock,
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
    const { initMock, replayIntegrationMock } = setupSentryMocks();
    const { registerSentryConfig, ensureSentry } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    const [firstFacade, secondFacade] = await Promise.all([ensureSentry(app), ensureSentry(app)]);

    expect(firstFacade).toBe(secondFacade);
    expect(initMock).toHaveBeenCalledTimes(1);
    expect(replayIntegrationMock).toHaveBeenCalledTimes(1);
    expect(initMock).toHaveBeenCalledWith({
      app,
      dsn: 'https://example@sentry.io/123',
      integrations: [{ name: 'replay' }],
      tracesSampleRate: 0.7,
      replaysSessionSampleRate: 0.7,
      replaysOnErrorSampleRate: 1.0,
    });
  });

  it('delegates proxied SDK calls after initialization, including non-curated methods', async () => {
    const { captureMessageMock, setUserMock, flushMock, startInactiveSpanMock } = setupSentryMocks();
    const { sentryPlugin, ensureSentry, useSentry } = await import('./setupSentry');
    const app = createApp(TestAppRoot);

    app.use(sentryPlugin, {
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

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

  it('kicks off initialization from facade usage while staying callable during the async gap', async () => {
    const moduleGate = createDeferred<undefined>();
    const { initMock, captureMessageMock } = setupSentryMocks({ moduleGate });
    const { registerSentryConfig, useSentry } = await import('./setupSentry');

    registerSentryConfig({
      dsn: 'https://example@sentry.io/123',
      enabled: true,
    });

    expect(useSentry().captureMessage('before-ready')).toBeUndefined();
    expect(captureMessageMock).not.toHaveBeenCalled();

    moduleGate.resolve(undefined);

    await vi.waitFor(() => {
      expect(initMock).toHaveBeenCalledTimes(1);
    });

    expect(useSentry().captureMessage('after-ready')).toBe('message-id');
    expect(captureMessageMock).toHaveBeenCalledOnce();
    expect(captureMessageMock).toHaveBeenCalledWith('after-ready');
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
});
