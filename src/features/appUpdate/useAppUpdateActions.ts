import { useAppUpdate } from '@entity/appUpdate';
import { appUpdateClient } from '@shared/serviceClient/appUpdate';

/**
 * Owns the user-triggered check, mode, and activation actions.
 * @returns Reactive update facts and explicit user actions.
 */
export const useAppUpdateActions = () => {
  const update = useAppUpdate();

  const checkForUpdates = async () => {
    update.setOperation('checking');
    try {
      return await update.applyOutcome(appUpdateClient.checkForUpdates());
    } finally {
      update.setOperation(undefined);
    }
  };

  const setAutomatic = async (enabled: boolean) => {
    const releaseId = update.runningRelease.value?.releaseId;
    if (!releaseId) return;
    update.setOperation(enabled ? 'preparing' : undefined);
    try {
      return await update.applyOutcome(appUpdateClient.setAutomatic(enabled, releaseId));
    } finally {
      update.setOperation(undefined);
    }
  };

  const updateNow = async () => {
    update.setOperation('preparing');
    try {
      return await update.applyOutcome(appUpdateClient.requestActivate());
    } finally {
      update.setOperation(undefined);
    }
  };

  return { ...update, checkForUpdates, setAutomatic, updateNow };
};
