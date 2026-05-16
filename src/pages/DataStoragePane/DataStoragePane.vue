<script setup lang="ts">
import dataStorageMarkdown from '../../../docs/user/data-storage.md?raw';
import MarkdownHelpPane from '@page/MarkdownHelpPane/MarkdownHelpPane.vue';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MarkdownHelpPane
    headline="Data storage"
    :markdown="dataStorageMarkdown"
    pane-class="data-storage-pane"
  >
    <template #navigationButton>
      <slot name="navigationButton" />
    </template>

    <template #appBarTrailing>
      <slot name="appBarTrailing" />
    </template>
  </MarkdownHelpPane>
</template>

<style scoped>
.data-storage-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}
</style>
