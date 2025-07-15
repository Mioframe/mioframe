<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';

import { HomeWidget } from '@widget/HomeWidget';
import { RepoExplorerPane } from '@widget/MainViewV2/RepoExplorer';
import { computed } from 'vue';
import { useRepoExplorerState } from '@widget/MainViewV2/useRepoExplorerState';
import DocumentViewPane from '@widget/DocumentView/DocumentViewPane.vue';

const { directoryEntry: currentDirectory, state } = useRepoExplorerState();

const directory = computed(() => currentDirectory.value);

const documentId = computed(() => state.document);
</script>

<template>
  <MDMainLayer class="main-view">
    <template #firstPane>
      <HomeWidget v-if="!directory" />

      <RepoExplorerPane v-else />
    </template>

    <template v-if="currentDirectory && documentId" #secondPane>
      <DocumentViewPane
        :directory="currentDirectory"
        :document-id="documentId"
      />
    </template>
  </MDMainLayer>
</template>
