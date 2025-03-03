<script setup lang="ts">
import { DirectoryContentList } from '@entity/directory';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import type {
  RefDirectory,
  RefEntry,
  RefFile,
} from '@shared/lib/refFileSystem';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { setupDirectoryChoice } from '@widget/MainView/setupDirectoryChoice';
import { computed, ref, shallowRef, watchEffect } from 'vue';
import EntryContextMenu from './EntryContextMenu.vue';
import { RemoveEntryDialog } from '@feature/entryRemove';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { DocumentCreationDialog } from '@feature/documentCreate';
import type { RefRepo } from '@shared/lib/cfrDocument';
import { refRepo } from '@shared/lib/cfrDocument';
import { some } from 'ix/iterable/some';
import { is } from '@shared/lib/validateZodScheme';
import { zodFileName } from '@shared/lib/fsStorageAdapter';

const { selectedDirectory: rootDirectory } = setupDirectoryChoice();

const isShowCreateDocument = ref(false);

const isShowCreateDirectory = ref(false);

const onClickCreateDirectory = () => {
  isShowCreateDirectory.value = true;
};

const entryToRemove = shallowRef<RefEntry>();

const directoryPath = ref<RefDirectory[]>([]);

const currentDirectory = computed(() => directoryPath.value.at(-1));

const entries = computed(() => currentDirectory.value?.entries);

watchEffect(() => {
  directoryPath.value = rootDirectory.value ? [rootDirectory.value] : [];
});

const onClickPath = (indexPath: number) => {
  directoryPath.value = directoryPath.value.slice(0, indexPath + 1);
};

const onClickEntry = (
  _entryKey: PropertyKey,
  entry: RefDirectory | RefFile,
) => {
  if ('entries' in entry) {
    directoryPath.value.push(entry);
  }
};

const repositoryForNewDocument = shallowRef<RefRepo>();

const onClickCreateDocument = () => {
  if (currentDirectory.value) {
    repositoryForNewDocument.value = refRepo(currentDirectory.value);
  }
};

const currentRepository = computed(() => {
  if (currentDirectory.value) {
    const hasRepo = some(currentDirectory.value.entries, {
      predicate: ([key]) => {
        return is(key, zodFileName);
      },
    });

    if (hasRepo) {
      return refRepo(currentDirectory.value);
    }
  }
  return undefined;
});
</script>

<template>
  <div class="document-explorer-widget">
    <!-- // todo: add MDTopAppBar -->

    <MDTopAppBar headline="headline" />

    <MDNavigationPath
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <DirectoryContentList
      v-if="entries"
      class="document-explorer-widget__content-list"
      :entries
      @click="onClickEntry"
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

    <DocumentCreationDialog
      v-if="repositoryForNewDocument"
      :repository="repositoryForNewDocument"
      @cancel="repositoryForNewDocument = undefined"
      @created="repositoryForNewDocument = undefined"
    />

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
  flex: 1 1;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  --md-container-color: var(--md-sys-color-surface);
  /* max-height: 100%; */

  &__content-list {
    /* overflow-y: auto; */
  }

  &__fab-container {
    position: sticky;
    bottom: 0;
    right: 0;
  }

  &__navigation-path {
    position: sticky;
    top: 0;
    z-index: 1;
  }
}
</style>
