import { ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';

/** Reliability status of browser storage persistence. */
export type BrowserStoragePersistenceStatus =
  | 'checking'
  | 'ordinary'
  | 'persistent'
  | 'unsupported';

/** Outcome returned by requestPersistence(). */
export type BrowserStoragePersistenceRequestOutcome =
  | 'enabled'
  | 'not-enabled'
  | 'failed'
  | 'unsupported'
  | 'ignored';

const getStorageManager = (): Pick<StorageManager, 'persisted' | 'persist'> | undefined => {
  if (typeof navigator === 'undefined') return undefined;
  const { storage } = navigator;
  if (!storage) return undefined;
  if (typeof storage.persisted !== 'function' || typeof storage.persist !== 'function')
    return undefined;
  return storage;
};

const setupBrowserStoragePersistence = () => {
  const status = ref<BrowserStoragePersistenceStatus>('checking');
  const isRequesting = ref(false);

  const refresh = async () => {
    const manager = getStorageManager();
    if (!manager) {
      status.value = 'unsupported';
      return;
    }
    try {
      const persisted = await manager.persisted();
      status.value = persisted ? 'persistent' : 'ordinary';
    } catch {
      // API exists but call failed — fall back to ordinary to keep the user warned.
      status.value = 'ordinary';
    }
  };

  const requestPersistence = async (): Promise<BrowserStoragePersistenceRequestOutcome> => {
    if (status.value !== 'ordinary' || isRequesting.value) {
      return 'ignored';
    }
    const manager = getStorageManager();
    if (!manager) {
      status.value = 'unsupported';
      return 'unsupported';
    }
    isRequesting.value = true;
    try {
      const result = await manager.persist();
      if (result) {
        status.value = 'persistent';
        return 'enabled';
      }
      return 'not-enabled';
    } catch {
      await refresh();
      return 'failed';
    } finally {
      isRequesting.value = false;
    }
  };

  void refresh();

  const onFocus = () => void refresh();
  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') void refresh();
  };
  const onPageShow = () => void refresh();

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  tryOnScopeDispose(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  });

  return { status, isRequesting, requestPersistence, refresh };
};

/** Returns the shared browser-storage persistence state and request action. */
export const useBrowserStoragePersistence = createGlobalState(setupBrowserStoragePersistence);
