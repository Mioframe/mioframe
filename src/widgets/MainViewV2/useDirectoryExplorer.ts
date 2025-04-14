import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { GOOGLE_DRIVE_SCOPE } from '@shared/lib/googleApi/utils';
import { GDriveSpace } from '@shared/lib/googleDrive';
import {
  createDirectoryGDriveEntry,
  type DirectoryGDriveEntry,
} from '@shared/lib/googleDrive';
import {
  createLocalDirectory,
  type DirectoryLocalEntry,
} from '@shared/lib/localFileSystem';
import { asyncComputed, createGlobalState } from '@vueuse/core';
import { computed, shallowReactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { isString } from 'lodash-es';
import type { TypeOf } from 'zod';
import { literal, union } from 'zod';
import { is } from '@shared/lib/validateZodScheme';
import type { EntryPath } from '@shared/lib/fileSystem';

const zodProvider = union([literal('local'), literal('google')]);
const zodSpace = union([literal('opfs'), literal('user')]);

type Space = TypeOf<typeof zodSpace>;

/**
 * Path to the directory
 * @example 'dir1/dir2/dir3'
 */
type PathString = string;

export const useLocalMount = createGlobalState(() => {
  const mounted = shallowReactive<Map<string, DirectoryLocalEntry>>(new Map());

  const mount = (directoryHandler: FileSystemDirectoryHandle) => {
    const name = directoryHandler.name;

    const entry = createLocalDirectory(directoryHandler, undefined, name);
    mounted.set(name, entry);
    return entry;
  };

  const unmount = (name: string) => {
    mounted.delete(name);
  };

  const get = (name: string) => {
    const entry = mounted.get(name);
    return entry;
  };

  return {
    mount,
    unmount,
    get,
    mounted: computed(() => mounted),
  };
});

export const useGoogleMount = createGlobalState(() => {
  const mounted = shallowReactive<Map<string, DirectoryGDriveEntry>>(new Map());

  const { getGDrive, userInfo } = useGoogleApi();

  const mount = async (email: string, space: GDriveSpace) => {
    if (userInfo.value?.email !== email) {
      throw new Error('Wrong user is logged into google');
    }
    const gDrive = await getGDrive(
      space === GDriveSpace.appDataFolder
        ? GOOGLE_DRIVE_SCOPE.appdata
        : GOOGLE_DRIVE_SCOPE.all,
    );

    const name = `${email} ${space}`;

    const entry = createDirectoryGDriveEntry(gDrive, space, undefined, name);

    mounted.set(name, entry);

    return entry;
  };

  const unmount = (name: string) => {
    mounted.delete(name);
  };

  const get = (name: string) => {
    const entry = mounted.get(name);
    return entry;
  };

  return {
    mount,
    unmount,
    get,
    mounted: computed(() => mounted),
  };
});

export const useDirectoryExplorer = createGlobalState(() => {
  const router = useRouter();

  const currentRoute = useRoute();

  const queryProvider = computed(() => {
    const query = currentRoute.query['provider'];

    if (is(query, zodProvider)) {
      return query;
    }

    return undefined;
  });

  const queryPath = computed(() => {
    const query = currentRoute.query['path'];
    if (isString(query)) {
      return query.split('/').filter((p) => p.length);
    }
    return undefined;
  });

  const querySpace = computed(() => {
    const query = currentRoute.query['space'];
    if (is(query, zodSpace)) {
      return query;
    }
    return undefined;
  });

  // todo: root зависит от провайдера
  const rootEntry = asyncComputed(
    async () => {
      switch (querySpace.value) {
        case 'opfs': {
          const entry = await navigator.storage.getDirectory();
          return createLocalDirectory(entry, undefined, 'opfs');
        }
        case 'user': {
          return;
        }

        default:
          return undefined;
      }
    },
    undefined,
    {
      lazy: true,
    },
  );

  const currentDirectory = asyncComputed(
    async () => {
      const path = queryPath.value;
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
    },
  );

  const go = async (space: Space, path: PathString | EntryPath) => {
    await router.push({
      query: {
        path: isString(path) ? path : path.join('/'),
        space,
      },
    });
  };

  return {
    currentDirectory,
    go,
  };
});

// TODO: внедрить в виджет
