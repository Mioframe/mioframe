import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getSentryReportingStateMock, flushMock } = vi.hoisted(() => ({
  getSentryReportingStateMock: vi.fn(() => 'enabled'),
  flushMock: vi.fn(() => Promise.resolve(true)),
}));
const drainQueuedDiagnosticEventsMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const drainQueuedDiagnosticExceptionsMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock('./sentryRuntime', () => ({
  getSentryReportingState: getSentryReportingStateMock,
  useSentry: () => ({ flush: flushMock }),
}));
vi.mock('./reportDiagnosticEvent', () => ({
  drainQueuedDiagnosticEvents: drainQueuedDiagnosticEventsMock,
}));
vi.mock('./captureDiagnosticException', () => ({
  drainQueuedDiagnosticExceptions: drainQueuedDiagnosticExceptionsMock,
}));

describe('drainDiagnostics', () => {
  beforeEach(() => {
    getSentryReportingStateMock.mockReset().mockReturnValue('enabled');
    flushMock.mockReset().mockResolvedValue(true);
    drainQueuedDiagnosticEventsMock.mockReset().mockResolvedValue(undefined);
    drainQueuedDiagnosticExceptionsMock.mockReset().mockResolvedValue(undefined);
  });

  it('drains both queues and waits on the SDK transport flush when enabled', async () => {
    const { drainDiagnostics, DIAGNOSTICS_DRAIN_TIMEOUT_MS } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(drainQueuedDiagnosticEventsMock).toHaveBeenCalledOnce();
    expect(drainQueuedDiagnosticExceptionsMock).toHaveBeenCalledOnce();
    expect(flushMock).toHaveBeenCalledWith(DIAGNOSTICS_DRAIN_TIMEOUT_MS);
  });

  it('awaits both queue drains before calling the SDK transport flush', async () => {
    const callOrder: string[] = [];
    drainQueuedDiagnosticEventsMock.mockImplementation(() => {
      callOrder.push('drainEvents');
      return Promise.resolve();
    });
    drainQueuedDiagnosticExceptionsMock.mockImplementation(() => {
      callOrder.push('drainExceptions');
      return Promise.resolve();
    });
    flushMock.mockImplementation(() => {
      callOrder.push('flush');
      return Promise.resolve(true);
    });
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(callOrder).toEqual(['drainEvents', 'drainExceptions', 'flush']);
  });

  it('is a no-op when reporting state is unknown', async () => {
    getSentryReportingStateMock.mockReturnValue('unknown');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(drainQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(drainQueuedDiagnosticExceptionsMock).not.toHaveBeenCalled();
    expect(flushMock).not.toHaveBeenCalled();
  });

  it('is a no-op when reporting state is disabled', async () => {
    getSentryReportingStateMock.mockReturnValue('disabled');
    const { drainDiagnostics } = await import('./drainDiagnostics');

    await drainDiagnostics();

    expect(drainQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
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
