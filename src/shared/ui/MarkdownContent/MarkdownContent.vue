<script setup lang="ts">
import { computed } from 'vue';
import { renderMarkdown } from '@shared/lib/markdown/renderMarkdown';

type MarkdownContentVariant = 'body' | 'article' | 'compact';

const props = withDefaults(
  defineProps<{
    source: string;
    variant?: MarkdownContentVariant;
    openExternalLinksInNewTab?: boolean;
  }>(),
  {
    variant: 'body',
    openExternalLinksInNewTab: false,
  },
);

const contentClassName = computed(() => ['markdown-content', `markdown-content--${props.variant}`]);
const tableWrapperClassName = 'markdown-content__table-scroll';

const renderedMarkdown = computed(() =>
  renderMarkdown(props.source, {
    openExternalLinksInNewTab: props.openExternalLinksInNewTab,
    tableWrapperClassName,
  }),
);
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html -->
  <div :class="contentClassName" v-html="renderedMarkdown" />
</template>

<style scoped>
.markdown-content {
  --markdown-block-gap: 16px;
  --markdown-inline-code-background: var(--md-sys-color-surface-container-low);
  --markdown-code-block-background: var(--md-sys-color-surface-container-low);
  --markdown-surface-background: var(--md-sys-color-surface-container-lowest);
  --markdown-border-color: var(--md-sys-color-outline-variant);
  --markdown-accent-color: var(--md-sys-color-primary);
  --markdown-heading-1-font: var(--md-sys-typescale-headline-medium-font);
  --markdown-heading-1-weight: var(--md-sys-typescale-headline-medium-weight);
  --markdown-heading-1-size: var(--md-sys-typescale-headline-medium-size);
  --markdown-heading-1-line-height: var(--md-sys-typescale-headline-medium-line-height);
  --markdown-heading-1-tracking: var(--md-sys-typescale-headline-medium-tracking);
  --markdown-heading-2-font: var(--md-sys-typescale-headline-small-font);
  --markdown-heading-2-weight: var(--md-sys-typescale-headline-small-weight);
  --markdown-heading-2-size: var(--md-sys-typescale-headline-small-size);
  --markdown-heading-2-line-height: var(--md-sys-typescale-headline-small-line-height);
  --markdown-heading-2-tracking: var(--md-sys-typescale-headline-small-tracking);
  --markdown-heading-3-font: var(--md-sys-typescale-title-large-font);
  --markdown-heading-3-weight: var(--md-sys-typescale-title-large-weight);
  --markdown-heading-3-size: var(--md-sys-typescale-title-large-size);
  --markdown-heading-3-line-height: var(--md-sys-typescale-title-large-line-height);
  --markdown-heading-3-tracking: var(--md-sys-typescale-title-large-tracking);
  --markdown-heading-4-font: var(--md-sys-typescale-title-medium-font);
  --markdown-heading-4-weight: var(--md-sys-typescale-title-medium-weight);
  --markdown-heading-4-size: var(--md-sys-typescale-title-medium-size);
  --markdown-heading-4-line-height: var(--md-sys-typescale-title-medium-line-height);
  --markdown-heading-4-tracking: var(--md-sys-typescale-title-medium-tracking);
  --markdown-heading-5-font: var(--md-sys-typescale-title-small-font);
  --markdown-heading-5-weight: var(--md-sys-typescale-title-small-weight);
  --markdown-heading-5-size: var(--md-sys-typescale-title-small-size);
  --markdown-heading-5-line-height: var(--md-sys-typescale-title-small-line-height);
  --markdown-heading-5-tracking: var(--md-sys-typescale-title-small-tracking);
  --markdown-heading-6-font: var(--md-sys-typescale-label-large-font);
  --markdown-heading-6-weight: var(--md-sys-typescale-label-large-weight);
  --markdown-heading-6-size: var(--md-sys-typescale-label-large-size);
  --markdown-heading-6-line-height: var(--md-sys-typescale-label-large-line-height);
  --markdown-heading-6-tracking: var(--md-sys-typescale-label-large-tracking);

  display: grid;
  align-content: start;
  gap: var(--markdown-block-gap);
  min-width: 0;
  color: var(--md-sys-color-on-surface);
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.markdown-content--article {
  --markdown-block-gap: 20px;
  --markdown-surface-background: var(--md-sys-color-surface-container-low);
  --markdown-heading-1-font: var(--md-sys-typescale-headline-large-font);
  --markdown-heading-1-weight: var(--md-sys-typescale-headline-large-weight);
  --markdown-heading-1-size: var(--md-sys-typescale-headline-large-size);
  --markdown-heading-1-line-height: var(--md-sys-typescale-headline-large-line-height);
  --markdown-heading-1-tracking: var(--md-sys-typescale-headline-large-tracking);
  --markdown-heading-2-font: var(--md-sys-typescale-title-large-font);
  --markdown-heading-2-weight: var(--md-sys-typescale-title-large-weight);
  --markdown-heading-2-size: var(--md-sys-typescale-title-large-size);
  --markdown-heading-2-line-height: var(--md-sys-typescale-title-large-line-height);
  --markdown-heading-2-tracking: var(--md-sys-typescale-title-large-tracking);
  --markdown-heading-3-font: var(--md-sys-typescale-title-medium-font);
  --markdown-heading-3-weight: var(--md-sys-typescale-title-medium-weight);
  --markdown-heading-3-size: var(--md-sys-typescale-title-medium-size);
  --markdown-heading-3-line-height: var(--md-sys-typescale-title-medium-line-height);
  --markdown-heading-3-tracking: var(--md-sys-typescale-title-medium-tracking);
  --markdown-heading-4-font: var(--md-sys-typescale-title-small-font);
  --markdown-heading-4-weight: var(--md-sys-typescale-title-small-weight);
  --markdown-heading-4-size: var(--md-sys-typescale-title-small-size);
  --markdown-heading-4-line-height: var(--md-sys-typescale-title-small-line-height);
  --markdown-heading-4-tracking: var(--md-sys-typescale-title-small-tracking);
  --markdown-heading-5-font: var(--md-sys-typescale-label-large-font);
  --markdown-heading-5-weight: var(--md-sys-typescale-label-large-weight);
  --markdown-heading-5-size: var(--md-sys-typescale-label-large-size);
  --markdown-heading-5-line-height: var(--md-sys-typescale-label-large-line-height);
  --markdown-heading-5-tracking: var(--md-sys-typescale-label-large-tracking);
  --markdown-heading-6-font: var(--md-sys-typescale-label-medium-font);
  --markdown-heading-6-weight: var(--md-sys-typescale-label-medium-weight);
  --markdown-heading-6-size: var(--md-sys-typescale-label-medium-size);
  --markdown-heading-6-line-height: var(--md-sys-typescale-label-medium-line-height);
  --markdown-heading-6-tracking: var(--md-sys-typescale-label-medium-tracking);

  font-size: var(--md-sys-typescale-body-large-size);
  font-weight: var(--md-sys-typescale-body-large-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
}

.markdown-content--compact {
  --markdown-block-gap: 12px;
  --markdown-inline-code-background: var(--md-sys-color-surface-container-lowest);
  --markdown-code-block-background: var(--md-sys-color-surface-container-lowest);
  --markdown-heading-1-font: var(--md-sys-typescale-headline-small-font);
  --markdown-heading-1-weight: var(--md-sys-typescale-headline-small-weight);
  --markdown-heading-1-size: var(--md-sys-typescale-headline-small-size);
  --markdown-heading-1-line-height: var(--md-sys-typescale-headline-small-line-height);
  --markdown-heading-1-tracking: var(--md-sys-typescale-headline-small-tracking);
  --markdown-heading-2-font: var(--md-sys-typescale-title-large-font);
  --markdown-heading-2-weight: var(--md-sys-typescale-title-large-weight);
  --markdown-heading-2-size: var(--md-sys-typescale-title-large-size);
  --markdown-heading-2-line-height: var(--md-sys-typescale-title-large-line-height);
  --markdown-heading-2-tracking: var(--md-sys-typescale-title-large-tracking);
  --markdown-heading-3-font: var(--md-sys-typescale-title-medium-font);
  --markdown-heading-3-weight: var(--md-sys-typescale-title-medium-weight);
  --markdown-heading-3-size: var(--md-sys-typescale-title-medium-size);
  --markdown-heading-3-line-height: var(--md-sys-typescale-title-medium-line-height);
  --markdown-heading-3-tracking: var(--md-sys-typescale-title-medium-tracking);
  --markdown-heading-4-font: var(--md-sys-typescale-title-small-font);
  --markdown-heading-4-weight: var(--md-sys-typescale-title-small-weight);
  --markdown-heading-4-size: var(--md-sys-typescale-title-small-size);
  --markdown-heading-4-line-height: var(--md-sys-typescale-title-small-line-height);
  --markdown-heading-4-tracking: var(--md-sys-typescale-title-small-tracking);
  --markdown-heading-5-font: var(--md-sys-typescale-label-large-font);
  --markdown-heading-5-weight: var(--md-sys-typescale-label-large-weight);
  --markdown-heading-5-size: var(--md-sys-typescale-label-large-size);
  --markdown-heading-5-line-height: var(--md-sys-typescale-label-large-line-height);
  --markdown-heading-5-tracking: var(--md-sys-typescale-label-large-tracking);
  --markdown-heading-6-font: var(--md-sys-typescale-label-medium-font);
  --markdown-heading-6-weight: var(--md-sys-typescale-label-medium-weight);
  --markdown-heading-6-size: var(--md-sys-typescale-label-medium-size);
  --markdown-heading-6-line-height: var(--md-sys-typescale-label-medium-line-height);
  --markdown-heading-6-tracking: var(--md-sys-typescale-label-medium-tracking);

  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

.markdown-content :deep(*) {
  box-sizing: border-box;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  overflow-wrap: anywhere;
}

.markdown-content :deep(h1) {
  font-family: var(--markdown-heading-1-font);
  font-size: var(--markdown-heading-1-size);
  font-weight: var(--markdown-heading-1-weight);
  line-height: var(--markdown-heading-1-line-height);
  letter-spacing: var(--markdown-heading-1-tracking);
}

.markdown-content :deep(h2) {
  font-family: var(--markdown-heading-2-font);
  font-size: var(--markdown-heading-2-size);
  font-weight: var(--markdown-heading-2-weight);
  line-height: var(--markdown-heading-2-line-height);
  letter-spacing: var(--markdown-heading-2-tracking);
}

.markdown-content :deep(h3) {
  font-family: var(--markdown-heading-3-font);
  font-size: var(--markdown-heading-3-size);
  font-weight: var(--markdown-heading-3-weight);
  line-height: var(--markdown-heading-3-line-height);
  letter-spacing: var(--markdown-heading-3-tracking);
}

.markdown-content :deep(h4) {
  font-family: var(--markdown-heading-4-font);
  font-size: var(--markdown-heading-4-size);
  font-weight: var(--markdown-heading-4-weight);
  line-height: var(--markdown-heading-4-line-height);
  letter-spacing: var(--markdown-heading-4-tracking);
}

.markdown-content :deep(h5) {
  font-family: var(--markdown-heading-5-font);
  font-size: var(--markdown-heading-5-size);
  font-weight: var(--markdown-heading-5-weight);
  line-height: var(--markdown-heading-5-line-height);
  letter-spacing: var(--markdown-heading-5-tracking);
}

.markdown-content :deep(h6) {
  font-family: var(--markdown-heading-6-font);
  font-size: var(--markdown-heading-6-size);
  font-weight: var(--markdown-heading-6-weight);
  line-height: var(--markdown-heading-6-line-height);
  letter-spacing: var(--markdown-heading-6-tracking);
}

.markdown-content :deep(p),
.markdown-content :deep(ul),
.markdown-content :deep(ol),
.markdown-content :deep(blockquote),
.markdown-content :deep(pre),
.markdown-content :deep(table),
.markdown-content :deep(img),
.markdown-content :deep(hr) {
  margin: 0;
}

.markdown-content :deep(p),
.markdown-content :deep(li),
.markdown-content :deep(blockquote),
.markdown-content :deep(td),
.markdown-content :deep(th) {
  overflow-wrap: anywhere;
}

.markdown-content :deep(a) {
  color: var(--markdown-accent-color);
  text-decoration-thickness: max(1px, 0.08em);
  text-underline-offset: 0.18em;
}

.markdown-content :deep(strong) {
  font-weight: var(--md-ref-typeface-weight-bold);
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  display: grid;
  gap: calc(var(--markdown-block-gap) * 0.35);
  padding-inline-start: 1.5em;
}

.markdown-content :deep(blockquote) {
  display: grid;
  gap: 8px;
  padding: 16px;
  border: 1px solid var(--markdown-border-color);
  border-inline-start-width: 3px;
  background-color: var(--markdown-surface-background);
  border-radius: var(--md-sys-shape-corner-medium);
  color: var(--md-sys-color-on-surface-variant);
}

.markdown-content :deep(code) {
  padding: 0.18em 0.4em;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background-color: var(--markdown-inline-code-background);
  color: var(--md-sys-color-on-surface);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.92em;
}

.markdown-content :deep(pre) {
  overflow-x: auto;
  max-width: 100%;
  padding: 14px 16px;
  border-radius: var(--md-sys-shape-corner-large);
  background-color: var(--markdown-code-block-background);
  border: 1px solid var(--markdown-border-color);
}

.markdown-content :deep(pre code) {
  display: block;
  padding: 0;
  background-color: transparent;
  color: inherit;
  white-space: pre;
}

.markdown-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  border-radius: var(--md-sys-shape-corner-medium);
}

.markdown-content :deep(blockquote > *) {
  margin: 0;
}

.markdown-content :deep(.markdown-content__table-scroll) {
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  border: 1px solid var(--markdown-border-color);
  border-radius: var(--md-sys-shape-corner-medium);
  background-color: var(--md-sys-color-surface-container-lowest);
}

.markdown-content :deep(.markdown-content__table-scroll > table) {
  width: 100%;
  min-width: max-content;
  border-collapse: separate;
  border-spacing: 0;
  background-color: transparent;
}

.markdown-content :deep(thead) {
  background-color: var(--md-sys-color-surface-container-low);
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid var(--markdown-border-color);
  text-align: left;
  vertical-align: top;
}

.markdown-content :deep(th) {
  font-family: var(--md-sys-typescale-label-large-font);
  font-size: var(--md-sys-typescale-label-large-size);
  font-weight: var(--md-sys-typescale-label-large-weight);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  color: var(--md-sys-color-on-surface-variant);
}

.markdown-content :deep(td) {
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.markdown-content :deep(tbody tr:last-child td) {
  border-bottom: 0;
}

.markdown-content :deep(hr) {
  border: 0;
  border-top: 1px solid var(--markdown-border-color);
}
</style>
