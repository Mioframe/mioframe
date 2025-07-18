import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { computed, shallowReactive } from 'vue';

export const useMountedDirectories = createGlobalState(() => {
  // TODO: хранить директории в indexDB для сохранения доступа между сессиями
  const mounted = shallowReactive<Map<string, DirectoryFSEntry>>(new Map());

  const mount = (directoryEntry: DirectoryFSEntry, customName?: string) => {
    const name = customName ?? directoryEntry.name;

    mounted.set(name, directoryEntry);
    return directoryEntry;
  };

  const unmount = (name: string) => {
    mounted.delete(name);
  };

  const get = (name: string) => {
    const entry = mounted.get(name);
    return entry;
  };

  return {
    mount,
    unmount,
    get,
    map: computed((): ReadonlyMap<string, DirectoryFSEntry> => mounted),
  };
});
