import type { AppUpdateSnapshot } from '@shared/serviceClient/appUpdate';

/**
 * Derive the Settings-row status from the controller-owned canonical update state.
 * @param snapshot - Latest public update snapshot.
 * @returns Compact factual supporting status.
 */
export const getCompactAppUpdateStatus = (snapshot: AppUpdateSnapshot | undefined): string => {
  if (!snapshot || snapshot.capability === 'unavailable') return 'Status unavailable';
  switch (snapshot.updateState) {
    case 'failed':
      return 'Could not check for updates';
    case 'notChecked':
      return 'Not checked yet';
    case 'ready':
      return 'Update ready';
    case 'available':
    case 'preparing':
    case 'trialStarting':
      return 'Update available';
    case 'checking':
    case 'upToDate':
    default:
      return 'Up to date';
  }
};
