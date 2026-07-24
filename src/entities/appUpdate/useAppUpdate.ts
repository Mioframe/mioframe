import {
  appUpdateClient,
  type AppUpdateSnapshot,
  type AppUpdateState,
} from '@shared/serviceClient/appUpdate';
import { computed, onScopeDispose, readonly, ref } from 'vue';

const snapshot = ref<AppUpdateSnapshot>();
let initialReadStarted = false;

/** Update states that carry an actionable forward release. */
const ACTIONABLE_UPDATE_STATES: ReadonlySet<AppUpdateState> = new Set<AppUpdateState>([
  'available',
  'preparing',
  'ready',
  'trialStarting',
]);

/**
 * Exposes read-only factual managed-update state from the controller-owned snapshot.
 * @returns Read-only snapshot and the controller-derived `hasUpdate`/`isReady` facts.
 */
export const useAppUpdate = () => {
  const unsubscribe = appUpdateClient.subscribeToSnapshot((value) => {
    snapshot.value = value;
  });
  onScopeDispose(unsubscribe);
  if (!initialReadStarted) {
    initialReadStarted = true;
    void appUpdateClient.getSnapshot().then((value) => {
      snapshot.value = value;
    });
  }

  const hasUpdate = computed(() => {
    const state = snapshot.value?.updateState;
    return state !== undefined && ACTIONABLE_UPDATE_STATES.has(state);
  });
  const isReady = computed(() => snapshot.value?.updateState === 'ready');

  return { snapshot: readonly(snapshot), hasUpdate, isReady };
};
