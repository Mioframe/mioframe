import type { DirectoryGDriveEntry } from '@shared/lib/googleDrive';
import { asyncComputed, createGlobalState } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import { useBrowserStorage } from '@widget/BrowserStorage/useBrowserStorage';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { computed, nextTick } from 'vue';
import type { RepoExplorerState } from './repoExplorerState';
import { useRepoExplorerState } from './repoExplorerState';

export const useRepoExplorer = createGlobalState(() => {
  const router = useRouter();
  const currentRoute = useRoute();

  const { state } = useRepoExplorerState();

  const path = computed(() => state.value?.path);

  const { getAndRequestMountDirectory } = useBrowserStorage();

  const rootEntry = asyncComputed(
    async (): Promise<
      undefined | DirectoryLocalEntry | DirectoryGDriveEntry
    > => {
      const rootName = path.value?.at(0);
      switch (state.value?.provider) {
        case 'browser': {
          await nextTick();
          const entry = await getAndRequestMountDirectory(rootName);
          if (!rootName) {
            await replace({
              ...state.value,
              path: [entry.name],
            });
          }
          return entry;
        }
      }
      return undefined;
    },
    undefined,
    {
      lazy: true,
      shallow: true,
    },
  );

  const currentDirectory = asyncComputed(
    async () => {
      const path = state.value?.path.slice(1);
      const root = rootEntry.value;
      if (root && path) {
        let lastDirectory = root;
        for (const name of path) {
          const entry = await lastDirectory.get(name);
          if (entry && 'get' in entry) {
            lastDirectory = entry;
          } else {
            throw new Error(
              `directory "${name}" not found in directory "${lastDirectory.name}"`,
            );
          }
        }
        return lastDirectory;
      }
      return undefined;
    },
    undefined,
    {
      lazy: true,
      shallow: true,
    },
  );

  const go = async (query?: RepoExplorerState) => {
    if (query) {
      const path = query.path.join('/');
      return await router.push({
        path: currentRoute.path,
        query: {
          ...currentRoute.query,
          ...query,
          path,
        },
      });
    } else {
      const emptyQuery = state.value
        ? Object.keys(state.value).reduce(
            (acc, key) => ({ ...acc, [key]: undefined }),
            {},
          )
        : {};

      return await router.push({
        path: currentRoute.path,
        query: {
          ...currentRoute.query,
          ...emptyQuery,
        },
      });
    }
  };

  const replace = async (query?: RepoExplorerState) => {
    if (query) {
      const path = query.path.join('/');
      return await router.replace({
        path: currentRoute.path,
        query: {
          ...currentRoute.query,
          ...query,
          path,
        },
      });
    } else {
      const emptyQuery = state.value
        ? Object.keys(state.value).reduce(
            (acc, key) => ({ ...acc, [key]: undefined }),
            {},
          )
        : {};

      return await router.replace({
        path: currentRoute.path,
        query: {
          ...currentRoute.query,
          ...emptyQuery,
        },
      });
    }
  };

  const back = () => {
    router.back();
  };

  const up = async () => {
    if (state.value && state.value.path.length > 1) {
      const newPath = state.value.path.slice(0, -1);
      await go({ ...state.value, path: newPath });
    } else {
      await go();
    }
  };

  return {
    currentDirectory,
    go,
    back,
    up,
    state,
    replace,
  };
});
