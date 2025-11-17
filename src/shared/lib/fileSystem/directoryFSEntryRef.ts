import type { ShallowRef } from 'vue';
import { reactive, shallowReactive, shallowRef } from 'vue';
import type {
  WritableDirectoryFSEntry,
  DirectoryFSEntry,
  StaticDirectoryFSEntry,
} from './DirectoryFSEntry';
import type { StrictRecord } from '../strictRecord';
import type { FileFSEntry } from './FileFSEntry';
import {
  strictRecordClear,
  strictRecordRemove,
  strictRecordSet,
} from '../strictRecord/wrapStrictRecord';
import { once } from 'es-toolkit';
import { tryOnScopeDispose } from '@vueuse/core';

export interface ReadonlyDirectoryFSEntryRef
  extends Omit<StaticDirectoryFSEntry, 'entries'> {
  entries: StrictRecord<string, FileFSEntry | DirectoryFSEntry>;
  loading: boolean;
  error: Error | undefined;
  ready: boolean;
  reload: () => Promise<void>;
  raw: DirectoryFSEntry;
}

export interface WritableDirectoryFSEntryRef
  extends ReadonlyDirectoryFSEntryRef {
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileFSEntry>;
  removeByName: (name: string) => Promise<void>;
  createDirectory: (name: string) => Promise<WritableDirectoryFSEntry>;
}

export type DirectoryFSEntryRef =
  | ReadonlyDirectoryFSEntryRef
  | WritableDirectoryFSEntryRef;

/**
 * Create Ref for DirectoryFSEntry
 * @param directoryFSEntry
 * @returns
 */
export function directoryFSEntryRef(
  directoryFSEntry: DirectoryFSEntry,
): DirectoryFSEntryRef {
  const readyRef = shallowRef(false);
  const loadingRef = shallowRef(false);
  const errorRef = shallowRef<Error>();
  const entriesReactiveState = shallowReactive<
    StrictRecord<string, DirectoryFSEntry | FileFSEntry>
  >({});

  const loadDirectory = async () => {
    readyRef.value = false;

    loadingRef.value = true;
    errorRef.value = undefined;
    strictRecordClear(entriesReactiveState);

    try {
      for await (const [name, entry] of directoryFSEntry.entries()) {
        strictRecordSet(entriesReactiveState, name, entry);
      }
    } catch (err) {
      errorRef.value = err instanceof Error ? err : new Error(String(err));
    } finally {
      loadingRef.value = false;
      readyRef.value = true;
    }
  };

  const onAdd = (name: string, entry: DirectoryFSEntry | FileFSEntry) => {
    strictRecordSet(entriesReactiveState, name, entry);
  };

  const onRemove = (name: string) => {
    strictRecordRemove(entriesReactiveState, name);
  };

  const addListeners = () => {
    if ('on' in directoryFSEntry) {
      directoryFSEntry.on('add', onAdd);
      directoryFSEntry.on('remove', onRemove);
    }
  };

  const onceInit = once(() => {
    addListeners();
    void loadDirectory();
  });

  const api: Omit<DirectoryFSEntry, 'entries'> & {
    readonly entries: StrictRecord<string, FileFSEntry | DirectoryFSEntry>;
    loading: ShallowRef<boolean>;
    error: ShallowRef<Error | undefined>;
    ready: ShallowRef<boolean>;
    reload: () => Promise<void>;
    raw: DirectoryFSEntry;
  } = {
    ...directoryFSEntry,
    get entries() {
      onceInit();
      return entriesReactiveState;
    },
    loading: loadingRef,
    error: errorRef,
    ready: readyRef,
    reload: loadDirectory,
    raw: directoryFSEntry,
  };

  const directoryCacheApiRef = reactive(api);

  const onScopeDispose = () => {
    if ('off' in directoryFSEntry) {
      directoryFSEntry.off('add', onAdd);
      directoryFSEntry.off('remove', onRemove);
    }
  };

  tryOnScopeDispose(onScopeDispose);

  return directoryCacheApiRef;
}
