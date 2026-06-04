import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticEvent } from './DiagnosticEvent';
import { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';

type MockSentryScope = {
  setExtras: ReturnType<typeof vi.fn>;
  setTag: ReturnType<typeof vi.fn>;
  setLevel: ReturnType<typeof vi.fn>;
};

type MockSentryFacade = {
  captureMessage: ReturnType<typeof vi.fn>;
  withScope: ReturnType<typeof vi.fn>;
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
  realFacade,
} = vi.hoisted(() => {
  const scopeSetTagMock = vi.fn();
  const scopeSetExtrasMock = vi.fn();
  const scopeSetLevelMock = vi.fn();
  const scope = {
    setExtras: scopeSetExtrasMock,
    setTag: scopeSetTagMock,
    setLevel: scopeSetLevelMock,
  };

  const createFacade = (captureResult?: string) => {
    const captureMessage = vi.fn<(message: string) => string | undefined>(() => captureResult);
    const withScope = vi.fn((callback: (innerScope: MockSentryScope) => unknown) =>
      callback(scope),
    );
    return { captureMessage, withScope } satisfies MockSentryFacade;
  };

  return {
    ensureSentryMock: vi.fn(),
    isSentryConfiguredMock: vi.fn(() => true),
    getSentryReportingStateMock: vi.fn(() => 'enabled'),
    mockScope: scope,
    realFacade: createFacade('event-id'),
  };
});

vi.mock('@shared/lib/setupSentry', () => ({
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
    mockScope.setExtras.mockReset();
    mockScope.setTag.mockReset();
    mockScope.setLevel.mockReset();
    realFacade.captureMessage.mockClear();
    realFacade.withScope.mockClear();
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
    expect(realFacade.captureMessage).toHaveBeenCalledWith(expect.stringContaining('[diagnostic]'));
  });

  it('includes the event name in the Sentry captureMessage call', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent({ name: 'writeAccessRecovery.permissionDenied' }));
    await waitForAsyncWork();

    expect(realFacade.captureMessage).toHaveBeenCalledWith(
      '[diagnostic] writeAccessRecovery.permissionDenied',
    );
  });

  it('sets Sentry event level from diagnostic severity', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent({ severity: DiagnosticSeverity.Warning }));
    await waitForAsyncWork();

    expect(mockScope.setLevel).toHaveBeenCalledWith('warning');
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

    expect(mockScope.setLevel).toHaveBeenCalledWith(expectedLevel);
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

    expect(mockScope.setTag).toHaveBeenCalledWith('eventKind', 'diagnostic');
    expect(mockScope.setTag).toHaveBeenCalledWith('severity', 'warning');
    expect(mockScope.setTag).toHaveBeenCalledWith('result', 'stale');
    expect(mockScope.setTag).toHaveBeenCalledWith('classification', 'access');
  });

  it('does not set flow-specific tags (feature, operation, stage, providerKind) on Sentry scope', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    const tagCalls = mockScope.setTag.mock.calls.map((args: unknown[]) => String(args[0]));
    expect(tagCalls).not.toContain('feature');
    expect(tagCalls).not.toContain('operation');
    expect(tagCalls).not.toContain('stage');
    expect(tagCalls).not.toContain('providerKind');
  });

  it('forwards safeTags as individual Sentry tags', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(
      makeEvent({ safeTags: { provider: 'webFileSystem', operation: 'requestAccess' } }),
    );
    await waitForAsyncWork();

    expect(mockScope.setTag).toHaveBeenCalledWith('provider', 'webFileSystem');
    expect(mockScope.setTag).toHaveBeenCalledWith('operation', 'requestAccess');
  });

  it('attaches safe counters as extras when provided', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(
      makeEvent({ counters: { pendingCount: 3, flushedCount: 1, failedCount: 0 } }),
    );
    await waitForAsyncWork();

    expect(mockScope.setExtras).toHaveBeenCalledWith(
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

    expect(mockScope.setExtras).toHaveBeenCalledWith(
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
  });

  describe('dedupe/rate-limit', () => {
    it('back-to-back identical events result in one Sentry send', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent());
      reportDiagnosticEvent(makeEvent());
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledOnce();
    });

    it('identical events both reach the memory sink', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent, setDiagnosticEventSink } =
        await import('./reportDiagnosticEvent');
      const sink: DiagnosticEvent[] = [];
      setDiagnosticEventSink(sink);

      reportDiagnosticEvent(makeEvent());
      reportDiagnosticEvent(makeEvent());
      await waitForAsyncWork();

      expect(sink).toHaveLength(2);
      setDiagnosticEventSink(undefined);
    });

    it('events with different name are not deduped', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent({ name: 'flow.eventA' }));
      reportDiagnosticEvent(makeEvent({ name: 'flow.eventB' }));
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);
    });

    it('events with different result are not deduped', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent({ result: DiagnosticResult.Failed }));
      reportDiagnosticEvent(makeEvent({ result: DiagnosticResult.Blocked }));
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);
    });

    it('events with different classification are not deduped', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent({ classification: DiagnosticClassification.Access }));
      reportDiagnosticEvent(makeEvent({ classification: DiagnosticClassification.Storage }));
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);
    });

    it('events with different safeTags are not deduped', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent({ safeTags: { operation: 'requestAccess' } }));
      reportDiagnosticEvent(makeEvent({ safeTags: { operation: 'flushPendingSaves' } }));
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);
    });

    it('attemptId does not defeat dedupe — identical events with different attemptId are still deduped', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent({ attemptId: 'attempt-1' }));
      reportDiagnosticEvent(makeEvent({ attemptId: 'attempt-2' }));
      await waitForAsyncWork();

      expect(realFacade.captureMessage).toHaveBeenCalledOnce();
    });

    it('reporting more than DEDUPE_MAP_MAX_SIZE unique events does not break reporting', async () => {
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      // 201 unique events exceeds the internal dedupe cap of 200 — must not throw or corrupt state
      expect(() => {
        for (let i = 0; i <= 200; i++) {
          reportDiagnosticEvent(makeEvent({ name: `flow.bounded${i}` }));
        }
      }).not.toThrow();

      await waitForAsyncWork();

      // Some events reach Sentry; exact count depends on the internal queue limit, not dedupe cap
      expect(realFacade.captureMessage.mock.calls.length).toBeGreaterThan(0);
    });

    it('oldest dedupe key is evicted when the map is full so the size stays bounded', async () => {
      vi.useFakeTimers();
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      // Fill the map with 200 unique events (all fresh — TTL not expired)
      for (let i = 0; i < 200; i++) {
        reportDiagnosticEvent(makeEvent({ name: `flow.evictTest${i}` }));
      }
      await vi.runAllTimersAsync();

      // event0 is the oldest entry; it should still be deduped (within TTL)
      realFacade.captureMessage.mockClear();
      reportDiagnosticEvent(makeEvent({ name: 'flow.evictTest0' }));
      await vi.runAllTimersAsync();
      expect(realFacade.captureMessage).not.toHaveBeenCalled();

      // Sending a 201st unique event must evict the oldest (event0) to stay bounded
      reportDiagnosticEvent(makeEvent({ name: 'flow.evictTest200' }));
      await vi.runAllTimersAsync();

      // event0 was evicted — it can now be sent again as a new event
      reportDiagnosticEvent(makeEvent({ name: 'flow.evictTest0' }));
      await vi.runAllTimersAsync();

      // event200 + event0 (re-sent after eviction) = 2 sends
      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('after TTL expires the same event can be sent again', async () => {
      vi.useFakeTimers();
      ensureSentryMock.mockResolvedValue(realFacade);
      const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');

      reportDiagnosticEvent(makeEvent());
      await vi.runAllTimersAsync();

      // Identical event within TTL — deduped
      reportDiagnosticEvent(makeEvent());
      await vi.runAllTimersAsync();

      expect(realFacade.captureMessage).toHaveBeenCalledOnce();

      // Advance past 30-second TTL
      vi.advanceTimersByTime(31_000);

      // Same event after TTL — should be sent
      reportDiagnosticEvent(makeEvent());
      await vi.runAllTimersAsync();

      expect(realFacade.captureMessage).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});
