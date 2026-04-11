<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { useFSNodeStat } from '@entity/fsEntry';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { zodQuery } from './model';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { FSEntryManageMenuButton } from '@feature/entryManage';
import { RepositoryExplorerWidget } from '@widget/RepositoryExplorerWidget';

const props = defineProps(zodToVueProps(zodQuery));

const { repoPath: directoryPath } = toRefs(props);

defineSlots<{
  navigationButton: () => unknown;
}>();

const createDirectoryParentPath = ref<string>();

const onClickCreateDirectory = () => {
  createDirectoryParentPath.value = directoryPath.value;
};

const { data: directoryStat } = useFSNodeStat(directoryPath);

const { open } = useStackNavigation();

const onClickPath = async (path: string) => {
  await open('repo', {
    repoPath: path,
  });
};

const showCreateDocumentDialog = ref(false);

const onClickCreateDocument = () => {
  showCreateDocumentDialog.value = true;
};

const onClickDocument = async (documentId: AMDocumentId) => {
  await open(
    'document',
    {
      documentDirectory: directoryPath.value,
      documentId,
    },
    {
      target: 'document',
    },
  );
};

const title = computed(() => PathUtils.basename(directoryPath.value) || 'root');

const canEditDirectoryContents = computed(
  () => directoryStat.value?.capabilities?.canEditChildren === true,
);

const onClickReturnHome = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};
</script>

<template>
  <MDPane>
    <MDAppBar v-if="title" :headline="title">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <FSEntryManageMenuButton :path="directoryPath" />
      </template>
    </MDAppBar>

    <RepositoryExplorerWidget
      :directory-path="directoryPath"
      @click-path="onClickPath"
      @click-document="onClickDocument"
      @click-return-home="onClickReturnHome"
    >
      <template v-if="canEditDirectoryContents" #after>
        <MDFabContainer auto-hide>
          <MDFab tooltip="Create directory" color="tonal-primary" @click="onClickCreateDirectory">
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
        </MDFabContainer>
      </template>
    </RepositoryExplorerWidget>

    <DocumentCreationDialog
      v-if="directoryPath && showCreateDocumentDialog"
      :path="directoryPath"
      @cancel="showCreateDocumentDialog = false"
      @created="showCreateDocumentDialog = false"
    />

    <DirectoryCreateDialog
      v-if="createDirectoryParentPath"
      :path="createDirectoryParentPath"
      @cancel="createDirectoryParentPath = undefined"
      @created="createDirectoryParentPath = undefined"
    />
  </MDPane>
</template>
