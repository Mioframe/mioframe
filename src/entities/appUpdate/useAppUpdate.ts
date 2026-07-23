import { appUpdateClient } from '@shared/serviceClient/appUpdate';
import { APP_RELEASE_ID } from '@shared/config';
import type { AppUpdateErrorCode, ReleaseControllerState } from '@shared/service';
import { computed, onScopeDispose, readonly, ref } from 'vue';

const state = ref<ReleaseControllerState>();
const operation = ref<'checking' | 'preparing'>();
const errorCode = ref<AppUpdateErrorCode>();
const initialized = ref(false);

const applyOutcome = async (promise: ReturnType<typeof appUpdateClient.getState>) => {
  const outcome = await promise;
  initialized.value = true;
  if ('state' in outcome) state.value = outcome.state;
  errorCode.value = outcome.status === 'ok' ? undefined : outcome.code;
  return outcome;
};

/**
 * Exposes reactive, factual managed-update state without worker implementation details.
 * @returns Reactive controller facts and the local operation adapter.
 */
export const useAppUpdate = () => {
  const unsubscribe = appUpdateClient.subscribe((value) => {
    state.value = value;
  });
  onScopeDispose(unsubscribe);
  if (!initialized.value) void applyOutcome(appUpdateClient.getState());

  const runningRelease = computed(() => {
    const value = state.value;
    if (!value) return undefined;
    return [value.bootAttempt, value.activeRelease, value.pinnedRelease].find(
      (release) => release?.releaseId === APP_RELEASE_ID,
    );
  });
  const latestRelease = computed(() => state.value?.confirmedLatestRelease);
  const hasUpdate = computed(
    () =>
      !!latestRelease.value && latestRelease.value.releaseId !== runningRelease.value?.releaseId,
  );
  const isReady = computed(
    () =>
      !!state.value?.candidateRelease &&
      state.value.candidateRelease.releaseId === latestRelease.value?.releaseId,
  );
  const status = computed(() => {
    if (!initialized.value || !state.value) return 'statusUnavailable' as const;
    if (operation.value === 'checking') return 'checking' as const;
    if (operation.value === 'preparing') return 'preparing' as const;
    if (errorCode.value === 'checkFailed') return 'checkFailed' as const;
    if (errorCode.value === 'prepareFailed') return 'prepareFailed' as const;
    if (errorCode.value === 'restartBusy' || errorCode.value === 'restartUnresponsive') {
      return 'restartBlocked' as const;
    }
    if (errorCode.value === 'capabilityUnavailable') return 'statusUnavailable' as const;
    if (!state.value.lastSuccessfulCheckAt) return 'notChecked' as const;
    if (!hasUpdate.value) return 'upToDate' as const;
    return isReady.value ? ('ready' as const) : ('available' as const);
  });

  return {
    state: readonly(state),
    operation: readonly(operation),
    errorCode: readonly(errorCode),
    runningRelease,
    latestRelease,
    hasUpdate,
    isReady,
    status,
    initialized: readonly(initialized),
    applyOutcome,
    setOperation(value: 'checking' | 'preparing' | undefined) {
      operation.value = value;
    },
  };
};
