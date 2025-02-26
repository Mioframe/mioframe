<script setup lang="ts">
import { DirectoryContentList } from '@entity/directory';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import type { RefDirectory, RefEntry } from '@shared/lib/refFileSystem';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { setupDirectoryChoice } from '@widget/MainView/setupDirectoryChoice';
import { computed, ref, shallowRef, watchEffect } from 'vue';
import EntryContextMenu from './EntryContextMenu.vue';
import { RemoveEntryDialog } from '@feature/entryRemove';

const { selectedDirectory: rootDirectory } = setupDirectoryChoice();

const isShowCreateDocument = ref(false);

const onClickCreateDocument = () => {
  if (currentDirectory.value) {
    isShowCreateDocument.value = true;
  }
};

const isShowCreateDirectory = ref(false);

const onClickCreateDirectory = () => {
  isShowCreateDirectory.value = true;
};

const entryToRemove = shallowRef<RefEntry>();

const directoryTree = ref<RefDirectory[]>([]);

const currentDirectory = computed(() => directoryTree.value.at(-1));

const entries = computed(() => currentDirectory.value?.entries);

watchEffect(() => {
  directoryTree.value = rootDirectory.value ? [rootDirectory.value] : [];
});
</script>

<template>
  <div class="document-explorer-widget">
    <!-- todo: path -->
    <DirectoryContentList
      v-if="entries"
      class="document-explorer-widget__content-list"
      :entries
    >
      <template #trailing="{ entry }">
        <EntryContextMenu @remove="entryToRemove = entry" />
      </template>
    </DirectoryContentList>

    <div v-else class="document-explorer-widget__empty">
      <!-- todo -->
      empty
    </div>

    <MDFabContainer class="document-explorer-widget__fab-container">
      <MDFab
        tooltip="Create directory"
        size="small"
        @click="onClickCreateDirectory"
      >
        <template #icon>
          <MDSymbol name="create_new_folder" />
        </template>
      </MDFab>

      <MDFab tooltip="Create document" @click="onClickCreateDocument">
        <template #icon>
          <MDSymbol name="edit_document" />
        </template>
      </MDFab>
    </MDFabContainer>

    <!--
      <DocumentCreationDialog
      v-if="isShowCreateDocument && currentFolder"
      :document-repository="currentFolder"
      @cancel="isShowCreateDocument = false"
      @created="isShowCreateDocument = false"
      /> 
    -->

    <DirectoryCreateDialog
      v-if="isShowCreateDirectory && currentDirectory"
      :parent-directory="currentDirectory"
      @cancel="isShowCreateDirectory = false"
      @created="isShowCreateDirectory = false"
    />

    <RemoveEntryDialog
      v-if="entryToRemove"
      :entry="entryToRemove"
      @cancel="entryToRemove = undefined"
      @removed="entryToRemove = undefined"
    />
  </div>
</template>

<style scoped>
.document-explorer-widget {
  position: relative;
  flex: 1 0;
  max-height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  &__content-list {
    /* overflow-y: auto; */
    /* max-height: 100%; */
  }

  &__fab-container {
    position: sticky;
    bottom: 0;
    right: 0;
  }
}
</style>
