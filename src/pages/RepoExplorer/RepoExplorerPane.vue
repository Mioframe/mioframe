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
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { zodQuery } from './model';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { FSEntryManageMenuButton } from '@feature/entryManage';
import { RepositoryExplorerWidget } from '@widget/RepositoryExplorerWidget';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { repoPath: directoryPath } = toRefs(props);

const createDirectoryParentPath = ref<string>();

const onClickCreateDirectory = () => {
  createDirectoryParentPath.value = directoryPath.value;
};

const onCloseCreateDirectoryDialog = () => {
  createDirectoryParentPath.value = undefined;
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

const onCloseCreateDocumentDialog = () => {
  showCreateDocumentDialog.value = false;
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
        <slot name="appBarTrailing" />
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
      @cancel="onCloseCreateDocumentDialog"
      @created="onCloseCreateDocumentDialog"
    />

    <DirectoryCreateDialog
      v-if="createDirectoryParentPath"
      :path="createDirectoryParentPath"
      @cancel="onCloseCreateDirectoryDialog"
      @created="onCloseCreateDirectoryDialog"
    />
  </MDPane>
</template>
