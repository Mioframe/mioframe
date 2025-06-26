import { Repo } from '@automerge/automerge-repo';
import { shallowRef, watch, computed, reactive } from 'vue';
import { zodAutomergeFileName } from '../fsStorageAdapter';
import {
  createStorageAdapter as createFSStorageAdapter,
  fileNameToPartialKey,
} from '../fsStorageAdapter/createFSStorageAdapter';
import { type DirectoryFSEntry } from '../fileSystem';
import { zodIs } from '../validateZodScheme';
import type { RepoRef } from './useRepo';
import { useRepoRef } from './useRepo';
import {
  createGlobalWeakCache,
  defineGlobalWeakCache,
} from '../globalWeakCache';
import { useDirectoryFSEntryRef } from '../fileSystem/useDirectoryFSEntryRef';
import type { AMDocumentId } from '../automerge';
import { isEqual } from 'es-toolkit';

// FIXME: при удалении файла, не пропадает документ

export interface DirectoryRepo extends RepoRef {}

const useDirectoryRepoRefCacheApi = createGlobalWeakCache(
  (directory: DirectoryFSEntry): DirectoryRepo => {
    const repoState = shallowRef<Repo>();

    const directoryRef = useDirectoryFSEntryRef(directory);

    const directoryDocumentIds = computed<AMDocumentId[]>(
      (oldState): AMDocumentId[] => {
        const entriesMap = directoryRef.value?.entries;

        const list: AMDocumentId[] = [];

        if (entriesMap) {
          for (const [name] of entriesMap) {
            if (zodIs(name, zodAutomergeFileName)) {
              const maybePartialKey = fileNameToPartialKey(name);

              if (maybePartialKey) {
                const [id] = maybePartialKey;
                if (!list.includes(id)) {
                  list.push(id);
                }
              }
            }
          }
        }

        if (oldState && isEqual(oldState, list)) {
          return oldState;
        }

        return list;
      },
    );

    const hasDocumentsFile = computed(() => {
      const entriesMap = directoryRef.value?.entries;

      if (entriesMap) {
        for (const [name] of entriesMap) {
          if (zodIs(name, zodAutomergeFileName)) {
            return true;
          }
        }
      }

      return false;
    });

    const initialRepo = (): Repo => {
      if (!repoState.value) {
        repoState.value = new Repo({
          storage: createFSStorageAdapter(directory),
        });
      }
      return repoState.value;
    };

    watch(
      hasDocumentsFile,
      (hasDocuments) => {
        if (hasDocuments) {
          initialRepo();
        }
      },
      { immediate: true, flush: 'sync' },
    );

    const repoRefs = useRepoRef(repoState, directoryDocumentIds);

    const directoryRepo: DirectoryRepo = reactive({
      map: computed(() => repoRefs.map ?? new Map()),
      find: (...args: Parameters<typeof repoRefs.find>) => {
        initialRepo();
        repoRefs.find(...args);
      },
      create: (...args: Parameters<typeof repoRefs.create>) => {
        initialRepo();
        repoRefs.create(...args);
      },
      remove: (...args: Parameters<typeof repoRefs.remove>) => {
        initialRepo();
        repoRefs.remove(...args);
      },
    });

    return directoryRepo;
  },
);

/**
 * Использование директории как репозитория документов
 * @param directory - директория для хранения документов
 * @returns
 */
export const useDirectoryRepo = defineGlobalWeakCache(
  useDirectoryRepoRefCacheApi,
);
