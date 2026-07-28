import type { UpdateControllerState } from './contracts';
import type { AppUpdateErrorCode, AppUpdateSnapshot } from './protocol';

/**
 * Builds the UI-facing {@link AppUpdateSnapshot} from persisted controller
 * state.
 * @param state - Current controller state.
 * @param error - An error to report for this response, if any.
 * @returns The resulting snapshot.
 */
export function buildAppUpdateSnapshot(
  state: UpdateControllerState,
  error?: AppUpdateErrorCode,
): AppUpdateSnapshot {
  return {
    mode: state.mode,
    activeRelease: state.activeRelease,
    latestRelease: state.latestRelease,
    scheduledRelease: state.approvedRelease,
    lastSuccessfulCheckAt: state.lastSuccessfulCheckAt,
    error,
  };
}
