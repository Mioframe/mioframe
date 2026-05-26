<script setup lang="ts">
import { computed, nextTick, ref, toRefs } from 'vue';
import { DocumentCreationDialog } from '@feature/documentCreate';
import { MDExtendedFab, MDFabContainer } from '@shared/ui/Button';
import { useFSNodeStat } from '@entity/fsEntry';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { zodQuery } from './model';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import {
  RepositoryExplorerEntryManageButton,
  RepositoryExplorerWidget,
} from '@widget/RepositoryExplorerWidget';
import { DocumentAddSheet } from '@feature/documentAdd';
import { useImportDocumentAction } from '@feature/importDocument';

// eslint-disable-next-line vue/define-props-declaration -- z.infer output is too complex for Vue macro runtime inference
const props = defineProps(zodToVueProps(zodQuery));

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { repoPath: directoryPath } = toRefs(props);

const { data: directoryStat } = useFSNodeStat(directoryPath);

const { open } = useStackNavigation();

const onClickPath = async (path: string) => {
  await open('repo', {
    repoPath: path,
  });
};

const showDocumentAddSheet = ref(false);
const showCreateDocumentDialog = ref(false);
const { importDocument } = useImportDocumentAction();

const onClickAddDocument = () => {
  showDocumentAddSheet.value = true;
};

const onCloseDocumentAddSheet = () => {
  showDocumentAddSheet.value = false;
};

const onSelectCreateDocument = async () => {
  await nextTick();
  showCreateDocumentDialog.value = true;
};

const onCloseCreateDocumentDialog = () => {
  showCreateDocumentDialog.value = false;
};

const onSelectImportDocument = async () => {
  await nextTick();
  await importDocument(directoryPath.value);
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
        <RepositoryExplorerEntryManageButton
          :path="directoryPath"
          :entry-type="FSNodeType.Directory"
        />

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
          <MDExtendedFab label="Add document" md-symbol="add" @click="onClickAddDocument" />
        </MDFabContainer>
      </template>
    </RepositoryExplorerWidget>

    <DocumentAddSheet
      v-if="showDocumentAddSheet"
      @close="onCloseDocumentAddSheet"
      @select-create="onSelectCreateDocument"
      @select-import="onSelectImportDocument"
    />

    <DocumentCreationDialog
      v-if="showCreateDocumentDialog"
      :path="directoryPath"
      @cancel="onCloseCreateDocumentDialog"
      @created="onCloseCreateDocumentDialog"
    />
  </MDPane>
</template>
