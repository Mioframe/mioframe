import type { AppUpdateLifecycleStatus, AppUpdateTransientError } from './useAppUpdate';

/** The concise, stable headline presentation derived from candidate lifecycle status only. */
export type AppUpdatesDisplayStatus =
  | 'unavailable'
  | 'not-checked'
  | 'up-to-date'
  | 'update-available'
  | 'ready'
  | 'activating'
  | 'update-failed';

/** Inputs to {@link deriveAppUpdatesDisplayStatus}. */
export type AppUpdatesDisplayStatusInput = {
  /** The current entity-derived lifecycle status. */
  status: AppUpdateLifecycleStatus;
};

/**
 * Derives the stable headline presentation from durable lifecycle status
 * only. A transient worker error never changes this: see
 * {@link deriveAppUpdateTransientFeedback} for its own, separately rendered
 * projection.
 * @param input - Current entity lifecycle status.
 * @returns The concise display status.
 */
export function deriveAppUpdatesDisplayStatus({
  status,
}: AppUpdatesDisplayStatusInput): AppUpdatesDisplayStatus {
  switch (status) {
    case 'unavailable':
      return 'unavailable';
    case 'not-checked':
      return 'not-checked';
    case 'up-to-date':
      return 'up-to-date';
    case 'update-available':
      return 'update-available';
    case 'failed':
      return 'update-failed';
    case 'ready':
      return 'ready';
    case 'activating':
      return 'activating';
  }
}

/**
 * Maps a display status to concise, user-facing headline text without
 * worker or release-identity terminology.
 * @param displayStatus - The status to describe.
 * @returns The concise status text.
 */
export function getAppUpdatesDisplayStatusText(displayStatus: AppUpdatesDisplayStatus): string {
  switch (displayStatus) {
    case 'unavailable':
      return 'Updates unavailable';
    case 'not-checked':
      return 'Not checked yet';
    case 'up-to-date':
      return 'Up to date';
    case 'update-available':
      return 'Update available';
    case 'ready':
      return 'Update ready';
    case 'activating':
      return 'Activating update…';
    case 'update-failed':
      return 'Update failed';
  }
}

/** The concise, stable transient feedback presentation, separate from the durable headline. */
export type AppUpdateTransientFeedback =
  | 'could-not-check'
  | 'offline'
  | 'could-not-prepare'
  | undefined;

/** Inputs to {@link deriveAppUpdateTransientFeedback}. */
export type AppUpdateTransientFeedbackInput = {
  /** The current entity-derived transient worker error, if any. */
  transientError: AppUpdateTransientError;
  /** Whether the browser currently reports itself online. */
  isOnline: boolean;
};

/**
 * Derives transient command feedback, entirely independent of durable
 * candidate lifecycle: a transient error never replaces or hides the
 * lifecycle headline (see {@link deriveAppUpdatesDisplayStatus}), and this
 * feedback is presented even when there is no candidate at all.
 * @param input - Current entity transient error and connectivity fact.
 * @returns The concise transient feedback, or `undefined` when there is none to show.
 */
export function deriveAppUpdateTransientFeedback({
  transientError,
  isOnline,
}: AppUpdateTransientFeedbackInput): AppUpdateTransientFeedback {
  switch (transientError) {
    case 'check-failed':
      return isOnline ? 'could-not-check' : 'offline';
    case 'install-failed':
      return 'could-not-prepare';
    case undefined:
      return undefined;
  }
}

/**
 * Maps transient feedback to concise, user-facing text, rendered separately
 * from the durable lifecycle headline.
 * @param feedback - The transient feedback to describe.
 * @returns The concise feedback text, or `undefined` when there is none.
 */
export function getAppUpdateTransientFeedbackText(
  feedback: AppUpdateTransientFeedback,
): string | undefined {
  switch (feedback) {
    case 'could-not-check':
      return 'Could not check for updates';
    case 'offline':
      return 'Offline';
    case 'could-not-prepare':
      return 'Could not prepare the update';
    case undefined:
      return undefined;
  }
}
