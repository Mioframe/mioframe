import { reactive, shallowReactive, shallowRef } from 'vue';
import type { DirectoryFSEntry } from './DirectoryFSEntry';
import type { StrictRecord } from '../strictRecord';
import type { FileFSEntry } from './FileFSEntry';
import {
  strictRecordClear,
  strictRecordRemove,
  strictRecordSet,
} from '../strictRecord/wrapStrictRecord';
import { once } from 'es-toolkit';
import { tryOnScopeDispose } from '@vueuse/core';

export interface DirectoryFSEntryRef extends Omit<DirectoryFSEntry, 'entries'> {
  entries: StrictRecord<string, FileFSEntry | DirectoryFSEntry>;
  loading: boolean;
  error: Error | undefined;
  ready: boolean;
  reload: () => Promise<void>;
  writeFile: (
    name: string,
    file?: FileSystemWriteChunkType,
  ) => Promise<FileFSEntry>;
  removeByName: (name: string) => Promise<void>;
  createDirectory: (name: string) => Promise<DirectoryFSEntry>;
  raw: DirectoryFSEntry;
}

/**
 * Create Ref for DirectoryFSEntry
 * @param directoryFSEntry
 * @returns
 */
export const directoryFSEntryRef = (
  directoryFSEntry: DirectoryFSEntry,
): DirectoryFSEntryRef => {
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
    directoryFSEntry.on('add', onAdd);
    directoryFSEntry.on('remove', onRemove);
  };

  const onceInit = once(() => {
    addListeners();
    void loadDirectory();
  });

  const directoryCacheApiRef: DirectoryFSEntryRef = reactive({
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
  });

  const onScopeDispose = () => {
    directoryFSEntry.off('add', onAdd);
    directoryFSEntry.off('remove', onRemove);
  };

  tryOnScopeDispose(onScopeDispose);

  return directoryCacheApiRef;
};
