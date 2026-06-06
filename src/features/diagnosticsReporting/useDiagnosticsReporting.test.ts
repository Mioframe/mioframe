import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{
  diagnosticsEnabled: boolean;
  diagnosticsConsentRequested: boolean;
}>({
  diagnosticsEnabled: false,
  diagnosticsConsentRequested: false,
});
const isFinished = ref(false);
const activeScopes: EffectScope[] = [];
let sentryConfigured = true;
const ensureSentryMock = vi.fn();
const setDiagnosticsRuntimeStateMock = vi.fn();
const syncSentryStateToWorkerMock = vi.fn();
const flushQueuedHandledReportsMock = vi.fn();
const clearQueuedHandledReportsMock = vi.fn();
const flushQueuedDiagnosticEventsMock = vi.fn();
const clearQueuedDiagnosticEventsMock = vi.fn();

const flushMicrotasks = async () => {
  await nextTick();
  await Promise.resolve();
};

const createTrackedScope = (): EffectScope => {
  const scope = effectScope();
  activeScopes.push(scope);
  return scope;
};

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
    isFinished,
  }),
}));

vi.mock('@shared/lib/setupSentry', () => ({
  ensureSentry: ensureSentryMock,
  isSentryConfigured: () => sentryConfigured,
  setDiagnosticsRuntimeState: setDiagnosticsRuntimeStateMock,
}));

vi.mock('@shared/lib/sentry', () => ({
  getOrCreateSentrySessionId: () => 'session:test-id-aaaa-bbbb-cccc-dddddddddddd',
}));

vi.mock('@shared/service/sentryWorkerSync', () => ({
  syncSentryStateToWorker: syncSentryStateToWorkerMock,
}));

vi.mock('@shared/lib/reportHandledError', () => ({
  flushQueuedHandledReports: flushQueuedHandledReportsMock,
  clearQueuedHandledReports: clearQueuedHandledReportsMock,
}));

vi.mock('@shared/lib/diagnostics', () => ({
  flushQueuedDiagnosticEvents: flushQueuedDiagnosticEventsMock,
  clearQueuedDiagnosticEvents: clearQueuedDiagnosticEventsMock,
}));

describe('useDiagnosticsReporting', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    };
    isFinished.value = false;
    sentryConfigured = true;
    ensureSentryMock.mockReset();
    ensureSentryMock.mockResolvedValue(undefined);
    setDiagnosticsRuntimeStateMock.mockReset();
    syncSentryStateToWorkerMock.mockReset();
    flushQueuedHandledReportsMock.mockReset();
    clearQueuedHandledReportsMock.mockReset();
    flushQueuedDiagnosticEventsMock.mockReset();
    clearQueuedDiagnosticEventsMock.mockReset();
  });

  afterEach(() => {
    while (activeScopes.length > 0) {
      activeScopes.pop()?.stop();
    }
  });

  it('does nothing before local settings hydration finishes', async () => {
    settings.value = {
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).not.toHaveBeenCalled();
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(clearQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(clearQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
  });

  it('enables reporting, initializes Sentry, then flushes both queues after hydration', async () => {
    settings.value = {
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id-aaaa-bbbb-cccc-dddddddddddd',
      reportingState: 'enabled',
    });
    expect(ensureSentryMock).toHaveBeenCalledTimes(1);
    expect(flushQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(flushQueuedDiagnosticEventsMock).toHaveBeenCalledTimes(1);
    expect(clearQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(clearQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(setDiagnosticsRuntimeStateMock.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      ensureSentryMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(ensureSentryMock.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      flushQueuedHandledReportsMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('syncs runtime state to the worker with the same session ID and reporting state', async () => {
    settings.value = {
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(syncSentryStateToWorkerMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id-aaaa-bbbb-cccc-dddddddddddd',
      reportingState: 'enabled',
    });
  });

  it('keeps reporting state unknown after hydration before diagnostics consent is answered', async () => {
    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id-aaaa-bbbb-cccc-dddddddddddd',
      reportingState: 'unknown',
    });
    expect(clearQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(clearQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
  });

  it('disables reporting and clears both queues after hydration when diagnostics are disabled', async () => {
    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:test-id-aaaa-bbbb-cccc-dddddddddddd',
      reportingState: 'disabled',
    });
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(clearQueuedDiagnosticEventsMock).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
  });

  it('disables reporting and clears both queues when Sentry is unavailable', async () => {
    settings.value = {
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    };
    sentryConfigured = false;

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenCalledWith(
      expect.objectContaining({ reportingState: 'disabled' }),
    );
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(clearQueuedDiagnosticEventsMock).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
  });

  it('does not flush when an older ensureSentry resolves after a fast true to false toggle', async () => {
    let resolveEnsure: (() => void) | undefined;
    ensureSentryMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveEnsure = resolve;
        }),
    );
    settings.value = {
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    };
    await flushMicrotasks();

    resolveEnsure?.();
    await flushMicrotasks();

    expect(setDiagnosticsRuntimeStateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ reportingState: 'disabled' }),
    );
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(clearQueuedDiagnosticEventsMock).toHaveBeenCalledTimes(1);
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(flushQueuedDiagnosticEventsMock).not.toHaveBeenCalled();
  });
});
