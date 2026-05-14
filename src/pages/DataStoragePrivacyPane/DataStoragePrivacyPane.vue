<script setup lang="ts">
import privacyPolicyMarkdown from '../../../PRIVACY.md?raw';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { MarkdownContent } from '@shared/ui/MarkdownContent';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MDPane class="data-storage-privacy-pane" allow-bottom-navigation>
    <MDAppBar headline="Privacy policy">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="data-storage-privacy-pane__content">
      <MarkdownContent
        :source="privacyPolicyMarkdown"
        variant="article"
        open-external-links-in-new-tab
      />
    </div>
  </MDPane>
</template>

<style scoped>
.data-storage-privacy-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.data-storage-privacy-pane__content {
  padding: 16px;
}
</style>
