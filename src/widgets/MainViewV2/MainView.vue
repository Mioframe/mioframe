<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';

import { HomeWidget } from '@widget/Home';
import { RepoExplorerPane } from '@widget/MainViewV2/RepoExplorer';
import { computed } from 'vue';
import { useRepoExplorerNavigate } from '@widget/MainViewV2/useRepoExplorerNavigate';
import DocumentViewPane from '@widget/DocumentView/DocumentViewPane.vue';
import { MDIconButton } from '@shared/ui/Button';
import { useRouter } from 'vue-router';

const {
  directoryEntry: currentDirectory,
  state,
  closeDocument,
} = useRepoExplorerNavigate();

const directory = computed(() => currentDirectory.value);

const documentId = computed(() => state.document);

const onClickCloseDocument = async () => {
  await closeDocument();
};

const router = useRouter();
const onClickBack = () => {
  router.back();
};
</script>

<template>
  <MDMainLayer class="main-view">
    <template #firstPane>
      <HomeWidget v-if="!directory" />

      <RepoExplorerPane v-else />
    </template>

    <template
      v-if="currentDirectory && documentId"
      #secondPane="{ showFirstPane }"
    >
      <DocumentViewPane :directory="currentDirectory" :document-id="documentId">
        <template #leadingNavigation>
          <MDIconButton
            v-if="showFirstPane"
            tooltip="close"
            md-symbol-name="close"
            @click="onClickCloseDocument"
          />

          <MDIconButton
            v-else
            tooltip="back"
            md-symbol-name="arrow_back"
            @click="onClickBack"
          />
        </template>
      </DocumentViewPane>
    </template>
  </MDMainLayer>
</template>
