<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
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
</script>

<template>
  <MDListContainer is="div" class="g-profile-card">
    <MDListItem
      is="div"
      v-if="evaluating"
      headline="Loading"
      class="g-profile-card__loading"
    >
      <template #leadingAvatarContainer>
        <MDCircularProgressIndicator />
      </template>
    </MDListItem>

    <MDListItem
      is="div"
      v-if="error"
      headline="Google profile error"
      :supporting-text="error.message"
    >
      <template #trailingIcon>
        <MDIconButton
          tooltip="logout"
          md-symbol-name="logout"
          @click="onClickLogout"
        />
      </template>
    </MDListItem>

    <template v-if="headlineUser">
      <MDListItem
        is="div"
        :headline="headlineUser"
        :supporting-text="supportingTextUser"
      >
        <template #leadingAvatarContainer>
          <img
            v-if="profileImageUrl"
            :src="profileImageUrl"
            width="100%"
            height="100%"
          />
        </template>

        <template #trailingIcon>
          <MDIconButton
            tooltip="logout"
            md-symbol-name="logout"
            @click="onClickLogout"
          />
        </template>
      </MDListItem>
    </template>
  </MDListContainer>
</template>

<style lang="css" scoped>
.g-profile-card {
  &__loading {
    --md-content-color: var(--md-sys-color-primary);
  }
}
</style>
