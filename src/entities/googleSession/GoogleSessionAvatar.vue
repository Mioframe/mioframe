<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { tryOnScopeDispose } from '@vueuse/core';
import { computed, ref, toRefs, watch } from 'vue';

const props = defineProps<{
  profileImageUrl?: string | undefined;
}>();

const { profileImageUrl } = toRefs(props);

const profileImageBlobUrl = ref<string>();
const showProfileImage = computed(() => !!profileImageBlobUrl.value);
const isLoading = ref(false);

let activeProfileImageBlobUrl: string | undefined;
let profileImageRequestId = 0;

watch(
  profileImageUrl,
  async (nextPictureUrl) => {
    profileImageRequestId += 1;
    const requestId = profileImageRequestId;

    profileImageBlobUrl.value = undefined;
    isLoading.value = false;

    if (activeProfileImageBlobUrl) {
      URL.revokeObjectURL(activeProfileImageBlobUrl);
      activeProfileImageBlobUrl = undefined;
    }

    if (!nextPictureUrl) {
      return;
    }

    isLoading.value = true;

    try {
      const response = await fetch(nextPictureUrl, {
        mode: 'cors',
        referrerPolicy: 'no-referrer',
      });

      if (!response.ok) {
        return;
      }

      const profileImageBlob = await response.blob();

      if (requestId !== profileImageRequestId || profileImageBlob.size === 0) {
        return;
      }

      const nextProfileImageBlobUrl = URL.createObjectURL(profileImageBlob);

      activeProfileImageBlobUrl = nextProfileImageBlobUrl;
      profileImageBlobUrl.value = nextProfileImageBlobUrl;
    } catch {
      if (requestId !== profileImageRequestId) {
        return;
      }
    } finally {
      if (requestId === profileImageRequestId) {
        isLoading.value = false;
      }
    }
  },
  {
    immediate: true,
  },
);

tryOnScopeDispose(() => {
  if (activeProfileImageBlobUrl) {
    URL.revokeObjectURL(activeProfileImageBlobUrl);
  }
});
</script>

<template>
  <img v-if="showProfileImage" :src="profileImageBlobUrl" width="100%" height="100%" />

  <MDCircularProgressIndicator v-else-if="isLoading" :size="24" />

  <MDSymbol v-else name="account_circle" />
</template>
