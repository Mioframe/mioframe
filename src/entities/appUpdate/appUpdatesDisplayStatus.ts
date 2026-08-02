import type { AppUpdateStatus } from './useAppUpdate';

/** The concise, stable presentation derived from app-update entity status. */
export type AppUpdatesDisplayStatus =
  | 'unavailable'
  | 'not-checked'
  | 'up-to-date'
  | 'update-available'
  | 'ready'
  | 'activating'
  | 'update-failed'
  | 'could-not-check'
  | 'offline';

/** Inputs to {@link deriveAppUpdatesDisplayStatus}. */
export type AppUpdatesDisplayStatusInput = {
  /** The current entity-derived lifecycle status. */
  status: AppUpdateStatus;
  /** Whether the browser currently reports itself online. */
  isOnline: boolean;
};

/**
 * Derives stable entity-state presentation only. Feature-local busy and
 * transport outcomes intentionally stay with the invoking feature/widget.
 * @param input - Current entity status and connectivity fact.
 * @returns The concise display status.
 */
export function deriveAppUpdatesDisplayStatus({
  status,
  isOnline,
}: AppUpdatesDisplayStatusInput): AppUpdatesDisplayStatus {
  switch (status) {
    case 'unavailable':
      return 'unavailable';
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
 * Maps a display status to concise, user-facing text without worker or
 * release-identity terminology.
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
    case 'could-not-check':
      return 'Could not check for updates';
    case 'offline':
      return 'Offline';
  }
}
