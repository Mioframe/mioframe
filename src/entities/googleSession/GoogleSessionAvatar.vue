<script setup lang="ts">
import { MDSymbol } from '@shared/ui/Icon';
import { MDCircularProgressIndicator } from '@shared/ui/material';
import { toRefs } from 'vue';
import { useGoogleSessionAvatar } from './useGoogleSessionAvatar';

const props = defineProps<{
  profileImageUrl?: string | undefined;
}>();

const { profileImageUrl } = toRefs(props);
const { isLoading, profileImageBlobUrl, showProfileImage } =
  useGoogleSessionAvatar(profileImageUrl);
</script>

<template>
  <img v-if="showProfileImage" :src="profileImageBlobUrl" width="100%" height="100%" />

  <MDCircularProgressIndicator v-else-if="isLoading" :size="24" />

  <MDSymbol v-else name="account_circle" />
</template>
