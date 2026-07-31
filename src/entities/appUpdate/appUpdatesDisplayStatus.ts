import type { AppUpdateStatus } from './useAppUpdate';

/**
 * The concise, user-facing status the App updates Settings entry and pane
 * both display. Derived from {@link AppUpdateStatus} plus local,
 * non-persisted action-in-flight facts a caller supplies — never persisted
 * itself, and never inferred from worker or protocol internals.
 */
export type AppUpdatesDisplayStatus =
  | 'unavailable'
  | 'not-checked'
  | 'checking'
  | 'up-to-date'
  | 'update-available'
  | 'preparing'
  | 'ready'
  | 'activating'
  | 'update-failed'
  | 'could-not-check'
  | 'offline';

/** Inputs to {@link deriveAppUpdatesDisplayStatus}. */
export type AppUpdatesDisplayStatusInput = {
  /** The current entity-derived status. */
  status: AppUpdateStatus;
  /** Whether an explicit `Check for updates` action is currently in flight. */
  isChecking: boolean;
  /** Whether an explicit `Install on next launch` (or equivalent preparation) action is currently in flight. */
  isPreparing: boolean;
  /** Whether the browser currently reports itself online. */
  isOnline: boolean;
};

/**
 * Derives the display status the App updates Settings entry and pane both
 * show. `isChecking`/`isPreparing` are transient local facts, never
 * persisted; a failed check is split into `could-not-check` or `offline`
 * using the browser's current `navigator.onLine` state at the moment of
 * derivation. An install (prepare) failure still shows `update-available`,
 * since the release remains available to retry.
 * @param input - Current entity status plus local action-in-flight and connectivity facts.
 * @returns The resulting display status.
 */
export function deriveAppUpdatesDisplayStatus({
  status,
  isChecking,
  isPreparing,
  isOnline,
}: AppUpdatesDisplayStatusInput): AppUpdatesDisplayStatus {
  if (status === 'unavailable') return 'unavailable';
  if (isChecking) return 'checking';
  if (isPreparing) return 'preparing';

  switch (status) {
    case 'not-checked':
      return 'not-checked';
    case 'up-to-date':
      return 'up-to-date';
    case 'update-available':
    case 'install-failed':
      return 'update-available';
    case 'failed':
      return 'update-failed';
    case 'ready':
      return 'ready';
    case 'activating':
      return 'activating';
    case 'check-failed':
      return isOnline ? 'could-not-check' : 'offline';
  }
}

/**
 * Maps a display status to its concise, user-facing text. Never mentions
 * worker, channel, or release-identity terminology.
 * @param displayStatus - The status to describe.
 * @returns The concise status text.
 */
export function getAppUpdatesDisplayStatusText(displayStatus: AppUpdatesDisplayStatus): string {
  switch (displayStatus) {
    case 'unavailable':
      return 'Updates unavailable';
    case 'not-checked':
      return 'Not checked yet';
    case 'checking':
      return 'Checking for updates…';
    case 'up-to-date':
      return 'Up to date';
    case 'update-available':
      return 'Update available';
    case 'preparing':
      return 'Preparing update…';
    case 'ready':
      return 'Update ready';
    case 'activating':
      return 'Activating update…';
    case 'update-failed':
      return 'Update failed';
    case 'could-not-check':
      return 'Could not check for updates';
    case 'offline':
      return 'Offline';
  }
}
