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
    google: { disableGoogleDriveIntegration, enableGoogleDriveIntegration },
  } = useMainServiceClient();
  let isGoogleApiBound = false;
  let setupGoogleSessionsPromise: Promise<void> | undefined;
  let desiredEnabled = false;
  let desiredRevision = 0;
  let appliedRevision = -1;
  let reconcilePromise: Promise<void> | undefined;

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
  const reconcileGoogleDriveIntegration = () => {
    reconcilePromise ??= (async () => {
      /* eslint-disable no-await-in-loop -- reconcile must stay serial so each await can observe the latest desired state. */
      while (appliedRevision !== desiredRevision) {
        const revisionToApply = desiredRevision;

        if (desiredEnabled) {
          await ensureGoogleApiBound();

          if (revisionToApply !== desiredRevision) {
            continue;
          }

          await enableGoogleDriveIntegration();
        } else {
          await disableGoogleDriveIntegration();
        }

        if (revisionToApply !== desiredRevision) {
          continue;
        }

        appliedRevision = revisionToApply;
      }
      /* eslint-enable no-await-in-loop -- serial reconcile is intentional for deterministic enable/disable ordering. */
    })().finally(() => {
      reconcilePromise = undefined;

      if (appliedRevision !== desiredRevision) {
        void reconcileGoogleDriveIntegration();
      }
    });

    return reconcilePromise;
  };

  watch(
    () => settings.value.googleDriveIntegrationEnabled,
    async (googleDriveIntegrationEnabled) => {
      desiredEnabled = googleDriveIntegrationEnabled === true && Boolean(googleClientId);
      desiredRevision += 1;

      await reconcileGoogleDriveIntegration();
    },
    { immediate: true },
  );
};
