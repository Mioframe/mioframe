<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { defineContextButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { useGProfile } from '@entity/gProfile';
import { MDSymbol } from '@shared/ui/Icon';
import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { GOOGLE_DRIVE_SCOPE } from '@shared/lib/googleApi/utils';
import {
  createDirectoryGDriveEntry,
  GDriveSpace,
} from '@shared/lib/googleDrive';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

const emit = defineEmits<{
  'update:directoryPath': [directoryPath: DirectoryFSEntry[]];
}>();

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

const onClickUseGDrive = async () => {
  await login();
};

const { getGDrive } = useGoogleApi();

const onClickGDriveAppFolder = async () => {
  const gDrive = await getGDrive(GOOGLE_DRIVE_SCOPE.appdata);

  const directoryGDriveEntry = createDirectoryGDriveEntry(
    gDrive,
    GDriveSpace.appDataFolder,
  );

  emit('update:directoryPath', [directoryGDriveEntry]);
};
</script>

<template>
  <MDListContainer tag="div" type="grid" class="google-drive-widget">
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
        <img class="profile__avatar" :src="profile.picture" />
      </template>

      <template #trailingIcon>
        <MDContextMenuButton
          :btns="profileContextMenu"
          @click="onClickContextProfile"
        />
      </template>
    </MDListItem>

    <MDListItem
      v-pressed-state
      headline="App Folder"
      class="google-drive-widget__item"
      supporting-text="Available only for this application"
      is-button
      @click="onClickGDriveAppFolder"
    >
      <template #leadingIcon>
        <MDSymbol name="cloud_lock" />
      </template>
    </MDListItem>

    <MDListItem
      v-pressed-state
      headline="My Drive"
      class="google-drive-widget__item"
      supporting-text="The contents of your drive"
      is-button
    >
      <template #leadingIcon>
        <MDSymbol name="cloud" />
      </template>
    </MDListItem>

    <MDListItem
      v-pressed-state
      headline="Shared"
      class="google-drive-widget__item"
      supporting-text="Items shared with me"
      is-button
    >
      <template #leadingIcon>
        <MDSymbol name="folder_shared" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>

<style lang="css" scoped>
.google-drive-widget {
  --md-list-container-radius: 16px;

  &__profile {
    grid-column: 1 / -1;
  }

  &__item,
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
  &__avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }
}
</style>
