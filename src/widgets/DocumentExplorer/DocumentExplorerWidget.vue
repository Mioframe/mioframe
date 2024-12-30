<script setup lang="ts">
import { MenuFolder } from '@entity/folder';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { setupDocumentChoice } from '@widget/MainView/setupDocumentChoice';
import { setupDocumentRemove } from '@widget/MainView/setupDocumentRemove';
import { setupFolderChoice } from '@widget/MainView/setupFolderChoice';
import { vMdTooltip } from '@shared/ui/Tooltips';

const { folderContents } = setupFolderChoice();

const { onClickFolderDocument } = setupDocumentChoice();

const { onClickRemove } = setupDocumentRemove();
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
      <MDFab v-md-tooltip="'Create folder'" size="small">
        <template #icon>
          <MDSymbol name="create_new_folder" />
        </template>
      </MDFab>

      <MDFab v-md-tooltip="'Create document'">
        <template #icon>
          <MDSymbol name="edit_document" />
        </template>
      </MDFab>
    </MDFabContainer>
  </div>
</template>

<style lang="scss" scoped>
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
