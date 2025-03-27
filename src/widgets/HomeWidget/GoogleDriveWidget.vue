<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { defineContextButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { useGProfile } from '@entity/gProfile';

const { profile, remove, login } = useGProfile();

enum ProfileContextAction {
  logout,
}

const profileContextMenu = defineContextButtonList([
  [
    ProfileContextAction.logout,
    {
      text: 'Logout',
      symbolName: 'logout',
    },
  ],
]);

const onClickContextProfile = (key: ProfileContextAction) => {
  switch (key) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- for more actions
    case ProfileContextAction.logout:
      remove();
      break;

    default:
      break;
  }
};

const onClickUseGDrive = () => {
  void login();
};
</script>

<template>
  <div class="google-drive-widget">
    <MDListContainer tag="div">
      <MDListItem
        v-if="!profile"
        v-pressed-state
        headline="Use Google Drive"
        class="google-drive-widget__use-btn"
        is-button
        @click="onClickUseGDrive"
      >
        <template #leadingAvatarContainer>
          <img
            src="https://fonts.gstatic.com/s/i/productlogos/drive_2020q4/v8/web-64dp/logo_drive_2020q4_color_2x_web_64dp.png"
            class="google-drive-widget__g-drive-logo"
          />
        </template>
      </MDListItem>

      <MDListItem
        v-if="profile"
        :headline="profile.name ?? 'unknown name'"
        :supporting-text="profile.email"
        is-div
        class="google-drive-widget__profile profile"
      >
        <template #leadingAvatarContainer>
          <!-- <img class="profile__avatar" src="https://picsum.photos/80/80" /> -->

          <img class="profile__avatar" :src="profile.picture" />
        </template>

        <template #trailingIcon>
          <MDContextMenuButton
            :btns="profileContextMenu"
            @click="onClickContextProfile"
          />
        </template>
      </MDListItem>
    </MDListContainer>
  </div>
</template>

<style lang="css" scoped>
.google-drive-widget {
  &__profile {
  }

  &__use-btn {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-list-item-border-radius: 16px;
  }

  &__g-drive-logo {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}

.profile {
  --md-container-color: var(--md-sys-color-secondary-container);
  --md-content-color: var(--md-sys-color-on-secondary-container);
  --md-list-item-border-radius: 16px;

  &__avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}
</style>
