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
import { SlidingPanel } from '../../shared/ui/SlidingPanel';
import { DocumentPanel } from '../DocumentPanel';
import { createDatabaseDocument } from '../../shared/lib/databaseDocument/createDatabaseDocument';
import { createLogger } from '../../shared/lib/logger';
import { GDriveDirectoryPickerForm } from '../../features/gDriveDirectoryPicker';
import type { GDriveDirectory } from '../../shared/lib/googleDrive';
import { usePickLocalDirectory } from '../../features/localDirectoryPick';
import { useMediaQuery } from '@vueuse/core';

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
  openBottomMenu.value = false;
  isOpenPanel.value = false;
};

const openBottomMenu = ref(true);

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

const isLandscape = useMediaQuery('(orientation: landscape)');
</script>

<template>
  <div class="main-view">
    <WorkspaceFrame
      v-if="selectedCFRDocument"
      :cfr-document="selectedCFRDocument"
      class="main-view__workspace-frame"
    />

    <div v-else class="main-view__workspace-frame content p-2">
      <h1>Welcome</h1>

      <p>To continue, select the directory where your data is stored.</p>
    </div>

    <SlidingPanel
      v-model:open="isOpenPanel"
      class="main-view__panel panel"
      :right="isLandscape"
    >
      <div class="card panel__card">
        <button
          type="button"
          class="panel__toggle button is-transparent is-small is-fullwidth is-ghost"
          @click="isOpenPanel = !isOpenPanel"
        >
          <span class="icon">
            <i
              class="fa-solid fa-chevron-up"
              :class="{
                'fa-flip-vertical': isOpenPanel,
              }"
            />
          </span>
        </button>

        <DocumentPanel
          v-if="selectedCFRDocument"
          :cfr-document="selectedCFRDocument"
        />

        <div class="panel__menu-list menu">
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
    </SlidingPanel>

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
  </div>
</template>

<style lang="scss" scoped>
.main-view {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  justify-content: flex-end;
  overflow: auto;

  &__workspace-frame {
    flex-grow: 1;
    flex-shrink: 1;
  }

  &__panel {
    --sliding-panel-min-height: 134px;
    --sliding-panel-min-width: 30px;
    .card {
      min-height: var(--sliding-panel-min-height);
    }
  }

  @media screen and (orientation: landscape) {
    flex-direction: row;
    gap: 8px;

    &__panel {
      width: 320px;
      max-width: 35vw;
      max-height: 100%;
      overflow-y: auto;
      align-self: center;
      .card {
        max-height: 100%;
        min-height: auto;
        overflow-y: auto;
      }
    }
  }
}

.panel {
  &__card {
    @media screen and (orientation: landscape) {
      width: 30vw;
      min-width: 320px;
    }
  }

  &__toggle {
    @media screen and (orientation: landscape) {
      width: var(--sliding-panel-min-width);
      transform: rotate(-90deg);
    }
  }

  &__menu-list {
    @media screen and (orientation: landscape) {
      overflow-x: auto;
    }
  }
}
</style>
