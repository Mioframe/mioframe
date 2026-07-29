import {
  getGoogleDrivePathEmail,
  getGoogleDrivePathScope,
} from '@shared/lib/googleDriveFileSystemProvider';
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';
import { useMainServiceClient } from '@shared/service';

interface GoogleDriveRecoveryOptions {
  /** Google Drive path containing the account and authorization scope to recover. */
  path: MaybeRefOrGetter<string>;
}

/**
 * Owns Google Drive reauthorization availability and pending presentation state.
 * @param options - Reactive Google Drive recovery inputs.
 * @returns The guarded retry action and its feature-owned pending presentation.
 */
export const useGoogleDriveRecovery = ({ path }: GoogleDriveRecoveryOptions) => {
  const {
    google: { requestToken },
  } = useMainServiceClient();

  const isRetryAuthorizationPending = ref(false);

  const retryAuthorization = async () => {
    const currentPath = toValue(path);
    const email = getGoogleDrivePathEmail(currentPath, { hasRootName: true });
    const scope = getGoogleDrivePathScope(currentPath, { hasRootName: true });

    if (!email || isRetryAuthorizationPending.value) {
      return;
    }

    isRetryAuthorizationPending.value = true;

    try {
      await requestToken([scope], email);
    } finally {
      isRetryAuthorizationPending.value = false;
    }
  };

  return {
    isRetryAuthorizationPending,
    retryAuthorization,
    retryAuthorizationPendingMessage: computed(() =>
      isRetryAuthorizationPending.value
        ? 'Complete authorization in the provider window.'
        : undefined,
    ),
  };
};
