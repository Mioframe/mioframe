<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import MDListContainer from '@shared/ui/Lists/MDListContainer.vue';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { MDSymbol } from '@shared/ui/Icon';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { createLocalDirectory } from '@shared/lib/localFileSystem';

const emit = defineEmits<{
  'update:directoryPath': [directoryPath: DirectoryFSEntry[]];
}>();

const onClickBrowserStorage = async () => {
  const rootDirectoryHandle = await navigator.storage.getDirectory();
  emit('update:directoryPath', [
    createLocalDirectory(rootDirectoryHandle, undefined, 'Browser Storage'),
  ]);
};

const isSupportDirectoryPicker = 'showDirectoryPicker' in window;

const onClickLocalFolder = async () => {
  const dirHandle = await window.showDirectoryPicker();
  emit('update:directoryPath', [
    createLocalDirectory(dirHandle, undefined, dirHandle.name),
  ]);
};
</script>

<template>
  <MDListContainer class="local-storage-widget" type="grid">
    <MDListItem
      v-pressed-state
      headline="Browser Storage"
      class="local-storage-widget__item"
      is-button
      supporting-text="Storage inside your browser"
      @click="onClickBrowserStorage"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_special" />
      </template>
    </MDListItem>

    <MDListItem
      v-if="isSupportDirectoryPicker"
      v-pressed-state
      headline="Local Folder"
      class="local-storage-widget__item"
      supporting-text="Folder on your device"
      is-button
      @click="onClickLocalFolder"
    >
      <template #leadingIcon>
        <MDSymbol name="folder" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>

<style lang="css" scoped>
.local-storage-widget {
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);

  &__item {
    --md-container-color: var(--md-sys-color-secondary-container);
    --md-content-color: var(--md-sys-color-on-secondary-container);
    --md-list-item-border-radius: 16px;
  }
}
</style>
