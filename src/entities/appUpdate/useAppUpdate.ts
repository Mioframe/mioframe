import { computed, ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import {
  getAppUpdateSnapshot,
  subscribeToAppUpdateStateChanged,
  type AppUpdateSnapshot,
} from '@shared/serviceClient/appUpdate/client';

/** UI-facing update status, derived from the worker-owned snapshot. */
export type AppUpdateStatus =
  | 'unavailable'
  | 'not-checked'
  | 'up-to-date'
  | 'update-available'
  | 'failed'
  | 'ready'
  | 'activating'
  | 'install-failed'
  | 'check-failed';

function deriveAppUpdateStatus(
  snapshot: AppUpdateSnapshot | undefined,
  isAvailable: boolean,
): AppUpdateStatus {
  if (!isAvailable) return 'unavailable';
  if (!snapshot) return 'not-checked';
  // Activation in progress takes priority over every other status,
  // including an ephemeral error: the worker has already selected a
  // release for this clean launch, and no other action is meaningful while
  // that resolves.
  if (snapshot.candidate?.phase === 'activating') return 'activating';
  if (snapshot.error === 'install-failed') return 'install-failed';
  if (snapshot.error === 'check-failed') return 'check-failed';
  switch (snapshot.candidate?.phase) {
    case 'ready':
      return 'ready';
    case 'available':
      return 'update-available';
    case 'failed':
      return 'failed';
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
  // A background check (e.g. a scheduled Manual-mode discovery) can change
  // worker state with no foreground request returning a fresh snapshot;
  // this refreshes the existing snapshot through the ordinary GET_SNAPSHOT
  // path instead of introducing a second state transport.
  const unsubscribeStateChanged = subscribeToAppUpdateStateChanged(() => void refresh());

  tryOnScopeDispose(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', onFocus);
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    unsubscribeStateChanged();
  });

  const status = computed(() => deriveAppUpdateStatus(snapshot.value, isAvailable.value));

  return {
    status,
    mode: computed(() => snapshot.value?.mode),
    activeRelease: computed(() => snapshot.value?.activeRelease),
    candidate: computed(() => snapshot.value?.candidate),
    lastSuccessfulCheckAt: computed(() => snapshot.value?.lastSuccessfulCheckAt),
    error: computed(() => snapshot.value?.error),
    refresh,
    applySnapshot,
  };
};

/** Returns the shared application-update state, snapshot facts, and refresh/apply functions. */
export const useAppUpdate = createGlobalState(setupAppUpdate);
