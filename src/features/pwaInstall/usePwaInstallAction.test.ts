/* eslint-disable @typescript-eslint/consistent-type-assertions -- BeforeInstallPromptEvent mocks require structural casting since the interface is non-standard and cannot be instantiated directly in tests. */
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick, ref, shallowRef } from 'vue';

const useIDBKeyvalMock = vi.fn();
vi.mock('@vueuse/integrations/useIDBKeyval', () => ({
  useIDBKeyval: (...args: unknown[]) => useIDBKeyvalMock(...args),
}));

const retainedPromptRef = shallowRef<BeforeInstallPromptEvent | null>(null);
const isInstalledForSessionRef = shallowRef(false);

vi.mock('./pwaInstallRuntime', () => ({
  usePwaInstallRuntime: () => ({
    retainedPrompt: retainedPromptRef,
    isInstalledForSession: isInstalledForSessionRef,
  }),
}));

describe('usePwaInstallAction', () => {
  beforeEach(() => {
    vi.resetModules();
    useIDBKeyvalMock.mockReset();
    retainedPromptRef.value = null;
    isInstalledForSessionRef.value = false;
    vi.spyOn(window, 'open').mockReturnValue(null);
    vi.stubGlobal('navigator', { userAgent: '' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const setupSettings = (
    overrides: Record<string, unknown> = {},
    { isFinished = true }: { isFinished?: boolean } = {},
  ) => {
    const defaultValue = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
      panesWidth: [],
      ...overrides,
    };
    useIDBKeyvalMock.mockImplementation((_key: unknown, _default: unknown) => ({
      data: ref(structuredClone(defaultValue)),
      isFinished: ref(isFinished),
    }));
  };

  it('hasRetainedPrompt is true when a prompt is retained', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { hasRetainedPrompt } = usePwaInstallAction();

    retainedPromptRef.value = {
      prompt: vi.fn().mockResolvedValue({ outcome: 'accepted' }),
    } as unknown as BeforeInstallPromptEvent;

    expect(hasRetainedPrompt.value).toBe(true);
  });

  it('hasRetainedPrompt is false when no prompt is retained', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { hasRetainedPrompt } = usePwaInstallAction();

    expect(hasRetainedPrompt.value).toBe(false);
  });

  it('isHomeWidgetVisible is false when standalone', async () => {
    setupSettings();
    isInstalledForSessionRef.value = true;
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);
  });

  it('isSettingsEntryVisible is false when standalone', async () => {
    setupSettings();
    isInstalledForSessionRef.value = true;
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isSettingsEntryVisible } = usePwaInstallAction();

    expect(isSettingsEntryVisible.value).toBe(false);
  });

  it('isHomeWidgetVisible is true when not standalone and not dismissed', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(true);
  });

  it('isSettingsEntryVisible is true when not standalone', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isSettingsEntryVisible } = usePwaInstallAction();

    expect(isSettingsEntryVisible.value).toBe(true);
  });

  it('dismissHomeWidget stores dismissedUntil approximately 30 days from now', async () => {
    const settings = {
      diagnosticsEnabled: false,
      diagnosticsConsentRequested: false,
      panesWidth: [],
      pwaInstallWidgetDismissedUntil: undefined as number | undefined,
    };
    useIDBKeyvalMock.mockImplementation(() => ({
      data: ref(settings),
      isFinished: ref(true),
    }));

    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { dismissHomeWidget } = usePwaInstallAction();

    const before = Date.now();
    dismissHomeWidget();
    const after = Date.now();

    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    expect(settings.pwaInstallWidgetDismissedUntil).toBeGreaterThanOrEqual(before + thirtyDaysMs);
    expect(settings.pwaInstallWidgetDismissedUntil).toBeLessThanOrEqual(after + thirtyDaysMs);
  });

  it('isHomeWidgetVisible is false after dismissing (dismissedUntil in future)', async () => {
    const futureTimestamp = Date.now() + 10_000;
    setupSettings({ pwaInstallWidgetDismissedUntil: futureTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);
  });

  it('isSettingsEntryVisible is true even when home widget is dismissed', async () => {
    const futureTimestamp = Date.now() + 10_000;
    setupSettings({ pwaInstallWidgetDismissedUntil: futureTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isSettingsEntryVisible } = usePwaInstallAction();

    expect(isSettingsEntryVisible.value).toBe(true);
  });

  it('isHomeWidgetVisible is true when dismissedUntil has expired', async () => {
    const pastTimestamp = Date.now() - 1000;
    setupSettings({ pwaInstallWidgetDismissedUntil: pastTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(true);
  });

  it('isHomeWidgetVisible is false while settings are not finished loading', async () => {
    setupSettings({}, { isFinished: false });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);
  });

  it('isHomeWidgetVisible becomes true after settings finish loading with no dismissal', async () => {
    const isFinishedRef = ref(false);
    useIDBKeyvalMock.mockImplementation(() => ({
      data: ref({ diagnosticsEnabled: false, diagnosticsConsentRequested: false, panesWidth: [] }),
      isFinished: isFinishedRef,
    }));
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);

    isFinishedRef.value = true;
    await nextTick();

    expect(isHomeWidgetVisible.value).toBe(true);
  });

  it('isHomeWidgetVisible stays hidden after settings finish loading when dismissedUntil is in future', async () => {
    const futureTimestamp = Date.now() + 10_000;
    const isFinishedRef = ref(false);
    useIDBKeyvalMock.mockImplementation(() => ({
      data: ref({
        diagnosticsEnabled: false,
        diagnosticsConsentRequested: false,
        panesWidth: [],
        pwaInstallWidgetDismissedUntil: futureTimestamp,
      }),
      isFinished: isFinishedRef,
    }));
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);

    isFinishedRef.value = true;
    await nextTick();

    expect(isHomeWidgetVisible.value).toBe(false);
  });

  it('isHomeWidgetVisible becomes true reactively after dismissedUntil expires', async () => {
    vi.useFakeTimers();
    const remaining = 1000;
    const futureTimestamp = Date.now() + remaining;
    setupSettings({ pwaInstallWidgetDismissedUntil: futureTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);

    vi.advanceTimersByTime(remaining + 1);
    await nextTick();

    expect(isHomeWidgetVisible.value).toBe(true);
  });

  it('isHomeWidgetVisible stays hidden across the MAX_TIMEOUT_MS boundary and becomes true after full expiration', async () => {
    // setTimeout delay is a 32-bit signed integer; the scheduler must chain segments.
    const MAX_TIMEOUT_MS = 2 ** 31 - 1;
    const extra = 1000;
    vi.useFakeTimers();
    const futureTimestamp = Date.now() + MAX_TIMEOUT_MS + extra;
    setupSettings({ pwaInstallWidgetDismissedUntil: futureTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);

    vi.advanceTimersByTime(MAX_TIMEOUT_MS);
    await nextTick();
    expect(isHomeWidgetVisible.value).toBe(false);

    vi.advanceTimersByTime(extra);
    await nextTick();
    expect(isHomeWidgetVisible.value).toBe(true);
  });

  it('isSettingsEntryVisible is not affected by home widget dismissal (reactive check)', async () => {
    vi.useFakeTimers();
    const futureTimestamp = Date.now() + 1000;
    setupSettings({ pwaInstallWidgetDismissedUntil: futureTimestamp });
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { isSettingsEntryVisible, isHomeWidgetVisible } = usePwaInstallAction();

    expect(isHomeWidgetVisible.value).toBe(false);
    expect(isSettingsEntryVisible.value).toBe(true);

    vi.advanceTimersByTime(1001);
    await nextTick();

    expect(isHomeWidgetVisible.value).toBe(true);
    expect(isSettingsEntryVisible.value).toBe(true);
  });

  it('runInstallAction calls prompt() when a prompt is retained', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { runInstallAction } = usePwaInstallAction();

    const mockPrompt = vi.fn().mockResolvedValue({ outcome: 'accepted' });
    retainedPromptRef.value = { prompt: mockPrompt } as unknown as BeforeInstallPromptEvent;

    await runInstallAction();

    expect(mockPrompt).toHaveBeenCalledOnce();
    expect(retainedPromptRef.value).toBeNull();
  });

  it('runInstallAction clears the retained prompt after calling it (in finally)', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { runInstallAction } = usePwaInstallAction();

    retainedPromptRef.value = {
      prompt: vi.fn().mockResolvedValue({ outcome: 'dismissed' }),
    } as unknown as BeforeInstallPromptEvent;

    await runInstallAction();

    expect(retainedPromptRef.value).toBeNull();
  });

  it('runInstallAction clears the retained prompt even when prompt() throws', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { runInstallAction } = usePwaInstallAction();

    retainedPromptRef.value = {
      prompt: vi.fn().mockRejectedValue(new Error('prompt rejected')),
    } as unknown as BeforeInstallPromptEvent;

    await expect(runInstallAction()).rejects.toThrow('prompt rejected');
    expect(retainedPromptRef.value).toBeNull();
  });

  it('runInstallAction opens install guide when no prompt is retained', async () => {
    setupSettings();
    const { usePwaInstallAction } = await import('./usePwaInstallAction');
    const { runInstallAction } = usePwaInstallAction();

    await runInstallAction();

    expect(window.open).toHaveBeenCalledOnce();
    const [url, target, features] = vi.mocked(window.open).mock.calls[0] as [
      string,
      string,
      string,
    ];
    expect(url).toContain('mozilla.org');
    expect(target).toBe('_blank');
    expect(features).toContain('noopener');
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions -- Re-enable after BeforeInstallPromptEvent test mocks. */
