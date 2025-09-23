import { createGlobalState } from '@vueuse/core';
import { useApiClient } from '@shared/api';
import {
  useSubscribeClient,
  useSubscribeByKeyClient,
} from '@shared/lib/remoteStore/subscribeClient';
import { toRef, watchEffect } from 'vue';
import { isFunction } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDialog } from '@shared/ui/Dialog';
import type { EntryPath, EntryPathString } from '@shared/lib/fileSystem';
import { cloneDeepSerialize } from '@shared/lib/wrapWorker/vueTransferHandlerSet';

export const OPFSName = 'Origin private file system';
export const OPFS = OPFSName;

export const useDirectoryStoreClient = createGlobalState(() => {
  const api = useApiClient();

  const directoryStore = api.directoryStore;

  const rootList = useSubscribeClient(directoryStore.subscribeRootList, []);

  watchEffect(() => {
    console.debug('rootList', rootList.value);
  });

  const entryStore = useSubscribeByKeyClient(directoryStore.subscribeEntry);

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

  const mountOPFS = async () => {
    console.debug('🔴 mountOPFS');
    const persistent = await navigator.storage.persisted();
    if (!persistent) {
      await navigator.storage.persist();
    }

    if (!rootList.value.includes(OPFSName)) {
      const directory = await navigator.storage.getDirectory();
      await addRootFSHandle(directory, OPFSName);
    }
  };

  setTimeout(() => {
    void mountOPFS();
  }, 1e3);

  const removeEntry = async (rawPath: EntryPath | EntryPathString) => {
    await directoryStore.removeEntry(cloneDeepSerialize(rawPath));
  };

  return {
    rootList,
    entryStore,

    addRootFSHandle,
    createDirectory: directoryStore.createDirectory,
    removeEntry,
    renameEntry: directoryStore.renameEntry,
    mountUserDirectory,
  };
});
