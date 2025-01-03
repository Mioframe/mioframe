<script setup lang="ts">
import { MenuFolder } from '@entity/folder';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { setupDocumentChoice } from '@widget/MainView/setupDocumentChoice';
import { setupDocumentRemove } from '@widget/MainView/setupDocumentRemove';
import { setupFolderChoice } from '@widget/MainView/setupFolderChoice';
import { computed, ref } from 'vue';

const { folderContents, selectedDocumentFolder } = setupFolderChoice();

const { onClickFolderDocument } = setupDocumentChoice();

const { onClickRemove } = setupDocumentRemove();

const isShowCreateDocument = ref(false);

const currentFolder = computed(() => selectedDocumentFolder.value);

const onClickCreateDocument = () => {
  if (currentFolder.value) {
    isShowCreateDocument.value = true;
  }
};
</script>

<template>
  <div class="document-explorer-widget">
    <MenuFolder
      v-if="folderContents"
      :folder-contents="folderContents"
      @click="onClickFolderDocument"
    >
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

    <MDFabContainer class="document-explorer-widget__fab-container">
      <MDFab tooltip="Create folder" size="small">
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
      v-if="isShowCreateDocument && currentFolder"
      :folder="currentFolder"
      @cancel="isShowCreateDocument = false"
      @create="isShowCreateDocument = false"
    />
  </div>
</template>

<style scoped>
.document-explorer-widget {
  position: relative;
  flex: 1 0;

  &__fab-container {
    position: absolute;
    bottom: 0;
    right: 0;
  }
}
</style>
