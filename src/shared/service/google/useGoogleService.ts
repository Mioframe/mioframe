import { setupGoogleSessionService } from './setupGoogleSessionService';
import { computed, watch } from 'vue';
import { createGlobalState } from '@vueuse/core';
import { useFileSystemService } from '../fileSystem';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GoogleDriveFileSystem } from '@shared/lib/vfsProviders/google';
import { GoogleDriveMount } from '@shared/lib/vfsProviders/google/GoogleDriveFileSystem';

/**
 * Зона ответственности
 * // [x] хранить сессию
 * // [ ] обновлять устаревшую сессию
 * // [x] монтировать гугл диск приложения
 * // [ ] монтировать пользовательский диск
 */

const setupGoogleService = () => {
  const {
    addSession,
    getScopes,
    removeSession,
    subscribeGetScope,
    subscribeGetToken,
    getToken,
  } = setupGoogleSessionService();

  const token = computed(getToken);

  const scopes = computed(getScopes);

  const { vfs } = useFileSystemService();

  const hasAppData = computed(() =>
    scopes.value.has(DRIVE_GOOGLE_SCOPE.appdata),
  );

  const appDataName = 'GDrive App Data';

  watch(
    [hasAppData, token],
    async ([has, ACCESS_TOKEN]) => {
      const path = PathUtils.join('/', appDataName);
      if (has && ACCESS_TOKEN) {
        await vfs.createDirectory(path);
        vfs.mount(
          path,
          new GoogleDriveFileSystem(
            { ACCESS_TOKEN },
            { mount: GoogleDriveMount.AppData },
          ),
        );
      } else {
        if (await vfs.exists(path)) {
          vfs.unmount(path);
          await vfs.delete(path);
        }
      }
    },
    { immediate: true },
  );

  return {
    addSession,
    removeSession,

    getScopes,

    subscribeGetScope,
    subscribeGetToken,
  };
};

export const useGoogleService = createGlobalState(setupGoogleService);
