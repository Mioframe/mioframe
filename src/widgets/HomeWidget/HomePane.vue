<script setup lang="ts">
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDPaneContainer } from '@shared/ui/Layers';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { vPressedState } from '@shared/lib/md/stateHelper';
import {
  createDirectoryGDriveEntry,
  GDriveSpace,
} from '@shared/lib/googleDrive';
import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import GoogleDriveWidget from './GoogleDriveWidget.vue';
import { GOOGLE_DRIVE_SCOPE } from '@shared/lib/googleApi/utils';

const { directoryPath = [] } = defineProps<{
  directoryPath: DirectoryFSEntry[];
}>();

const emit = defineEmits<{
  'update:directoryPath': [directoryPath: DirectoryFSEntry[]];
}>();

const onClickBrowserStorage = async () => {
  const rootDirectoryHandle = await navigator.storage.getDirectory();
  emit('update:directoryPath', [
    createLocalDirectory(rootDirectoryHandle, undefined, 'Browser Storage'),
  ]);
};

const { getGDrive } = useGoogleApi();

const onClickGDriveAppFolder = async () => {
  // TODO: перенести кнопки диска в виджет для диска
  const gDrive = await getGDrive(GOOGLE_DRIVE_SCOPE.appdata);

  const directoryGDriveEntry = createDirectoryGDriveEntry(
    gDrive,
    GDriveSpace.appDataFolder,
  );

  emit('update:directoryPath', [directoryGDriveEntry]);
};
</script>

<template>
  <MDPaneContainer class="home-widget">
    <MDListContainer
      type="grid"
      class="home-widget__storage-list storage-list"
      tag="div"
    >
      <MDListItem
        v-pressed-state
        headline="Browser Storage"
        class="storage-list__item"
        is-button
        supporting-text="storage inside your browser"
        @click="onClickBrowserStorage"
      >
        <template #leadingIcon>
          <MDSymbol name="folder_special" />
        </template>
      </MDListItem>

      <MDListItem
        headline="My Drive"
        class="storage-list__item"
        supporting-text="from Google Drive"
      >
        <template #leadingIcon>
          <MDSymbol name="cloud" />
        </template>
      </MDListItem>

      <MDListItem
        headline="Shared"
        class="storage-list__item"
        supporting-text="from Google Drive"
      >
        <template #leadingIcon>
          <MDSymbol name="folder_shared" />
        </template>
      </MDListItem>

      <MDListItem
        v-pressed-state
        headline="App Folder"
        class="storage-list__item"
        supporting-text="from Google Drive"
        is-button
        @click="onClickGDriveAppFolder"
      >
        <template #leadingIcon>
          <MDSymbol name="cloud_lock" />
        </template>
      </MDListItem>

      <MDListItem headline="Local Folder" class="storage-list__item">
        <template #leadingIcon>
          <MDSymbol name="folder" />
        </template>
      </MDListItem>
    </MDListContainer>
    <!-- TODO: отдельный блок для Google Drive -->
    <GoogleDriveWidget />
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 0 8px;
}

.storage-list {
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);

  &__item {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-list-item-border-radius: 16px;
  }
}
</style>
