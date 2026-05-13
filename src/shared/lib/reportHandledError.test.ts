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

const {
  ensureSentryMock,
  isSentryConfiguredMock,
  getSentryReportingStateMock,
  mockScope,
  noopFacade,
  realFacade,
  throwingFacade,
} = vi.hoisted(() => {
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
    isSentryConfiguredMock: vi.fn(() => true),
    getSentryReportingStateMock: vi.fn(() => 'enabled'),
    mockScope: scope,
    noopFacade: createFacade(undefined),
    realFacade: createFacade('event-id'),
    throwingFacade: facadeThatThrows,
  };
});

vi.mock('./setupSentry', () => ({
  ensureSentry: ensureSentryMock,
  isSentryConfigured: isSentryConfiguredMock,
  getSentryReportingState: getSentryReportingStateMock,
}));

describe('reportHandledError', () => {
  beforeEach(() => {
    vi.resetModules();
    ensureSentryMock.mockReset();
    isSentryConfiguredMock.mockReset();
    isSentryConfiguredMock.mockReturnValue(true);
    getSentryReportingStateMock.mockReset();
    getSentryReportingStateMock.mockReturnValue('enabled');
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

  it('reports the DomainError cause and stores the user-facing message and code after Sentry resolves', async () => {
    const gate = createDeferred<MockSentryFacade>();
    ensureSentryMock.mockReturnValue(gate.promise);

    const { DomainError } = await import('@shared/lib/error');
    const { reportHandledError } = await import('./reportHandledError');
    const cause = new Error('write failed');

    reportHandledError(
      new DomainError('Could not save', {
        cause,
        code: 'document-export-failed',
      }),
      {
        feature: 'documents',
        action: 'save',
      },
    );

    expect(realFacade.captureException).not.toHaveBeenCalled();

    gate.resolve(realFacade);

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(cause);
    });

    expect(mockScope.setExtras).toHaveBeenCalledWith({
      userMessage: 'Could not save',
      domainErrorCode: 'document-export-failed',
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

  it('wraps a non-Error without preserving the original thrown value', async () => {
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
      originalThrownType: 'string',
    });
  });

  it('does not send a user path in handled error extras', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { DomainError } = await import('@shared/lib/error');
    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(
      new DomainError('Could not save', {
        cause: new Error('Could not save the document'),
      }),
      {
        feature: 'documents',
        action: 'save',
      },
    );

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalled();
    });
    expect(mockScope.setExtras).toHaveBeenCalledWith({
      userMessage: 'Could not save',
    });
    expect(mockScope.setExtras).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: '/docs/a' }),
    );
  });

  it('accepts only feature and action metadata, without path options', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('boom'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(expect.any(Error));
    });
    expect(mockScope.setTag).toHaveBeenCalledWith('feature', 'documents');
    expect(mockScope.setTag).toHaveBeenCalledWith('action', 'save');
    expect(mockScope.setExtras).not.toHaveBeenCalledWith(
      expect.objectContaining({ path: expect.anything() }),
    );
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

  it('does not queue new reports and clears the queue when Sentry is not configured', async () => {
    const { reportHandledError } = await import('./reportHandledError');

    ensureSentryMock.mockResolvedValue(realFacade);

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });
    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledTimes(1);
    });

    isSentryConfiguredMock.mockReturnValue(false);

    reportHandledError(new Error('second'), {
      feature: 'documents',
      action: 'save',
    });

    isSentryConfiguredMock.mockReturnValue(true);
    const { flushQueuedHandledReports } = await import('./reportHandledError');
    flushQueuedHandledReports();

    await waitForAsyncWork();
    expect(realFacade.captureException).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).toHaveBeenCalledTimes(1);
  });

  it('queues but does not flush while reporting state is unknown', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError, flushQueuedHandledReports } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(realFacade.captureException).not.toHaveBeenCalled();

    getSentryReportingStateMock.mockReturnValue('enabled');
    flushQueuedHandledReports();

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'first' }),
      );
    });
  });

  it('does not queue new reports when reporting is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    ensureSentryMock.mockResolvedValue(noopFacade);

    const { reportHandledError, flushQueuedHandledReports } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await waitForAsyncWork();

    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(noopFacade.captureException).not.toHaveBeenCalled();

    getSentryReportingStateMock.mockReturnValue('enabled');
    flushQueuedHandledReports();

    await waitForAsyncWork();
    expect(realFacade.captureException).not.toHaveBeenCalled();
  });

  it('queues and flushes when reporting is enabled', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('boom'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(realFacade.captureException).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'boom' }),
      );
    });
  });

  it('unconfigured clears queue so unknown errors are lost', async () => {
    const gate = createDeferred<MockSentryFacade>();
    getSentryReportingStateMock.mockReturnValue('unknown');
    ensureSentryMock.mockReturnValue(gate.promise);

    const { reportHandledError, flushQueuedHandledReports } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    expect(realFacade.captureException).not.toHaveBeenCalled();

    isSentryConfiguredMock.mockReturnValue(false);

    reportHandledError(new Error('second'), {
      feature: 'documents',
      action: 'save',
    });

    isSentryConfiguredMock.mockReturnValue(true);
    getSentryReportingStateMock.mockReturnValue('enabled');

    flushQueuedHandledReports();
    gate.resolve(realFacade);

    await waitForAsyncWork();
    expect(realFacade.captureException).not.toHaveBeenCalled();
  });

  it('keeps a failed entry queued without starting an infinite retry loop when Sentry is configured but still no-op', async () => {
    ensureSentryMock.mockResolvedValue(noopFacade);

    const { reportHandledError } = await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(noopFacade.captureException).toHaveBeenCalledTimes(1);
    });

    await waitForAsyncWork();
    await waitForAsyncWork();

    expect(ensureSentryMock).toHaveBeenCalledTimes(1);
    expect(noopFacade.captureException).toHaveBeenCalledTimes(1);
  });

  it('retries queued entries on the next reportHandledError call after a configured no-op facade', async () => {
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
    expect(ensureSentryMock).toHaveBeenCalledTimes(2);
  });

  it('clearQueuedHandledReports prevents later retry', async () => {
    ensureSentryMock.mockResolvedValue(noopFacade);

    const { clearQueuedHandledReports, flushQueuedHandledReports, reportHandledError } =
      await import('./reportHandledError');

    reportHandledError(new Error('first'), {
      feature: 'documents',
      action: 'save',
    });

    await vi.waitFor(() => {
      expect(noopFacade.captureException).toHaveBeenCalledTimes(1);
    });

    clearQueuedHandledReports();
    ensureSentryMock.mockResolvedValue(realFacade);
    flushQueuedHandledReports();

    await waitForAsyncWork();
    expect(realFacade.captureException).not.toHaveBeenCalled();
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
  });
});
