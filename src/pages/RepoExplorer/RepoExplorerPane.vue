<script setup lang="ts">
import { computed, ref, shallowRef, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { FSEntryRemoveDialog } from '@feature/entryRemove';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { FSEntryMDListItem } from '@entity/fsEntry';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DocumentRemoveDialog } from '@feature/documentRemove';
import { DocumentRenameDialog } from '@feature/documentRename';
import { MDPaneContainer } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { isUndefined } from 'es-toolkit';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useDirectoryStoreClient } from '@entity/mountedDirectories/useDirectoryStoreClient';
import type { EntryPath } from '@shared/lib/fileSystem';
import type { EntryDescription } from '@shared/api/directories/types';
import { useDocumentRepoClient } from '@entity/documentRepo';
import { stringPath } from '@shared/api/directories';
import { DomainError } from '@shared/lib/error';
import { zodQuery } from './model';
import { useMainRouter } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { useLocalSettings } from '@entity/localSettings';

const props = defineProps(zodToVueProps(zodQuery));

const { repoPath: directoryPath } = toRefs(props);

defineSlots<{
  navigationButton: () => unknown;
}>();

const parentPathForNewDirectory = ref<EntryPath>();

const onClickCreateDirectory = () => {
  parentPathForNewDirectory.value = directoryPath.value;
};

const entryPathToRemove = ref<EntryPath>();

const { settings } = useLocalSettings();

const { getEntry, removeEntry } = useDirectoryStoreClient();

const directory = computed(() => {
  const entry = getEntry(directoryPath.value, {
    showAutomergeFiles: settings.value.showAutomergeFiles,
  });
  if (entry instanceof DomainError) {
    return entry;
  }
  if (entry?.type === 'file') {
    return new DomainError(
      `Entry ${stringPath(entry.path)} is not a directory`,
    );
  }
  if (entry && 'entries' in entry) {
    return entry;
  }
  return undefined;
});

const directoryEntries = computed(() =>
  directory.value instanceof Error ? undefined : directory.value?.entries,
);

const { open } = useMainRouter();

const onClickPath = async (indexPath: number) => {
  const repoPath = directoryPath.value.slice(0, indexPath + 1);

  if (repoPath.length) {
    await open('repo', {
      repoPath,
    });
  } else {
    await open('home', {});
  }
};

const onClickEntry = async (entry: EntryDescription) => {
  if (entry.type === 'directory') {
    await open('repo', {
      repoPath: entry.path,
    });
  }
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  if (directory.value) {
    showFormNewDocument.value = true;
  }
};

const { getDocumentIdList } = useDocumentRepoClient();

const documentIdList = computed(() => getDocumentIdList(directoryPath.value));

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
) => {
  switch (key) {
    case DocumentContextEvent.remove: {
      documentIdToRemove.value = docId;
      break;
    }
    case DocumentContextEvent.rename: {
      documentIdToRename.value = docId;
      break;
    }

    default:
      throw new Error('action key is unknown');
  }
};

const documentIdToRemove = shallowRef<AMDocumentId>();

const onClickDocument = async (documentId: AMDocumentId) => {
  await open('document', {
    repoPath: directoryPath.value,
    documentDirectory: directoryPath.value,
    documentId,
  });
};

const documentIdToRename = shallowRef<AMDocumentId>();

const title = computed((): string | undefined => {
  return directoryPath.value.at(-1);
});

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
    <MDAppBar v-if="title" :headline="title">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>
    </MDAppBar>

    <MDNavigationPath
      v-if="directoryPath"
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <div class="document-explorer-widget__scrollable-content">
      <MDListContainer
        is="div"
        v-if="directoryPath"
        class="document-explorer-widget__content-list"
      >
        <CFRDocumentMDListItem
          v-for="docId in documentIdList"
          :key="docId"
          :document-id="docId"
          :path="directoryPath"
          class="document-explorer-widget__list-item"
          is-button
          @click="onClickDocument(docId)"
        >
          <template #trailingIcon="{ documentName }">
            <MDContextMenuButton
              :btns="documentContextBtns"
              :tooltip="`options ${documentName}`"
              @click="onClickDocumentContextAction($event, docId)"
            />
          </template>
        </CFRDocumentMDListItem>

        <FSEntryMDListItem
          v-for="entry in directoryEntries"
          :key="entry.name"
          is-button
          :entry="entry"
          class="document-explorer-widget__list-item"
          @click="onClickEntry(entry)"
        >
          <template #trailingIcon="{ entry: { name: entryName } }">
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

    <DocumentCreationDialog
      v-if="directoryPath"
      v-model:show="showFormNewDocument"
      :path="directoryPath"
      @cancel="showFormNewDocument = false"
      @created="showFormNewDocument = false"
    />

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

    <DocumentRemoveDialog
      v-if="documentIdToRemove && directoryPath"
      :show="!!documentIdToRemove"
      :path="directoryPath"
      :document-id="documentIdToRemove"
      @cancel="documentIdToRemove = undefined"
      @apply="documentIdToRemove = undefined"
    />

    <DocumentRenameDialog
      v-if="documentIdToRename && directoryPath"
      :path="directoryPath"
      :show="!!documentIdToRename"
      :document-id="documentIdToRename"
      @renamed="documentIdToRename = undefined"
      @cancel="documentIdToRename = undefined"
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
    padding-left: 2step;
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
