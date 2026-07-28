import { computed, ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import {
  getAppUpdateSnapshot,
  type AppUpdateSnapshot,
} from '@shared/serviceClient/appUpdate/client';

/** UI-facing update status, derived from the worker-owned snapshot. */
export type AppUpdateStatus =
  | 'unavailable'
  | 'not-checked'
  | 'up-to-date'
  | 'update-available'
  | 'rolled-back'
  | 'ready'
  | 'install-failed'
  | 'check-failed';

function deriveAppUpdateStatus(
  snapshot: AppUpdateSnapshot | undefined,
  isAvailable: boolean,
): AppUpdateStatus {
  if (!isAvailable) return 'unavailable';
  if (!snapshot) return 'not-checked';
  if (snapshot.error === 'install-failed') return 'install-failed';
  if (snapshot.error === 'check-failed') return 'check-failed';
  if (snapshot.scheduledRelease) return 'ready';
  if (
    snapshot.latestRelease &&
    snapshot.latestRelease.releaseId !== snapshot.activeRelease.releaseId
  ) {
    // A previously rolled-back release stays visible as its own status only
    // while it is still the latest known release; a strictly newer
    // discovery already clears `failedRelease` worker-side and is shown as
    // an ordinary update instead.
    if (snapshot.failedRelease?.releaseId === snapshot.latestRelease.releaseId) {
      return 'rolled-back';
    }
    return 'update-available';
  }
  if (!snapshot.lastSuccessfulCheckAt) return 'not-checked';
  return 'up-to-date';
}

const setupAppUpdate = () => {
  const snapshot = ref<AppUpdateSnapshot | undefined>(undefined);
  const isAvailable = ref(true);

  /**
   * Applies a client call's result. `undefined` means the capability is unavailable.
   * @param result - The client call's result.
   */
  const applySnapshot = (result: AppUpdateSnapshot | undefined) => {
    if (result) {
      snapshot.value = result;
      isAvailable.value = true;
    } else {
      isAvailable.value = false;
    }
  };

  const refresh = async () => {
    applySnapshot(await getAppUpdateSnapshot());
  };

  void refresh();

  const onFocus = () => void refresh();
  const onVisibilityChange = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') void refresh();
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', onFocus);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  tryOnScopeDispose(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onFocus);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
  });

  const status = computed(() => deriveAppUpdateStatus(snapshot.value, isAvailable.value));

  return {
    status,
    mode: computed(() => snapshot.value?.mode),
    activeRelease: computed(() => snapshot.value?.activeRelease),
    latestRelease: computed(() => snapshot.value?.latestRelease),
    scheduledRelease: computed(() => snapshot.value?.scheduledRelease),
    failedRelease: computed(() => snapshot.value?.failedRelease),
    lastSuccessfulCheckAt: computed(() => snapshot.value?.lastSuccessfulCheckAt),
    error: computed(() => snapshot.value?.error),
    refresh,
    applySnapshot,
  };
};

/** Returns the shared application-update state, snapshot facts, and refresh/apply functions. */
export const useAppUpdate = createGlobalState(setupAppUpdate);
