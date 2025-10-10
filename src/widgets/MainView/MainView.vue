<script setup lang="ts">
import { MDIconButton } from '@shared/ui/Button';
import { MDMainLayer } from '@shared/ui/Layers';
import DocumentViewPane from '@widget/DocumentView/DocumentViewPane.vue';

import { HomeWidget } from '@widget/Home';
import { RepoExplorerPane } from '@widget/MainView/RepoExplorer';
import { useRepoExplorerNavigate } from '@widget/MainView/useRepoExplorerNavigate';
import { useRouter } from 'vue-router';

const { directoryPath, documentId, closeDocument } = useRepoExplorerNavigate();

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
      <HomeWidget v-if="!directoryPath" />

      <RepoExplorerPane v-else />
    </template>

    <template
      v-if="directoryPath && documentId"
      #secondPane="{ showFirstPane }"
    >
      <DocumentViewPane :directoryPath="directoryPath" :document-id="documentId">
        <template #leadingButton>
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
