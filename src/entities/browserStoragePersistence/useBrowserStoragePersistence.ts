import { ref } from 'vue';
import { createGlobalState } from '@vueuse/core';

/** Reliability status of browser storage persistence. */
export type BrowserStoragePersistenceStatus =
  | 'checking'
  | 'ordinary'
  | 'persistent'
  | 'unsupported';

const isApiAvailable = () => {
  if (typeof navigator === 'undefined') return false;
  const { storage } = navigator;
  if (!storage) return false;
  return typeof storage.persisted === 'function' && typeof storage.persist === 'function';
};

const setupBrowserStoragePersistence = () => {
  const status = ref<BrowserStoragePersistenceStatus>('checking');
  const isRequesting = ref(false);

  const refresh = async () => {
    const { storage } = navigator;
    if (!isApiAvailable() || !storage) {
      status.value = 'unsupported';
      return;
    }
    try {
      const persisted = await storage.persisted();
      status.value = persisted ? 'persistent' : 'ordinary';
    } catch {
      status.value = 'unsupported';
    }
  };

  const requestPersistence = async () => {
    if (status.value !== 'ordinary' || isRequesting.value) {
      return;
    }
    const { storage } = navigator;
    if (!storage) {
      return;
    }
    isRequesting.value = true;
    try {
      const result = await storage.persist();
      status.value = result ? 'persistent' : 'ordinary';
    } catch {
      // Expected outcome (e.g. user gesture required, API unavailable): remain ordinary.
    } finally {
      isRequesting.value = false;
    }
  };

  void refresh();

  return { status, isRequesting, requestPersistence, refresh };
};

/** Returns the shared browser-storage persistence state and request action. */
export const useBrowserStoragePersistence = createGlobalState(setupBrowserStoragePersistence);
