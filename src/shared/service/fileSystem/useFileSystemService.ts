import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { FSNodeStat, FSNodeType } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem, PathUtils } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { OPFSName } from '../directories';
import { createGlobalState } from '@vueuse/core';
import { WebFileSystem } from '@shared/lib/vfsProviders/WebFileSystem';
import {
  distinctUntilChanged,
  finalize,
  map,
  Observable,
  shareReplay,
} from 'rxjs';
import { isEqual, sortBy } from 'es-toolkit';
import { defineQuery } from '@shared/lib/observableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

export interface ReadDirectoryOptions {
  hideAutomergeFiles?: boolean;
}

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();

  const directoryContent$Cache = new Map<
    string,
    Observable<[string, FSNodeType][]>
  >();

  const directoryContent$ = defineCacheObservable(
    ({
      options: { hideAutomergeFiles = false } = {},
      path,
    }: {
      path: string;
      options?: ReadDirectoryOptions;
    }) =>
      new Observable<[string, FSNodeStat][]>((subscriber) => {
        const fetchEntries = async () => {
          try {
            const entries = await vfs.readDirectory(path);

            subscriber.next(sortBy(entries, [0]));
          } catch (err) {
            subscriber.error(err);
          }
        };

        void fetchEntries();

        const unwatch = vfs.watch(path, () => fetchEntries());

        return () => {
          unwatch();
        };
      }).pipe(
        distinctUntilChanged((a, b) => isEqual(a, b)),
        shareReplay({ bufferSize: 1, refCount: true }),
        finalize(() => directoryContent$Cache.delete(path)),
        map((list) => {
          if (hideAutomergeFiles) {
            return list.filter(([name]) => !zodIs(name, zodAutomergeFileName));
          }
          return list;
        }),
      ),
  );

  const unmount = (path: string) => {
    vfs.unmount(path);
  };

  const createDirectory = (path: string) => vfs.createDirectory(path);

  const mountFSDirectoryHandle = (
    path: string,
    handle: FileSystemDirectoryHandle,
  ) => {
    vfs.mount(path, new WebFileSystem(handle));
  };

  vfs.mount('/', new MemoryFileSystem());

  void vfs.createDirectory('/temp');

  const mountOpfs = async () => {
    const fileSystemDirectoryHandle = await navigator.storage?.getDirectory();
    if (fileSystemDirectoryHandle) {
      const mountedPath = PathUtils.join('/', OPFSName);

      await vfs.createDirectory(mountedPath);

      mountFSDirectoryHandle(mountedPath, fileSystemDirectoryHandle);
    }
  };

  void mountOpfs();

  const move = (oldPath: string, newPath: string) => vfs.move(oldPath, newPath);

  const remove = (path: string, recursive?: boolean) =>
    vfs.delete(path, recursive);

  return {
    vfs,

    unmount,
    createDirectory,
    directoryContent$,
    directoryContent: defineQuery(directoryContent$),
    mountFSDirectoryHandle,
    move,
    delete: remove,
    remove,
  };
};

export const useFileSystemService = createGlobalState(setupFileSystemService);
