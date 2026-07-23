import { appUpdateClient, type AppUpdateSnapshot } from '@shared/serviceClient/appUpdate';
import { computed, onScopeDispose, readonly, ref } from 'vue';

const snapshot = ref<AppUpdateSnapshot>();
let initialReadStarted = false;

/**
 * Exposes read-only factual managed-update state and small release comparisons.
 * @returns Read-only snapshot, newer-release fact, and prepared-release fact.
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

  const hasUpdate = computed(
    () =>
      snapshot.value?.runningRelease !== undefined &&
      snapshot.value.latestRelease !== undefined &&
      snapshot.value.latestRelease.releaseSequence > snapshot.value.runningRelease.releaseSequence,
  );
  const isReady = computed(() => hasUpdate.value && snapshot.value?.preparationState === 'ready');

  return { snapshot: readonly(snapshot), hasUpdate, isReady };
};
