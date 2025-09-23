<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';

import { HomeWidget } from '@widget/Home';
import { RepoExplorerPane } from '@widget/MainView/RepoExplorer';
import { useRepoExplorerNavigate } from '@widget/MainView/useRepoExplorerNavigate';
// import { useRouter } from 'vue-router';

const {
  directoryPath,
  // closeDocument
} = useRepoExplorerNavigate();

// const onClickCloseDocument = async () => {
//   await closeDocument();
// };

// const router = useRouter();
// const onClickBack = () => {
//   router.back();
// };
</script>

<template>
  <MDMainLayer class="main-view">
    <template #firstPane>
      <HomeWidget v-if="!directoryPath" />

      <RepoExplorerPane v-else />
    </template>

    <!--
      <template
      v-if="directoryPath && documentId"
      #secondPane="{ showFirstPane }"
      >
      <DocumentViewPane :directory="directoryPath" :document-id="documentId">
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
    -->
  </MDMainLayer>
</template>
