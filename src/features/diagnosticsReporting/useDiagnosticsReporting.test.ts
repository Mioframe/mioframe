import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{ diagnosticsEnabled: boolean }>({
  diagnosticsEnabled: false,
});
const isFinished = ref(false);
const activeScopes: EffectScope[] = [];
let sentryConfigured = true;
const ensureSentryMock = vi.fn();
const setSentryReportingStateMock = vi.fn();
const flushQueuedHandledReportsMock = vi.fn();
const clearQueuedHandledReportsMock = vi.fn();

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
  setSentryReportingState: setSentryReportingStateMock,
}));

vi.mock('@shared/lib/reportHandledError', () => ({
  flushQueuedHandledReports: flushQueuedHandledReportsMock,
  clearQueuedHandledReports: clearQueuedHandledReportsMock,
}));

describe('useDiagnosticsReporting', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {
      diagnosticsEnabled: false,
    };
    isFinished.value = false;
    sentryConfigured = true;
    ensureSentryMock.mockReset();
    ensureSentryMock.mockResolvedValue(undefined);
    setSentryReportingStateMock.mockReset();
    flushQueuedHandledReportsMock.mockReset();
    clearQueuedHandledReportsMock.mockReset();
  });

  afterEach(() => {
    while (activeScopes.length > 0) {
      activeScopes.pop()?.stop();
    }
  });

  it('does nothing before local settings hydration finishes', async () => {
    settings.value = { diagnosticsEnabled: true };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    expect(setSentryReportingStateMock).not.toHaveBeenCalled();
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(clearQueuedHandledReportsMock).not.toHaveBeenCalled();
  });

  it('enables reporting, initializes Sentry, then flushes after hydration', async () => {
    settings.value = { diagnosticsEnabled: true };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setSentryReportingStateMock).toHaveBeenCalledWith('enabled');
    expect(ensureSentryMock).toHaveBeenCalledTimes(1);
    expect(flushQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(clearQueuedHandledReportsMock).not.toHaveBeenCalled();
    expect(setSentryReportingStateMock.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      ensureSentryMock.mock.invocationCallOrder[0] ?? 0,
    );
    expect(ensureSentryMock.mock.invocationCallOrder[0] ?? 0).toBeLessThan(
      flushQueuedHandledReportsMock.mock.invocationCallOrder[0] ?? 0,
    );
  });

  it('disables reporting and clears the queue after hydration when diagnostics are disabled', async () => {
    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setSentryReportingStateMock).toHaveBeenCalledWith('disabled');
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
  });

  it('disables reporting and clears the queue when Sentry is unavailable', async () => {
    settings.value = { diagnosticsEnabled: true };
    sentryConfigured = false;

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    expect(setSentryReportingStateMock).toHaveBeenCalledWith('disabled');
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(ensureSentryMock).not.toHaveBeenCalled();
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
  });

  it('does not flush when an older ensureSentry resolves after a fast true to false toggle', async () => {
    let resolveEnsure: (() => void) | undefined;
    ensureSentryMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveEnsure = resolve;
        }),
    );
    settings.value = { diagnosticsEnabled: true };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    isFinished.value = true;
    await flushMicrotasks();

    settings.value = { diagnosticsEnabled: false };
    await flushMicrotasks();

    resolveEnsure?.();
    await flushMicrotasks();

    expect(setSentryReportingStateMock).toHaveBeenLastCalledWith('disabled');
    expect(clearQueuedHandledReportsMock).toHaveBeenCalledTimes(1);
    expect(flushQueuedHandledReportsMock).not.toHaveBeenCalled();
  });
});
