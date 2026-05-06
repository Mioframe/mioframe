import { setupGoogleSessions } from '@entity/googleSession';
import { useLocalSettings } from '@entity/localSettings';
import { GOOGLE_CLIENT_ID } from '@shared/config';
import { useMainServiceClient } from '@shared/service';
import { watch } from 'vue';

/**
 * Applies the local Google Drive integration preference to the shared Google service.
 */
export const useOptionalGoogleDriveIntegration = () => {
  const { settings } = useLocalSettings();
  const {
    google: { disableGoogleDriveIntegration, enableGoogleDriveIntegration },
  } = useMainServiceClient();
  let isGoogleApiBound = false;

  watch(
    () => settings.value.googleDriveIntegrationEnabled,
    async (googleDriveIntegrationEnabled) => {
      if (googleDriveIntegrationEnabled === true && GOOGLE_CLIENT_ID) {
        if (!isGoogleApiBound) {
          setupGoogleSessions(GOOGLE_CLIENT_ID);
          isGoogleApiBound = true;
        }

        await enableGoogleDriveIntegration();
        return;
      }

      await disableGoogleDriveIntegration();
    },
    { immediate: true },
  );
};
