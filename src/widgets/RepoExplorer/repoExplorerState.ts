import type { EntryPath } from '@shared/lib/fileSystem';
import { GDriveSpace } from '@shared/lib/googleDrive';
import { isEnumValue } from '@shared/lib/typeGuards/isEnum';
import { createGlobalState } from '@vueuse/core';
import { isString } from 'lodash-es';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { string } from 'zod';

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

interface BrowserStorageParams extends QueryPath {
  provider: 'browser';
}

interface GoogleDriveParams extends QueryPath {
  provider: 'Google Drive';
  email: string;
  space: GDriveSpace;
}

export type RepoExplorerState = BrowserStorageParams | GoogleDriveParams;

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

  const browserStorageParams = computed(
    (): BrowserStorageParams | undefined => {
      if (providerQuery.value === 'browser' && pathQuery.value) {
        return {
          provider: providerQuery.value,
          path: pathQuery.value,
        };
      }

      return undefined;
    },
  );

  const spaceQuery = computed(() =>
    isEnumValue(route.query.space, GDriveSpace) ? route.query.space : undefined,
  );

  const emailQuery = computed(
    () => string().email().safeParse(route.query.email).data,
  );

  const googleDriveParams = computed((): GoogleDriveParams | undefined => {
    if (
      providerQuery.value === 'Google Drive' &&
      pathQuery.value &&
      spaceQuery.value &&
      emailQuery.value
    ) {
      return {
        provider: providerQuery.value,
        path: pathQuery.value,
        space: spaceQuery.value,
        email: emailQuery.value,
      };
    }

    return undefined;
  });

  const state = computed(
    (): RepoExplorerState | undefined =>
      browserStorageParams.value ?? googleDriveParams.value ?? undefined,
  );

  return {
    state,
  };
});
