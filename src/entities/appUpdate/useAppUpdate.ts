import { computed, ref } from 'vue';
import { createGlobalState, tryOnScopeDispose } from '@vueuse/core';
import {
  getAppUpdateSnapshot,
  subscribeToAppUpdateStateChanged,
  type AppUpdateClientResult,
  type AppUpdateSnapshot,
} from '@shared/serviceClient/appUpdate/client';
import { MANAGED_APP_UPDATE_CHANNEL } from '@shared/config';

/** A stable release record suitable for app-update UI consumers. */
export type AppUpdateRelease = {
  /** Monotonically increasing publication sequence for the release. */
  releaseNumber: number;
  /** Human-readable application version. */
  appVersion: string;
  /** Immutable build identifier. */
  buildId: string;
  /** ISO-8601 build timestamp. */
  buildDate: string;
};

/** The entity projection of the worker's at-most-one future release candidate. */
export type AppUpdateCandidate =
  | {
      phase: 'available' | 'ready' | 'failed';
      release: AppUpdateRelease;
    }
  | {
      phase: 'activating';
      release: AppUpdateRelease;
    };

/**
 * Durable candidate lifecycle status, derived only from capability, the
 * persisted candidate's phase, and successful-check state — never from
 * `snapshot.error`. A transient worker error must never replace or hide this
 * status; see {@link AppUpdateTransientError} for the separate projection
 * that carries it.
 */
export type AppUpdateLifecycleStatus =
  | 'unavailable'
  | 'not-checked'
  | 'up-to-date'
  | 'update-available'
  | 'failed'
  | 'ready'
  | 'activating';

/**
 * The worker's most recent transient command error, projected independently
 * of {@link AppUpdateLifecycleStatus}. `'unavailable'` (an
 * `INSTALL_ON_NEXT_LAUNCH` with no candidate at all to install) is
 * deliberately excluded — it is not a presentable transient feedback state.
 */
export type AppUpdateTransientError = 'check-failed' | 'install-failed' | undefined;

function projectRelease(release: AppUpdateSnapshot['activeRelease']): AppUpdateRelease {
  return {
    releaseNumber: release.releaseNumber,
    appVersion: release.appVersion,
    buildId: release.buildId,
    buildDate: release.buildDate,
  };
}

function projectCandidate(
  candidate: AppUpdateSnapshot['candidate'],
): AppUpdateCandidate | undefined {
  if (!candidate) return undefined;
  if (candidate.phase === 'activating') {
    return { phase: 'activating', release: projectRelease(candidate.release) };
  }
  return { phase: candidate.phase, release: projectRelease(candidate.release) };
}

function deriveAppUpdateLifecycleStatus(
  snapshot: AppUpdateSnapshot | undefined,
  isCapabilityAvailable: boolean,
): AppUpdateLifecycleStatus {
  if (!isCapabilityAvailable) return 'unavailable';
  if (!snapshot) return 'not-checked';
  switch (snapshot.candidate?.phase) {
    case 'activating':
      return 'activating';
    case 'ready':
      return 'ready';
    case 'available':
      return 'update-available';
    case 'failed':
      return 'failed';
  }
  return snapshot.lastSuccessfulCheckAt ? 'up-to-date' : 'not-checked';
}

/**
 * Derives the transient worker error to present, independent of lifecycle
 * status. `'unavailable'` never surfaces as a transient error (see
 * {@link AppUpdateTransientError}).
 * @param snapshot - The last valid worker snapshot, if any.
 * @returns The transient error to present, if any.
 */
function deriveAppUpdateTransientError(
  snapshot: AppUpdateSnapshot | undefined,
): AppUpdateTransientError {
  return snapshot?.error === 'check-failed' || snapshot?.error === 'install-failed'
    ? snapshot.error
    : undefined;
}

const setupAppUpdate = () => {
  // This raw protocol snapshot never leaves the entity. Consumers receive
  // explicit projections below, which deliberately omit activation-only
  // protocol data such as `deadlineAt`.
  const snapshot = ref<AppUpdateSnapshot | undefined>(undefined);
  // An unsupported build (no managed channel at all) initializes as
  // unavailable immediately, never provisionally true: it can never pass
  // the client's own build-time channel check, so there is nothing to wait
  // on. A managed build starts provisionally true; the initial refresh()
  // converts a legacy Workbox controller to unavailable within the client's
  // capability-probe deadline.
  const isCapabilityAvailable = ref(MANAGED_APP_UPDATE_CHANNEL !== undefined);
  let latestApplicationToken = 0;

  const applyResult = (result: AppUpdateClientResult<AppUpdateSnapshot>): void => {
    switch (result.status) {
      case 'success':
        snapshot.value = result.value;
        isCapabilityAvailable.value = true;
        return;
      case 'unavailable':
        isCapabilityAvailable.value = false;
        return;
      case 'timeout':
        return;
    }
  };

  /**
   * Applies an action result while invalidating any older in-flight refresh.
   * @param result - The classified client result to apply.
   */
  const applyClientResult = (result: AppUpdateClientResult<AppUpdateSnapshot>): void => {
    latestApplicationToken += 1;
    applyResult(result);
  };

  /** Refreshes the read model through the current controlling worker, if any. */
  const refresh = async (): Promise<void> => {
    const requestToken = ++latestApplicationToken;
    const result = await getAppUpdateSnapshot();
    if (requestToken !== latestApplicationToken) return;
    applyResult(result);
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
  // A background worker change has no foreground command result to apply;
  // invalidation therefore triggers one ordinary GET_SNAPSHOT refresh.
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

  const status = computed(() =>
    deriveAppUpdateLifecycleStatus(snapshot.value, isCapabilityAvailable.value),
  );
  const transientError = computed(() => deriveAppUpdateTransientError(snapshot.value));
  const mode = computed(() => snapshot.value?.mode);
  const activeRelease = computed(() =>
    snapshot.value ? projectRelease(snapshot.value.activeRelease) : undefined,
  );
  const candidate = computed(() => projectCandidate(snapshot.value?.candidate));
  const lastSuccessfulCheckAt = computed(() => snapshot.value?.lastSuccessfulCheckAt);

  return {
    status,
    transientError,
    isCapabilityAvailable: computed(() => isCapabilityAvailable.value),
    mode,
    activeRelease,
    candidate,
    lastSuccessfulCheckAt,
    refresh,
    applyClientResult,
  };
};

/** Returns the shared application-update read model and result-application API. */
export const useAppUpdate = createGlobalState(setupAppUpdate);
