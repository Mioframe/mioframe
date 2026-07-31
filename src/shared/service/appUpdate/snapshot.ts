import type { UpdateControllerState } from './contracts';
import type { AppUpdateErrorCode, AppUpdateSnapshot } from './protocol';

/**
 * Builds the UI-facing {@link AppUpdateSnapshot} from persisted controller
 * state: a direct projection plus an ephemeral classified error.
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
    candidate: state.candidate,
    lastSuccessfulCheckAt: state.lastSuccessfulCheckAt,
    error,
  };
}
