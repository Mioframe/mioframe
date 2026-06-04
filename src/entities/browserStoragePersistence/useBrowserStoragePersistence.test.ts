import { afterEach, describe, expect, it, vi } from 'vitest';

const mockPersisted = vi.fn<() => Promise<boolean>>();
const mockPersist = vi.fn<() => Promise<boolean>>();

const setupNavigatorStorage = (
  overrides: Partial<{ persisted: typeof mockPersisted; persist: typeof mockPersist }> = {},
) => {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      storage: {
        persisted: overrides.persisted ?? mockPersisted,
        persist: overrides.persist ?? mockPersist,
      },
    },
    configurable: true,
    writable: true,
  });
};

const removeNavigatorStorage = () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: { storage: undefined },
    configurable: true,
    writable: true,
  });
};

const removeNavigator = () => {
  Object.defineProperty(globalThis, 'navigator', {
    value: undefined,
    configurable: true,
    writable: true,
  });
};

const withWindowRemoved = async (fn: () => Promise<void>) => {
  const original = globalThis.window;
  Object.defineProperty(globalThis, 'window', {
    value: undefined,
    configurable: true,
    writable: true,
  });
  try {
    await fn();
  } finally {
    Object.defineProperty(globalThis, 'window', {
      value: original,
      configurable: true,
      writable: true,
    });
  }
};

const withDocumentRemoved = async (fn: () => Promise<void>) => {
  const original = globalThis.document;
  Object.defineProperty(globalThis, 'document', {
    value: undefined,
    configurable: true,
    writable: true,
  });
  try {
    await fn();
  } finally {
    Object.defineProperty(globalThis, 'document', {
      value: original,
      configurable: true,
      writable: true,
    });
  }
};

describe('useBrowserStoragePersistence', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('reports unsupported when navigator is undefined', async () => {
    removeNavigator();

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value !== 'checking');
    expect(status.value).toBe('unsupported');
  });

  it('reports unsupported when navigator.storage API is missing', async () => {
    removeNavigatorStorage();

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value !== 'checking');
    expect(status.value).toBe('unsupported');
  });

  it('reports persistent when storage is already persisted', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(true);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value !== 'checking');
    expect(status.value).toBe('persistent');
  });

  it('reports ordinary when storage is not persisted', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value !== 'checking');
    expect(status.value).toBe('ordinary');
  });

  it('falls back to ordinary (not unsupported) when persisted() rejects', async () => {
    setupNavigatorStorage();
    mockPersisted.mockRejectedValue(new Error('Internal browser error'));

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value !== 'checking');
    expect(status.value).toBe('ordinary');
  });

  it('transitions to persistent and sets enabled outcome when requestPersistence resolves true', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockResolvedValue(true);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, lastRequestOutcome, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');
    await requestPersistence();

    expect(status.value).toBe('persistent');
    expect(lastRequestOutcome.value).toBe('enabled');
    expect(mockPersist).toHaveBeenCalledTimes(1);
  });

  it('stays ordinary and sets not-enabled outcome when requestPersistence resolves false (browser denial)', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, lastRequestOutcome, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');
    await requestPersistence();

    expect(status.value).toBe('ordinary');
    expect(lastRequestOutcome.value).toBe('not-enabled');
    expect(mockPersist).toHaveBeenCalledTimes(1);
  });

  it('sets failed outcome and refreshes when requestPersistence throws', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockRejectedValue(new Error('Browser rejected with internal path /private/data'));

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, lastRequestOutcome, requestPersistence, isRequesting } =
      useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    await expect(requestPersistence()).resolves.toBeUndefined();

    // After catch, refresh() is called which reads persisted() = false → ordinary.
    expect(status.value).toBe('ordinary');
    expect(lastRequestOutcome.value).toBe('failed');
    expect(isRequesting.value).toBe(false);
  });

  it('sets unsupported outcome when storage manager is unavailable during request', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, lastRequestOutcome, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    // Simulate storage becoming unavailable before the request
    removeNavigatorStorage();

    await requestPersistence();

    expect(lastRequestOutcome.value).toBe('unsupported');
    expect(status.value).toBe('unsupported');
  });

  it('resets lastRequestOutcome to none before each new request', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, lastRequestOutcome, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');
    await requestPersistence();
    expect(lastRequestOutcome.value).toBe('not-enabled');

    // Second request: outcome resets before resolving
    await requestPersistence();
    expect(lastRequestOutcome.value).toBe('enabled');
  });

  it('does not crash when window is undefined', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    await withWindowRemoved(async () => {
      await expect(
        import('./useBrowserStoragePersistence').then(({ useBrowserStoragePersistence }) => {
          useBrowserStoragePersistence();
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('does not crash when document is undefined', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    await withDocumentRemoved(async () => {
      await expect(
        import('./useBrowserStoragePersistence').then(({ useBrowserStoragePersistence }) => {
          useBrowserStoragePersistence();
        }),
      ).resolves.toBeUndefined();
    });
  });

  it('refreshes status on window focus event', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    mockPersisted.mockResolvedValue(true);
    window.dispatchEvent(new Event('focus'));

    await vi.waitUntil(() => status.value === 'persistent');
    expect(status.value).toBe('persistent');
  });

  it('refreshes status on visible visibilitychange event', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    mockPersisted.mockResolvedValue(true);
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitUntil(() => status.value === 'persistent');
    expect(status.value).toBe('persistent');
  });

  it('does not refresh on hidden visibilitychange event', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    mockPersisted.mockResolvedValue(true);
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((r) => setTimeout(r, 20));
    // persisted() was called only once (initial refresh) because visibilityState was hidden.
    expect(mockPersisted).toHaveBeenCalledTimes(1);
    expect(status.value).toBe('ordinary');
  });

  it('refreshes status on pageshow event', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    mockPersisted.mockResolvedValue(true);
    window.dispatchEvent(new Event('pageshow'));

    await vi.waitUntil(() => status.value === 'persistent');
    expect(status.value).toBe('persistent');
  });

  it('registers focus, pageshow, and visibilitychange listeners on setup when globals exist', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);

    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const addDocListenerSpy = vi.spyOn(document, 'addEventListener');

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    useBrowserStoragePersistence();

    const addedWindowEvents = addEventListenerSpy.mock.calls.map(([e]) => String(e));
    const addedDocEvents = addDocListenerSpy.mock.calls.map(([e]) => String(e));

    expect(addedWindowEvents).toContain('focus');
    expect(addedWindowEvents).toContain('pageshow');
    expect(addedDocEvents).toContain('visibilitychange');

    addEventListenerSpy.mockRestore();
    addDocListenerSpy.mockRestore();
  });
});
