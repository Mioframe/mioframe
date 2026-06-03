import { ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';

/** Reliability status of browser storage persistence. */
export type BrowserStoragePersistenceStatus =
  | 'checking'
  | 'ordinary'
  | 'persistent'
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
      return;
    }
    isRequesting.value = true;
    try {
      const result = await manager.persist();
      status.value = result ? 'persistent' : 'ordinary';
    } catch {
      // Expected outcome (e.g. user gesture required, API unavailable): refresh to get real state.
      await refresh();
    } finally {
      isRequesting.value = false;
    }
  };

  void refresh();

  const onFocus = () => void refresh();
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void refresh();
  };
  const onPageShow = () => void refresh();

  window.addEventListener('focus', onFocus);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pageshow', onPageShow);

  tryOnScopeDispose(() => {
    window.removeEventListener('focus', onFocus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pageshow', onPageShow);
  });

  return { status, isRequesting, requestPersistence, refresh };
};

/** Returns the shared browser-storage persistence state and request action. */
export const useBrowserStoragePersistence = createGlobalState(setupBrowserStoragePersistence);
