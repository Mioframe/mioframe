<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import type { FileFSEntry } from '@shared/lib/fileSystem';
import {
  isDirectoryRef,
  useDirectory,
  type DirectoryFSEntry,
} from '@shared/lib/fileSystem';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { setupDirectoryChoice } from '@widget/MainView/setupDirectoryChoice';
import EntryContextMenu from './EntryContextMenu.vue';
import { RemoveEntryDialog } from '@feature/entryRemove';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { DocumentCreationDialog } from '@feature/documentCreate';
import type { DocumentContent } from '@shared/lib/cfrDocument';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import { createLogger } from '@shared/lib/logger';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { vPressedState } from '@shared/lib/md/stateHelper';

const { watchDebug, debug } = createLogger('DocumentExplorerWidget.vue');

const { selectedDirectory: rootDirectory } = setupDirectoryChoice();

const isShowCreateDirectoryForm = ref(false);

const onClickCreateDirectory = () => {
  isShowCreateDirectoryForm.value = true;
};

type FSEntry = DirectoryFSEntry | FileFSEntry;

const entryNameToRemove = ref<string>();

const directoryPath = ref<DirectoryFSEntry[]>([]);

watchEffect(() => {
  directoryPath.value = rootDirectory.value ? [rootDirectory.value] : [];
});

const currentDirectoryEntry = computed(() => directoryPath.value.at(-1));

watchDebug('currentDirectoryEntry', currentDirectoryEntry);

const { entries: currentDirectoryEntries, removeByName } = useDirectory(
  currentDirectoryEntry,
);

watchDebug('directoryEntries', () =>
  Array.from(currentDirectoryEntries.value.values()),
);

const onClickPath = (indexPath: number) => {
  debug('onClickPath', indexPath);

  const start = indexPath + 1;
  const count = directoryPath.value.length - start;

  directoryPath.value.splice(start, count);
};

const onClickEntry = (_entryKey: PropertyKey, entry: FSEntry) => {
  if (isDirectoryRef(entry)) {
    directoryPath.value.push(entry);
  }
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  if (currentDirectoryEntry.value) {
    showFormNewDocument.value = true;
  }
};

const { documents: currentRepoDocuments, create: createDocument } =
  useDirectoryRepo(currentDirectoryEntry);

watchDebug('documents', () => Array.from(currentRepoDocuments.value));

const onClickRemoveEntry = (entry: FSEntry) => {
  entryNameToRemove.value = entry.name;
};

const onCreateNewDocument = (document: DocumentContent) => {
  createDocument(document);
  showFormNewDocument.value = false;
};

const onCreateDirectory = async (name: string) => {
  // TODO: добавить вывод ошибок
  if (currentDirectoryEntry.value) {
    await currentDirectoryEntry.value.createDirectory(name);
    isShowCreateDirectoryForm.value = false;
  }
};

const onRemoveEntry = async (name: string) => {
  await removeByName(name);
  entryNameToRemove.value = undefined;
};

// FIXME: повторное открытие репы не считывает документы
</script>

<template>
  <div class="document-explorer-widget">
    <!-- <MDTopAppBar headline="headline" /> -->

    <MDNavigationPath
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <MDFabContainer class="document-explorer-widget__fab-container">
      <template #content>
        <MDListContainer
          tag="div"
          class="document-explorer-widget__content-list"
        >
          <CFRDocumentMDListItem
            v-for="[docId, docHandle] in currentRepoDocuments"
            :key="docId"
            :doc-handle="docHandle"
          />

          <MDListItem
            v-for="[entryKey, entry] in currentDirectoryEntries"
            :key="entryKey"
            v-pressed-state
            :headline="entry.name"
            is-button
            @click="onClickEntry(entryKey, entry)"
          >
            <template #leadingIcon>
              <MDSymbol v-if="'entries' in entry" name="folder" />

              <MDSymbol v-else name="draft" />
            </template>

            <template #trailingIcon>
              <EntryContextMenu @remove-entry="onClickRemoveEntry(entry)" />
            </template>
          </MDListItem>
        </MDListContainer>
      </template>

      <template #buttons>
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
      </template>
    </MDFabContainer>

    <DocumentCreationDialog
      v-if="showFormNewDocument"
      @cancel="showFormNewDocument = false"
      @create="onCreateNewDocument"
    />

    <DirectoryCreateDialog
      v-if="isShowCreateDirectoryForm"
      @cancel="isShowCreateDirectoryForm = false"
      @create="onCreateDirectory"
    />

    <RemoveEntryDialog
      v-if="entryNameToRemove"
      :name="entryNameToRemove"
      @cancel="entryNameToRemove = undefined"
      @remove="onRemoveEntry"
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
  overflow-y: auto;

  &__fab-container {
    /* position: fixed;
    bottom: 0;
    right: var(--md-pane-padding); */
  }

  &__navigation-path {
    /* position: sticky; */
    /* top: 0; */
    /* z-index: 1; */
  }

  &__content-list {
    /* overflow-y: auto; */
    /* background: transparent;
    flex: 1 1;
    display: flex;
    flex-direction: column; */
  }
}
</style>
