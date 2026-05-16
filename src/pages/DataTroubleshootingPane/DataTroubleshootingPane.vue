<script setup lang="ts">
import dataTroubleshootingMarkdown from '../../../docs/user/data-troubleshooting.md?raw';
import MarkdownHelpPane from '@page/MarkdownHelpPane/MarkdownHelpPane.vue';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MarkdownHelpPane
    headline="Troubleshooting data problems"
    :markdown="dataTroubleshootingMarkdown"
    pane-class="data-troubleshooting-pane"
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
.data-troubleshooting-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}
</style>
