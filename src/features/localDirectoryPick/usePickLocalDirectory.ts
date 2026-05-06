import { useFileSystem } from '@entity/mountedDirectories';
import { isFunction } from 'es-toolkit';
import { ref, toRef } from 'vue';
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
      await alert(
        'Mounting user directory',
        'Allow and select a directory to use in the application',
      );

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      await addDeviceDirectory(directoryHandle);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        addSnackbar({
          text: 'Could not add the folder',
        });
        throw error;
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
