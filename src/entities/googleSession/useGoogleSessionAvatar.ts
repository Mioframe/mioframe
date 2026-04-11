import { tryOnScopeDispose } from '@vueuse/core';
import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';

export const useGoogleSessionAvatar = (profileImageUrl: Ref<string | undefined>) => {
  const profileImageBlobUrl = ref<string>();
  const showProfileImage = computed(() => !!profileImageBlobUrl.value);
  const isLoading = ref(false);

  let activeProfileImageBlobUrl: string | undefined;

  const revokeActiveProfileImageBlobUrl = () => {
    if (!activeProfileImageBlobUrl) {
      return;
    }

    URL.revokeObjectURL(activeProfileImageBlobUrl);
    activeProfileImageBlobUrl = undefined;
  };

  watch(
    profileImageUrl,
    async (nextPictureUrl, _previousPictureUrl, onCleanup) => {
      const requestState = {
        isStale: false,
      };
      const abortController = new AbortController();
      const isRequestStale = () => requestState.isStale;

      onCleanup(() => {
        requestState.isStale = true;
        abortController.abort();
      });

      profileImageBlobUrl.value = undefined;
      isLoading.value = false;

      revokeActiveProfileImageBlobUrl();

      if (!nextPictureUrl) {
        return;
      }

      isLoading.value = true;

      try {
        const response = await fetch(nextPictureUrl, {
          mode: 'cors',
          referrerPolicy: 'no-referrer',
          signal: abortController.signal,
        });

        if (isRequestStale() || !response.ok) {
          return;
        }

        const profileImageBlob = await response.blob();

        if (isRequestStale() || profileImageBlob.size === 0) {
          return;
        }

        const nextProfileImageBlobUrl = URL.createObjectURL(profileImageBlob);

        if (isRequestStale()) {
          URL.revokeObjectURL(nextProfileImageBlobUrl);
          return;
        }

        activeProfileImageBlobUrl = nextProfileImageBlobUrl;
        profileImageBlobUrl.value = nextProfileImageBlobUrl;
      } catch {
        if (isRequestStale()) {
          return;
        }
      } finally {
        if (!isRequestStale()) {
          isLoading.value = false;
        }
      }
    },
    {
      immediate: true,
    },
  );

  tryOnScopeDispose(() => {
    revokeActiveProfileImageBlobUrl();
  });

  return {
    isLoading,
    profileImageBlobUrl,
    showProfileImage,
  };
};
