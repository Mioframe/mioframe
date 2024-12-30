<script setup lang="ts">
import { MDMainLayer } from '@shared/ui/Layers';
import { DocumentExplorerWidget } from '@widget/DocumentExplorer';
</script>

<template>
  <MDMainLayer class="main-view">
    <template #firstPane>
      <DocumentExplorerWidget />
    </template>
  </MDMainLayer>
</template>
