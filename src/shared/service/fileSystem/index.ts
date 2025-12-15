import type { VfsEvent } from '@shared/lib/virtualFileSystem';
import { PathUtils, VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import type { VfsWatchOptions } from '@shared/lib/virtualFileSystem/VirtualFileSystem';
import { createGlobalState } from '@vueuse/core';
import { OPFSName } from '../directories';
import { WebFileSystem } from '@shared/lib/virtualFileSystem/WebFileSystem';

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
    vfs.mount(path, new WebFileSystem(handle));
  };

  vfs.mount('/', new MemoryFileSystem());

  void vfs.createDirectory('/temp');

  const mountOpfs = async () => {
    const fileSystemDirectoryHandle = await navigator.storage.getDirectory();

    const mountedPath = PathUtils.join('/', OPFSName);

    await vfs.createDirectory(mountedPath);

    mountFSDirectoryHandle(mountedPath, fileSystemDirectoryHandle);
  };

  void mountOpfs();

  const move = (oldPath: string, newPath: string) =>
    vfs.rename(oldPath, newPath);

  const remove = (path: string, recursive?: boolean) =>
    vfs.delete(path, recursive);

  return {
    vfs,

    unmount,
    createDirectory,
    watch,
    readDirectory,
    mountFSDirectoryHandle,
    move,
    delete: remove,
    remove,
  };
};

export const useFileSystemService = createGlobalState(setupFileSystemService);
