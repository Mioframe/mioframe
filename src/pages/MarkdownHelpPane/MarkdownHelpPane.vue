<script setup lang="ts">
import { computed } from 'vue';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { MarkdownContent } from '@shared/ui/MarkdownContent';

const props = defineProps<{
  headline: string;
  markdown: string;
  paneClass: string;
}>();

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const content = computed(() => props.markdown.replace(/^#\s+.*\r?\n+/, ''));
</script>

<template>
  <MDPane :class="paneClass" allow-bottom-navigation>
    <MDAppBar :headline="headline">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="markdown-help-pane__content">
      <MarkdownContent :source="content" variant="article" open-external-links-in-new-tab />
    </div>
  </MDPane>
</template>

<style scoped>
.markdown-help-pane__content {
  padding: 16px;
}
</style>
