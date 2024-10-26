<script setup lang="ts">
import { computed, ref, shallowRef, watch } from 'vue';
import { useDocumentFolder } from '../../entities/folder/useDocumentFolder';
import { MenuFolder } from '../../entities/folder';
import {
  createDocumentFolder,
  type CFRDocument,
  type DocumentFolder,
} from '../../shared/lib/cfrDocument';
import { CreateDocumentForm } from '../../features/documentCreat';
import { ModalCard } from '../../shared/ui/ModalCard';
import type { DocumentId } from '@automerge/automerge-repo';
import { DocumentRemoveForm } from '../../features/documentRemove';
import { WorkspaceFrame } from '../WorkspaceFrame';
import { DocumentPanel } from '../DocumentPanel';
import { createDatabaseDocument } from '../../shared/lib/databaseDocument/createDatabaseDocument';
import { createLogger } from '../../shared/lib/logger';
import { GDriveDirectoryPickerForm } from '../../features/gDriveDirectoryPicker';
import type { GDriveDirectory } from '../../shared/lib/googleDrive';
import { usePickLocalDirectory } from '../../features/localDirectoryPick';
import WelcomeMessage from './WelcomeMessage.vue';
import { ViewWithPanelLayout } from '@shared/ui/ViewWithPanelLayout';

const { debug } = createLogger('MainView');

const selectedDocumentFolder = shallowRef<DocumentFolder>();

const { openLocalDirectoryPicker, isSupport: isSupportLocalDirectory } =
  usePickLocalDirectory();

const onClickSelectDirectory = async () => {
  const localDirectory = await openLocalDirectoryPicker();

  selectedDocumentFolder.value = createDocumentFolder(localDirectory);
};

const { content: contentFolderMap } = useDocumentFolder(selectedDocumentFolder);

const contentFolderSize = computed(() => contentFolderMap.value.size);

watch(contentFolderSize, (contentFolderSize) => {
  setTimeout(() => {
    debug('contentFolderSize', !!contentFolderSize);
    isOpenPanel.value = !!contentFolderSize;
  }, 100);
});

const isDisplayedDocumentCreationForm = ref(false);

const onClickCreateDocument = () => {
  isDisplayedDocumentCreationForm.value = true;
};

const onCancelCreateDocument = () => {
  isDisplayedDocumentCreationForm.value = false;
  isOpenPanel.value = true;
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

const selectedCFRDocument = shallowRef<CFRDocument>();

const onClickFolder = (_documentId: DocumentId, cfrDocument: CFRDocument) => {
  const databaseDocument = createDatabaseDocument(cfrDocument);
  debug('onClickFolder', databaseDocument);
  selectedCFRDocument.value = cfrDocument;
  isOpenPanel.value = false;
};

const isOpenPanel = ref(true);

const openSelectGDirectory = ref(false);

const onClickSelectGDirectory = () => {
  openSelectGDirectory.value = true;
};

const onSelectGDirectory = (directory: GDriveDirectory) => {
  selectedDocumentFolder.value = createDocumentFolder(directory);
  openSelectGDirectory.value = false;
};

const onCancelSelectGDirectory = () => {
  openSelectGDirectory.value = false;
};
</script>

<template>
  <ViewWithPanelLayout v-model:open-panel="isOpenPanel">
    <WorkspaceFrame
      v-if="selectedCFRDocument"
      :cfr-document="selectedCFRDocument"
      class="is-flex-grow-1"
    />

    <WelcomeMessage v-else class="is-flex-grow-1" />

    <template #panel>
      <div class="p-1 block-spacing is-flex is-flex-direction-column">
        <DocumentPanel
          v-if="selectedCFRDocument"
          :cfr-document="selectedCFRDocument"
        />

        <div class="menu card is-shadowless is-overflow-x-auto">
          <MenuFolder :documents-map="contentFolderMap" @click="onClickFolder">
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
        </div>

        <div class="button-grid">
          <button
            v-if="selectedDocumentFolder"
            type="button"
            class="button"
            @click="onClickCreateDocument"
          >
            <span class="icon">
              <i class="fa-solid fa-plus" />
            </span>

            <span> create document </span>
          </button>

          <button
            v-if="isSupportLocalDirectory"
            type="button"
            class="button"
            @click="onClickSelectDirectory"
          >
            <span class="icon">
              <i class="fa-solid fa-plug" />
            </span>

            <span> select local directory </span>
          </button>

          <button type="button" class="button" @click="onClickSelectGDirectory">
            <span class="icon">
              <i class="fa-brands fa-google-drive" />
            </span>

            <span> select google drive directory </span>
          </button>
        </div>
      </div>
    </template>

    <ModalCard v-if="selectedDocumentFolder && isDisplayedDocumentCreationForm">
      <CreateDocumentForm
        :document-folder="selectedDocumentFolder"
        @cancel="onCancelCreateDocument"
        @created="onCreatedDocument"
      />
    </ModalCard>

    <ModalCard v-if="selectedDocumentFolder && documentIdForRemove">
      <DocumentRemoveForm
        :document-folder="selectedDocumentFolder"
        :document-id="documentIdForRemove"
        @cancel="onCancelRemove"
        @removed="onRemoved"
      />
    </ModalCard>

    <ModalCard v-if="openSelectGDirectory">
      <GDriveDirectoryPickerForm
        @submit="onSelectGDirectory"
        @cancel="onCancelSelectGDirectory"
      />
    </ModalCard>
  </ViewWithPanelLayout>
</template>
