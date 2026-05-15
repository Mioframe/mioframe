<script setup lang="ts">
import dataStorageHelpMarkdown from '../../../docs/user/data-storage-and-recovery.md?raw';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { MarkdownContent } from '@shared/ui/MarkdownContent';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const dataStorageHelpContent = dataStorageHelpMarkdown.replace(/^# .*\r?\n+/, '');
</script>

<template>
  <MDPane class="data-storage-help-pane" allow-bottom-navigation>
    <MDAppBar headline="Data storage & recovery">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="data-storage-help-pane__content">
      <MarkdownContent
        :source="dataStorageHelpContent"
        variant="article"
        open-external-links-in-new-tab
      />
    </div>
  </MDPane>
</template>

<style scoped>
.data-storage-help-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.data-storage-help-pane__content {
  padding: 16px;
}
</style>
