import { useFileSystem } from '@entity/mountedDirectories';
import { DomainError } from '@shared/lib/error';
import { isUserFileSelectionCancel } from '@shared/lib/fileSystem';
import { isFunction } from 'es-toolkit';
import { ref, toRef } from 'vue';
import { reportHandledError } from '@shared/lib/reportHandledError';
import { useDialog } from '@shared/ui/Dialog';
import { useSnackbar } from '@shared/ui/Snackbar';

/**
 * Creates a directory picker flow for mounting a local folder into the app.
 * @returns Reactive directory-picking state and action.
 */
export const usePickLocalDirectory = () => {
  const loading = ref(false);
  const { alert } = useDialog();
  const { addSnackbar } = useSnackbar();
  const { addDeviceDirectory } = useFileSystem();

  const isSupported = toRef(
    () => 'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const pickLocalDirectory = async () => {
    if (loading.value) {
      return;
    }

    if (!isSupported.value) {
      addSnackbar({
        text: 'Your browser does not support the use of user directories',
        actionLabel: 'More details',
        timeout: 5e3,
        callback: () => {
          window.open(
            'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
            '_blank',
          );
        },
      });

      return;
    }

    loading.value = true;

    try {
      await alert({
        headline: 'Mounting user directory',
        supportingText: 'Allow and select a directory to use in the application',
      });

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      await addDeviceDirectory(directoryHandle);
    } catch (error) {
      if (!isUserFileSelectionCancel(error)) {
        addSnackbar({
          text: error instanceof DomainError ? error.message : 'Could not add the folder',
        });
        reportHandledError(error, {
          feature: 'localDirectoryPick',
          action: 'pickLocalDirectory',
        });
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    isSupported,
    loading,
    pickLocalDirectory,
  };
};
