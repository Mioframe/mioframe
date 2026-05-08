import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref, type EffectScope } from 'vue';

const settings = ref<{
  diagnosticsEnabled: boolean;
  diagnosticsConsentRequested: boolean;
}>({
  diagnosticsEnabled: false,
  diagnosticsConsentRequested: false,
});
const confirmMock =
  vi.fn<
    (
      headline: string,
      supportingText: string,
      confirmLabel?: string,
      symbolName?: string,
      cancelLabel?: string,
    ) => Promise<boolean>
  >();
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
    settings,
    isFinished,
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
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    };
    sentryDiagnosticsAvailable = true;
    isFinished.value = true;
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
    expect(settings.value).toEqual({
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
    });
  });

  it('does not show a dialog when consent was already requested', async () => {
    settings.value = {
      diagnosticsEnabled: false,
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
    expect(confirmMock).toHaveBeenCalledWith(
      'Help improve Mioframe?',
      'Mioframe can send technical error reports when something breaks. This helps developers find and fix crashes. Document contents are not intentionally included.',
      'Allow',
      undefined,
      'Not now',
    );
  });

  it('stores consent when the user confirms the diagnostics dialog', async () => {
    confirmMock.mockResolvedValue(true);

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    });
  });

  it('stores rejection when the user cancels the diagnostics dialog', async () => {
    confirmMock.mockResolvedValue(false);

    const scope = createTrackedScope();
    const { useDiagnosticsConsentRequest } = await import('./useDiagnosticsConsentRequest');

    scope.run(() => {
      useDiagnosticsConsentRequest();
    });

    await flushMicrotasks();

    expect(settings.value).toEqual({
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: true,
    });
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

    expect(settings.value).toEqual({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
    });
  });
});
