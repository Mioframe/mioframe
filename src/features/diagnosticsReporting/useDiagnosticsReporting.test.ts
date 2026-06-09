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
const applyDiagnosticsRuntimeStateMock = vi.fn();
const syncSentryStateToWorkerMock = vi.fn();

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

vi.mock('@shared/lib/diagnostics', () => ({
  applyDiagnosticsRuntimeState: applyDiagnosticsRuntimeStateMock,
  getOrCreateSentrySessionId: () => 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
}));

vi.mock('@shared/service/sentryWorkerSync', () => ({
  syncSentryStateToWorker: syncSentryStateToWorkerMock,
}));

describe('useDiagnosticsReporting', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    };
    isFinished.value = false;
    applyDiagnosticsRuntimeStateMock.mockReset();
    applyDiagnosticsRuntimeStateMock.mockResolvedValue(undefined);
    syncSentryStateToWorkerMock.mockReset();
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

    expect(applyDiagnosticsRuntimeStateMock).not.toHaveBeenCalled();
  });

  it('enables reporting and applies enabled state after hydration', async () => {
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

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'enabled',
    });
    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledTimes(1);
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
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
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

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'unknown',
    });
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

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenCalledWith({
      sessionId: 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb',
      reportingState: 'disabled',
    });
  });

  it('does not act after sequence changes when an older apply resolves after a fast true to false toggle', async () => {
    let resolveApply: (() => void) | undefined;
    applyDiagnosticsRuntimeStateMock.mockImplementation((state: { reportingState: string }) =>
      state.reportingState === 'enabled'
        ? new Promise<void>((resolve) => {
            resolveApply = resolve;
          })
        : Promise.resolve(),
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

    resolveApply?.();
    await flushMicrotasks();

    expect(applyDiagnosticsRuntimeStateMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ reportingState: 'disabled' }),
    );
  });
});
