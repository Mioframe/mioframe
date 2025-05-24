<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import {
  isDirectoryRef,
  useDirectory,
  type DirectoryFSEntry,
  type FileFSEntry,
} from '@shared/lib/fileSystem';
import { MDFab, MDFabContainer, MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
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
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import type { DocHandle, DocumentId } from '@automerge/automerge-repo';
import { DocumentRenameDialog } from '@feature/documentRename';
import { MDPaneContainer } from '@shared/ui/Layers';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { useRepoExplorer } from '@widget/RepoExplorer/useRepoExplorer';
import { clone } from 'remeda';

const { watchDebug, debug } = createLogger('RepoExplorerWidget.vue');

const emit = defineEmits<{
  clickDocument: [id: DocumentId, doc: DocHandle<unknown>];
}>();

const isShowCreateDirectoryForm = ref(false);

const onClickCreateDirectory = () => {
  isShowCreateDirectoryForm.value = true;
};

type FSEntry = DirectoryFSEntry | FileFSEntry;

const entryKeyToRemove = ref<string>();

const {
  currentDirectory,
  go: directoryGo,
  up: directoryUp,
  state: directoryState,
} = useRepoExplorer();

const directoryPath = computed(
  () => directoryState.value?.path.map((name) => ({ name })) ?? [],
);

watchDebug('currentDirectory', currentDirectory);

const { entries: currentDirectoryEntries, removeByName: removeEntryByName } =
  useDirectory(currentDirectory);

watchDebug('directoryEntries', () =>
  Array.from(currentDirectoryEntries.value.values()),
);

const onClickPath = async (indexPath: number) => {
  debug('onClickPath', indexPath);

  const start = indexPath + 1;

  if (directoryState.value?.path) {
    const count = directoryState.value.path.length - start;

    const path = clone(directoryState.value.path);

    path.splice(start, count);

    await directoryGo({
      ...directoryState.value,
      path,
    });
  }
};

const onClickEntry = async (_entryKey: PropertyKey, entry: FSEntry) => {
  if (directoryState.value && isDirectoryRef(entry)) {
    await directoryGo({
      ...directoryState.value,
      path: entry.path,
    });
  }
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  if (currentDirectory.value) {
    showFormNewDocument.value = true;
  }
};

const {
  documents: currentRepoDocuments,
  create: createDocument,
  remove: removeDocument,
} = useDirectoryRepo(currentDirectory);

const onCreateNewDocument = (document: DocumentContent) => {
  createDocument(document);
  showFormNewDocument.value = false;
};

const onCreateDirectory = async (name: string) => {
  // TODO: добавить вывод ошибок
  if (currentDirectory.value) {
    await currentDirectory.value.createDirectory(name);
    isShowCreateDirectoryForm.value = false;
  }
};

const onRemoveEntry = async (name: string) => {
  debug('onRemoveEntry', name);
  await removeEntryByName(name);
  entryKeyToRemove.value = undefined;
};

enum FSEntryContextEvent {
  remove,
  rename,
}

const fsEntryContextBtns = defineMenuButtonList([
  [FSEntryContextEvent.rename, { text: 'Rename', symbolName: 'edit' }],
  [FSEntryContextEvent.remove, { text: 'Remove', symbolName: 'delete' }],
]);

const entryKeyToRename = ref<string>();

const onClickFSEntryContextAction = (
  key: FSEntryContextEvent,
  entryKey: string,
) => {
  switch (key) {
    case FSEntryContextEvent.remove: {
      entryKeyToRemove.value = entryKey;
      break;
    }
    case FSEntryContextEvent.rename: {
      entryKeyToRename.value = entryKey;
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

enum DocumentContextEvent {
  remove,
  rename,
}

const documentContextBtns = defineMenuButtonList([
  [DocumentContextEvent.rename, { text: 'Rename', symbolName: 'edit' }],
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
    case DocumentContextEvent.remove: {
      documentIdToRemove.value = docId;
      break;
    }
    case DocumentContextEvent.rename: {
      documentToRename.value = document;
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

const documentToRename = shallowRef<DocHandle<unknown>>();

const title = computed((): string | undefined => {
  if (directoryState.value) {
    return directoryState.value.provider;
  }

  return undefined;
});

const onClickBack = async () => {
  await directoryUp();
};

const loadingRename = ref(0);

const onRenameEntry = async (newName: string) => {
  loadingRename.value += 1;
  try {
    if (entryKeyToRename.value) {
      const entry = currentDirectoryEntries.value.get(entryKeyToRename.value);
      if (entry) {
        await entry.rename(newName);
        entryKeyToRename.value = undefined;
        return;
      }
    }
    throw new Error('unknown entry to rename');
  } finally {
    loadingRename.value -= 1;
  }
};
</script>

<template>
  <MDPaneContainer class="document-explorer-widget">
    <MDTopAppBar v-if="title" :headline="title">
      <template #leadingNavigation>
        <MDIconButton tooltip="Navigate up" @click="onClickBack">
          <template #icon>
            <MDSymbol name="arrow_back" />
          </template>
        </MDIconButton>
      </template>
    </MDTopAppBar>

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
              @click="onClickFSEntryContextAction($event, entryKey)"
            />
          </template>
        </FSEntryMDListItem>
      </MDListContainer>

      <MDFabContainer class="document-explorer-widget__fab-container">
        <template #default>
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
      v-if="entryKeyToRemove"
      :name="entryKeyToRemove"
      @cancel="entryKeyToRemove = undefined"
      @apply="onRemoveEntry"
    />

    <DocumentRemoveDialog
      v-if="documentToRemove"
      :doc-handle="documentToRemove"
      @cancel="documentIdToRemove = undefined"
      @apply="onDocumentRemoveApply"
    />

    <DocumentRenameDialog
      v-if="documentToRename"
      :doc-handle="documentToRename"
      @renamed="documentToRename = undefined"
      @cancel="documentToRename = undefined"
    />

    <FSEntryRenameDialog
      v-if="entryKeyToRename"
      :name="entryKeyToRename"
      :loading="!!loadingRename"
      @cancel="entryKeyToRename = undefined"
      @rename="onRenameEntry"
    />
  </MDPaneContainer>
</template>

<style scoped>
.document-explorer-widget {
  &__fab-container {
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
    margin-right: calc(16px - var(--md-pane-padding, 0));
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
    padding: 0 8px;
  }
}
</style>
