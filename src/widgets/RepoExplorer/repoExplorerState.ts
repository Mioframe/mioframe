import type { EntryPath } from '@shared/lib/fileSystem';
import { createGlobalState } from '@vueuse/core';
import { isString } from 'es-toolkit';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

/**
 * Path to the directory
 * @example 'dir1/dir2/dir3'
 */
export type PathString = string;

type Path = EntryPath;

interface QueryPath {
  path: Path;
}

export const OPFS = 'Origin private file system';

export interface RepoExplorerState extends QueryPath {
  provider: 'browser';
}

export const useRepoExplorerState = createGlobalState(() => {
  const route = useRoute();

  const pathQuery = computed(() =>
    (isString(route.query.path) ? route.query.path : undefined)
      ?.split('/')
      .filter((v) => !!v),
  );

  const providerQuery = computed(() => {
    if (isString(route.query.provider)) {
      return route.query.provider;
    }
    return undefined;
  });

  const repoExplorerState = computed((): RepoExplorerState | undefined => {
    if (providerQuery.value === 'browser' && pathQuery.value) {
      return {
        provider: providerQuery.value,
        path: pathQuery.value,
      };
    }

    return undefined;
  });

  const state = computed(
    (): RepoExplorerState | undefined => repoExplorerState.value,
  );

  return {
    state,
  };
});
