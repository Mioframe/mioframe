import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const waitForAsyncWork = async () => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

const {
  ensureSentryMock,
  isSentryConfiguredMock,
  getSentryReportingStateMock,
  captureExceptionMock,
} = vi.hoisted(() => ({
  ensureSentryMock: vi.fn(),
  isSentryConfiguredMock: vi.fn(() => true),
  getSentryReportingStateMock: vi.fn(() => 'enabled'),
  captureExceptionMock: vi.fn<
    (exception: unknown, captureContext?: Record<string, unknown>) => string | undefined
  >(() => 'event-id'),
}));

vi.mock('./sentryRuntime', () => ({
  ensureSentry: ensureSentryMock,
  isSentryConfigured: isSentryConfiguredMock,
  getSentryReportingState: getSentryReportingStateMock,
}));

describe('captureDiagnosticException', () => {
  beforeEach(() => {
    vi.resetModules();
    ensureSentryMock.mockReset();
    ensureSentryMock.mockResolvedValue({ captureException: captureExceptionMock });
    isSentryConfiguredMock.mockReset();
    isSentryConfiguredMock.mockReturnValue(true);
    getSentryReportingStateMock.mockReset();
    getSentryReportingStateMock.mockReturnValue('enabled');
    captureExceptionMock.mockReset();
    captureExceptionMock.mockReturnValue('event-id');
  });

  afterEach(async () => {
    await waitForAsyncWork();
    vi.clearAllMocks();
  });

  it('reports a real Error with eventKind tag and no contexts when no context provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error);
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
    });
  });

  it('attaches diagnostic context when operation and failureClassification are provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {
      operation: 'repositorySave',
      failureClassification: 'accessRequired',
    });
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
      contexts: {
        diagnostic: {
          operation: 'repositorySave',
          failureClassification: 'accessRequired',
        },
      },
    });
  });

  it('includes feature and action in tags when provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, { feature: 'importDocument', action: 'import' });
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException', feature: 'importDocument', action: 'import' },
    });
  });

  it('merges scopeTags with standard tags', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, undefined, { provider: 'indexedDb' });
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException', provider: 'indexedDb' },
    });
  });

  it('wraps a non-Error value in a synthetic Error', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');

    captureDiagnosticException('raw string error');
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ eventKind: 'handledException' }) }),
    );
  });

  it('omits contexts when context object is empty', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {});
    await waitForAsyncWork();

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
    });
  });

  it('does not send when reporting state is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    const { captureDiagnosticException } = await import('./captureDiagnosticException');

    captureDiagnosticException(new Error('boom'));
    await waitForAsyncWork();

    expect(captureExceptionMock).not.toHaveBeenCalled();
  });

  it('does not throw when Sentry is not configured', async () => {
    isSentryConfiguredMock.mockReturnValue(false);
    const { captureDiagnosticException } = await import('./captureDiagnosticException');

    expect(() => {
      captureDiagnosticException(new Error('boom'));
    }).not.toThrow();
  });

  describe('bounded queue while reporting state is unknown', () => {
    it('keeps the exception queued instead of dropping it while state is unknown', async () => {
      getSentryReportingStateMock.mockReturnValue('unknown');
      const { captureDiagnosticException } = await import('./captureDiagnosticException');

      captureDiagnosticException(new Error('boom'));
      await waitForAsyncWork();

      expect(captureExceptionMock).not.toHaveBeenCalled();
      expect(ensureSentryMock).not.toHaveBeenCalled();
    });

    it('flushes the queued exception, preserving the original Error object, once state becomes enabled', async () => {
      getSentryReportingStateMock.mockReturnValue('unknown');
      const { captureDiagnosticException, flushQueuedDiagnosticExceptions } =
        await import('./captureDiagnosticException');
      const error = new Error('queued boom');

      captureDiagnosticException(error, { operation: 'repositorySave' });
      await waitForAsyncWork();
      expect(captureExceptionMock).not.toHaveBeenCalled();

      getSentryReportingStateMock.mockReturnValue('enabled');
      flushQueuedDiagnosticExceptions();
      await waitForAsyncWork();

      expect(captureExceptionMock).toHaveBeenCalledWith(error, {
        tags: { eventKind: 'handledException' },
        contexts: { diagnostic: { operation: 'repositorySave' } },
      });
    });

    it('clears the queue when reporting becomes disabled', async () => {
      getSentryReportingStateMock.mockReturnValue('unknown');
      const { captureDiagnosticException, clearQueuedDiagnosticExceptions } =
        await import('./captureDiagnosticException');

      captureDiagnosticException(new Error('boom'));
      await waitForAsyncWork();

      clearQueuedDiagnosticExceptions();

      getSentryReportingStateMock.mockReturnValue('enabled');
      const { flushQueuedDiagnosticExceptions } = await import('./captureDiagnosticException');
      flushQueuedDiagnosticExceptions();
      await waitForAsyncWork();

      expect(captureExceptionMock).not.toHaveBeenCalled();
    });

    it('bounds the queue so an unbounded burst before consent resolves cannot grow it forever', async () => {
      getSentryReportingStateMock.mockReturnValue('unknown');
      const { captureDiagnosticException, flushQueuedDiagnosticExceptions } =
        await import('./captureDiagnosticException');

      for (let index = 0; index < 60; index += 1) {
        captureDiagnosticException(new Error(`boom-${index}`));
      }
      await waitForAsyncWork();

      getSentryReportingStateMock.mockReturnValue('enabled');
      flushQueuedDiagnosticExceptions();
      await waitForAsyncWork();

      expect(captureExceptionMock).toHaveBeenCalledTimes(50);
      // The oldest 10 were dropped to keep the queue bounded — the earliest surviving entry is boom-10.
      expect(captureExceptionMock.mock.calls[0]?.[0]).toEqual(new Error('boom-10'));
    });
  });

  it('does not produce an unhandled rejection when ensureSentry rejects', async () => {
    ensureSentryMock.mockRejectedValue(new Error('Sentry init failed'));
    const { captureDiagnosticException } = await import('./captureDiagnosticException');

    expect(() => {
      captureDiagnosticException(new Error('boom'));
    }).not.toThrow();

    await expect(waitForAsyncWork()).resolves.toBeUndefined();
  });
});
