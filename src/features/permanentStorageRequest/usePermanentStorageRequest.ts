import { useDialog } from '@shared/ui/Dialog';

/**
 * Creates the permanent-storage consent flow used before relying on browser-managed storage.
 * @returns Permanent-storage request action.
 */
export const usePermanentStorageRequest = () => {
  const { alert } = useDialog();

  const permanentStorageRequest = async () => {
    const persistent = await navigator.storage?.persisted();
    if (!persistent) {
      await alert({
        headline: 'Protect Your Stored Files from Deletion',
        supportingText:
          "To ensure the files and documents you save in this app's storage are never automatically cleared by your browser when space is low, we require permission for permanent storage. This guarantees the security and availability of your work, especially for offline use.",
        confirmLabel: 'Ok',
        symbolName: 'warning',
      });
      const result = await navigator.storage?.persist();
      if (!result) {
        await alert({
          headline: 'Important: Your Storage is Temporary',
          supportingText:
            'Your browser denied the request for permanent storage. Your files and settings are currently safe, but they may be deleted if your device runs low on space. To prevent data loss, please ensure you frequently back up your critical files outside of the app.',
          confirmLabel: 'Ok',
          symbolName: 'error',
        });
      }
    }
  };

  return {
    permanentStorageRequest,
  };
};
