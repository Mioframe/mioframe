import { useDialog } from '@shared/ui/Dialog';

export const usePermanentStorageRequest = () => {
  const { alert } = useDialog();

  const permanentStorageRequest = async () => {
    const persistent = await navigator.storage?.persisted();
    if (!persistent) {
      await alert(
        'Protect Your Stored Files from Deletion',
        "To ensure the files and documents you save in this app's storage are never automatically cleared by your browser when space is low, we require permission for permanent storage. This guarantees the security and availability of your work, especially for offline use.",
        'Ok',
        'warning',
      );
      const result = await navigator.storage?.persist();
      if (!result) {
        await alert(
          'Important: Your Storage is Temporary',
          'Your browser denied the request for permanent storage. Your files and settings are currently safe, but they may be deleted if your device runs low on space. To prevent data loss, please ensure you frequently back up your critical files outside of the app.',
          'Ok',
          'error',
        );
      }
    }
  };

  return {
    permanentStorageRequest,
  };
};
