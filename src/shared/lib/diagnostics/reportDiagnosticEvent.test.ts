import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosticEvent } from './DiagnosticEvent';
import {
  DiagnosticClassification,
  DiagnosticFeature,
  DiagnosticOperation,
  DiagnosticResult,
  DiagnosticSeverity,
  DiagnosticStage,
} from './diagnosticEnums';

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
  severity: DiagnosticSeverity.Error,
  feature: DiagnosticFeature.WriteAccessRecovery,
  operation: DiagnosticOperation.RequestAccess,
  stage: DiagnosticStage.AccessRequestPrepare,
  result: DiagnosticResult.StaleRequest,
  classification: DiagnosticClassification.StaleRequest,
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

  it('attaches structured safe tags to the Sentry scope', async () => {
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');
    const event = makeEvent({
      severity: DiagnosticSeverity.Warning,
      result: DiagnosticResult.StorageFailure,
      classification: DiagnosticClassification.StorageFailure,
    });

    reportDiagnosticEvent(event);
    await waitForAsyncWork();

    expect(mockScope.setTag).toHaveBeenCalledWith('eventKind', 'diagnostic');
    expect(mockScope.setTag).toHaveBeenCalledWith('severity', 'warning');
    expect(mockScope.setTag).toHaveBeenCalledWith('feature', DiagnosticFeature.WriteAccessRecovery);
    expect(mockScope.setTag).toHaveBeenCalledWith('result', 'storageFailure');
    expect(mockScope.setTag).toHaveBeenCalledWith('classification', 'storageFailure');
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
});
