import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DiagnosticClassification, DiagnosticResult, DiagnosticSeverity } from './diagnosticEnums';

/**
 * Proves the real ordering `drainDiagnostics` must guarantee: a queued
 * diagnostic is handed to the Sentry facade's `captureMessage`/`captureException`
 * before the Sentry transport-level `flush()` runs, and `drainDiagnostics` itself
 * only resolves after both. Deliberately does not mock `./reportDiagnosticEvent`
 * or `./captureDiagnosticException` — this exercises their real queue/flush
 * mechanics, not call-count-only doubles, so a regression that starts the
 * transport flush before the queue has actually handed its entries to Sentry
 * would fail this test even though every individual call still happens once.
 */
const { getSentryReportingStateMock, isSentryConfiguredMock, ensureSentryMock, facade, order } =
  vi.hoisted(() => {
    const callOrder: string[] = [];
    const sentryFacade = {
      captureMessage: vi.fn(() => {
        callOrder.push('capture');
        return 'event-id';
      }),
      captureException: vi.fn(() => {
        callOrder.push('capture');
        return 'event-id';
      }),
      flush: vi.fn(() => {
        callOrder.push('flush');
        return Promise.resolve(true);
      }),
    };
    return {
      getSentryReportingStateMock: vi.fn(() => 'enabled'),
      isSentryConfiguredMock: vi.fn(() => true),
      ensureSentryMock: vi.fn(() => Promise.resolve(sentryFacade)),
      facade: sentryFacade,
      order: callOrder,
    };
  });

vi.mock('./sentryRuntime', () => ({
  ensureSentry: ensureSentryMock,
  useSentry: () => facade,
  getSentryReportingState: getSentryReportingStateMock,
  isSentryConfigured: isSentryConfiguredMock,
}));

describe('drainDiagnostics ordering', () => {
  beforeEach(() => {
    vi.resetModules();
    order.length = 0;
    getSentryReportingStateMock.mockReset().mockReturnValue('enabled');
    isSentryConfiguredMock.mockReset().mockReturnValue(true);
    ensureSentryMock.mockReset().mockResolvedValue(facade);
    facade.captureMessage.mockClear();
    facade.captureException.mockClear();
    facade.flush.mockClear();
  });

  it('captures every queued diagnostic before the transport flush runs, and resolves only after both', async () => {
    const { reportDiagnosticEvent } = await import('./reportDiagnosticEvent');
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    reportDiagnosticEvent({
      name: 'test.event',
      severity: DiagnosticSeverity.Error,
      result: DiagnosticResult.Failed,
      classification: DiagnosticClassification.Unexpected,
    });
    captureDiagnosticException(new Error('boom'));

    await drainDiagnostics();

    expect(order).toEqual(['capture', 'capture', 'flush']);
    expect(facade.captureMessage).toHaveBeenCalledOnce();
    expect(facade.captureException).toHaveBeenCalledOnce();
    expect(facade.flush).toHaveBeenCalledOnce();
  });

  it('joins an already in-flight per-queue flush instead of starting a duplicate one', async () => {
    const { reportDiagnosticEvent, flushQueuedDiagnosticEvents } =
      await import('./reportDiagnosticEvent');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    reportDiagnosticEvent({
      name: 'test.event',
      severity: DiagnosticSeverity.Error,
      result: DiagnosticResult.Failed,
      classification: DiagnosticClassification.Unexpected,
    });
    // `reportDiagnosticEvent` above already started a fire-and-forget flush;
    // this extra call must join it rather than starting a second one.
    flushQueuedDiagnosticEvents();

    await drainDiagnostics();

    expect(facade.captureMessage).toHaveBeenCalledOnce();
    expect(ensureSentryMock).toHaveBeenCalledOnce();
  });
});
