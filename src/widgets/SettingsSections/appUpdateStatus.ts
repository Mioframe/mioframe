import type { AppUpdateSnapshot } from '@shared/serviceClient/appUpdate';

/**
 * Derive the Settings-row status from factual public update state.
 * @param snapshot - Latest public update snapshot.
 * @returns Compact factual supporting status.
 */
export const getCompactAppUpdateStatus = (snapshot: AppUpdateSnapshot | undefined): string => {
  if (!snapshot || snapshot.capability === 'unavailable') return 'Status unavailable';
  if (snapshot.checkState === 'failed') return 'Could not check for updates';
  if (!snapshot.lastSuccessfulCheckAt) return 'Not checked yet';
  if (
    snapshot.latestRelease &&
    snapshot.runningRelease &&
    snapshot.latestRelease.releaseSequence > snapshot.runningRelease.releaseSequence
  )
    return snapshot.preparationState === 'ready' ? 'Update ready' : 'Update available';
  return 'Up to date';
};
