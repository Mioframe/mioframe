import { zodAutomergeFileName } from '@shared/lib/automergeAdapter';
import { zodIs } from '@shared/lib/validateZodScheme';
import type { FSNodeStat } from '@shared/lib/virtualFileSystem';
import { VirtualFileSystem, PathUtils } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { OPFSName } from '../directories';
import { createGlobalState } from '@vueuse/core';
import { WebFileSystemProvider } from '@shared/lib/webFileSystemProvider';
import { distinctUntilChanged, map, Observable, shareReplay } from 'rxjs';
import { isEqual, sortBy } from 'es-toolkit';
import { defineObservableQuery } from '@shared/lib/useObservableQuery';
import { defineCacheObservable } from '@shared/lib/defineCacheObservable';

export interface ReadDirectoryOptions {
  hideAutomergeFiles?: boolean;
}

const setupFileSystemService = () => {
  const vfs = new VirtualFileSystem();

  const directoryContent$ = defineCacheObservable(
    ({
      options: { hideAutomergeFiles = false } = {},
      path,
    }: {
      path: string;
      options?: ReadDirectoryOptions;
    }) =>
      new Observable<[string, FSNodeStat][] | Error>((subscriber) => {
        const fetchEntries = async () => {
          try {
            const entries = await vfs.readDirectory(path);

            subscriber.next(sortBy(entries, [0]));
          } catch (err) {
            if (err instanceof Error) {
              subscriber.next(err);
            } else {
              subscriber.error(err);
            }
          }
        };

        void fetchEntries();

        const unwatch = vfs.watch(path, () => {
          void fetchEntries();
        });

        return () => {
          unwatch();
        };
      }).pipe(
        distinctUntilChanged((a, b) => isEqual(a, b)),
        shareReplay({ bufferSize: 1, refCount: true }),
        map((payload) => {
          if (payload instanceof Error) {
            return payload;
          }
          if (hideAutomergeFiles) {
            return payload.filter(
              ([name]) => !zodIs(name, zodAutomergeFileName),
            );
          }
          return payload;
        }),
      ),
  );

  const fsNodeStat$ = defineCacheObservable(({ path }: { path: string }) =>
    new Observable<FSNodeStat | Error>((subscriber) => {
      const fetchStat = async () => {
        try {
          const stat = await vfs.stat(path);

          subscriber.next(stat);
        } catch (err) {
          if (err instanceof Error) {
            subscriber.next(err);
          } else {
            subscriber.error(err);
          }
        }
      };

      void fetchStat();

      const unwatch = vfs.watch(path, () => fetchStat());

      return () => {
        unwatch();
      };
    }).pipe(
      distinctUntilChanged((a, b) => isEqual(a, b)),
      shareReplay({ bufferSize: 1, refCount: true }),
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
    vfs.mount(path, new WebFileSystemProvider(handle));
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
    directoryContent: defineObservableQuery(directoryContent$),
    fsNodeStat$,
    fsNodeStat: defineObservableQuery(fsNodeStat$),
    mountFSDirectoryHandle,
    move,
    delete: remove,
    remove,
  };
};

export const useFileSystemService = createGlobalState(setupFileSystemService);
