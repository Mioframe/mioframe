import type { DirectoryGDriveEntry } from '@shared/lib/googleDrive';
import { GDriveSpace } from '@shared/lib/googleDrive';
import { asyncComputed, createGlobalState } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import type { RepoExplorerState } from './repoExplorerState';
import { useRepoExplorerState } from './repoExplorerState';
import { useBrowserStorage } from '@widget/BrowserStorage/useBrowserStorage';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { createLogger } from '@shared/lib/logger';
import { isEnumValue } from '@shared/lib/typeGuards';
import { useGoogleStorage } from './useGoogleStorage';
import { computed, nextTick } from 'vue';

const { watchDebug, debug } = createLogger('useRepoExplorer');

export const useRepoExplorer = createGlobalState(() => {
  const router = useRouter();
  const currentRoute = useRoute();

  const { state } = useRepoExplorerState();

  watchDebug('state', state);

  const path = computed(() => state.value?.path);

  watchDebug('path', path);

  const { getAndRequestMountDirectory } = useBrowserStorage();
  const { getAndRequest: getAndRequestGDriveSpace } = useGoogleStorage();

  const rootEntry = asyncComputed(
    async (): Promise<
      undefined | DirectoryLocalEntry | DirectoryGDriveEntry
    > => {
      debug('rootEntry', 'start');
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
        case 'Google Drive': {
          if (isEnumValue(rootName, GDriveSpace)) {
            await nextTick(); // FIXME: запрашивает авторизацию при правильном email
            return await getAndRequestGDriveSpace(state.value.email, rootName);
          }
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

  watchDebug('rootEntry', rootEntry);

  const currentDirectory = asyncComputed(
    async () => {
      const path = state.value?.path.slice(1);
      const root = rootEntry.value;
      if (root && path) {
        let lastDirectory = root;
        debug('lastDirectory', lastDirectory);
        for (const name of path) {
          debug('name', name);
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

  watchDebug('currentDirectory', currentDirectory);

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
