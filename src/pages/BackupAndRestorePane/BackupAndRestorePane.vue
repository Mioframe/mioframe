<script setup lang="ts">
import backupAndRestoreMarkdown from '../../../docs/user/backup-and-restore.md?raw';
import MarkdownHelpPane from '@page/MarkdownHelpPane/MarkdownHelpPane.vue';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MarkdownHelpPane
    headline="Backup and restore"
    :markdown="backupAndRestoreMarkdown"
    pane-class="backup-and-restore-pane"
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
.backup-and-restore-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}
</style>
