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

  it('flushes a queued event when flushQueuedDiagnosticEvents is called while enabled', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent, flushQueuedDiagnosticEvents } =
      await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();
    expect(realFacade.captureMessage).not.toHaveBeenCalled();

    getSentryReportingStateMock.mockReturnValue('enabled');
    flushQueuedDiagnosticEvents();
    await waitForAsyncWork();

    expect(realFacade.captureMessage).toHaveBeenCalledOnce();
  });

  it('clears the queue when reporting becomes disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    ensureSentryMock.mockResolvedValue(realFacade);
    const { reportDiagnosticEvent, clearQueuedDiagnosticEvents } =
      await import('./reportDiagnosticEvent');

    reportDiagnosticEvent(makeEvent());
    await waitForAsyncWork();

    clearQueuedDiagnosticEvents();

    getSentryReportingStateMock.mockReturnValue('enabled');
    const { flushQueuedDiagnosticEvents } = await import('./reportDiagnosticEvent');
    flushQueuedDiagnosticEvents();
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
});
