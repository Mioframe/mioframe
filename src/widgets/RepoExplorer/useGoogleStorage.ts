import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import {
  GOOGLE_DRIVE_SCOPE,
  USERINFO_SCOPE,
} from '@shared/lib/googleApi/utils';
import {
  createDirectoryGDriveEntry,
  GDriveSpace,
} from '@shared/lib/googleDrive';
import { createLogger } from '@shared/lib/logger';
import { useAlert } from '@shared/ui/Dialog';
import { createGlobalState } from '@vueuse/core';
import { computed } from 'vue';

const { debug } = createLogger('useGoogleStorage');

export const useGoogleStorage = createGlobalState(() => {
  const {
    getGDrive,
    userInfo,
    userInfoEvaluating,
    removeToken,
    requestAccess,
  } = useGoogleApi();

  const currentEmail = computed(() => userInfo.value?.email);

  const get = async (email: string, space: GDriveSpace) => {
    if (!userInfoEvaluating.value && currentEmail.value !== email) {
      throw new Error('Wrong user is logged into google');
    }
    const gDrive = await getGDrive(
      space === GDriveSpace.appDataFolder
        ? GOOGLE_DRIVE_SCOPE.appdata
        : GOOGLE_DRIVE_SCOPE.all,
    );

    const entry = createDirectoryGDriveEntry(gDrive, space);

    return entry;
  };

  const { alert } = useAlert();

  const getAndRequest = async (email: string, space: GDriveSpace) => {
    const currentEmail = userInfo.value?.email;

    debug(
      'getAndRequest',
      email,
      space,
      userInfoEvaluating.value,
      currentEmail,
    );

    if (currentEmail !== email) {
      await alert(
        'Invalid Google Drive user email',
        `To continue, the user with the email "${email}" must log in.`,
      );
      removeToken();
      await requestAccess(USERINFO_SCOPE.userinfoEmail);
    }
    return get(email, space);
  };

  return {
    get,
    getAndRequest,
  };
});
