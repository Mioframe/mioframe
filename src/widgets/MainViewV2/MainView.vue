<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';

import { HomeWidget } from '@widget/Home';
import { RepoExplorerPane } from '@widget/MainViewV2/RepoExplorer';
import { computed } from 'vue';
import { useRepoExplorerNavigate } from '@widget/MainViewV2/useRepoExplorerNavigate';
import DocumentViewPane from '@widget/DocumentView/DocumentViewPane.vue';

const { directoryEntry: currentDirectory, state } = useRepoExplorerNavigate();

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
