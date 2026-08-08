import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSentryReportingStateMock, flushMock } = vi.hoisted(() => ({
  getSentryReportingStateMock: vi.fn(() => 'enabled'),
  flushMock: vi.fn(() => Promise.resolve(true)),
}));
const flushQueuedDiagnosticEventsMock = vi.hoisted(() => vi.fn());
const flushQueuedDiagnosticExceptionsMock = vi.hoisted(() => vi.fn());

vi.mock('./sentryRuntime', () => ({
  getSentryReportingState: getSentryReportingStateMock,
  useSentry: () => ({ flush: flushMock }),
}));
vi.mock('./reportDiagnosticEvent', () => ({
  flushQueuedDiagnosticEvents: flushQueuedDiagnosticEventsMock,
}));
vi.mock('./captureDiagnosticException', () => ({
  flushQueuedDiagnosticExceptions: flushQueuedDiagnosticExceptionsMock,
}));

describe('drainDiagnostics', () => {
  beforeEach(() => {
    getSentryReportingStateMock.mockReset().mockReturnValue('enabled');
    flushMock.mockReset().mockResolvedValue(true);
    flushQueuedDiagnosticEventsMock.mockReset();
    flushQueuedDiagnosticExceptionsMock.mockReset();
  });

  it('flushes both queues and waits on the SDK transport flush when enabled', async () => {
    const { drainDiagnostics, DIAGNOSTICS_DRAIN_TIMEOUT_MS } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(flushQueuedDiagnosticEventsMock).toHaveBeenCalledOnce();
    expect(flushQueuedDiagnosticExceptionsMock).toHaveBeenCalledOnce();
    expect(flushMock).toHaveBeenCalledWith(DIAGNOSTICS_DRAIN_TIMEOUT_MS);
  });

  it('is a no-op when reporting state is unknown', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticExceptionsMock).not.toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('is a no-op when reporting state is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('never rejects when the SDK transport flush rejects', async () => {
    flushMock.mockRejectedValue(new Error('flush failed'));
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await expect(drainDiagnostics()).resolves.toBeUndefined();
  });

  it('never rejects when getSentryReportingState throws', async () => {
    getSentryReportingStateMock.mockImplementation(() => {
      throw new Error('unexpected');
    });
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await expect(drainDiagnostics()).resolves.toBeUndefined();
  });
});
