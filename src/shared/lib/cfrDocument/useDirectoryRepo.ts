import { Repo } from '@automerge/automerge-repo';
import {
  type MaybeRefOrGetter,
  toRef,
  toValue,
  shallowRef,
  watch,
  computed,
} from 'vue';
import { zodAutomergeFileName } from '../fsStorageAdapter';
import {
  createStorageAdapter as createFSStorageAdapter,
  fileNameToPartialKey,
} from '../fsStorageAdapter/createFSStorageAdapter';
import { useDirectory, type DirectoryFSEntry } from '../fileSystem';
import { zodIs } from '../validateZodScheme';
import { useRepo } from './useRepo';
import { createLogger } from '../logger';
import { useReduceIterable, useReduceMap } from '../useReduce';
import { WeakValueMap } from '../WeakValueMap';
import type { DocumentId } from './automergeTypes';

const { debug, watchDebug } = createLogger('useDirectoryRepo');

const cacheRepo = new WeakValueMap<DirectoryFSEntry, Repo>();

// FIXME: при удалении файла, не пропадает документ

/**
 * Использование директории как репозитория документов
 * @param directory - директория для хранения документов
 * @returns
 */
export const useDirectoryRepo = (
  directory: MaybeRefOrGetter<DirectoryFSEntry | undefined>,
) => {
  debug('start');

  const currentDirectory = toRef(() => toValue(directory));

  const { entries: directoryEntries, ready: directoryReady } =
    useDirectory(currentDirectory);

  watchDebug('directoryEntries', () =>
    Array.from(directoryEntries.value.values()),
  );

  const directoryEntriesNames = useReduceMap(
    directoryEntries,
    (acc: string[], _, name) => {
      if (!acc.includes(name)) {
        acc.push(name);
      }
    },
    [],
  );

  const hasDocumentFile = computed((): boolean =>
    directoryEntriesNames.value.some((name) =>
      zodIs(name, zodAutomergeFileName),
    ),
  );

  watchDebug('hasDocumentFile', hasDocumentFile);

  const currentRepo = shallowRef<Repo>();

  watchDebug('currentRepo', currentRepo);

  watch(
    currentDirectory,
    () => {
      currentRepo.value = undefined;
    },
    { immediate: true },
  );

  const initialRepo = (): Repo => {
    if (!currentDirectory.value) {
      throw new Error('missing directory');
    }
    if (!currentRepo.value) {
      const cachedRepo = cacheRepo.get(currentDirectory.value);
      if (cachedRepo) {
        currentRepo.value = cachedRepo;
      } else {
        const newRepo = new Repo({
          storage: createFSStorageAdapter(currentDirectory.value),
        });
        cacheRepo.set(currentDirectory.value, newRepo);
        currentRepo.value = newRepo;
      }
    }
    return currentRepo.value;
  };

  watch(
    [directoryReady, currentRepo, hasDocumentFile],
    ([directoryReady, currentRepo, hasDocumentFile]) => {
      if (directoryReady && !currentRepo && hasDocumentFile) {
        initialRepo();
      }
    },
    { immediate: true },
  );

  const directoryDocumentIdList = useReduceIterable(
    directoryEntries,
    (acc, [fileName]) => {
      if (zodIs(fileName, zodAutomergeFileName)) {
        const id = fileNameToPartialKey(fileName)?.[0];
        if (id) {
          acc.add(id);
        }
      }
    },
    new Set<DocumentId>(),
  );

  const {
    documents,
    create: repoCreate,
    remove: repoRemove,
  } = useRepo(currentRepo, directoryDocumentIdList);

  const create = (...params: Parameters<typeof repoCreate>) => {
    initialRepo();
    repoCreate(...params);
  };

  const remove = (...params: Parameters<typeof repoRemove>) => {
    initialRepo();
    repoRemove(...params);
  };

  return {
    create,
    remove,
    documents,
  };
};
