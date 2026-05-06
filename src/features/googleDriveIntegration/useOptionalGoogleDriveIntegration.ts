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
  let setupGoogleSessionsPromise: Promise<void> | undefined;
  let revision = 0;

  watch(
    () => settings.value.googleDriveIntegrationEnabled,
    async (googleDriveIntegrationEnabled) => {
      const currentRevision = ++revision;

      if (googleDriveIntegrationEnabled === true && GOOGLE_CLIENT_ID) {
        if (!isGoogleApiBound) {
          setupGoogleSessionsPromise ??= setupGoogleSessions(GOOGLE_CLIENT_ID)
            .then(() => {
              isGoogleApiBound = true;
            })
            .finally(() => {
              setupGoogleSessionsPromise = undefined;
            });

          await setupGoogleSessionsPromise;
        }

        if (currentRevision !== revision) {
          return;
        }

        await enableGoogleDriveIntegration();

        if (currentRevision !== revision) {
          await disableGoogleDriveIntegration();
        }

        return;
      }

      await disableGoogleDriveIntegration();
    },
    { immediate: true },
  );
};
