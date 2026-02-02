import { Repo } from '@automerge/automerge-repo';
import { shallowRef, watch, computed, reactive } from 'vue';
import type { DirectoryFSEntry } from '../fileSystem';
import { zodIs } from '../validateZodScheme';
import type { RepoState } from './useRepo';
import { useRepo } from './useRepo';
import { defineScopePool, createUsePoolHook } from '../scopePool';
import { useDirectoryFSEntryPool } from '../fileSystem/directoryFSEntryPool';
import type { AMDocHandle } from '../automerge';
import { zodDocumentId, type AMDocumentId } from '../automerge';
import { isEqual } from 'es-toolkit';
import { strictRecordIterableEntries } from '../strictRecord/wrapStrictRecord';
import {
  createFSStorageAdapter,
  fileNameToPartialKey,
  zodAutomergeFileName,
  zodPartialAutomergeFileName,
} from '../automergeAdapter';

// FIXME: при удалении файла, не пропадает документ

export interface DirectoryRepoState extends RepoState {}

export const setupDirectoryRepoState = (
  directory: DirectoryFSEntry,
): DirectoryRepoState => {
  const repo = shallowRef<Repo>();

  const directoryRef = useDirectoryFSEntryPool(directory);

  const directoryDocumentIds = computed<AMDocumentId[]>(
    (oldState): AMDocumentId[] => {
      const entriesMap = directoryRef.value?.entries;

      const list: AMDocumentId[] = [];

      if (entriesMap) {
        for (const [name] of strictRecordIterableEntries(entriesMap)()) {
          if (zodIs(name, zodPartialAutomergeFileName)) {
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
    if (!repo.value) {
      repo.value = new Repo({
        storage: createFSStorageAdapter(directory),
      });
    }
    return repo.value;
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

  const repoRef = useRepo(repo, directoryDocumentIds);

  const documentMap = computed(
    (): ReadonlyMap<AMDocumentId, AMDocHandle> =>
      repoRef.map ?? new Map<AMDocumentId, AMDocHandle>(),
  );

  const directoryRepoState: DirectoryRepoState = reactive({
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

  return directoryRepoState;
};

export const directoryRepoPool = defineScopePool(setupDirectoryRepoState);

/**
 * Использование директории как репозитория документов
 * @param directory - директория для хранения документов
 * @returns
 */
export const useDirectoryRepo = createUsePoolHook(directoryRepoPool);
