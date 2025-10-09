import { createGlobalState } from '@vueuse/core';
import { useMainService } from '@shared/api';
import {
  createSubscribeClient,
  useSubscribeByKeyClient,
} from '@shared/lib/subscriptions/subscribeClient';
import { toRef } from 'vue';
import { isFunction } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDialog } from '@shared/ui/Dialog';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { OPFSName } from '@shared/api/directories';

export const OPFS = OPFSName;

export const useDirectoryStoreClient = createGlobalState(() => {
  const api = useMainService();

  const directoryStore = api.directoryStore;

  const rootList = createSubscribeClient(directoryStore.subscribeRootList, []);

  const isSupportUserDirectory = toRef(
    () =>
      'showDirectoryPicker' in window && isFunction(window.showDirectoryPicker),
  );

  const { addSnackbar } = useSnackbar();

  const { alert } = useDialog();

  const addRootFSHandle = (handle: FileSystemDirectoryHandle, name: string) =>
    directoryStore.addRootFileSystemDirectoryHandle(handle, name);

  const mountUserDirectory = async () => {
    if (isSupportUserDirectory.value) {
      await alert(
        'Mounting user directory',
        'Allow and select a directory to use in the application',
      );

      const directoryHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });

      await addRootFSHandle(directoryHandle, directoryHandle.name);
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

  const removeEntry = async (rawPath: EntryPath | EntryPathString) => {
    await directoryStore.removeEntry(rawPath);
  };

  return {
    rootList,
    getEntry: useSubscribeByKeyClient(directoryStore.subscribeEntry),

    addRootFSHandle,
    createDirectory: directoryStore.createDirectory,
    removeEntry,
    renameEntry: directoryStore.renameEntry,
    mountUserDirectory,
  };
});
