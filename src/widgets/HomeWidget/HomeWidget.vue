<script setup lang="ts">
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { MDPaneContainer } from '@shared/ui/Layers';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { vPressedState } from '@shared/lib/md/stateHelper';

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
        headline="App Data"
        class="storage-list__item"
        supporting-text="from Google Drive"
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
