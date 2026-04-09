import {
  getGoogleDrivePathEmail,
  getGoogleDrivePathScope,
} from '@shared/lib/googleDriveFileSystemProvider';
import { ref, toValue, type MaybeRefOrGetter } from 'vue';
import { useMainServiceClient } from '@shared/service';

export const useGoogleDriveRecovery = ({ path }: { path: MaybeRefOrGetter<string> }) => {
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
    } finally {
      isRetryAuthorizationLoading.value = false;
    }
  };

  return {
    isRetryAuthorizationLoading,
    onRetryAuthorization,
  };
};
