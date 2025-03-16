<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
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
import { FSEntryRemoveDialog } from '@feature/entryRemove';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { DocumentCreationDialog } from '@feature/documentCreate';
import type { DocumentContent } from '@shared/lib/cfrDocument';
import { useDirectoryRepo } from '@shared/lib/cfrDocument';
import { createLogger } from '@shared/lib/logger';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { FSEntryMDListItem } from '@entity/fsEntry';
import { defineContextButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import FixedPlaceholder from '@shared/ui/Layers/FixedPlaceholder.vue';

const { watchDebug, debug } = createLogger('DocumentExplorerWidget.vue');

const emit = defineEmits<{
  clickDocument: [id: DocumentId, doc: DocHandle<unknown>];
}>();

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

const { entries: currentDirectoryEntries, removeByName: removeEntryByName } =
  useDirectory(currentDirectoryEntry);

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

const {
  documents: currentRepoDocuments,
  create: createDocument,
  remove: removeDocument,
} = useDirectoryRepo(currentDirectoryEntry);

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
  await removeEntryByName(name);
  entryNameToRemove.value = undefined;
};

enum FSEntryContextEvent {
  remove,
}

const fsEntryContextBtns = defineContextButtonList([
  [FSEntryContextEvent.remove, { text: 'Remove', symbolName: 'delete' }],
]);

const onClickFSEntryContextAction = (
  key: FSEntryContextEvent,
  entryKey: string,
  entry: FileFSEntry | DirectoryFSEntry,
) => {
  switch (key) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- действий будет больше
    case FSEntryContextEvent.remove: {
      entryNameToRemove.value = entryKey;

      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

enum DocumentContextEvent {
  remove,
}

const documentContextBtns = defineContextButtonList([
  [
    DocumentContextEvent.remove,
    { text: 'Remove', symbolName: 'delete_forever' },
  ],
]);

const onClickDocumentContextAction = (
  key: DocumentContextEvent,
  docId: DocumentId,
  document: DocHandle<unknown>,
) => {
  switch (key) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- действий будет больше
    case DocumentContextEvent.remove: {
      documentIdToRemove.value = docId;
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const documentIdToRemove = shallowRef<DocumentId>();

const documentToRemove = computed(() =>
  documentIdToRemove.value
    ? currentRepoDocuments.value.get(documentIdToRemove.value)
    : undefined,
);

const onDocumentRemoveApply = (documentId: DocumentId) => {
  removeDocument(documentId);
  documentIdToRemove.value = undefined;
};

const onClickDocument = (
  documentId: DocumentId,
  docHandle: DocHandle<unknown>,
) => {
  emit('clickDocument', documentId, docHandle);
};
</script>

<template>
  <div class="document-explorer-widget">
    <!-- <MDTopAppBar headline="headline" /> -->

    <MDNavigationPath
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <div class="document-explorer-widget__scrollable-content">
      <MDListContainer tag="div" class="document-explorer-widget__content-list">
        <CFRDocumentMDListItem
          v-for="[docId, docHandle] in currentRepoDocuments"
          :key="docId"
          v-pressed-state
          :doc-handle="docHandle"
          class="document-explorer-widget__list-item"
          is-button
          @click="onClickDocument(docId, docHandle)"
        >
          <template #trailingIcon>
            <MDContextMenuButton
              :btns="documentContextBtns"
              @click="onClickDocumentContextAction($event, docId, docHandle)"
            />
          </template>
        </CFRDocumentMDListItem>

        <FSEntryMDListItem
          v-for="[entryKey, entry] in currentDirectoryEntries"
          :key="entryKey"
          v-pressed-state
          is-button
          :entry
          :entry-key
          class="document-explorer-widget__list-item"
          @click="onClickEntry(entryKey, entry)"
        >
          <template #trailingIcon>
            <MDContextMenuButton
              :btns="fsEntryContextBtns"
              @click="onClickFSEntryContextAction($event, entryKey, entry)"
            />
          </template>
        </FSEntryMDListItem>
      </MDListContainer>

      <MDFabContainer class="document-explorer-widget__fab-container">
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
    </div>

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

    <FSEntryRemoveDialog
      v-if="entryNameToRemove"
      :name="entryNameToRemove"
      @cancel="entryNameToRemove = undefined"
      @apply="onRemoveEntry"
    />

    <DocumentRemoveDialog
      v-if="documentToRemove"
      :doc-handle="documentToRemove"
      @cancel="documentIdToRemove = undefined"
      @apply="onDocumentRemoveApply"
    />
  </div>
</template>

<style scoped>
.document-explorer-widget {
  position: relative;
  flex: 1 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  border-radius: 16px;
  --md-container-color: var(--md-sys-color-surface);
  overflow-y: auto;

  &__fab-container {
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
  }

  &__navigation-path {
    position: sticky;
    top: 0;
    flex-shrink: 0;
  }

  &__content-list {
    flex: 1 0;
  }

  &__list-item {
    --md-list-item-border-radius: 8px;
  }

  &__scrollable-content {
    overflow-y: auto;
    flex: 1 1;
    display: flex;
    flex-direction: column;
  }
}
</style>
