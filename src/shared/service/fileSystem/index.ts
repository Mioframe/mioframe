import type { VfsEvent } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import type { VfsWatchOptions } from '@shared/lib/virtualFileSystem/VirtualFileSystem';
import { createGlobalState } from '@vueuse/core';

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();

  const unmount = (path: string) => {
    vfs.unmount(path);
  };

  const createDirectory = (path: string) => vfs.createDirectory(path);

  const watch = (
    path: string,
    callback: (event: VfsEvent) => void,
    options?: VfsWatchOptions,
  ) => vfs.watch(path, callback, options);

  const readDirectory = (path: string) => vfs.readDirectory(path);

  const mountFSDirectoryHandle = (
    path: string,
    handle: FileSystemDirectoryHandle,
  ) => {
    // fixme: сделать драйвер для FileSystemDirectoryHandle
    // vfs.mount(path, ...);
  };

  vfs.mount('/', new MemoryFileSystem());

  // todo: сразу монтировать OPFS

  const move = (oldPath: string, newPath: string) =>
    vfs.rename(oldPath, newPath);

  return {
    vfs,

    unmount,
    createDirectory,
    watch,
    readDirectory,
    mountFSDirectoryHandle,
    move,
  };
};

export const useFileSystemService = createGlobalState(setupFileSystemService);
