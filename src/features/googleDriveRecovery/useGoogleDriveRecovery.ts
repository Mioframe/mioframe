import {
  getGoogleDrivePathEmail,
  getGoogleDrivePathScope,
} from '@shared/lib/googleDriveFileSystemProvider';
import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import { useMainServiceClient } from '@shared/service';

export const useGoogleDriveRecovery = ({
  path,
  // TODO: Remove manual refresh after Google Drive queries react to Google session changes through the existing RxJS service reactivity.
  onRefresh,
}: {
  path: MaybeRefOrGetter<string>;
  onRefresh?: (() => Promise<void>) | undefined;
}) => {
  const {
    google: { requestToken },
  } = useMainServiceClient();

  const isRetryAuthorizationLoading = ref(false);

  const onRetryAuthorization = async () => {
    const currentPath = toValue(path);
    const email = getGoogleDrivePathEmail(currentPath, { hasRootName: true });
    const scope = getGoogleDrivePathScope(currentPath, { hasRootName: true });

    if (!email || isRetryAuthorizationLoading.value) {
      return;
    }

    isRetryAuthorizationLoading.value = true;

    try {
      await requestToken([scope], email);
      await onRefresh?.();
    } finally {
      isRetryAuthorizationLoading.value = false;
    }
  };

  return {
    isRetryAuthorizationLoading,
    onRetryAuthorization,
  };
};
