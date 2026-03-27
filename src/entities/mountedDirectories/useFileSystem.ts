import { createGlobalState } from '@vueuse/core';
import { useMainServiceClient } from '@shared/service';
import { computed, toRef, toValue } from 'vue';
import { isFunction, isUndefined } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDialog } from '@shared/ui/Dialog';
import { OPFSName } from '@shared/service/directories';
import { useObservableQuery } from '@shared/lib/observableQuery';

export const OPFS = OPFSName;

const setupFileSystem = () => {
  const {
    fileSystem: {
      createDirectory,
      mountFSDirectoryHandle,
      unmount,
      move,
      remove,
      directoryContent,
    },
  } = useMainServiceClient();

  const rootPath = '/';

  const {
    data: rootDirectory,
    error,
    isLoading,
  } = useObservableQuery(
    directoryContent,
    computed(() => ({
      path: rootPath,
    })),
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading directory';
  });

  const isSupportUserDirectory = toRef(
    () =>
      'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const { addSnackbar } = useSnackbar();

  const { alert } = useDialog();

  const mountUserDirectory = async () => {
    if (isSupportUserDirectory.value) {
      await alert(
        'Mounting user directory',
        'Allow and select a directory to use in the application',
      );

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      await mountFSDirectoryHandle(directoryHandle.name, directoryHandle);
    } else {
      addSnackbar({
        text: 'Your browser does not support the use of user directories',
        actionLabel: 'More details',
        timeout: 5e3,
        callback: () => {
          window.open(
            'https://developer.mozilla.org/en-US/docs/Web/API/Window/showDirectoryPicker',
            '_black',
          );
        },
      });
    }
  };

  return {
    rootDirectory,
    errorMessage,
    isLoading,

    mountUserDirectory,
    createDirectory,
    unmount,

    move,
    remove,
    delete: remove,
  };
};

export const useFileSystem = createGlobalState(setupFileSystem);
