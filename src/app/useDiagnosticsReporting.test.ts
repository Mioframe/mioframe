import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{ diagnosticsEnabled?: boolean }>({});
const activeScopes: EffectScope[] = [];
let sentryReportingConfigured = true;
const ensureSentryMock = vi.fn();
const setSentryReportingEnabledMock = vi.fn();

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
  }),
}));

vi.mock('@shared/lib/setupSentry', () => ({
  ensureSentry: ensureSentryMock,
  isSentryReportingConfigured: () => sentryReportingConfigured,
  setSentryReportingEnabled: setSentryReportingEnabledMock,
}));

describe('useDiagnosticsReporting', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {};
    sentryReportingConfigured = true;
    ensureSentryMock.mockReset();
    ensureSentryMock.mockResolvedValue(undefined);
    setSentryReportingEnabledMock.mockReset();
  });

  afterEach(() => {
    while (activeScopes.length > 0) {
      activeScopes.pop()?.stop();
    }
  });

  it('enables Sentry reporting only when diagnostics are opted in and config is available', async () => {
    settings.value = {
      diagnosticsEnabled: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    expect(setSentryReportingEnabledMock).toHaveBeenCalledWith(true);
    expect(ensureSentryMock).toHaveBeenCalledTimes(1);
  });

  it('disables Sentry reporting when diagnostics are undefined', async () => {
    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    expect(setSentryReportingEnabledMock).toHaveBeenCalledWith(false);
    expect(ensureSentryMock).not.toHaveBeenCalled();
  });

  it('disables Sentry reporting when config is unavailable even if diagnostics are enabled', async () => {
    settings.value = {
      diagnosticsEnabled: true,
    };
    sentryReportingConfigured = false;

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    expect(setSentryReportingEnabledMock).toHaveBeenCalledWith(false);
    expect(ensureSentryMock).not.toHaveBeenCalled();
  });

  it('turns reporting back off when diagnostics are toggled from true to undefined', async () => {
    settings.value = {
      diagnosticsEnabled: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsReporting } = await import('./useDiagnosticsReporting');

    scope.run(() => {
      useDiagnosticsReporting();
    });

    await flushMicrotasks();

    settings.value = {};
    await flushMicrotasks();

    expect(setSentryReportingEnabledMock).toHaveBeenLastCalledWith(false);
  });
});
