<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from 'vue';
import { MDAppBar } from '@shared/ui/AppBar';
import { usePaneContainer } from '@shared/ui/Layout';
import { MarkdownContent } from '@shared/ui/MarkdownContent';
import { stripMarkdownTitle } from './stripMarkdownTitle';

const props = defineProps<{
  headline: string;
  markdown: string;
  /** Heading id to scroll to once the article renders; falls back to the pane top. */
  anchor?: string | undefined;
}>();

const emit = defineEmits<{
  contentClick: [event: MouseEvent];
}>();

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const content = computed(() => stripMarkdownTitle(props.markdown));

const onContentClick = (event: MouseEvent) => {
  emit('contentClick', event);
};

const contentEl = useTemplateRef<HTMLElement>('contentEl');

const paneContainer = usePaneContainer();

/**
 * Finds the heading element matching `anchor` inside this pane's own rendered Markdown
 * content. Scoped DOM lookup for anchor scrolling only, not component coordination.
 * @param anchor - Heading id to look up.
 * @returns The matching heading element, or `null` when no heading has that id.
 */
const findAnchorElement = (anchor: string): HTMLElement | null => {
  const root = contentEl.value;
  if (!root) {
    return null;
  }

  // eslint-disable-next-line no-restricted-syntax -- local anchor-scroll lookup inside this pane's own rendered markdown content, not component coordination.
  return root.querySelector<HTMLElement>(`#${CSS.escape(anchor)}`);
};

const scrollToAnchorOrTop = () => {
  const target = props.anchor ? findAnchorElement(props.anchor) : null;
  if (target) {
    target.scrollIntoView({ block: 'start' });
    return;
  }

  paneContainer.value?.scrollTo({ top: 0 });
};

// `onMounted` covers the initial render: a `watch({ immediate: true })` callback runs
// synchronously during setup, before this pane's first render has produced the `contentEl`
// and heading DOM that anchor lookup depends on.
onMounted(scrollToAnchorOrTop);

watch(() => [props.markdown, props.anchor] as const, scrollToAnchorOrTop, { flush: 'post' });
</script>

<template>
  <div class="markdown-help-pane">
    <MDAppBar :headline="headline">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div ref="contentEl" class="markdown-help-pane__content" @click="onContentClick">
      <MarkdownContent
        :source="content"
        variant="article"
        open-external-links-in-new-tab
        generate-heading-ids
      />
    </div>
  </div>
</template>

<style scoped>
.markdown-help-pane {
  display: flex;
  flex-direction: column;
}

.markdown-help-pane__content {
  padding: 16px;
}
</style>
