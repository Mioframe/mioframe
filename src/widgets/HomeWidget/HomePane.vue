<script setup lang="ts">
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDPaneContainer } from '@shared/ui/Layers';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { vPressedState } from '@shared/lib/md/stateHelper';
import GoogleDriveWidget from './GoogleDriveWidget.vue';
import { useModel } from 'vue';
import { MDDivider } from '@shared/ui/Divider';

const props = defineProps<{
  directoryPath: DirectoryFSEntry[];
}>();

const emit = defineEmits<{
  'update:directoryPath': [directoryPath: DirectoryFSEntry[]];
}>();

const directoryPath = useModel(props, 'directoryPath');

const onClickBrowserStorage = async () => {
  const rootDirectoryHandle = await navigator.storage.getDirectory();
  emit('update:directoryPath', [
    createLocalDirectory(rootDirectoryHandle, undefined, 'Browser Storage'),
  ]);
};
</script>

<template>
  <MDPaneContainer class="home-widget">
    <h2 class="md sys typescale title-medium">Google Drive</h2>

    <GoogleDriveWidget v-model:directory-path="directoryPath" />

    <MDDivider />

    <h2 class="md sys typescale title-medium">Local Storage</h2>

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

      <MDListItem headline="Local Folder" class="storage-list__item">
        <template #leadingIcon>
          <MDSymbol name="folder" />
        </template>
      </MDListItem>
    </MDListContainer>
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 8px;
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
