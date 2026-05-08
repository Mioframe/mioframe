import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{ diagnosticsConsentRequested: boolean }>({
  diagnosticsConsentRequested: false,
});
const acceptDiagnosticsConsentMock = vi.fn();
const rejectDiagnosticsConsentMock = vi.fn();
const confirmMock = vi.fn<(options: object) => Promise<boolean>>();
const isFinished = ref(true);
const activeScopes: EffectScope[] = [];
let sentryDiagnosticsAvailable = true;

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
    isFinished,
  }),
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled: computed(() => false),
    diagnosticsConsentRequested: computed(() => settings.value.diagnosticsConsentRequested),
    acceptDiagnosticsConsent: acceptDiagnosticsConsentMock,
    rejectDiagnosticsConsent: rejectDiagnosticsConsentMock,
    setDiagnosticsEnabledByUser: vi.fn(),
  }),
}));

vi.mock('@shared/config', () => ({
  get SENTRY_DIAGNOSTICS_AVAILABLE() {
    return sentryDiagnosticsAvailable;
  },
}));

vi.mock('@shared/ui/Dialog', () => ({
  useDialog: () => ({
    confirm: confirmMock,
  }),
}));

describe('useDiagnosticsConsentRequest', () => {
  beforeEach(() => {
    vi.resetModules();
    settings.value = {
      diagnosticsConsentRequested: false,
    };
    sentryDiagnosticsAvailable = true;
    isFinished.value = true;
    acceptDiagnosticsConsentMock.mockReset();
    rejectDiagnosticsConsentMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
  });

  afterEach(() => {
    while (activeScopes.length > 0) {
      activeScopes.pop()?.stop();
    }
  });

  it('does not show a dialog when diagnostics are unavailable', async () => {
    sentryDiagnosticsAvailable = false;

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('does not show a dialog when consent was already requested', async () => {
    settings.value = {
      diagnosticsConsentRequested: true,
    };

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(confirmMock).not.toHaveBeenCalled();
  });

  it('shows a dialog when diagnostics are available and consent was not requested yet', async () => {
    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(confirmMock).toHaveBeenCalledTimes(1);
    expect(confirmMock).toHaveBeenCalledWith({
      headline: 'Help improve Mioframe?',
      supportingText:
        'Mioframe can send technical error reports when something breaks. This helps developers find and fix crashes. Document contents are not intentionally included.',
      confirmLabel: 'Allow',
      cancelLabel: 'Not now',
    });
  });

  it('Allow calls acceptDiagnosticsConsent', async () => {
    confirmMock.mockResolvedValue(true);

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(acceptDiagnosticsConsentMock).toHaveBeenCalledTimes(1);
    expect(rejectDiagnosticsConsentMock).not.toHaveBeenCalled();
  });

  it('Not now calls rejectDiagnosticsConsent', async () => {
    confirmMock.mockResolvedValue(false);

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(rejectDiagnosticsConsentMock).toHaveBeenCalledTimes(1);
    expect(acceptDiagnosticsConsentMock).not.toHaveBeenCalled();
  });

  it('does not create a second dialog when the composable is called again in the same session', async () => {
    let resolveConfirm: ((value: boolean) => void) | undefined;
    confirmMock.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    const scopeOne = createTrackedScope();
    const scopeTwo = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scopeOne.run(() => {
      useDiagnosticsConsentRequest();
    });
    scopeTwo.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(confirmMock).toHaveBeenCalledTimes(1);

    resolveConfirm?.(true);
    await flushMicrotasks();
    expect(acceptDiagnosticsConsentMock).toHaveBeenCalledTimes(1);
  });

  it('does not show a dialog before hydration finishes', async () => {
    isFinished.value = false;

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();
    expect(confirmMock).not.toHaveBeenCalled();

    isFinished.value = true;
    await flushMicrotasks();

    expect(confirmMock).toHaveBeenCalledTimes(1);
  });
});
