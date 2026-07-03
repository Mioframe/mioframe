/* eslint-disable @typescript-eslint/consistent-type-assertions -- BeforeInstallPromptEvent mocks require structural casting since the interface is non-standard and cannot be instantiated directly in tests. */
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@shared/lib/pwaInstall', () => ({
  isStandaloneMode: () => false,
}));

describe('setupPwaInstallRuntime', () => {
  // Track listener registrations without call-through to avoid spy-stacking issues.
  let addCalls: [string, EventListener][] = [];
  let removeCalls: [string, EventListener][] = [];

  beforeEach(() => {
    vi.resetModules();
    addCalls = [];
    removeCalls = [];
    vi.spyOn(window, 'addEventListener').mockImplementation(
      (type: string, handler: EventListener) => {
        addCalls.push([type, handler]);
      },
    );
    vi.spyOn(window, 'removeEventListener').mockImplementation(
      (type: string, handler: EventListener) => {
        removeCalls.push([type, handler]);
      },
    );
  });

  it('registers beforeinstallprompt and appinstalled listeners on first call', async () => {
    const { setupPwaInstallRuntime } = await import('./pwaInstallRuntime');
    setupPwaInstallRuntime();

    expect(addCalls.some(([t]) => t === 'beforeinstallprompt')).toBe(true);
    expect(addCalls.some(([t]) => t === 'appinstalled')).toBe(true);
  });

  it('does not accumulate duplicate listeners on repeated calls', async () => {
    const { setupPwaInstallRuntime } = await import('./pwaInstallRuntime');
    setupPwaInstallRuntime();
    setupPwaInstallRuntime();
    setupPwaInstallRuntime();

    const addedBefore = addCalls.filter(([t]) => t === 'beforeinstallprompt');
    const addedApp = addCalls.filter(([t]) => t === 'appinstalled');

    // Three setup calls → three add calls per event type
    expect(addedBefore).toHaveLength(3);
    expect(addedApp).toHaveLength(3);

    // Each re-setup removes the previous handler before re-adding
    const removedBefore = removeCalls.filter(([t]) => t === 'beforeinstallprompt');
    const removedApp = removeCalls.filter(([t]) => t === 'appinstalled');
    expect(removedBefore).toHaveLength(2);
    expect(removedApp).toHaveLength(2);
  });

  it('on re-setup, the stale first handler is removed before a new one is added', async () => {
    const { setupPwaInstallRuntime } = await import('./pwaInstallRuntime');

    setupPwaInstallRuntime();
    const firstHandler = addCalls.find(([t]) => t === 'beforeinstallprompt')?.[1];

    setupPwaInstallRuntime();

    expect(removeCalls).toContainEqual(['beforeinstallprompt', firstHandler]);
  });

  it('beforeinstallprompt listener stores event and calls preventDefault', async () => {
    const { setupPwaInstallRuntime, usePwaInstallRuntime } = await import('./pwaInstallRuntime');
    const { retainedPrompt } = usePwaInstallRuntime();
    setupPwaInstallRuntime();

    const handler = addCalls.find(([t]) => t === 'beforeinstallprompt')?.[1];
    const mockPreventDefault = vi.fn();
    const fakeEvent = {
      preventDefault: mockPreventDefault,
      prompt: vi.fn(),
    } as unknown as BeforeInstallPromptEvent;

    handler?.(fakeEvent);

    expect(mockPreventDefault).toHaveBeenCalledOnce();
    expect(retainedPrompt.value).toBe(fakeEvent);
  });

  it('appinstalled listener clears the retained prompt and marks installed', async () => {
    const { setupPwaInstallRuntime, usePwaInstallRuntime } = await import('./pwaInstallRuntime');
    const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();
    retainedPrompt.value = { prompt: vi.fn() } as unknown as BeforeInstallPromptEvent;

    setupPwaInstallRuntime();

    const handler = addCalls.find(([t]) => t === 'appinstalled')?.[1];
    handler?.(new Event('appinstalled'));

    expect(retainedPrompt.value).toBeNull();
    expect(isInstalledForSession.value).toBe(true);
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions -- Re-enable after BeforeInstallPromptEvent test mocks. */
