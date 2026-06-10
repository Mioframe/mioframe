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
const applyDiagnosticsPolicyMock = vi.fn();

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

vi.mock('@shared/service/diagnosticsPolicy', () => ({
  applyDiagnosticsPolicy: applyDiagnosticsPolicyMock,
}));

describe('useDiagnosticsReporting', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    };
    isFinished.value = false;
    applyDiagnosticsPolicyMock.mockReset();
    applyDiagnosticsPolicyMock.mockResolvedValue(undefined);
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

    expect(applyDiagnosticsPolicyMock).not.toHaveBeenCalled();
  });

  it('applies enabled policy after hydration when diagnostics are enabled', async () => {
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

    expect(applyDiagnosticsPolicyMock).toHaveBeenCalledWith('enabled');
    expect(applyDiagnosticsPolicyMock).toHaveBeenCalledTimes(1);
  });

  it('applies unknown policy after hydration before consent is answered', async () => {
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

    expect(applyDiagnosticsPolicyMock).toHaveBeenCalledWith('unknown');
  });

  it('applies disabled policy after hydration when diagnostics are disabled', async () => {
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

    expect(applyDiagnosticsPolicyMock).toHaveBeenCalledWith('disabled');
  });

  it('does not act after sequence changes when an older apply resolves after a fast toggle', async () => {
    let resolveApply: (() => void) | undefined;
    applyDiagnosticsPolicyMock.mockImplementation((policy: string) =>
      policy === 'enabled'
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

    expect(applyDiagnosticsPolicyMock).toHaveBeenLastCalledWith('disabled');
  });
});
