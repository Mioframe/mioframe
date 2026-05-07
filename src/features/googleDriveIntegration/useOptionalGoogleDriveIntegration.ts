import { setupGoogleSessions } from '@entity/googleSession';
import { useLocalSettings } from '@entity/localSettings';
import { GOOGLE_CLIENT_ID } from '@shared/config';
import { useMainServiceClient } from '@shared/service';
import { watch } from 'vue';

/**
 * Applies the local Google Drive integration preference to the shared Google service.
 */
export const useOptionalGoogleDriveIntegration = () => {
  const googleClientId = GOOGLE_CLIENT_ID;
  const { settings } = useLocalSettings();
  const {
    google: { setGoogleDriveIntegrationEnabled },
  } = useMainServiceClient();
  let isGoogleApiBound = false;
  let setupGoogleSessionsPromise: Promise<void> | undefined;

  const ensureGoogleApiBound = async () => {
    if (isGoogleApiBound) {
      return;
    }

    if (!googleClientId) {
      return;
    }

    setupGoogleSessionsPromise ??= setupGoogleSessions(googleClientId)
      .then(() => {
        isGoogleApiBound = true;
      })
      .finally(() => {
        setupGoogleSessionsPromise = undefined;
      });

    await setupGoogleSessionsPromise;
  };
  watch(
    () => settings.value.googleDriveIntegrationEnabled === true && Boolean(googleClientId),
    async (enabled) => {
      if (enabled) {
        await ensureGoogleApiBound();
      }

      const nextEnabled =
        settings.value.googleDriveIntegrationEnabled === true && Boolean(googleClientId);

      await setGoogleDriveIntegrationEnabled(nextEnabled);
    },
    { immediate: true },
  );
};
