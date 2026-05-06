import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

type MockSentryScope = {
  setExtras: ReturnType<typeof vi.fn>;
  setTag: ReturnType<typeof vi.fn>;
};

type MockSentryFacade = {
  captureException: ReturnType<typeof vi.fn>;
  withScope: ReturnType<typeof vi.fn>;
};

const getReportedErrors = (facade: MockSentryFacade) =>
  facade.captureException.mock.calls
    .map((call) => call[0])
    .filter((value): value is Error => value instanceof Error);

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    reject,
    resolve,
  } satisfies Deferred<T>;
};

const waitForAsyncWork = async () => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

const { ensureSentryMock, mockScope, noopFacade, realFacade, throwingFacade } = vi.hoisted(() => {
  const scopeSetTagMock = vi.fn();
  const scopeSetExtrasMock = vi.fn();
  const scope = {
    setExtras: scopeSetExtrasMock,
    setTag: scopeSetTagMock,
  };

  const createFacade = (captureResult?: string) => {
    const captureException = vi.fn<(error: Error) => string | undefined>(() => captureResult);
    const withScope = vi.fn((callback: (innerScope: MockSentryScope) => unknown) =>
      callback(scope),
    );

    return {
      captureException,
      withScope,
    } satisfies MockSentryFacade;
  };

  const facadeThatThrows = {
    captureException: vi.fn<(error: Error) => string | undefined>(() => {
      throw new Error('capture failed');
    }),
    withScope: vi.fn((callback: (innerScope: MockSentryScope) => unknown) => callback(scope)),
  } satisfies MockSentryFacade;

  return {
    ensureSentryMock: vi.fn(),
    mockScope: scope,
    noopFacade: createFacade(undefined),
    realFacade: createFacade('event-id'),
    throwingFacade: facadeThatThrows,
  };
});

vi.mock('./setupSentry', () => ({
  ensureSentry: ensureSentryMock,
}));

describe('reportHandledError', () => {
  beforeEach(() => {
    vi.resetModules();
    ensureSentryMock.mockReset();
    mockScope.setExtras.mockReset();
    mockScope.setTag.mockReset();
    noopFacade.captureException.mockClear();
    noopFacade.withScope.mockClear();
    realFacade.captureException.mockClear();
    realFacade.withScope.mockClear();
    throwingFacade.captureException.mockClear();
    throwingFacade.withScope.mockClear();
  });

  afterEach(async () => {
    await waitForAsyncWork();
    vi.clearAllMocks();
  });

  it('reports the DomainError cause and stores the user-facing message after Sentry resolves', async () => {
    const gate = createDeferred<MockSentryFacade>();
    ensureSentryMock.mockReturnValue(gate.promise);

    const { DomainError } = await import('@shared/lib/error');
    const { reportHandledError } = await import('./reportHandledError');
    const cause = new Error('write failed');

    reportHandledError(new DomainError('Could not save', { cause }), {
      feature: 'documents',
      action: 'save',
      path: '/docs/a',
    });

    expect(realFacade.captureException).not.toHaveBeenCalled();

    gate.resolve(realFacade);

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(cause);
    });

    expect(mockScope.setExtras).toHaveBeenCalledWith({
      path: '/docs/a',
      userMessage: 'Could not save',
    });
  });

  it('reports a regular Error directly', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');
    const error = new Error('boom');

    reportHandledError(error, {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(error);
    });
    expect(mockScope.setExtras).not.toHaveBeenCalled();
  });

  it('wraps a non-Error and preserves the original thrown value', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError('boom', {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(expect.any(Error));
    });
    expect(getReportedErrors(realFacade)[0]).toMatchObject({
      message: 'Handled non-error exception',
    });
    expect(mockScope.setExtras).toHaveBeenCalledWith({
      originalError: 'boom',
    });
  });

  it('queues handled reports until lazy Sentry initialization completes', async () => {
    const gate = createDeferred<MockSentryFacade>();
    ensureSentryMock.mockReturnValue(gate.promise);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('boom'), {
      feature: 'documents',
      action: 'save',
    });

    expect(realFacade.captureException).not.toHaveBeenCalled();

    gate.resolve(realFacade);

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'boom' }),
      );
    });
  });

  it('retries queued entries after a no-op facade returns an undefined event id', async () => {
    ensureSentryMock.mockResolvedValueOnce(noopFacade).mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(noopFacade.captureException).toHaveBeenCalledTimes(1);
    });

    reportHandledError(new Error('second'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(2);
    });
    expect(getReportedErrors(realFacade).map((error) => error.message)).toEqual([
      'first',
      'second',
    ]);
  });

  it('keeps entries queued when withScope or captureException throws', async () => {
    ensureSentryMock.mockResolvedValueOnce(throwingFacade).mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    expect(() => {
      reportHandledError(new Error('boom'), {
        feature: 'documents',
        action: 'save',
      });
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(throwingFacade.captureException).toHaveBeenCalledTimes(1);
    });

    reportHandledError(new Error('retry'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(2);
    });
    expect(getReportedErrors(realFacade).map((error) => error.message)).toEqual(['boom', 'retry']);
  });

  it('drops the oldest queued entries when the queue limit is exceeded', async () => {
    const gate = createDeferred<MockSentryFacade>();
    ensureSentryMock.mockReturnValue(gate.promise);

    const { reportHandledError } = await import('./reportHandledError');

    for (let index = 0; index < 52; index += 1) {
      reportHandledError(new Error(`boom-${index}`), {
        feature: 'documents',
        action: 'save',
      });
    }

    gate.resolve(realFacade);

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(50);
    });
    expect(getReportedErrors(realFacade)[0]).toMatchObject({
      message: 'boom-2',
    });
    expect(getReportedErrors(realFacade).at(-1)).toMatchObject({
      message: 'boom-51',
    });
  });

  it('starts only one flush while Sentry initialization is already in flight', async () => {
    const gate = createDeferred<MockSentryFacade>();
    ensureSentryMock.mockReturnValue(gate.promise);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });
    reportHandledError(new Error('second'), {
      feature: 'documents',
      action: 'save',
    });

    expect(ensureSentryMock).toHaveBeenCalledTimes(1);

    gate.resolve(realFacade);

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(2);
    });
  });

  it('keeps an entry added during flush and sends it in the follow-up flush', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');
    const triggerSecondEntry = vi.fn(() => {
      reportHandledError(new Error('second'), {
        feature: 'documents',
        action: 'save',
      });

      return 'event-id';
    });

    realFacade.captureException.mockImplementationOnce((error: Error) => {
      expect(error.message).toBe('first');
      return triggerSecondEntry();
    });

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(2);
    });

    expect(getReportedErrors(realFacade).map((error) => error.message)).toEqual([
      'first',
      'second',
    ]);
    expect(ensureSentryMock).toHaveBeenCalledTimes(2);
  });

  it('preserves failed entries and new entries added during flush for the next successful retry', async () => {
    ensureSentryMock.mockResolvedValueOnce(noopFacade).mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    noopFacade.captureException.mockImplementationOnce((error: Error) => {
      expect(error.message).toBe('first');
      reportHandledError(new Error('second'), {
        feature: 'documents',
        action: 'save',
      });

      return undefined;
    });

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(2);
    });

    expect(getReportedErrors(realFacade).map((error) => error.message)).toEqual([
      'first',
      'second',
    ]);
    expect(noopFacade.captureException).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).toHaveBeenCalledTimes(2);
  });
});
