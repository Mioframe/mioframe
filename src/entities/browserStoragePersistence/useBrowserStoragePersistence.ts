import { ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';

/** Reliability status of browser storage persistence. */
export type BrowserStoragePersistenceStatus =
  | 'checking'
  | 'ordinary'
  | 'persistent'
  | 'unsupported';

/** Outcome of the last requestPersistence() call. */
export type BrowserStoragePersistenceRequestOutcome =
  | 'none'
  | 'enabled'
  | 'not-enabled'
  | 'failed'
  | 'unsupported';

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
  const lastRequestOutcome = ref<BrowserStoragePersistenceRequestOutcome>('none');

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

  const requestPersistence = async () => {
    if (status.value !== 'ordinary' || isRequesting.value) {
      return;
    }
    const manager = getStorageManager();
    if (!manager) {
      lastRequestOutcome.value = 'unsupported';
      status.value = 'unsupported';
      return;
    }
    isRequesting.value = true;
    lastRequestOutcome.value = 'none';
    try {
      const result = await manager.persist();
      if (result) {
        status.value = 'persistent';
        lastRequestOutcome.value = 'enabled';
      } else {
        lastRequestOutcome.value = 'not-enabled';
      }
    } catch {
      lastRequestOutcome.value = 'failed';
      await refresh();
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

  return { status, isRequesting, lastRequestOutcome, requestPersistence, refresh };
};

/** Returns the shared browser-storage persistence state and request action. */
export const useBrowserStoragePersistence = createGlobalState(setupBrowserStoragePersistence);
