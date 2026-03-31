<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { useGoogleUserInfo } from './useGoogleUserInfo';
import { useGoogleSessions } from './useGoogleSessions';
import { computed, toRefs } from 'vue';
import { MDIconButton } from '@shared/ui/Button';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const props = defineProps<{
  email: string;
}>();

const { email } = toRefs(props);

defineSlots<{
  mediaRight(): unknown;
}>();

const {
  data: userInfo,
  profileImageBlobUrl,
  evaluating,
} = useGoogleUserInfo(email);

const { logout } = useGoogleSessions();

const headlineUser = computed(() =>
  userInfo.value instanceof Error ? undefined : userInfo.value?.name,
);

const supportingTextUser = computed(() =>
  userInfo.value instanceof Error ? undefined : userInfo.value?.email,
);

const profileImageUrl = computed(() =>
  profileImageBlobUrl.value instanceof Error
    ? undefined
    : profileImageBlobUrl.value,
);

const error = computed(() =>
  userInfo.value instanceof Error ? userInfo.value : undefined,
);

const onClickLogout = async () => {
  await logout(email.value);
};

const headline = computed(() => {
  if (evaluating.value) {
    return 'Loading';
  }

  if (error.value) {
    return 'Google profile error';
  }

  return headlineUser.value ?? 'Google profile';
});

const supportingText = computed(() => {
  if (error.value) {
    return error.value.message;
  }

  return supportingTextUser.value;
});
</script>

<template>
  <MDListItem is="div" :headline="headline" :supporting-text="supportingText">
    <template #leadingAvatarContainer>
      <MDCircularProgressIndicator v-if="evaluating" />

      <img
        v-else-if="profileImageUrl"
        :src="profileImageUrl"
        width="100%"
        height="100%"
      />
    </template>

    <template v-if="!evaluating" #trailingIcon>
      <MDIconButton
        tooltip="logout"
        md-symbol-name="logout"
        @click="onClickLogout"
      />
    </template>
  </MDListItem>
</template>
