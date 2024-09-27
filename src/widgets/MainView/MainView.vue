<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import { useFolder } from '../../entities/folder/useFolder';
import { MenuFolder } from '../../entities/folder';
import type { DocumentApi, FolderApi } from '../../shared/lib/documentApi';
import { createFolderApi } from '../../shared/lib/documentApi';
import { createDirectoryEntryApi } from '../../shared/lib/fileSystemApi';
import { usePickDirectory } from '../../features/directoryPick';
import CreateDocumentForm from '../../features/documentCreat/DocumentCreationForm.vue';
import { ModalCard } from '../../shared/ui/ModalCard';
import type { DocumentId } from '@automerge/automerge-repo';
import { DocumentRemoveForm } from '../../features/documentRemove';
import { WorkspaceFrame } from '../WorkspaceFrame';
import SlidingPanel from '../../shared/ui/SlidingPanel/SlidingPanel.vue';
import DocumentPanel from '../DocumentPanel/DocumentPanel.vue';
import { createDatabaseApi } from '../../shared/lib/databaseDocument/createDatabaseApi';
import { createLogModule } from '../../shared/lib/logger';

const { debug } = createLogModule('MainView');

const { pickedDirectoryHandler, showPicker } = usePickDirectory();

const folderApi = computed((): FolderApi | undefined =>
  pickedDirectoryHandler.value
    ? createFolderApi(createDirectoryEntryApi(pickedDirectoryHandler.value))
    : undefined,
);

const onClickSelectDirectory = showPicker;

const { content: documentsMap } = useFolder(folderApi);

const isDisplayedDocumentCreationForm = ref(false);

const onClickCreateDocument = () => {
  isDisplayedDocumentCreationForm.value = true;
};

const onCancelCreateDocument = () => {
  isDisplayedDocumentCreationForm.value = false;
};

const onCreatedDocument = onCancelCreateDocument;

const documentIdForRemove = ref<DocumentId>();

const onClickRemove = (documentId: DocumentId) => {
  documentIdForRemove.value = documentId;
};

const onCancelRemove = () => {
  documentIdForRemove.value = undefined;
};

const onRemoved = onCancelRemove;

const selectedDocumentApi = shallowRef<DocumentApi>();

const onClickFolder = (_documentId: DocumentId, documentApi: DocumentApi) => {
  const databaseApi = createDatabaseApi(documentApi);
  debug('onClickFolder', databaseApi);
  selectedDocumentApi.value = documentApi;
  openBottomMenu.value = false;
};

const openBottomMenu = ref(true);
</script>

<template>
  <div
    class="is-flex is-flex-direction-column is-flex-grow-1 is-justify-content-flex-end"
  >
    <WorkspaceFrame
      v-if="selectedDocumentApi"
      :document-api="selectedDocumentApi"
    />

    <SlidingPanel class="bottom-panel">
      <div class="card">
        <button
          type="button"
          class="button is-transparent is-small is-fullwidth is-ghost"
        >
          <span class="icon">
            <i class="fa-solid fa-chevron-up" />
          </span>
        </button>

        <DocumentPanel
          v-if="selectedDocumentApi"
          :document-api="selectedDocumentApi"
        />

        <div class="menu">
          <MenuFolder :documents-map="documentsMap" @click="onClickFolder">
            <template #contextMenu="{ documentId, documentName }">
              <span class="dropdown-item">
                {{ documentName }}
              </span>

              <hr class="dropdown-divider" />

              <button
                type="button"
                class="dropdown-item"
                title="create new directory"
                @click="onClickRemove(documentId)"
              >
                <span class="icon is-small">
                  <i class="fa-solid fa-trash" />
                </span>

                <span class="ml-2">remove</span>
              </button>
            </template>
          </MenuFolder>

          <ul class="menu-list">
            <li v-if="folderApi">
              <button
                type="button"
                class="button is-link"
                @click="onClickCreateDocument"
              >
                <span class="icon">
                  <i class="fa-solid fa-plus" />
                </span>

                <span> create document </span>
              </button>
            </li>

            <li>
              <button
                type="button"
                class="button is-link"
                @click="onClickSelectDirectory"
              >
                <span class="icon">
                  <i class="fa-solid fa-plug" />
                </span>

                <span> directory selection </span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </SlidingPanel>

    <ModalCard v-if="folderApi && isDisplayedDocumentCreationForm">
      <CreateDocumentForm
        :folder-api="folderApi"
        @cancel="onCancelCreateDocument"
        @created="onCreatedDocument"
      />
    </ModalCard>

    <ModalCard v-if="folderApi && documentIdForRemove">
      <DocumentRemoveForm
        :folder-api="folderApi"
        :document-id="documentIdForRemove"
        @cancel="onCancelRemove"
        @removed="onRemoved"
      />
    </ModalCard>
  </div>
</template>

<style lang="scss" scoped>
.bottom-panel {
  --sliding-panel-min-height: 71px;
}
</style>
