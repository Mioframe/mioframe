<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { useFSNodeStat } from '@entity/fsEntry';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { zodQuery } from './model';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { RepoExplorerScreenMenuButton } from '@feature/repoExplorerScreenMenu';
import { RepositoryExplorerWidget } from '@widget/RepositoryExplorerWidget';
import { DocumentAddSheet } from '@feature/documentAdd';

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

const showDocumentAddSheet = ref(false);

const onClickAddDocument = () => {
  showDocumentAddSheet.value = true;
};

const onCloseDocumentAddSheet = () => {
  showDocumentAddSheet.value = false;
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
        <RepoExplorerScreenMenuButton />
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
          <MDFab
            tooltip="Добавить в документы Mioframe"
            color="primary"
            md-symbol="add"
            label="+ Добавить"
            @click="onClickAddDocument"
          />

          <MDFab tooltip="Create directory" color="tonal-primary" @click="onClickCreateDirectory">
            <template #icon>
              <MDSymbol name="create_new_folder" />
            </template>
          </MDFab>
        </MDFabContainer>
      </template>
    </RepositoryExplorerWidget>

    <DocumentAddSheet
      v-if="directoryPath && showDocumentAddSheet"
      :path="directoryPath"
      @close="onCloseDocumentAddSheet"
    />

    <DirectoryCreateDialog
      v-if="createDirectoryParentPath"
      :path="createDirectoryParentPath"
      @cancel="onCloseCreateDirectoryDialog"
      @created="onCloseCreateDirectoryDialog"
    />
  </MDPane>
</template>
