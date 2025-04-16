<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import MDListContainer from '@shared/ui/Lists/MDListContainer.vue';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { MDSymbol } from '@shared/ui/Icon';
import { useRepoExplorer } from '@widget/RepoExplorer/useRepoExplorer';
import { OPFS } from '@widget/RepoExplorer/repoExplorerState';
import { useBrowserStorage } from './useBrowserStorage';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';

const { go } = useRepoExplorer();

const { mounted } = useBrowserStorage();

const onClickBrowserStorage = async () => {
  await go({
    provider: 'browser',
    path: [OPFS],
  });
};

const isSupportDirectoryPicker = 'showDirectoryPicker' in window;

const onClickLocalFolder = async () => {
  await go({
    provider: 'browser',
    path: [],
  });
};

const onClickMountedItem = async (item: DirectoryLocalEntry) => {
  await go({
    provider: 'browser',
    path: item.path,
  });
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

    <MDListItem
      v-for="[name, item] in mounted"
      :key="name"
      v-pressed-state
      :headline="name"
      class="local-storage-widget__item"
      supporting-text="Folder on your device"
      is-button
      @click="onClickMountedItem(item)"
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
