import { asyncComputed, createGlobalState } from '@vueuse/core';
import { computed, reactive } from 'vue';
import { useMountDirectoriesService } from './useMountDirectoriesService';
import {
  createScopesMap,
  defineSubscribeScopesMapByKey,
} from '@shared/lib/scopesMap';
import { useDirectoryFSEntryCacheRef } from '@shared/lib/fileSystem/useDirectoryFSEntryRef';
import { useReduceStrictRecord } from '@shared/lib/useReduce';
import { strictRecordSet, type StrictRecord } from '@shared/lib/strictRecord';
import type {
  DirectoryFSEntry,
  EntryPath,
  EntryPathString,
  FileFSEntry,
} from '@shared/lib/fileSystem';

type ContentItem = {
  name: string;
  type: 'directory' | 'file';
  path: EntryPath;
};

type DirectoryContent = {
  content: StrictRecord<string, ContentItem>;
};

export const PATH_SEPARATOR = '/';

const useDirectoriesContentMap = createScopesMap<
  EntryPathString,
  DirectoryContent
>((path: EntryPathString) => {
  const mountDirectories = useMountDirectoriesService();

  const getLocalDirectory = async (
    path: string[],
    parent?: DirectoryFSEntry,
  ): Promise<DirectoryFSEntry | undefined> => {
    const currentName = path.at(0);
    if (currentName) {
      const entry = parent
        ? await parent.get(currentName)
        : mountDirectories.get(currentName);

      if (entry && 'get' in entry) {
        if (path.length > 1) {
          return await getLocalDirectory(path.toSpliced(0, 1), entry);
        }
        return entry;
      }
    }
    return undefined;
  };

  const directory = asyncComputed(() =>
    getLocalDirectory(path.split(PATH_SEPARATOR)),
  );

  const directoryRef = useDirectoryFSEntryCacheRef(directory);

  const entries = computed(
    (): StrictRecord<string, DirectoryFSEntry | FileFSEntry> =>
      directoryRef.value?.entries ?? {},
  );

  const content = useReduceStrictRecord(
    entries,
    (acc: StrictRecord<string, ContentItem>, entry, name) => {
      strictRecordSet(acc, name, {
        name: entry.name,
        path: entry.path,
        type: 'get' in entry ? 'directory' : 'file',
      });
    },
    {},
  );

  return reactive({
    content,
  });
});

export const useDirectoryContentService = createGlobalState(() => {
  const subscribe = defineSubscribeScopesMapByKey(useDirectoriesContentMap);

  return {
    directoryContentSubscribe: subscribe,
  };
});
