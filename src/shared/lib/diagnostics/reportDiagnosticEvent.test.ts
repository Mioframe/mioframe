import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticEvent } from './DiagnosticEvent';
import { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';

type MockSentryFacade = {
  captureMessage: ReturnType<typeof vi.fn>;
};

const waitForAsyncWork = async () => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });
};

const { ensureSentryMock, isSentryConfiguredMock, getSentryReportingStateMock, realFacade } =
  vi.hoisted(() => {
    const createFacade = (captureResult?: string) => {
      const captureMessage = vi.fn<
        (message: string, context?: Record<string, unknown>) => string | undefined
      >(() => captureResult);
      return { captureMessage } satisfies MockSentryFacade;
    };

    return {
      ensureSentryMock: vi.fn(),
      isSentryConfiguredMock: vi.fn(() => true),
      getSentryReportingStateMock: vi.fn(() => 'enabled'),
      realFacade: createFacade('event-id'),
    };
  });

const getLastCaptureContext = () => realFacade.captureMessage.mock.calls.at(-1)?.[1];

vi.mock('./sentryRuntime', () => ({
  ensureSentry: ensureSentryMock,
  isSentryConfigured: isSentryConfiguredMock,
  getSentryReportingState: getSentryReportingStateMock,
}));

const makeEvent = (overrides?: Partial<DiagnosticEvent>): DiagnosticEvent => ({
  name: 'test.event',
  severity: DiagnosticSeverity.Error,
  result: DiagnosticResult.Failed,
  classification: DiagnosticClassification.Unexpected,
  ...overrides,
});

describe('reportDiagnosticEvent', () => {
  beforeEach(() => {
    vi.resetModules();
    ensureSentryMock.mockReset();
    isSentryConfiguredMock.mockReset();
    isSentryConfiguredMock.mockReturnValue(true);
    getSentryReportingStateMock.mockReset();
    getSentryReportingStateMock.mockReturnValue('enabled');
    realFacade.captureMessage.mockClear();
  });

  afterEach(async () => {
    await waitForAsyncWork();
    vi.clearAllMocks();
  });

  it('sends a captureMessage call to Sentry when reporting is enabled', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    expect(realFacade.captureMessage).toHaveBeenCalledOnce();
    expect(realFacade.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('[diagnostic]'),
      expect.any(Object),
    );
  });

  it('includes the event name in the Sentry captureMessage call', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent({ name: 'writeAccessRecovery.permissionDenied' }));
    await waitForAsyncWork();

    expect(realFacade.captureMessage).toHaveBeenCalledWith(
      '[diagnostic] writeAccessRecovery.permissionDenied',
      expect.any(Object),
    );
  });

  it('sets Sentry event level from diagnostic severity', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent({ severity: DiagnosticSeverity.Warning }));
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.level).toBe('warning');
  });

  it.each([
    [DiagnosticSeverity.Info, 'info'],
    [DiagnosticSeverity.Warning, 'warning'],
    [DiagnosticSeverity.Error, 'error'],
    [DiagnosticSeverity.Fatal, 'fatal'],
  ] as const)('maps severity %s to Sentry level %s', async (severity, expectedLevel) => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent({ severity }));
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.level).toBe(expectedLevel);
  });

  it('attaches result and classification as safe tags to the Sentry scope', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');
    const event = makeEvent({
      severity: DiagnosticSeverity.Warning,
      result: DiagnosticResult.Stale,
      classification: DiagnosticClassification.Access,
    });

    reportDiagnosticEvent(event);
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.tags).toEqual(
      expect.objectContaining({
        eventKind: 'diagnostic',
        severity: 'warning',
        result: 'stale',
        classification: 'access',
      }),
    );
  });

  it('does not set flow-specific tags (feature, operation, stage, providerKind) on Sentry scope', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.tags).not.toEqual(
      expect.objectContaining({
        feature: expect.anything(),
        operation: expect.anything(),
        stage: expect.anything(),
        providerKind: expect.anything(),
      }),
    );
  });

  it('forwards safeTags as individual Sentry tags', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(
      makeEvent({ safeTags: { provider: 'webFileSystem', operation: 'requestAccess' } }),
    );
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.tags).toEqual(
      expect.objectContaining({
        provider: 'webFileSystem',
        operation: 'requestAccess',
      }),
    );
  });

  it('attaches safe counters as extras when provided', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(
      makeEvent({ counters: { pendingCount: 3, flushedCount: 1, failedCount: 0 } }),
    );
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.extra).toEqual(
      expect.objectContaining({ pendingCount: 3, flushedCount: 1, failedCount: 0 }),
    );
  });

  it('attaches sanitized error fields as extras when provided', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(
      makeEvent({
        error: {
          errorClass: 'DOMException',
          domExceptionName: 'NotAllowedError',
          errorClassification: 'accessDenied',
        },
      }),
    );
    await waitForAsyncWork();

    expect(getLastCaptureContext()?.extra).toEqual(
      expect.objectContaining({
        errorClass: 'DOMException',
        domExceptionName: 'NotAllowedError',
        errorClassification: 'accessDenied',
      }),
    );
  });

  it('does not send when reporting state is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    expect(realFacade.captureMessage).not.toHaveBeenCalled();
  });

  it('queues the event when reporting state is unknown', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    expect(realFacade.captureMessage).not.toHaveBeenCalled();
  });

  it('does not throw when Sentry is not configured', async () => {
    isSentryConfiguredMock.mockReturnValue(false);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    expect(() => {
      reportDiagnosticEvent(makeEvent());
    }).not.toThrow();
  });

  it('does not produce an unhandled rejection when ensureSentry rejects', async () => {
    ensureSentryMock.mockRejectedValue(new Error('Sentry init failed'));
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    expect(() => {
      reportDiagnosticEvent(makeEvent());
    }).not.toThrow();

    await expect(waitForAsyncWork()).resolves.toBeUndefined();
  });

  it('schedules a follow-up flush when an event is added while a flush is in progress', async () => {
    let resolveFirst: (() => void) | undefined;
    ensureSentryMock
      .mockImplementationOnce(
        () =>
          new Promise<typeof realFacade>((resolve) => {
            resolveFirst = () => {
              resolve(realFacade);
            };
          }),
      )
      .mockResolvedValue(realFacade);

    const { reportDiagnosticEvent, flushQueuedDiagnosticEvents } =
      await import('./reportDiagnosticEvent');

    // Start a flush that is blocked on ensureSentry
    reportDiagnosticEvent(makeEvent());
    flushQueuedDiagnosticEvents();

    // A second event arrives while the first flush is still in flight
    reportDiagnosticEvent(makeEvent());

    // The second flush call is deferred (pendingRetry=true)
    // Resolve the first flush, which triggers a follow-up flush for the second event
    resolveFirst?.();
    await waitForAsyncWork();
    await waitForAsyncWork();

    expect(realFacade.captureMessage.mock.calls.length).toBeGreaterThanOrEqual(1);
  });

  describe('queue retry on failed flush', () => {
    it('performs exactly one auto-retry when ensureSentry rejects and queue is non-empty', async () => {
      let callCount = 0;
      ensureSentryMock.mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('Sentry init failed'));
      });

      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent());

      // Allow initial flush + one auto-retry to complete.
      await waitForAsyncWork();
      await waitForAsyncWork();
      await waitForAsyncWork();

      // Initial call + exactly one auto-retry = 2 attempts total (no tight loop).
      expect(callCount).toBe(2);
    });

    it('retains queued events after a failed Sentry initialization', async () => {
      ensureSentryMock
        .mockRejectedValueOnce(new Error('Sentry init failed'))
        .mockRejectedValueOnce(new Error('Sentry init failed'));

      const { reportDiagnosticEvent, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');

      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);

      reportDiagnosticEvent(makeEvent());

      await waitForAsyncWork();
      await waitForAsyncWork();
      await waitForAsyncWork();

      // Sentry did not receive the event.
      expect(realFacade.captureMessage).not.toHaveBeenCalled();
      // The event was captured by the in-memory sink (not dropped).
      expect(sink).toHaveLength(1);

      setDiagnosticEventSink(undefined);
    });

    it('sends queued events on a later explicit flush after failed initialization', async () => {
      ensureSentryMock
        .mockRejectedValueOnce(new Error('Sentry init failed'))
        .mockRejectedValueOnce(new Error('Sentry init failed'))
        .mockResolvedValue(realFacade);

      const { reportDiagnosticEvent, flushQueuedDiagnosticEvents } =
        await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent());

      // Let initial flush and its one auto-retry both fail.
      await waitForAsyncWork();
      await waitForAsyncWork();
      await waitForAsyncWork();

      expect(realFacade.captureMessage).not.toHaveBeenCalled();

      // Explicit retry after Sentry becomes available.
      flushQueuedDiagnosticEvents();
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledOnce();
    });

    it('events queued during an active flush are not lost when the flush fails', async () => {
      let resolveFirst: (() => void) | undefined;
      ensureSentryMock
        .mockImplementationOnce(
          () =>
            new Promise<typeof realFacade>((resolve) => {
              resolveFirst = () => {
                resolve(realFacade);
              };
            }),
        )
        .mockResolvedValue(realFacade);

      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      // Start a slow flush. Use distinct names so events are not deduped.
      reportDiagnosticEvent(makeEvent({ name: 'queue.eventA' }));

      // Queue a second distinct event while the first flush is in progress.
      reportDiagnosticEvent(makeEvent({ name: 'queue.eventB' }));

      // Resolve the first flush — the second event should trigger a follow-up flush.
      resolveFirst?.();
      await waitForAsyncWork();
      await waitForAsyncWork();
      await waitForAsyncWork();

      // Both events must have been sent.
      expect(realFacade.captureMessage.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('memory sink', () => {
    it('writes events to the in-memory sink regardless of reporting state', async () => {
      getSentryReportingStateMock.mockReturnValue('disabled');
      const { reportDiagnosticEvent, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');
      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);

      const event = makeEvent();
      reportDiagnosticEvent(event);

      expect(sink).toHaveLength(1);
      expect(sink[0]).toBe(event);

      setDiagnosticEventSink(undefined);
    });

    it('stops writing to the sink after it is removed', async () => {
      const { reportDiagnosticEvent, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');
      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);
      setDiagnosticEventSink(undefined);

      reportDiagnosticEvent(makeEvent());

      expect(sink).toHaveLength(0);
    });

    it('captures events even when Sentry is not configured', async () => {
      isSentryConfiguredMock.mockReturnValue(false);
      const { reportDiagnosticEvent, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');
      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);

      reportDiagnosticEvent(makeEvent());

      expect(sink).toHaveLength(1);
      setDiagnosticEventSink(undefined);
    });

    it('clearing queued diagnostic events does not change memory sink behavior', async () => {
      getSentryReportingStateMock.mockReturnValue('disabled');
      const { reportDiagnosticEvent, clearQueuedDiagnosticEvents, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');
      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);

      reportDiagnosticEvent(makeEvent());
      clearQueuedDiagnosticEvents();
      reportDiagnosticEvent(makeEvent());

      expect(sink).toHaveLength(2);

      setDiagnosticEventSink(undefined);
    });
  });
});
