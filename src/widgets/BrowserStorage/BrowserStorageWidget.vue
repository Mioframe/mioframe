<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import MDListContainer from '@shared/ui/Lists/MDListContainer.vue';
import { MDSymbol } from '@shared/ui/Icon';
import { useRepoExplorerNavigate } from '@widget/MainView/useRepoExplorerNavigate';
import { useBrowserSourceMounted } from '../../entities/mountedDirectories/useBrowserStorage';
import type { DirectoryLocalEntry } from '@shared/lib/localFileSystem';
import { computed } from 'vue';
import { OPFSName } from '@entity/mountedDirectories/useDirectoryStoreClient';

const { open } = useRepoExplorerNavigate();

const { mounted } = useBrowserSourceMounted();

const onClickBrowserStorage = async () => {
  await open({
    path: [OPFSName],
    document: undefined,
  });
};

const isSupportDirectoryPicker = 'showDirectoryPicker' in window;

const onClickLocalFolder = async () => {
  await open({
    path: [],
    document: undefined,
  });
};

const onClickMountedItem = async (item: DirectoryLocalEntry) => {
  await open({
    path: item.path,
    document: undefined,
  });
};

const isMountedOPFS = computed(() => mounted.value.has(OPFSName));
</script>

<template>
  <MDListContainer class="local-storage-widget" type="grid">
    <MDListItem
      is="button"
      v-if="!isMountedOPFS"
      :headline="OPFSName"
      class="local-storage-widget__item"
      supporting-text="Storage inside your browser"
      @click="onClickBrowserStorage"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_special" />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      v-if="isSupportDirectoryPicker"
      headline="Select Local Folder"
      class="local-storage-widget__item"
      supporting-text="Folder on your device"
      @click="onClickLocalFolder"
    >
      <template #leadingIcon>
        <MDSymbol name="folder" />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      v-for="[name, item] in mounted"
      :key="name"
      :headline="name"
      class="local-storage-widget__item"
      supporting-text="Folder on your device"
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
