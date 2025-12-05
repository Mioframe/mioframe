import { createRootGDriveEntry } from '@shared/lib/googleDrive/createRootGDriveEntry';
import { useDirectoryStoreService } from '../directories';
import { setupGoogleSessionService } from './googleSessionService';
import { computed, watch } from 'vue';
import { createGlobalState } from '@vueuse/core';

/**
 * Зона ответственности
 * // [x] хранить сессию
 * // [ ] обновлять устаревшую сессию
 * // [x] монтировать гугл диск
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

  const G_DRIVE_NAME = 'Google Drive';

  const { mount, unmount } = useDirectoryStoreService();

  const onGetError = () => {
    // fixme: добавить обработку ошибок google api
  };

  const token = computed(getToken);

  const scopes = computed(getScopes);

  const mountGoogleDrive = () => {
    unmount(G_DRIVE_NAME);

    if (token.value) {
      mount(
        createRootGDriveEntry(
          token.value,
          scopes.value,
          G_DRIVE_NAME,
          onGetError,
        ),
      );
    }
  };

  watch(token, mountGoogleDrive, { immediate: true });

  return {
    addSession,
    removeSession,

    getScopes,

    subscribeGetScope,
    subscribeGetToken,
  };
};

export const useGoogleService = createGlobalState(setupGoogleService);
