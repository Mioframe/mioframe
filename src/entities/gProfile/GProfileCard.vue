<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useGProfile } from './useGProfile';
import { MDSymbol } from '@shared/ui/Icon';
import { useGSession } from './useGSession';
import { computed } from 'vue';
import { MDIconButton } from '@shared/ui/Button';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { DRIVE_GOOGLE_SCOPE } from '@shared/lib/googleApi';

defineSlots<{
  mediaRight(): unknown;
}>();

const { userInfo, profileImageBlobUrl, evaluating } = useGProfile();

const { login, accessToken, logout, scope } = useGSession();

const onClickLogin = async () => {
  await login(DRIVE_GOOGLE_SCOPE.appdata);
};

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
  await logout();
};

const canUseAppFolder = computed(() =>
  scope.value?.has(DRIVE_GOOGLE_SCOPE.appdata),
);

const canUseAllFiles = computed(() => scope.value?.has(DRIVE_GOOGLE_SCOPE.all));
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
      is="button"
      v-if="!accessToken"
      headline="Sign in Google"
      @click="onClickLogin"
    >
      <template #leadingIcon>
        <MDSymbol name="login" />
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

      <MDListItem
        is="div"
        headline="Permission for app's folder"
        supporting-text="View and manage the app's own configuration data in your Google Drive."
      >
        <template #leadingIcon>
          <MDSymbol v-if="canUseAppFolder" name="check" />

          <MDSymbol v-else name="block" />
        </template>
      </MDListItem>

      <MDListItem
        is="div"
        headline="Permission for all files"
        supporting-text="View and manage all your Drive files."
      >
        <template #leadingIcon>
          <MDSymbol v-if="canUseAllFiles" name="check" />

          <MDSymbol v-else name="block" />
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
