import { Repo } from '@automerge/automerge-repo';
import { shallowRef, watch, computed, reactive } from 'vue';
import { zodAutomergeFileName } from '../fsStorageAdapter';
import {
  createFSStorageAdapter,
  fileNameToPartialKey,
} from '../fsStorageAdapter';
import type { DirectoryFSEntry } from '../fileSystem';
import { zodIs } from '../validateZodScheme';
import type { RepoRef } from './useRepo';
import { useRepo } from './useRepo';
import { createScopesWeakMap, defineScopesWeakMapRef } from '../scopesWeakMap';
import { useDirectoryFSEntryCacheRef } from '../fileSystem/useDirectoryFSEntryRef';
import type { AMDocHandle } from '../automerge';
import { zodDocumentId, type AMDocumentId } from '../automerge';
import { isEqual } from 'es-toolkit';
import { strictRecordIterableEntries } from '../strictRecord/wrapStrictRecord';

// FIXME: при удалении файла, не пропадает документ

export interface DirectoryRepo extends RepoRef {}

export const defineDirectoryRepo = (
  directory: DirectoryFSEntry,
): DirectoryRepo => {
  const repoState = shallowRef<Repo>();

  const directoryRef = useDirectoryFSEntryCacheRef(directory);

  const directoryDocumentIds = computed<AMDocumentId[]>(
    (oldState): AMDocumentId[] => {
      const entriesMap = directoryRef.value?.entries;

      const list: AMDocumentId[] = [];

      if (entriesMap) {
        for (const [name] of strictRecordIterableEntries(entriesMap)()) {
          if (zodIs(name, zodAutomergeFileName)) {
            const maybePartialKey = fileNameToPartialKey(name);

            if (maybePartialKey) {
              const [id] = maybePartialKey;
              if (zodIs(id, zodDocumentId) && !list.includes(id)) {
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
      for (const [name] of strictRecordIterableEntries(entriesMap)()) {
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

  const repoRef = useRepo(repoState, directoryDocumentIds);

  const documentMap = computed(
    (): ReadonlyMap<AMDocumentId, AMDocHandle> =>
      repoRef.map ?? new Map<AMDocumentId, AMDocHandle>(),
  );

  const directoryRepo: DirectoryRepo = reactive({
    map: documentMap,
    find: (...args: Parameters<typeof repoRef.find>) => {
      initialRepo();
      repoRef.find(...args);
    },
    create: (...args: Parameters<typeof repoRef.create>) => {
      initialRepo();
      repoRef.create(...args);
    },
    remove: (...args: Parameters<typeof repoRef.remove>) => {
      initialRepo();
      repoRef.remove(...args);
    },
  });

  return directoryRepo;
};

export const useDirectoryRepoScopesWeakMap =
  createScopesWeakMap(defineDirectoryRepo);

/**
 * Использование директории как репозитория документов
 * @param directory - директория для хранения документов
 * @returns
 */
export const useDirectoryRepo = defineScopesWeakMapRef(
  useDirectoryRepoScopesWeakMap,
);
