import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { useDialog } from '@shared/ui/Dialog';
import { createGlobalState } from '@vueuse/core';
import { OPFS } from '@widget/RepoExplorer/repoExplorerState';
import { computed, shallowReactive } from 'vue';

export const useBrowserStorage = createGlobalState(() => {
  const mounted = shallowReactive<Map<string, DirectoryLocalEntry>>(new Map());

  const mount = (
    directoryHandler: FileSystemDirectoryHandle,
    customName?: string,
  ) => {
    const name = customName ?? directoryHandler.name;

    const entry = createLocalDirectory(directoryHandler, undefined, name);
    mounted.set(name, entry);
    return entry;
  };

  const unmount = (name: string) => {
    mounted.delete(name);
  };

  const get = (name: string) => {
    const entry = mounted.get(name);
    return entry;
  };

  const { alert } = useDialog();

  const requestMountDirectory = async (
    name: string,
  ): Promise<DirectoryLocalEntry> => {
    await alert(
      `Mounting "${name}"`,
      `Please select directory "${name}" to mount in the application`,
    );
    const directoryHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
    });

    if (directoryHandle.name !== name) {
      throw new Error(
        `Directory name "${directoryHandle.name}" does not match "${name}"`,
      );
    }

    return mount(directoryHandle);
  };

  const getAndRequestMountDirectory = async (
    rootName?: string,
  ): Promise<DirectoryLocalEntry> => {
    if (!rootName) {
      if ('showDirectoryPicker' in window) {
        await alert(
          'Mounting user directory',
          'Select a directory to use in the application',
        );
        const directoryHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
        });
        return mount(directoryHandle);
      } else {
        throw new Error('showDirectoryPicker is not supported');
      }
    }
    const entry = get(rootName);
    if (entry) {
      return entry;
    }
    if (rootName === OPFS) {
      return mountOPFS();
    }
    return requestMountDirectory(rootName);
  };

  const mountOPFS = async () => {
    let handle: FileSystemDirectoryHandle;
    try {
      handle = await navigator.storage.getDirectory();
    } catch {
      await alert(
        'Allow use of original private file system',
        "OPFS (Origin Private File System) enables websites to store data privately and securely on a user's device.",
      );
      handle = await navigator.storage.getDirectory();
    }
    return mount(handle, OPFS);
  };

  void mountOPFS();

  return {
    mount,
    unmount,
    get,
    mounted: computed(() => mounted),
    requestMountDirectory,
    getAndRequestMountDirectory,
  };
});
