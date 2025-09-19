<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { MDFab, MDFabContainer, MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { FSEntryRemoveDialog } from '@feature/entryRemove';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { DocumentCreationDialog } from '@feature/documentCreate';
import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { FSEntryMDListItem } from '@entity/fsEntry';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import { DocumentRenameDialog } from '@feature/documentRename';
import { MDPaneContainer } from '@shared/ui/Layers';
import { MDTopAppBar } from '@shared/ui/TopAppBar';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { isUndefined } from 'es-toolkit';
import type {
  AMDocHandle,
  AMDocumentId,
} from '@shared/lib/automerge/automergeTypes';
import { useDirectoryRepo } from '@shared/lib/cfrDocument/useDirectoryRepo';
import { useRepoExplorerNavigate } from '../useRepoExplorerNavigate';
import { useRouter } from 'vue-router';
import { useDirectoryStoreClient } from '@entity/mountedDirectories/useDirectoryStoreClient';
import type { EntryDescription } from '@shared/api/directories/directoriesStoreService';
import type { EntryPath } from '@shared/lib/fileSystem';
import { ENTRY_NOT_FOUND } from '@shared/api/directories/types';

const {
  directoryPathString,
  directoryPath,
  open,
  state: repoExplorerState,
} = useRepoExplorerNavigate();

const parentPathForNewDirectory = ref<EntryPath>();

const onClickCreateDirectory = () => {
  parentPathForNewDirectory.value = directoryPath.value;
};

const entryPathToRemove = ref<EntryPath>();

const {
  entryStore: { get: getEntry },
  removeEntry,
} = useDirectoryStoreClient();

const directory = computed(() => {
  if (directoryPathString.value) {
    const entry = getEntry(directoryPathString.value);
    if (entry === ENTRY_NOT_FOUND) {
      return entry;
    }
    if (entry && 'entries' in entry) {
      return entry;
    }
  }
  return undefined;
});

const directoryEntries = computed(() =>
  directory.value !== ENTRY_NOT_FOUND ? directory.value?.entries : undefined,
);

const onClickPath = async (indexPath: number) => {
  if (repoExplorerState.path) {
    await open({
      path: repoExplorerState.path.slice(0, indexPath + 1),
      document: undefined,
    });
  }
};

const onClickEntry = async (entry: EntryDescription) => {
  if (entry.type === 'directory') {
    await open({
      ...repoExplorerState,
      path: entry.path,
    });
  }
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  if (directoryPath.value) {
    showFormNewDocument.value = true;
  }
};

/**
 * - список документов в репозитории
 * - метод создания документа
 * - метод удаления документа
 *
 */
// const directoryRepoRef = useDirectoryRepo(directoryPath);

// const currentRepoDocuments = computed(() => directoryRepoRef.value?.map);

// const onCreateNewDocument = (document: CFRDocumentContent) => {
//   directoryRepoRef.value?.create(document);
//   showFormNewDocument.value = false;
// };

const onRemoveEntry = async (path: EntryPath) => {
  await removeEntry(path);
  entryPathToRemove.value = undefined;
};

enum FSEntryContextEvent {
  remove,
  rename,
}

const fsEntryContextBtns = defineMenuButtonList([
  { label: 'Rename', symbolName: 'edit', key: FSEntryContextEvent.rename },
  { label: 'Remove', symbolName: 'delete', key: FSEntryContextEvent.remove },
]);

const entryKeyToRename = ref<EntryPath>();

const onClickFSEntryContextAction = (
  { key }: { key: FSEntryContextEvent },
  entry: EntryDescription,
) => {
  switch (key) {
    case FSEntryContextEvent.remove: {
      entryPathToRemove.value = entry.path;
      break;
    }
    case FSEntryContextEvent.rename: {
      entryKeyToRename.value = entry.path;
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
  { label: 'Rename', symbolName: 'edit', key: DocumentContextEvent.rename },

  {
    label: 'Remove',
    symbolName: 'delete_forever',
    key: DocumentContextEvent.remove,
  },
]);

const onClickDocumentContextAction = (
  { key }: { key: DocumentContextEvent },
  docId: AMDocumentId,
  document: AMDocHandle,
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

const documentIdToRemove = shallowRef<AMDocumentId>();

// const documentToRemove = computed(() =>
//   documentIdToRemove.value
//     ? currentRepoDocuments.value?.get(documentIdToRemove.value)
//     : undefined,
// );

// const onDocumentRemoveApply = (documentId: AMDocumentId) => {
//   directoryRepoRef.value?.remove(documentId);
//   documentIdToRemove.value = undefined;
// };

const onClickDocument = async (documentId: AMDocumentId) => {
  if (directoryPath.value) {
    await open({
      path: directoryPath.value,
      document: documentId,
    });
  }
};

const documentToRename = shallowRef<AMDocHandle>();

const title = computed((): string | undefined => {
  return repoExplorerState.path?.at(-1);
});

const router = useRouter();

const onClickBack = () => {
  router.back();
};

const onRenamedEntry = () => {
  entryKeyToRename.value = undefined;
};

const showFSEntryRenameDialog = computed({
  get: () => !isUndefined(entryKeyToRename),
  set: (v) => {
    if (!v) {
      entryKeyToRename.value = undefined;
    }
  },
});
</script>

<template>
  <MDPaneContainer class="document-explorer-widget">
    <MDTopAppBar v-if="title" :headline="title">
      <template #leadingNavigation>
        <MDIconButton tooltip="Back" @click="onClickBack">
          <template #icon>
            <MDSymbol name="arrow_back" />
          </template>
        </MDIconButton>
      </template>
    </MDTopAppBar>

    <MDNavigationPath
      v-if="directoryPath"
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <div class="document-explorer-widget__scrollable-content">
      <MDListContainer is="div" class="document-explorer-widget__content-list">
        <!--
          <CFRDocumentMDListItem
          v-for="[docId, docHandle] in currentRepoDocuments"
          :key="docId"
          :doc-handle="docHandle"
          class="document-explorer-widget__list-item"
          is-button
          @click="onClickDocument(docId)"
          >
          <template #trailingIcon="{ documentName }">
          <MDContextMenuButton
          :btns="documentContextBtns"
          :tooltip="`options ${documentName}`"
          @click="onClickDocumentContextAction($event, docId, docHandle)"
          />
          </template>
          </CFRDocumentMDListItem> 
        -->

        <FSEntryMDListItem
          v-for="entry in directoryEntries"
          :key="entry.name"
          is-button
          :entry="entry"
          class="document-explorer-widget__list-item"
          @click="onClickEntry(entry)"
        >
          <template #trailingIcon="{ entry: entryName }">
            <MDContextMenuButton
              :btns="fsEntryContextBtns"
              :tooltip="`options ${entryName}`"
              @click="onClickFSEntryContextAction($event, entry)"
            />
          </template>
        </FSEntryMDListItem>
      </MDListContainer>

      <MDFabContainer class="document-explorer-widget__fab-container" auto-hide>
        <template #default>
          <MDFab
            tooltip="Create directory"
            color="tonal-primary"
            @click="onClickCreateDirectory"
          >
            <template #icon>
              <MDSymbol name="create_new_folder" />
            </template>
          </MDFab>

          <MDFab
            tooltip="Create document"
            size="medium"
            color="tonal-primary"
            @click="onClickCreateDocument"
          >
            <template #icon>
              <MDSymbol name="edit_document" />
            </template>
          </MDFab>
        </template>
      </MDFabContainer>
    </div>

    <!--
      <DocumentCreationDialog
      v-model:show="showFormNewDocument"
      @cancel="showFormNewDocument = false"
      @create="onCreateNewDocument"
      /> 
    -->

    <DirectoryCreateDialog
      v-if="parentPathForNewDirectory"
      :show="!!parentPathForNewDirectory"
      :path="parentPathForNewDirectory"
      @update:show="
        parentPathForNewDirectory = $event
          ? parentPathForNewDirectory
          : undefined
      "
      @cancel="parentPathForNewDirectory = undefined"
      @created="parentPathForNewDirectory = undefined"
    />

    <FSEntryRemoveDialog
      v-if="entryPathToRemove"
      :show="!!entryPathToRemove"
      :path="entryPathToRemove"
      @cancel="entryPathToRemove = undefined"
      @apply="onRemoveEntry"
    />

    <!--
      <DocumentRemoveDialog
      v-if="documentToRemove"
      :show="!!documentToRemove"
      :doc-handle="documentToRemove"
      @cancel="documentIdToRemove = undefined"
      @apply="onDocumentRemoveApply"
      /> 
    -->

    <DocumentRenameDialog
      v-if="documentToRename"
      :show="!!documentToRename"
      :doc-handle="documentToRename"
      @renamed="documentToRename = undefined"
      @cancel="documentToRename = undefined"
    />

    <FSEntryRenameDialog
      v-if="entryKeyToRename"
      v-model:show="showFSEntryRenameDialog"
      :path="entryKeyToRename"
      @cancel="entryKeyToRename = undefined"
      @renamed="onRenamedEntry"
    />
  </MDPaneContainer>
</template>

<style scoped>
.document-explorer-widget {
  &__fab-container {
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
  }

  &__navigation-path {
    position: sticky;
    top: 0;
    flex-shrink: 0;
    padding-left: 4step;
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
