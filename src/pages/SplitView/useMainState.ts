import type { WritableDirectoryFSEntry } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { computed, shallowRef } from 'vue';

export const useMainState = createGlobalState(() => {
  const openedDocument = computed(() => undefined);
  const openedDirectory = shallowRef<WritableDirectoryFSEntry>();

  return {
    openedDocument,
    openedDirectory,
  };
});
