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
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { FSEntryRenameDialog } from '@feature/entryRename';
import { isUndefined } from 'es-toolkit';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { zodQuery } from './model';
import { useMainRouter } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { useRepository } from '@entity/repository';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { useDirectory } from '@entity/directory/useDirectory';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useLocalSettings } from '@entity/localSettings';

const props = defineProps(zodToVueProps(zodQuery));

const { repoPath: directoryPath } = toRefs(props);

defineSlots<{
  navigationButton: () => unknown;
}>();

const parentPathForNewDirectory = ref<string>();

const onClickCreateDirectory = () => {
  parentPathForNewDirectory.value = directoryPath.value;
};

const entryPathToRemove = ref<string>();

const { remove: removeEntry } = useFileSystem();

const { settings } = useLocalSettings();

const readDirectoryOptions = computed(
  (): ReadDirectoryOptions => ({
    hideAutomergeFiles: !settings.value.showAutomergeFiles,
  }),
);

const { data: directoryEntries } = useDirectory(
  directoryPath,
  readDirectoryOptions,
);

const { open } = useMainRouter();

const onClickPath = async (path: string) => {
  if (path === '/') {
    await open('home', {});
  } else {
    await open('repo', {
      repoPath: path,
    });
  }
};

const onClickEntry = async (name: string) => {
  await open('repo', {
    repoPath: PathUtils.join(directoryPath.value, name),
  });
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  showFormNewDocument.value = true;
};

const { state: documentIdList } = useRepository(directoryPath);

const onRemoveEntry = async (path: string) => {
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

const entryKeyToRename = ref<string>();

const onClickFSEntryContextAction = (
  { key }: { key: FSEntryContextEvent },
  name: string,
) => {
  switch (key) {
    case FSEntryContextEvent.remove: {
      entryPathToRemove.value = PathUtils.join(directoryPath.value, name);
      break;
    }
    case FSEntryContextEvent.rename: {
      entryKeyToRename.value = PathUtils.join(directoryPath.value, name);
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
    // repoPath: directoryPath.value,
    documentDirectory: directoryPath.value,
    documentId,
  });
};

const documentIdToRename = shallowRef<AMDocumentId>();

const title = computed((): string | undefined =>
  PathUtils.basename(directoryPath.value),
);

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
  <MDPane class="document-explorer-widget">
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
          is="button"
          v-for="docId in documentIdList"
          :key="docId"
          :document-id="docId"
          :path="directoryPath"
          class="document-explorer-widget__list-item"
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
          v-for="[name, fileType] in directoryEntries"
          :key="name"
          is-button
          :name="name"
          :type="fileType"
          class="document-explorer-widget__list-item"
          @click="onClickEntry(name)"
        >
          <template #trailingIcon>
            <MDContextMenuButton
              :btns="fsEntryContextBtns"
              :tooltip="`options ${name}`"
              @click="onClickFSEntryContextAction($event, name)"
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
  </MDPane>
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
