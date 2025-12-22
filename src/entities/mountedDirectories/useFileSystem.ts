import { createGlobalState } from '@vueuse/core';
import { useMainService } from '@shared/service';
import { toRef } from 'vue';
import { isFunction } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDialog } from '@shared/ui/Dialog';
import { OPFSName } from '@shared/service/directories';
import { useLiveResource } from '@shared/lib/useLiveResource';

export const OPFS = OPFSName;

const setupFileSystem = () => {
  const {
    fileSystem: {
      createDirectory,
      mountFSDirectoryHandle,
      readDirectory,
      unmount,
      onChangePath: watch,
      move,
      remove,
    },
  } = useMainService();

  const rootPath = '/';

  const {
    errorMessage,
    isLoading,
    isReady,
    state: rootDirectory,
  } = useLiveResource(() => rootPath, {
    fetch: (rootPath) => readDirectory(rootPath),
    subscribe: watch,
    defaultErrorMessage: 'Error reading directory',
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
    isReady,

    mountUserDirectory,
    createDirectory,
    readDirectory,
    unmount,
    watch,
    move,
    remove,
    delete: remove,
  };
};

export const useFileSystem = createGlobalState(setupFileSystem);
