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

describe('useBrowserStoragePersistence', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
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

  it('transitions to persistent when requestPersistence resolves true', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockResolvedValue(true);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');
    await requestPersistence();

    expect(status.value).toBe('persistent');
    expect(mockPersist).toHaveBeenCalledTimes(1);
  });

  it('stays ordinary when requestPersistence resolves false (browser denial)', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockResolvedValue(false);

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, requestPersistence } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');
    await requestPersistence();

    expect(status.value).toBe('ordinary');
    expect(mockPersist).toHaveBeenCalledTimes(1);
  });

  it('stays ordinary and does not propagate when requestPersistence throws', async () => {
    setupNavigatorStorage();
    mockPersisted.mockResolvedValue(false);
    mockPersist.mockRejectedValue(new Error('Browser rejected with internal path /private/data'));

    const { useBrowserStoragePersistence } = await import('./useBrowserStoragePersistence');
    const { status, requestPersistence, isRequesting } = useBrowserStoragePersistence();

    await vi.waitUntil(() => status.value === 'ordinary');

    await expect(requestPersistence()).resolves.toBeUndefined();

    expect(status.value).toBe('ordinary');
    expect(isRequesting.value).toBe(false);
  });
});
